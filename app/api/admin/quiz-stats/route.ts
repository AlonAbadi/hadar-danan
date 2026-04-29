import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("quiz_results")
    .select("recommended_product");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = data.length;
  const counts: Record<string, number> = {};
  for (const row of data) {
    const p = row.recommended_product ?? "unknown";
    counts[p] = (counts[p] ?? 0) + 1;
  }

  const distribution = Object.entries(counts)
    .map(([product, count]) => ({
      product,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ total, distribution });
}
