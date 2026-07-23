// Admin: the actual filmed materials — member-room reels + free first-reel
// renders, with signed playback URLs so Alon can WATCH what customers made
// straight from /admin/broadcast (Alon 2026-07-23).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/lib/supabase/server";

const BUCKET = "broadcast-takes";
const SIGN_TTL = 7200; // 2h — the admin page is force-dynamic, links refresh per load

export interface MemberReelRow {
  edit_id: string;
  user_name: string | null;
  user_email: string | null;
  video_number: number;
  created_at: string;
  downloaded: boolean;
  published: boolean;
  video_url: string | null;
}

export interface FirstReelRow {
  extraction_id: string;
  user_name: string | null;
  user_email: string | null;
  diagnosed_at: string;
  script_at: string | null;
  render_status: string | null;
  render_at: string | null;
  video_url: string | null;
}

export interface FirstReelFunnel {
  views: number;
  camera_requested: number;
  camera_ready: number;
  camera_denied: number;
  record_started: number;
  recorded: number;
  submitted: number;
  ready: number;
}

export interface BroadcastMaterials {
  memberReels: MemberReelRow[];
  firstReels: FirstReelRow[];
  firstReelFunnel: FirstReelFunnel;
}

const parseSlice = (v: any) => {
  if (v == null) return null;
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return null; }
  }
  return v;
};

export async function getBroadcastMaterials(): Promise<BroadcastMaterials> {
  const db = createServerClient() as any;
  const sign = async (p: string | null | undefined): Promise<string | null> => {
    if (!p) return null;
    const { data } = await db.storage.from(BUCKET).createSignedUrl(p, SIGN_TTL);
    return data?.signedUrl ?? null;
  };

  // ── member-room reels (ready edits, newest first) ──
  const { data: edits } = await db
    .from("broadcast_edits")
    .select("id, user_id, video_number, created_at, output_path, downloaded_at, review_item_id")
    .eq("status", "ready")
    .eq("is_test", false)
    .order("created_at", { ascending: false })
    .limit(40);

  const reviewIds = (edits ?? []).map((e: any) => e.review_item_id).filter(Boolean);
  const publishedSet = new Set<string>();
  if (reviewIds.length) {
    const { data: items } = await db
      .from("review_items")
      .select("id, status")
      .in("id", reviewIds);
    for (const it of items ?? []) if (it.status === "published") publishedSet.add(it.id);
  }

  // ── free first-reel renders off the extraction jsonb ──
  const ex: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db
      .from("signal_extractions")
      .select("id, user_id, created_at, signal")
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (!data?.length) break;
    ex.push(...data);
    if (data.length < 1000) break;
  }
  const frRows = ex
    .map((e) => {
      const fr = parseSlice(e.signal?.first_reel);
      const rr = parseSlice(e.signal?.first_reel_render);
      if (!fr && !rr) return null;
      return { e, fr, rr };
    })
    .filter(Boolean) as { e: any; fr: any; rr: any }[];

  // ── user lookup (batched — .in() with hundreds of ids breaks silently) ──
  const userIds = [
    ...new Set([
      ...(edits ?? []).map((e: any) => e.user_id),
      ...frRows.map((r) => r.e.user_id),
    ].filter(Boolean)),
  ];
  const umap = new Map<string, { name: string | null; email: string | null }>();
  for (let i = 0; i < userIds.length; i += 100) {
    const { data } = await db.from("users").select("id, name, email").in("id", userIds.slice(i, i + 100));
    for (const u of data ?? []) umap.set(u.id, { name: u.name, email: u.email });
  }

  const memberReels: MemberReelRow[] = await Promise.all(
    (edits ?? []).map(async (e: any) => ({
      edit_id: e.id,
      user_name: umap.get(e.user_id)?.name ?? null,
      user_email: umap.get(e.user_id)?.email ?? null,
      video_number: e.video_number,
      created_at: e.created_at,
      downloaded: Boolean(e.downloaded_at),
      published: publishedSet.has(e.review_item_id),
      video_url: await sign(e.output_path),
    }))
  );

  const firstReels: FirstReelRow[] = await Promise.all(
    frRows.map(async ({ e, fr, rr }) => ({
      extraction_id: e.id,
      user_name: umap.get(e.user_id)?.name ?? null,
      user_email: umap.get(e.user_id)?.email ?? null,
      diagnosed_at: e.created_at,
      script_at: fr?.generated_at ?? null,
      render_status: rr?.status ?? null,
      render_at: rr?.at ?? null,
      video_url: rr?.status === "ready" ? await sign(rr.output_path) : null,
    }))
  );

  // ── first-reel funnel (all-time — the feature is days old) ──
  const funnel: FirstReelFunnel = {
    views: 0, camera_requested: 0, camera_ready: 0, camera_denied: 0,
    record_started: 0, recorded: 0, submitted: 0, ready: 0,
  };
  const KEYS: Record<string, keyof FirstReelFunnel> = {
    FIRST_REEL_VIEW: "views",
    FIRST_REEL_CAMERA_REQUESTED: "camera_requested",
    FIRST_REEL_CAMERA_READY: "camera_ready",
    FIRST_REEL_CAMERA_DENIED: "camera_denied",
    FIRST_REEL_RECORD_STARTED: "record_started",
    FIRST_REEL_RECORDED: "recorded",
    FIRST_REEL_SUBMITTED: "submitted",
    FIRST_REEL_READY: "ready",
  };
  const { data: evs } = await db
    .from("events")
    .select("type")
    .like("type", "FIRST_REEL%")
    .limit(5000);
  for (const e of evs ?? []) {
    const k = KEYS[e.type];
    if (k) funnel[k]++;
  }

  return { memberReels, firstReels, firstReelFunnel: funnel };
}
