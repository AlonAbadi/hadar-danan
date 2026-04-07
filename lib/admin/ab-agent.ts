import { createServerClient } from '@/lib/supabase/server';

// ════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════

export interface ABProposal {
  id: string;
  category: 'copy' | 'ux' | 'funnel';
  title: string;
  hypothesis: string;
  variant_a: string;
  variant_b: string;
  metric: string;
  page_or_element: string;
  estimated_traffic: number;
  days_to_significance: number;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  status: 'proposed' | 'approved' | 'running' | 'paused' | 'completed';
  visitors_a: number;
  visitors_b: number;
  conversions_a: number;
  conversions_b: number;
  confidence: number;
  winner: 'a' | 'b' | 'none' | null;
  approved_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface SiteInsights {
  totalSignups: number;
  dailySignups: number;
  funnelDropOffs: { stage: string; dropPct: number }[];
  weakEmailSequences: { sequenceId: string; openRate: number }[];
  checkoutAbandonRate: number;
  topDropOffStage: string;
}

// ════════════════════════════════════════════════════════
// BAYESIAN STATISTICAL ENGINE
// ════════════════════════════════════════════════════════

// Normal CDF approximation (Abramowitz and Stegun formula 7.1.26)
function normCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const xAbs = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * xAbs);
  const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-xAbs * xAbs);
  return 0.5 * (1 + sign * erf);
}

/**
 * Bayesian A/B test statistics using Beta-Binomial model.
 * Prior: Beta(1, 1) - uniform, non-informative.
 * Posterior: Beta(1 + conversions, 1 + failures).
 * P(B > A) approximated via normal distribution of the difference.
 *
 * Returns confidence as max(P(B>A), P(A>B)) × 100.
 * Minimum sample: 100 visitors per variant.
 */
export function bayesianStats(
  visitors_a: number,
  conversions_a: number,
  visitors_b: number,
  conversions_b: number
): {
  confidence: number;
  probBWins: number;
  uplift: number;
  muA: number;
  muB: number;
  ci_a: [number, number];
  ci_b: [number, number];
  winner: 'a' | 'b' | 'none' | null;
  hasMinSample: boolean;
} {
  const hasMinSample = visitors_a >= 100 && visitors_b >= 100;

  if (!hasMinSample || visitors_a === 0 || visitors_b === 0) {
    return {
      confidence: 0, probBWins: 0.5, uplift: 0, muA: 0, muB: 0,
      ci_a: [0, 1], ci_b: [0, 1], winner: null, hasMinSample,
    };
  }

  // Posterior Beta(α, β) parameters
  const αA = 1 + conversions_a;
  const βA = 1 + visitors_a - conversions_a;
  const αB = 1 + conversions_b;
  const βB = 1 + visitors_b - conversions_b;

  // Posterior mean and variance
  const muA = αA / (αA + βA);
  const varA = (αA * βA) / ((αA + βA) ** 2 * (αA + βA + 1));
  const muB = αB / (αB + βB);
  const varB = (αB * βB) / ((αB + βB) ** 2 * (αB + βB + 1));

  // P(B > A): normal approximation of B − A
  const diff = muB - muA;
  const stdDiff = Math.sqrt(varA + varB);
  const probBWins = stdDiff > 0 ? normCDF(diff / stdDiff) : (diff > 0 ? 1 : 0);

  // Confidence = how sure we are that the better variant is actually better
  const confidence = Math.round(Math.max(probBWins, 1 - probBWins) * 100);

  // Relative uplift of B over A
  const uplift = muA > 0 ? ((muB - muA) / muA) * 100 : 0;

  // 95% credible intervals
  const ci_a: [number, number] = [
    Math.max(0, muA - 1.96 * Math.sqrt(varA)),
    Math.min(1, muA + 1.96 * Math.sqrt(varA)),
  ];
  const ci_b: [number, number] = [
    Math.max(0, muB - 1.96 * Math.sqrt(varB)),
    Math.min(1, muB + 1.96 * Math.sqrt(varB)),
  ];

  // Winner determination (only at 95%+ confidence)
  let winner: 'a' | 'b' | 'none' | null = null;
  if (confidence >= 95) {
    winner = probBWins > 0.5 ? 'b' : 'a';
  }

  return { confidence, probBWins, uplift, muA, muB, ci_a, ci_b, winner, hasMinSample };
}

// ════════════════════════════════════════════════════════
// DATA ANALYSIS
// ════════════════════════════════════════════════════════

async function gatherInsights(): Promise<SiteInsights> {
  const supabase = createServerClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Total users (last 30 days)
  const { count: totalSignups } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo);

  // Funnel drop-offs
  const { data: users } = await supabase
    .from('users')
    .select('status')
    .gte('created_at', thirtyDaysAgo);

  const stages = ['lead', 'engaged', 'high_intent', 'buyer', 'booked'];
  const stageCounts: Record<string, number> = {};
  stages.forEach((s) => { stageCounts[s] = 0; });
  users?.forEach((u) => {
    const idx = stages.indexOf(u.status);
    for (let i = 0; i <= Math.max(0, idx); i++) stageCounts[stages[i]]++;
  });

  const funnelDropOffs = stages.slice(1).map((stage, i) => {
    const prev = stageCounts[stages[i]];
    const curr = stageCounts[stage];
    return { stage, dropPct: prev > 0 ? Math.round((1 - curr / prev) * 100) : 0 };
  });

  const topDropOffStage = funnelDropOffs.reduce(
    (max, s) => s.dropPct > max.dropPct ? s : max,
    { stage: 'lead', dropPct: 0 }
  ).stage;

  // Email weak sequences
  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('sequence_id, status')
    .gte('sent_at', thirtyDaysAgo);

  const seqStats: Record<string, { sent: number; opened: number }> = {};
  emailLogs?.forEach((log) => {
    const key = log.sequence_id || 'unknown';
    if (!seqStats[key]) seqStats[key] = { sent: 0, opened: 0 };
    seqStats[key].sent++;
    if (log.status === 'opened' || log.status === 'clicked') seqStats[key].opened++;
  });

  const weakEmailSequences = Object.entries(seqStats)
    .filter(([, s]) => s.sent >= 10)
    .map(([sequenceId, s]) => ({
      sequenceId,
      openRate: Math.round((s.opened / s.sent) * 100),
    }))
    .filter((s) => s.openRate < 20)
    .sort((a, b) => a.openRate - b.openRate);

  // Checkout abandonment
  const { count: checkoutStarted } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'CHECKOUT_STARTED')
    .gte('created_at', thirtyDaysAgo);

  const { count: completed } = await supabase
    .from('purchases')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('created_at', thirtyDaysAgo);

  const checkoutAbandonRate = (checkoutStarted || 0) > 0
    ? Math.round((1 - (completed || 0) / (checkoutStarted || 1)) * 100)
    : 0;

  return {
    totalSignups: totalSignups || 0,
    dailySignups: Math.round((totalSignups || 0) / 30),
    funnelDropOffs,
    weakEmailSequences,
    checkoutAbandonRate,
    topDropOffStage,
  };
}

// ════════════════════════════════════════════════════════
// PROPOSAL GENERATION
// ════════════════════════════════════════════════════════

type ProposalTemplate = Omit<ABProposal,
  'id' | 'status' | 'visitors_a' | 'visitors_b' | 'conversions_a' | 'conversions_b' |
  'confidence' | 'winner' | 'approved_at' | 'started_at' | 'completed_at' | 'created_at'
>;

function buildProposals(insights: SiteInsights): ProposalTemplate[] {
  const { dailySignups, funnelDropOffs, weakEmailSequences, checkoutAbandonRate, topDropOffStage } = insights;
  const proposals: ProposalTemplate[] = [];

  // ── COPY PROPOSALS ──────────────────────────────────────────────

  // Hero CTA - always relevant for top-of-funnel
  const trafficEst = Math.max(20, dailySignups);
  proposals.push({
    category: 'copy',
    title: 'טקסט כפתור CTA - עמוד הדרכה חינמית',
    hypothesis: 'כפתור ממוקד תועלת ספציפית יגדיל הרשמות ב-15-25% לעומת כפתור גנרי, כי הוא מדגיש מה המשתמש מקבל ומפחית חשש.',
    variant_a: '"להתחיל עכשיו" - CTA כללי',
    variant_b: '"לקבל את השיעור בחינם" - CTA ממוקד תועלת',
    metric: 'signup_rate',
    page_or_element: '/training',
    estimated_traffic: trafficEst,
    days_to_significance: Math.max(7, Math.ceil(200 / trafficEst)),
    priority: 'high',
    reasoning: `${dailySignups} הרשמות יומיות בממוצע. שיפור של 20% = ${Math.round(dailySignups * 0.2)} הרשמות נוספות ליום. כפתורים ממוקדי-תועלת מוכחים כמשיגים עליית המרה של 15-30% לפי מחקרי CXL ו-HubSpot.`,
  });

  // Homepage headline (always relevant)
  proposals.push({
    category: 'copy',
    title: 'כותרת ראשית - עמוד הבית',
    hypothesis: 'כותרת ממוקדת-תוצאה עם מספרים קונקרטיים תגדיל הרשמות ב-15% כי היא מדברת לתוצאה הרצויה ובונה אמינות מיידית.',
    variant_a: 'כותרת Brand: "אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך."',
    variant_b: 'כותרת Result: "200+ עסקים שינו את הנוכחות הדיגיטלית שלהם ב-90 יום" + "בלי צילום יומי. בלי עייפות תוכן."',
    metric: 'signup_rate',
    page_or_element: '/',
    estimated_traffic: Math.max(50, dailySignups * 2),
    days_to_significance: Math.max(7, Math.ceil(200 / Math.max(50, dailySignups * 2))),
    priority: funnelDropOffs[0]?.dropPct > 70 ? 'high' : 'medium',
    reasoning: `שיעור נשירה מהדף הראשי: ${funnelDropOffs[0]?.dropPct || 'לא ידוע'}%. כותרת ממוקדת תוצאה (social proof + outcome) מקטינה bounce rate ומגדילה engagement לפי עשרות מחקרי CRO.`,
  });

  // Pricing format - relevant if checkout abandonment is high
  if (checkoutAbandonRate > 40) {
    proposals.push({
      category: 'copy',
      title: 'פורמט תמחור - עמוד הקורס',
      hypothesis: `הצגת מחיר כעלות יומית (₪5/יום) תקטין כאב מחיר ותגדיל המרה ב-20%, כי ₪1,800 חד פעמי נתפס כיקר בהשוואה לפחות מכוס קפה ביום.`,
      variant_a: 'הצגה נוכחית: "₪1,800" - מחיר חד פעמי ברור',
      variant_b: 'הצגת ערך: "₪5 ביום × 365 = ₪1,800 פעם אחת" - מחיר יומי + הסבר',
      metric: 'checkout_rate',
      page_or_element: '/course',
      estimated_traffic: Math.max(10, Math.round(dailySignups * 0.3)),
      days_to_significance: 21,
      priority: 'high',
      reasoning: `שיעור נטישת תשלום: ${checkoutAbandonRate}% - גבוה מהנורמה (60%). פסיכולוגיית תמחור: פיצול לסכום יומי מקטין perception cost. נפוץ בקורסים ו-SaaS עם עלייה מוכחת של 15-25% בהמרה.`,
    });
  }

  // Email subject lines - if weak sequences found
  if (weakEmailSequences.length > 0) {
    const weakest = weakEmailSequences[0];
    proposals.push({
      category: 'copy',
      title: `שורת נושא - אימייל ${weakest.sequenceId}`,
      hypothesis: 'שורת נושא מבוססת-סקרנות וממוקדת-תוצאה תגדיל open rate ב-10-15%.',
      variant_a: `שורת נושא נוכחית (open rate: ${weakest.openRate}%)`,
      variant_b: 'שורת נושא חדשה: ממוקדת תוצאה ספציפית + מספר (לדוגמה: "7 ימים שיכולים לשנות את הפיד שלך")',
      metric: 'email_open_rate',
      page_or_element: `email:${weakest.sequenceId}`,
      estimated_traffic: 200,
      days_to_significance: 7,
      priority: 'medium',
      reasoning: `רצף "${weakest.sequenceId}" מגיע לשיעור פתיחה של ${weakest.openRate}% בלבד - מתחת לממוצע התעשייה (21%). כל 5% שיפור ב-open rate = עשרות לידים חמים נוספים בשבוע.`,
    });
  }

  // ── UX PROPOSALS ────────────────────────────────────────────────

  // Social proof placement
  proposals.push({
    category: 'ux',
    title: 'מיקום הוכחה חברתית - עמוד הדרכה חינמית',
    hypothesis: 'הוספת Counter ("צטרפו 2,000+ אנשי תוכן") מתחת לכפתור CTA תגדיל המרה ב-10%, כי היא מפחיתה חשש ובונה אמינות בנקודת ההחלטה.',
    variant_a: 'CTA בלבד - ללא הוכחה חברתית ליד הכפתור',
    variant_b: 'CTA + Counter קטן מתחת: "🙌 2,000+ אנשי תוכן כבר בפנים" בטקסט קטן מתחת לכפתור',
    metric: 'signup_rate',
    page_or_element: '/training #cta-section',
    estimated_traffic: trafficEst,
    days_to_significance: 14,
    priority: 'medium',
    reasoning: 'Social proof בנקודת ההמרה מוכחת כמגדילה המרה. Counter ספציפי עדיף על "אנשים רבים" גנרי. השפעה מוכחת ב-10-15% עלייה בהרשמות לפי מחקרי Nielsen Norman Group.',
  });

  // Sticky CTA vs inline (high drop-off from homepage)
  if (topDropOffStage === 'lead' || funnelDropOffs[0]?.dropPct > 60) {
    proposals.push({
      category: 'ux',
      title: 'CTA צף (Sticky) - עמוד הבית',
      hypothesis: 'CTA צף שנשאר גלוי בזמן גלילה יגדיל הרשמות ב-12%, כי הוא נגיש תמיד ומפחית חיכוך.',
      variant_a: 'CTA inline בלבד - מופיע רק בחלק Hero',
      variant_b: 'CTA צף בתחתית המסך - "הרשם לשיעור חינם ←" נשאר גלוי בגלילה (mobile בלבד)',
      metric: 'signup_rate',
      page_or_element: '/ #hero',
      estimated_traffic: Math.max(50, dailySignups * 2),
      days_to_significance: 14,
      priority: 'medium',
      reasoning: `שיעור נשירה ב-lead→engaged: ${funnelDropOffs[0]?.dropPct || 0}%. רבים גוללים מעבר ל-Hero מבלי להמיר. CTA צף במובייל מגדיל המרות ב-8-15% לפי מחקרי Baymard Institute.`,
    });
  }

  // ── FUNNEL PROPOSALS ────────────────────────────────────────────

  // Quiz length
  proposals.push({
    category: 'funnel',
    title: 'אורך שאלון האבחון - 5 מול 3 שאלות',
    hypothesis: 'שאלון מקוצר (3 שאלות) יגדיל השלמה ב-30%, כי הוא מקטין עייפות - גם אם הדיוק קצת פחות.',
    variant_a: 'שאלון נוכחי: 5 שאלות - אבחון מפורט',
    variant_b: 'שאלון מקוצר: 3 שאלות בלבד - רק תקציב, שלב עסקי, מטרה ראשית',
    metric: 'quiz_completion_rate',
    page_or_element: '/quiz',
    estimated_traffic: Math.max(20, dailySignups),
    days_to_significance: 14,
    priority: 'medium',
    reasoning: 'שאלונים עם יותר מ-4 שאלות סובלים מנשירה של 40-60% לפי מחקרי SurveyMonkey. אם המשתמש לא מסיים - לא ממיר. שאלון קצר עם המרה גבוהה שווה יותר מאבחון מדויק עם נשירה.',
  });

  // Upsell timing - if checkout abandonment is high
  if (checkoutAbandonRate > 50) {
    proposals.push({
      category: 'funnel',
      title: 'תזמון הצעת האפסייל - מיידי מול מושהה',
      hypothesis: 'הצגת אפסייל לסדנה 24 שעות אחרי רכישת האתגר (במקום מיידית) תגדיל המרה לסדנה ב-20%, כי הלקוח צריך זמן להרגיש ערך קודם.',
      variant_a: 'אפסייל מיידי: הצג הצעה לסדנה מיד בעמוד ה-success של האתגר',
      variant_b: 'אפסייל מושהה: שלח אימייל עם הצעה לסדנה 24 שעות אחרי, כשהלקוח כבר "הרגיש" ערך',
      metric: 'checkout_rate',
      page_or_element: '/challenge/success → /workshop',
      estimated_traffic: Math.max(5, Math.round(dailySignups * 0.1)),
      days_to_significance: 30,
      priority: 'low',
      reasoning: `נטישת תשלום: ${checkoutAbandonRate}% - גבוה. הלקוח שרכש זה עתה נמצא ב"תרדמת קוני" (buyer's remorse window). המתנה 24 שעות מאפשרת לו לעכל ולהתרגש לפני ההצעה הבאה.`,
    });
  }

  return proposals;
}

// ════════════════════════════════════════════════════════
// MAIN AGENT FUNCTION
// ════════════════════════════════════════════════════════

/**
 * Analyzes site data and generates new A/B test proposals.
 * Skips proposals that are duplicates (same metric + page_or_element).
 * Saves new proposals to the database and returns them.
 */
export async function analyzeAndPropose(): Promise<ABProposal[]> {
  const supabase = createServerClient();

  // Gather real data from the site
  const insights = await gatherInsights();

  // Generate proposals from insights
  const candidates = buildProposals(insights);

  // Fetch existing proposals to avoid duplicates
  const { data: existing } = await supabase
    .from('ab_proposals')
    .select('metric, page_or_element, title');

  const existingKeys = new Set(
    (existing || []).map((p) => `${p.metric}::${p.page_or_element}`)
  );

  // Filter out duplicates
  const newProposals = candidates.filter(
    (p) => !existingKeys.has(`${p.metric}::${p.page_or_element}`)
  );

  if (newProposals.length === 0) {
    return [];
  }

  // Insert new proposals
  const { data: inserted, error } = await supabase
    .from('ab_proposals')
    .insert(
      newProposals.map((p) => ({
        ...p,
        status: 'proposed',
        visitors_a: 0,
        visitors_b: 0,
        conversions_a: 0,
        conversions_b: 0,
        confidence: 0,
      }))
    )
    .select();

  if (error) throw error;
  return (inserted || []) as ABProposal[];
}

// ════════════════════════════════════════════════════════
// AUTO-STOP ENGINE
// ════════════════════════════════════════════════════════

/**
 * Checks all running proposals and auto-stops any that have reached
 * 95% confidence or exceeded 2× their estimated duration.
 * Called by the cron job or manually from the admin UI.
 */
export async function checkAutoStop(): Promise<{ stopped: string[]; errors: string[] }> {
  const supabase = createServerClient();
  const stopped: string[] = [];
  const errors: string[] = [];

  const { data: running } = await supabase
    .from('ab_proposals')
    .select('*')
    .eq('status', 'running');

  for (const test of running || []) {
    const stats = bayesianStats(
      test.visitors_a, test.conversions_a,
      test.visitors_b, test.conversions_b
    );

    const daysRunning = test.started_at
      ? Math.floor((Date.now() - new Date(test.started_at).getTime()) / 86400000)
      : 0;

    const shouldStop =
      (stats.hasMinSample && stats.confidence >= 95) ||
      daysRunning >= test.days_to_significance * 2;

    if (shouldStop) {
      const winner = stats.confidence >= 95 ? stats.winner : 'none';
      const { error } = await supabase
        .from('ab_proposals')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          confidence: stats.confidence,
          winner,
        })
        .eq('id', test.id);

      if (error) {
        errors.push(`${test.id}: ${error.message}`);
      } else {
        stopped.push(test.id);
      }
    } else if (stats.hasMinSample) {
      // Update confidence even if not stopping
      await supabase
        .from('ab_proposals')
        .update({ confidence: stats.confidence })
        .eq('id', test.id);
    }
  }

  return { stopped, errors };
}
