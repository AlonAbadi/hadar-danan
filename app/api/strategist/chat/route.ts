import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { STRATEGIST_SYSTEM_PROMPT } from '@/lib/strategist/system-prompt';
import { loadLiveContext } from '@/lib/strategist/context-loader';

// ════════════════════════════════════════════════════════
// Marketing Strategist Chat — streaming endpoint
// ════════════════════════════════════════════════════════
// Model:  claude-opus-4-7 (highest capability — strategic depth matters)
// Mode:   streaming SSE, adaptive thinking, high effort
// Caching: system prompt cached (stable across all turns + sessions)

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min for long strategic analyses

type IncomingMessage = { role: 'user' | 'assistant'; content: string };

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  let body: { messages: IncomingMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400 });
  }

  // Sanitize: only user/assistant pairs, alternating
  const sanitized = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.trim() }))
    .filter(m => m.content.length > 0);

  if (sanitized.length === 0 || sanitized[0].role !== 'user') {
    return new Response(JSON.stringify({ error: 'first message must be user' }), { status: 400 });
  }

  // Load fresh business context. We attach it to the FIRST user message
  // so the cached system prompt stays byte-stable across turns.
  let liveContext = '';
  try {
    liveContext = await loadLiveContext();
  } catch (err) {
    console.error('Strategist context-load failed:', err);
    liveContext = '⚠️ נכשלה טעינת נתונים חיים — תענה לפי הקשר כללי וצריך לבדוק את המערכת.';
  }

  // Prepend the live context to the LAST user message so the strategist
  // sees fresh data on every turn (not the cached older snapshot).
  const enriched: Anthropic.MessageParam[] = sanitized.map((m, i) => {
    if (i === sanitized.length - 1 && m.role === 'user') {
      return {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${liveContext}\n\n---\n\n# שאלת המשתמש\n\n${m.content}`,
          },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });

  // Stream the response back to the client as SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-opus-4-7',
          max_tokens: 16000,
          thinking: { type: 'adaptive' },
          system: [
            {
              type: 'text',
              text: STRATEGIST_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: enriched,
        });

        for await (const event of messageStream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              const chunk = `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            } else if (event.delta.type === 'thinking_delta') {
              const chunk = `data: ${JSON.stringify({ type: 'thinking', text: event.delta.thinking })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          } else if (event.type === 'message_delta') {
            if (event.delta.stop_reason) {
              const chunk = `data: ${JSON.stringify({ type: 'stop', reason: event.delta.stop_reason })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
        }

        const final = await messageStream.finalMessage();
        const usage = `data: ${JSON.stringify({
          type: 'usage',
          input: final.usage.input_tokens,
          output: final.usage.output_tokens,
          cacheRead: final.usage.cache_read_input_tokens ?? 0,
          cacheCreated: final.usage.cache_creation_input_tokens ?? 0,
        })}\n\n`;
        controller.enqueue(encoder.encode(usage));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        const msg = err instanceof Anthropic.APIError
          ? `Anthropic ${err.status}: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
        console.error('Strategist stream error:', err);
        const errChunk = `data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`;
        controller.enqueue(encoder.encode(errChunk));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
