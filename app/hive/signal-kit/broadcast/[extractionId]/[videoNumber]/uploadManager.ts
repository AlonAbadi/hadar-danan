// חדר השידור — module-singleton TUS upload queue.
//
// The iron rule: the moment recording stops, the take starts uploading to
// Supabase Storage over resumable TUS, and keeps uploading while the user
// reviews takes or records the next one. Components subscribe for progress.
// Supabase's TUS endpoint requires chunkSize of exactly 6MB.
"use client";

import * as tus from "tus-js-client";
import { createBrowserClient } from "@/lib/supabase/browser";

export type UploadState = "uploading" | "done" | "error";

export interface TakeUpload {
  takeId: string;
  progress: number; // 0..1
  state: UploadState;
}

type Listener = (uploads: TakeUpload[]) => void;

const CHUNK = 6 * 1024 * 1024;

class UploadManager {
  private uploads = new Map<string, { entry: TakeUpload; tusUpload: tus.Upload }>();
  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }

  snapshot(): TakeUpload[] {
    return Array.from(this.uploads.values()).map((u) => ({ ...u.entry }));
  }

  hasPending(): boolean {
    return this.snapshot().some((u) => u.state === "uploading");
  }

  private emit() {
    const snap = this.snapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  async enqueue(opts: {
    takeId: string;
    blob: Blob;
    objectName: string;
    contentType: string;
    durationSeconds: number;
    suggestedTrimStartMs: number | null;
    suggestedTrimEndMs: number | null;
  }): Promise<void> {
    const supabase = createBrowserClient();
    const entry: TakeUpload = { takeId: opts.takeId, progress: 0, state: "uploading" };

    const confirm = async () => {
      // Server verifies the object exists before trusting 'uploaded'.
      const res = await fetch(`/api/broadcast/takes/${opts.takeId}/uploaded`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_seconds: opts.durationSeconds,
          suggested_trim_start_ms: opts.suggestedTrimStartMs,
          suggested_trim_end_ms: opts.suggestedTrimEndMs,
        }),
      });
      if (!res.ok) throw new Error(`confirm_${res.status}`);
    };

    const tusUpload = new tus.Upload(opts.blob, {
      endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      chunkSize: CHUNK,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: "broadcast-takes",
        objectName: opts.objectName,
        contentType: opts.contentType,
        cacheControl: "3600",
      },
      headers: {},
      onBeforeRequest: async (req) => {
        // Long uploads outlive the JWT — refresh per request.
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          req.setHeader("authorization", `Bearer ${token}`);
          req.setHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        }
      },
      onProgress: (sent, total) => {
        entry.progress = total > 0 ? sent / total : 0;
        this.emit();
      },
      onError: () => {
        entry.state = "error";
        this.emit();
        navigator.sendBeacon?.(
          "/api/broadcast/client-event",
          JSON.stringify({ type: "upload_stalled", take_id: opts.takeId })
        );
      },
      onSuccess: () => {
        confirm()
          .then(() => {
            entry.state = "done";
            entry.progress = 1;
            this.emit();
          })
          .catch(() => {
            entry.state = "error";
            this.emit();
          });
      },
    });

    this.uploads.set(opts.takeId, { entry, tusUpload });
    this.emit();

    // Resume a previous attempt of the same blob if one exists.
    const previous = await tusUpload.findPreviousUploads();
    if (previous.length) tusUpload.resumeFromPreviousUpload(previous[0]);
    tusUpload.start();
  }

  retry(takeId: string): void {
    const u = this.uploads.get(takeId);
    if (u && u.entry.state === "error") {
      u.entry.state = "uploading";
      this.emit();
      u.tusUpload.start();
    }
  }
}

export const uploadManager = new UploadManager();
