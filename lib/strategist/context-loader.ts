import { createServerClient } from '@/lib/supabase/server';
import { getMetaCampaigns, aggregateKpis, getQuizFunnel } from '@/lib/admin/meta-queries';

// ════════════════════════════════════════════════════════
// Strategist live-context loader
// ════════════════════════════════════════════════════════
// Pulls a fresh snapshot of business state on every chat turn.
// Output is markdown intended to land in the user message (so it's
// outside the cached system prompt and reflects current reality).

export async function loadLiveContext(): Promise<string> {
  const supabase = createServerClient();
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    leads30, leads7, leadsToday,
    purchases30, purchases7,
    bookings30,
    hiveActive,
    quizFunnel,
    metaCampaigns,
    sources30,
  ] = await Promise.all([
    supabase.from('users').select('id, status, utm_source, created_at').gte('created_at', since30),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', since7),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('purchases').select('amount, product, user_id, created_at').eq('status', 'completed').gte('created_at', since30),
    supabase.from('purchases').select('amount, product, created_at').eq('status', 'completed').gte('created_at', since7),
    supabase.from('bookings').select('id, type, status, created_at').gte('created_at', since30),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('hive_status', 'active'),
    getQuizFunnel('30d'),
    getMetaCampaigns('30d'),
    supabase.from('users').select('utm_source').gte('created_at', since30),
  ]);

  // ─── Funnel: status distribution ───────────────────
  const statusCounts: Record<string, number> = {};
  (leads30.data ?? []).forEach(u => {
    const s = u.status || 'lead';
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  });

  // ─── Revenue + product mix ─────────────────────────
  const PRODUCT_NAMES: Record<string, string> = {
    challenge_197: 'אתגר ₪197',
    workshop_1080: 'סדנה ₪1,080',
    course_1800: 'קורס ₪1,800',
    strategy_4000: 'פגישת אסטרטגיה ₪4,000',
    premium_14000: 'יום צילום פרימיום ₪14,000',
    test_1: 'בדיקה ₪1',
    hive_starter_160: 'כוורת ₪29',
    hive_pro_97: 'כוורת ₪97',
  };

  const revenueByProduct: Record<string, { count: number; revenue: number }> = {};
  (purchases30.data ?? []).forEach(p => {
    const k = p.product as string;
    if (!revenueByProduct[k]) revenueByProduct[k] = { count: 0, revenue: 0 };
    revenueByProduct[k].count += 1;
    revenueByProduct[k].revenue += p.amount || 0;
  });

  const revenue30 = Object.values(revenueByProduct).reduce((s, x) => s + x.revenue, 0);
  const revenue7  = (purchases7.data ?? []).reduce((s, p) => s + (p.amount || 0), 0);

  // ─── Sources mix ───────────────────────────────────
  const sourceCounts: Record<string, number> = {};
  (sources30.data ?? []).forEach(u => {
    const s = (u.utm_source || 'direct').toLowerCase();
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1;
  });
  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // ─── Bookings ──────────────────────────────────────
  const bookingsByType: Record<string, { total: number; pending: number; confirmed: number }> = {};
  (bookings30.data ?? []).forEach(b => {
    const t = (b as any).type || 'other';
    if (!bookingsByType[t]) bookingsByType[t] = { total: 0, pending: 0, confirmed: 0 };
    bookingsByType[t].total += 1;
    if ((b as any).status === 'pending') bookingsByType[t].pending += 1;
    if ((b as any).status === 'confirmed') bookingsByType[t].confirmed += 1;
  });

  // ─── Meta campaigns top-level ──────────────────────
  const metaKpis = metaCampaigns.rows ? aggregateKpis(metaCampaigns.rows) : null;
  const topCampaigns = (metaCampaigns.rows ?? []).slice(0, 8);

  // ─── Funnel conversion math ────────────────────────
  const totalLeads30 = leads30.data?.length ?? 0;
  const totalBuyers30 = new Set((purchases30.data ?? []).map(p => p.user_id).filter(Boolean)).size;
  const overallConversion = totalLeads30 > 0 ? (totalBuyers30 / totalLeads30) * 100 : 0;

  const strategyBookings = bookingsByType['strategy']?.total ?? 0;
  const premiumPurchases = revenueByProduct['premium_14000']?.count ?? 0;
  const strategyToPremium = strategyBookings > 0 ? (premiumPurchases / strategyBookings) * 100 : 0;

  // ─── Build markdown context ────────────────────────
  const lines: string[] = [];
  lines.push('# 📊 נתונים חיים מהמערכת (30 יום אחרונים)');
  lines.push('');
  lines.push(`**תאריך נוכחי:** ${now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`);
  lines.push('');

  // Lead volume
  lines.push('## 👥 ליד volume');
  lines.push(`- היום: ${leadsToday.count ?? 0} לידים חדשים`);
  lines.push(`- 7 ימים: ${leads7.count ?? 0} לידים`);
  lines.push(`- 30 ימים: ${totalLeads30} לידים`);
  lines.push('');

  // Status distribution
  lines.push('## 🪜 התפלגות לפי שלב במשפך');
  const STATUS_LABELS: Record<string, string> = {
    lead: 'ליד טרי',
    engaged: 'מעורב',
    high_intent: 'כוונה גבוהה',
    buyer: 'רוכש',
    booked: 'פגישה נקבעה',
    premium_lead: 'ליד פרימיום',
    partnership_lead: 'ליד שותפות',
    handled: 'טופל',
    not_relevant: 'לא רלוונטי',
  };
  Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
    lines.push(`- ${STATUS_LABELS[s] ?? s}: ${c}`);
  });
  lines.push('');

  // Revenue
  lines.push('## 💰 הכנסות');
  lines.push(`- 7 ימים: ₪${Math.round(revenue7).toLocaleString()}`);
  lines.push(`- 30 ימים: ₪${Math.round(revenue30).toLocaleString()}`);
  lines.push('');
  lines.push('### לפי מוצר (30 יום)');
  Object.entries(revenueByProduct).sort((a, b) => b[1].revenue - a[1].revenue).forEach(([k, d]) => {
    lines.push(`- ${PRODUCT_NAMES[k] ?? k}: ${d.count} מכירות, ₪${Math.round(d.revenue).toLocaleString()}`);
  });
  lines.push('');

  // Conversion
  lines.push('## 🎯 שיעורי המרה ב-30 הימים');
  lines.push(`- **המרה כוללת**: ${overallConversion.toFixed(1)}% (${totalBuyers30} רוכשים מ-${totalLeads30} לידים)`);
  if (strategyBookings > 0) {
    lines.push(`- **פגישת אסטרטגיה → פרימיום**: ${strategyToPremium.toFixed(0)}% (${premiumPurchases} פרימיום מ-${strategyBookings} פגישות)`);
  } else {
    lines.push(`- פגישות אסטרטגיה ב-30 יום: 0 ⚠️ (= 0 לידים ל-Premium pipeline)`);
  }
  lines.push('');

  // Quiz funnel
  if (quizFunnel.completions > 0) {
    lines.push('## 🧠 פאנל קוויז');
    lines.push(`- השלימו את הקוויז: ${quizFunnel.completions}`);
    lines.push(`- הכניסו פרטים: ${quizFunnel.leads}`);
    lines.push(`- נטשו לפני פרטים: ${quizFunnel.dropoff} (${quizFunnel.dropoffPct.toFixed(0)}%)`);
    if (quizFunnel.byProduct.length > 0) {
      lines.push('');
      lines.push('### Drop-off לפי מוצר מומלץ');
      quizFunnel.byProduct.slice(0, 5).forEach(p => {
        lines.push(`- ${PRODUCT_NAMES[p.product] ?? p.product}: ${p.completions} השלמות, ${p.leads} לידים, ${p.dropoffPct.toFixed(0)}% נטישה`);
      });
    }
    lines.push('');
  }

  // Bookings
  if (Object.keys(bookingsByType).length > 0) {
    lines.push('## 📅 פגישות (30 יום)');
    Object.entries(bookingsByType).forEach(([t, d]) => {
      lines.push(`- ${t}: ${d.total} סך הכל (${d.confirmed} מאושרות, ${d.pending} ממתינות)`);
    });
    lines.push('');
  }

  // Hive
  lines.push('## 🐝 כוורת');
  lines.push(`- חברים פעילים: ${hiveActive.count ?? 0}`);
  lines.push('');

  // Sources
  lines.push('## 🚦 מקורות תנועה (30 יום)');
  sortedSources.forEach(([src, count]) => {
    lines.push(`- ${src}: ${count} לידים`);
  });
  lines.push('');

  // Meta campaigns
  if (metaKpis && topCampaigns.length > 0) {
    lines.push('## 📢 Meta Ads (30 יום)');
    lines.push(`- הוצאה כוללת: ₪${Math.round(metaKpis.totalSpend).toLocaleString()}`);
    lines.push(`- חשיפות: ${metaKpis.totalImpressions.toLocaleString()}`);
    lines.push(`- קליקים: ${metaKpis.totalClicks.toLocaleString()} (CTR ${metaKpis.overallCtr.toFixed(2)}%)`);
    lines.push(`- Meta leads: ${metaKpis.totalMetaLeads} | CRM leads מהקמפיינים: ${metaKpis.totalCrmLeads}`);
    lines.push(`- True ROAS (הכנסה CRM / הוצאה): ${metaKpis.trueRoas.toFixed(2)}x`);
    lines.push('');
    lines.push('### קמפיינים פעילים');
    topCampaigns.forEach(c => {
      const kindLabel = c.isQuiz ? 'קוויז' : c.kind === 'sale' ? 'מכירות (אתגר)' : c.kind === 'lead' ? 'לידים' : 'אחר';
      lines.push(`- **${c.name}** (${kindLabel}) — הוצאה ₪${Math.round(c.spend).toLocaleString()}, CTR ${c.ctr.toFixed(2)}%, Meta leads ${c.metaLeads}, CRM leads ${c.crmLeads}, CRM buyers ${c.crmBuyers}, True ROAS ${c.trueRoas.toFixed(2)}x`);
    });
    lines.push('');
  } else if (metaCampaigns.error) {
    lines.push('## 📢 Meta Ads');
    lines.push(`⚠️ שגיאה בקריאה ל-Meta API: ${metaCampaigns.error}`);
    lines.push('');
  }

  // Strategic flag
  lines.push('## ⚡ דגלים אסטרטגיים אוטומטיים');
  const flags: string[] = [];
  if (strategyBookings === 0) flags.push('🚨 **0 פגישות אסטרטגיה ב-30 יום** — המסלול ל-Premium לא פעיל');
  if (quizFunnel.dropoffPct > 70 && quizFunnel.completions > 10) flags.push(`🚨 **נטישה גבוהה ב-quiz**: ${quizFunnel.dropoffPct.toFixed(0)}%`);
  if (metaKpis && metaKpis.trueRoas < 1 && metaKpis.totalSpend > 500) flags.push(`🚨 **ROAS שלילי** ב-Meta: ${metaKpis.trueRoas.toFixed(2)}x`);
  if (totalLeads30 > 0 && totalBuyers30 / totalLeads30 < 0.02) flags.push(`⚠️ **המרה כללית נמוכה** (<2%): ${overallConversion.toFixed(1)}%`);
  if (flags.length === 0) flags.push('אין דגלים קריטיים אוטומטיים. תוכל לעבור לחקירה.');
  flags.forEach(f => lines.push(`- ${f}`));
  lines.push('');

  lines.push('---');
  lines.push('המידע לעיל הוא מצב הרגע. תשתמש בו כדי לתת ניתוח מבוסס נתונים. אם חסר לך data — תגיד לי בדיוק מה.');

  return lines.join('\n');
}
