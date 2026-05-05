import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.UCHAT_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "UCHAT_API_KEY not set" }, { status: 500 });

  const res = await fetch("https://www.uchat.com.au/api/whatsapp-template/list", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const text = await res.text();
  return NextResponse.json({ status: res.status, body: text });
}
