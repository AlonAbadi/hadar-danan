// One-time backfill: generate result_teasers (the public card + first script
// hook) for historical extractions created before the teasers feature
// shipped. New extractions since ~2026-07-15 all have them; 393 older ones
// (incl. both yaya accounts) render without the card section.
// Run: npx tsx scripts/backfill-result-teasers.ts
import { readFileSync } from "node:fs";
import path from "node:path";

for (const l of readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const i = l.indexOf("=");
  if (i > 0 && !l.startsWith("#")) process.env[l.slice(0, i)] ??= l.slice(i + 1).trim();
}

async function main() {
  const { generateAndStoreResultTeasers } = await import("../lib/signal/result-teasers");
  const { readResultTeasers } = await import("../lib/signal/result-teasers");
  const { createServerClient } = await import("../lib/supabase/server");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServerClient() as any;
  const ids: string[] = [];
  for (let off = 0; ; off += 1000) {
    const { data } = await db
      .from("signal_extractions")
      .select("id, signal")
      .order("created_at", { ascending: false })
      .range(off, off + 999);
    for (const ex of data ?? []) {
      if (ex.signal?.signal && !readResultTeasers(ex.signal).public_sentence) ids.push(ex.id);
    }
    if (!data || data.length < 1000) break;
  }
  console.log(`backfilling ${ids.length} extractions...`);
  
  let done = 0;
  const CONCURRENCY = 4;
  async function worker() {
    while (ids.length) {
      const id = ids.shift()!;
      await generateAndStoreResultTeasers(id); // internally: skip-if-done, error-logged, never throws
      if (++done % 25 === 0) console.log(`${done} done`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`backfill complete: ${done}`);
}

main();
