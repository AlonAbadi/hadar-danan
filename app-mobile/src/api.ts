// כוורת האות (mobile) — thin client for the existing beegood.online pipeline.
// Auth: supabase-js session; every API call carries Authorization: Bearer.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as tus from "tus-js-client";

export const BASE = "https://www.beegood.online";
const SUPABASE_URL = "https://rufzcpwzolitoqqhdmrx.supabase.co";
const SUPABASE_ANON =
  "sb_publishable_nuxWPbIVDphlEX3RJIJAyQ_Hr2GrGdK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

export async function token(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const t = await token();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`${path}:${res.status}`);
  return res.json() as Promise<T>;
}

// Resumable upload of a recorded take (iron rule: no take lost).
export function tusUpload(opts: {
  fileUri: string;
  objectName: string;
  contentType: string;
  onProgress: (p: number) => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    (async () => {
      const t = await token();
      const upload = new tus.Upload(
        { uri: opts.fileUri } as unknown as Blob,
        {
          endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
          chunkSize: 6 * 1024 * 1024,
          retryDelays: [0, 1000, 3000, 5000, 10000],
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: "broadcast-takes",
            objectName: opts.objectName,
            contentType: opts.contentType,
            cacheControl: "3600",
          },
          headers: { authorization: `Bearer ${t}`, apikey: SUPABASE_ANON },
          onProgress: (sent, total) => opts.onProgress(total > 0 ? sent / total : 0),
          onError: reject,
          onSuccess: () => resolve(),
        }
      );
      upload.start();
    })().catch(reject);
  });
}

export interface Script {
  number: number;
  title: string;
  hook: string;
  body: string;
  cta: string;
}
