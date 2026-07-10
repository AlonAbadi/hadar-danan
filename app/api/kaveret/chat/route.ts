/**
 * POST /api/kaveret/chat
 *
 * Body: { messages: [{ role: "user" | "assistant"; content: string }, …] }
 *
 * Hive-gated Q&A bot for /kaveret. Uses the KAVERET_CHAT_SYSTEM knowledge
 * base defined in lib/prompts/kaveret-chat.ts. Streams-simple: returns the
 * whole reply in one JSON envelope so the client can pop it into the
 * conversation array without SSE plumbing.
 *
 * Anthropic call is short-tokened (600) — the system prompt caps answers at
 * 2-6 lines. Cost per message ~$0.01 at current sonnet rates.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { KAVERET_CHAT_SYSTEM, KAVERET_CHAT_MODEL } from "@/lib/prompts/kaveret-chat";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 20;

const MAX_TURNS   = 12;   // last N turns from client (bot ignores anything older)
const MAX_TOKENS  = 700;
const MAX_QLEN    = 900;  // per-turn character cap; prevents prompt injection via giant payloads

export async function POST(req: NextRequest) {
  // Auth
  const cookieStore = await cookies();
  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "auth required" }, { status: 401 });

  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (db as any)
    .from("users")
    .select("id, hive_status, name, gender")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!userRow || userRow.hive_status !== "active") {
    return NextResponse.json({ error: "hive-only" }, { status: 403 });
  }

  // Parse body
  let messages: { role: "user" | "assistant"; content: string }[] = [];
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages)) throw new Error("messages must be array");
    messages = body.messages
      .filter((m: unknown): m is { role: string; content: string } =>
        !!m && typeof (m as { role?: unknown }).role === "string" && typeof (m as { content?: unknown }).content === "string")
      .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
      .map((m: { role: string; content: string }) => ({
        role:    m.role as "user" | "assistant",
        content: m.content.trim().slice(0, MAX_QLEN),
      }))
      .filter((m: { content: string }) => m.content.length > 0)
      .slice(-MAX_TURNS);
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "last message must be from user" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: String(e) }, { status: 400 });
  }

  // Small personalization: pass the caller's first name + gender so the bot
  // addresses them correctly without asking.
  const firstName = String(userRow.name ?? "").split(" ")[0] || "";
  const genderNote = userRow.gender === "m" ? "הפונה זכר." :
                     userRow.gender === "f" ? "הפונה נקבה." : "מגדר הפונה לא ידוע — פנייה נטרלית.";
  const systemWithCtx = `${KAVERET_CHAT_SYSTEM}\n\n---\nהפונה: ${firstName || "חבר/ת כוורת"}. ${genderNote}`;

  try {
    const client = new Anthropic();
    const resp = await client.messages.create({
      model:      KAVERET_CHAT_MODEL,
      max_tokens: MAX_TOKENS,
      system:     systemWithCtx,
      messages,
    });
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("")
      .trim();

    if (!text) {
      return NextResponse.json({ error: "empty reply" }, { status: 502 });
    }

    return NextResponse.json({
      role:    "assistant",
      content: text,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "chat failed", details: String(e) },
      { status: 500 },
    );
  }
}
