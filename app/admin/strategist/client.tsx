'use client';

import { useState, useRef, useEffect } from 'react';

const C = {
  bg:     '#080C14',
  card:   '#141820',
  soft:   '#1D2430',
  border: '#2C323E',
  gold:   '#C9964A',
  goldL:  '#E8B94A',
  fg:     '#EDE9E1',
  muted:  '#9E9990',
  green:  '#22c55e',
  red:    '#ef4444',
  blue:   '#3b82f6',
  purple: '#8b5cf6',
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  usage?: { input: number; output: number; cacheRead: number; cacheCreated: number };
};

const QUICK_PROMPTS: { label: string; prompt: string; icon: string }[] = [
  {
    icon: '🚨',
    label: 'איפה הדליפה הכי גדולה במשפך?',
    prompt: 'תנתח את כל הנתונים ותגיד לי איפה הדליפה הכי גדולה במשפך כרגע. תן לי תוכנית פעולה ב-3 שלבים לתיקון.',
  },
  {
    icon: '🎯',
    label: 'תוכנית להגדלת פגישות אסטרטגיה',
    prompt: 'המטרה האסטרטגית היא להביא יותר אנשים לפגישת אסטרטגיה (₪4,000) כי 90% מהם נסגרים ל-Premium. תן לי תוכנית מפורטת ל-30 יום להכפלת כמות הפגישות.',
  },
  {
    icon: '💡',
    label: 'הצע 3 קונספטים חדשים לקריאייטיב',
    prompt: 'תסתכל על הביצועים של הקריאייטיבים הקיימים בקמפיין הקוויז. הצע לי 3 קונספטים חדשים לקריאייטיב, מנותחים לפי TRIBE v2 (ARS, EII, HSS, CAS, NES). פרט מבנה, hook, ו-CTA.',
  },
  {
    icon: '📊',
    label: 'אנליזת ROAS אמיתי לפי קמפיין',
    prompt: 'תעשה אנליזה מעמיקה של ROAS אמיתי (CRM revenue / Meta spend) לכל קמפיין פעיל. איזה קמפיין להשבית? איזה להגדיל? איזה לנסות לשפר?',
  },
  {
    icon: '🧠',
    label: 'למה drop-off ב-quiz?',
    prompt: 'יש לנו אחוז גבוה של אנשים שמסיימים את הקוויז אבל לא משאירים פרטים. תנתח למה זה קורה ותציע 3 פתרונות קונקרטיים.',
  },
  {
    icon: '💰',
    label: 'תמחור — האם המחירים נכונים?',
    prompt: 'תסתכל על המחירים שלנו (אתגר ₪197, סדנה ₪1,080, קורס ₪1,800, אסטרטגיה ₪4,000, פרימיום ₪14,000). בהנחה ש-90% מפגישת אסטרטגיה סוגרים פרימיום, האם התמחור אופטימלי? תציע אסטרטגיית תמחור מעודכנת.',
  },
];

export default function StrategistClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [currentThinking, setCurrentThinking] = useState('');
  const [showThinking, setShowThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentThinking]);

  async function send(content: string) {
    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    if (!userMsg.content || streaming) return;

    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setStreaming(true);
    setCurrentThinking('');

    // Open the assistant slot
    setMessages([...next, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/strategist/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => 'Unknown error');
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: `שגיאה: ${errText}` };
          return updated;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let thinkingText = '';
      let usage: ChatMessage['usage'] | undefined;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const event = JSON.parse(payload);
            if (event.type === 'text') {
              assistantText += event.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText, thinking: thinkingText, usage };
                return updated;
              });
            } else if (event.type === 'thinking') {
              thinkingText += event.text;
              setCurrentThinking(thinkingText);
            } else if (event.type === 'usage') {
              usage = { input: event.input, output: event.output, cacheRead: event.cacheRead, cacheCreated: event.cacheCreated };
            } else if (event.type === 'error') {
              assistantText += `\n\n[שגיאה: ${event.error}]`;
            }
          } catch {
            // ignore malformed event
          }
        }
      }

      // Final flush
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: assistantText, thinking: thinkingText, usage };
        return updated;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: `שגיאה ברשת: ${msg}` };
        return updated;
      });
    } finally {
      setStreaming(false);
      setCurrentThinking('');
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const isFirstTurn = messages.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.fg, fontFamily: "'Assistant', sans-serif", direction: 'rtl', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px 48px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.fg, margin: 0, display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span>🧠</span> אסטרטג שיווק
              <span style={{ fontSize: 13, fontWeight: 400, color: C.muted, fontFamily: 'system-ui' }}>Marketing Strategist · Claude Opus 4.7</span>
            </h1>
            <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>
              מומחה במשפך של ביגוד, בקמפיינים, בקריאייטיב ובדאטה. מטרה: להוביל יותר אנשים לפגישת אסטרטגיה ול-Premium.
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setCurrentThinking(''); }}
              disabled={streaming}
              style={{
                background: C.soft, border: `1px solid ${C.border}`, color: C.muted,
                borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: streaming ? 'not-allowed' : 'pointer',
                fontFamily: "'Assistant', sans-serif",
              }}
            >
              שיחה חדשה
            </button>
          )}
        </div>
      </div>

      {/* Chat scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 48px 24px' }}>
        {isFirstTurn && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(201,150,74,0.08), rgba(232,185,74,0.04))', border: `1px solid rgba(201,150,74,0.25)`, borderRadius: 14, padding: 28, marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: C.goldL, fontWeight: 700, marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>👋 ברוך הבא</div>
              <div style={{ fontSize: 15, color: C.fg, lineHeight: 1.7, marginBottom: 12 }}>
                אני מכיר את כל המוצרים שלכם, את המשפך, את היעדים, ואת הנתונים בזמן אמת. תשאל אותי כל דבר שקשור לאסטרטגיה, לקמפיינים, או לקריאייטיב.
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                💡 אני מבוסס על Claude Opus 4.7 עם adaptive thinking. תקבל ניתוח מעמיק, ולא הצעות שטחיות. אם אני לא מוצא מספיק נתונים, אגיד לך בדיוק מה חסר.
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              שאלות מומלצות להתחלה
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => send(qp.prompt)}
                  disabled={streaming}
                  style={{
                    background: C.card, border: `1px solid ${C.border}`, color: C.fg,
                    borderRadius: 12, padding: '16px 18px', cursor: streaming ? 'not-allowed' : 'pointer',
                    fontFamily: "'Assistant', sans-serif", textAlign: 'right',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (streaming) return;
                    e.currentTarget.style.borderColor = 'rgba(201,150,74,0.5)';
                    e.currentTarget.style.background = '#171d28';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.background = C.card;
                  }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{qp.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{qp.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                message={m}
                isLast={i === messages.length - 1}
                streaming={streaming && i === messages.length - 1}
                liveThinking={i === messages.length - 1 ? currentThinking : ''}
                showThinking={showThinking}
                onToggleThinking={() => setShowThinking(!showThinking)}
              />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 48px 24px', background: C.bg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ position: 'relative', background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 14px' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={streaming ? 'מקבל תשובה...' : 'שאל את האסטרטג... (Enter לשליחה, Shift+Enter לשורה חדשה)'}
              disabled={streaming}
              rows={3}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                color: C.fg, fontFamily: "'Assistant', sans-serif", fontSize: 14,
                resize: 'none', direction: 'rtl', textAlign: 'right', lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: 'system-ui' }}>
                Opus 4.7 · adaptive thinking · live CRM + Meta data
              </div>
              <button
                onClick={() => send(input)}
                disabled={streaming || !input.trim()}
                style={{
                  background: streaming || !input.trim() ? C.soft : `linear-gradient(135deg, ${C.goldL}, ${C.gold})`,
                  color: streaming || !input.trim() ? C.muted : '#1a1206',
                  border: 'none', borderRadius: 8, padding: '8px 18px',
                  fontWeight: 700, fontSize: 13, cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: "'Assistant', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {streaming ? 'חושב...' : 'שלח ←'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message, isLast, streaming, liveThinking, showThinking, onToggleThinking,
}: {
  message: ChatMessage;
  isLast: boolean;
  streaming: boolean;
  liveThinking: string;
  showThinking: boolean;
  onToggleThinking: () => void;
}) {
  const isUser = message.role === 'user';
  const thinkingToShow = streaming ? liveThinking : (message.thinking ?? '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'stretch', gap: 6 }}>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', paddingRight: isUser ? 6 : 0, paddingLeft: isUser ? 0 : 6 }}>
        {isUser ? '👤 אתה' : '🧠 אסטרטג'}
      </div>

      {/* Thinking block (collapsible) */}
      {!isUser && thinkingToShow && (
        <div style={{ background: 'rgba(139,92,246,0.06)', border: `1px solid rgba(139,92,246,0.2)`, borderRadius: 10, padding: '10px 14px', maxWidth: '92%' }}>
          <button
            onClick={onToggleThinking}
            style={{
              background: 'transparent', border: 'none', color: C.purple, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Assistant', sans-serif", padding: 0,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>💭 חשיבה פנימית {showThinking ? '▲' : '▼'}</span>
            {streaming && <span style={{ fontSize: 10, color: C.muted, fontFamily: 'system-ui' }}>(streaming...)</span>}
          </button>
          {showThinking && (
            <div style={{ marginTop: 8, fontSize: 12, color: C.muted, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'system-ui' }}>
              {thinkingToShow}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          background: isUser ? `linear-gradient(135deg, ${C.gold}25, ${C.gold}15)` : C.card,
          border: `1px solid ${isUser ? 'rgba(201,150,74,0.3)' : C.border}`,
          borderRadius: 14, padding: '16px 20px', maxWidth: '92%',
          fontSize: 14, lineHeight: 1.7, color: C.fg, whiteSpace: 'pre-wrap',
        }}
      >
        {message.content || (streaming ? <span style={{ color: C.muted, fontStyle: 'italic' }}>חושב...</span> : '')}
        {streaming && message.content && <span style={{ display: 'inline-block', width: 8, height: 14, background: C.gold, marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s infinite' }} />}
      </div>

      {/* Usage footer */}
      {!isUser && message.usage && !streaming && (
        <div style={{ fontSize: 10, color: `${C.muted}88`, fontFamily: 'system-ui', paddingLeft: 6, marginTop: 2 }}>
          {message.usage.input.toLocaleString()} in · {message.usage.output.toLocaleString()} out
          {message.usage.cacheRead > 0 && ` · ${message.usage.cacheRead.toLocaleString()} cached read`}
          {message.usage.cacheCreated > 0 && ` · ${message.usage.cacheCreated.toLocaleString()} cached write`}
        </div>
      )}

      <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }`}</style>
    </div>
  );
}
