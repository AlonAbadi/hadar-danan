// Quiz Narrative Engine
// Maps quiz answers to user profile and generates personalized copy
// Works alongside existing scoring matrix - doesn't replace it

import type { Answer } from "./quiz-config";

// ============================================
// TYPES
// ============================================

export type Stage = "beginner" | "active_business" | "established" | "company_brand";
export type Pain = "not_producing" | "producing_unsatisfied" | "known_plateau" | "exploring";
export type ContentMaturity = "no_content" | "random_content" | "consistent_content" | "strategic_content";
export type Preference = "diy_learning" | "structured_learning" | "personal_guidance" | "full_service";
export type Urgency = "exploring" | "warming" | "ready_now";
export type Budget = "low" | "mid" | "high" | "premium";

export interface UserProfile {
  stage: Stage;
  pain: Pain;
  contentMaturity: ContentMaturity;
  preference: Preference;
  urgency: Urgency;
  budget: Budget;
}

export interface NarrativeOutput {
  headline: { main: string; highlight: string };
  subline: string;
  diagnosis: {
    problem: string;
    consequence: string;
    socialProof: string;
  };
  bridge: string;
  confidence: {
    level: number; // 1-5
    percentage: number;
    text: string;
  };
  incoherenceWarning?: string;
}

// ============================================
// ANSWER → PROFILE MAPPING
// ============================================

const STAGE_MAP: Record<Answer, Stage> = {
  A: "beginner",
  B: "active_business",
  C: "established",
  D: "company_brand",
};

const PAIN_MAP: Record<Answer, Pain> = {
  A: "not_producing",
  B: "producing_unsatisfied",
  C: "exploring",
  D: "known_plateau",
};

const CONTENT_MAP: Record<Answer, ContentMaturity> = {
  A: "no_content",
  B: "random_content",
  C: "consistent_content",
  D: "strategic_content",
};

const PREFERENCE_MAP: Record<Answer, Preference> = {
  A: "diy_learning",
  B: "structured_learning",
  C: "personal_guidance",
  D: "full_service",
};

const URGENCY_MAP: Record<Answer, Urgency> = {
  A: "exploring",
  B: "warming",
  C: "ready_now",
  D: "ready_now",
};

const BUDGET_MAP: Record<Answer, Budget> = {
  A: "low",
  B: "mid",
  C: "high",
  D: "premium",
};

export function mapAnswersToProfile(answers: Answer[]): UserProfile {
  return {
    stage: STAGE_MAP[answers[0]] ?? "active_business",
    pain: PAIN_MAP[answers[1]] ?? "producing_unsatisfied",
    contentMaturity: CONTENT_MAP[answers[2]] ?? "random_content",
    preference: PREFERENCE_MAP[answers[3]] ?? "structured_learning",
    urgency: URGENCY_MAP[answers[4]] ?? "warming",
    budget: BUDGET_MAP[answers[5]] ?? "mid",
  };
}

// ============================================
// HEADLINES - by Stage
// ============================================

const HEADLINES: Record<Stage, { main: string; highlight: string }> = {
  beginner: {
    main: "אתם רוצים להתחיל -",
    highlight: "אבל לא יודעים מאיפה.",
  },
  active_business: {
    main: "יש לכם תנועה -",
    highlight: "אבל היא לא הופכת ללקוחות.",
  },
  established: {
    main: "יש לכם עסק שעובד -",
    highlight: "אבל הוא תקוע באותו מקום.",
  },
  company_brand: {
    main: "יש לכם מותג -",
    highlight: "אבל השיווק לא עובד מספיק חזק.",
  },
};

// ============================================
// SUBLINES - by Stage + Pain
// ============================================

const SUBLINES: Record<Stage, Record<Pain, string>> = {
  beginner: {
    not_producing: "זה בדיוק המקום שבו כדאי להתחיל נכון.",
    producing_unsatisfied: "יש לכם התחלה - עכשיו צריך כיוון.",
    known_plateau: "אתם יודעים שמשהו חסר - ואתם צודקים.",
    exploring: "בואו נבין מה באמת מתאים לכם.",
  },
  active_business: {
    not_producing: "הבעיה היא לא שאתם לא עובדים - אלא שאין שיטה.",
    producing_unsatisfied: "זה בדיוק המקום שבו רוב בעלי העסקים נתקעים.",
    known_plateau: "אתם יודעים שצריך לעשות משהו אחרת - ואתם צודקים.",
    exploring: "בואו נבין מה הצעד הבא שלכם.",
  },
  established: {
    not_producing: "עסק מבוסס בלי שיווק שיטתי - זה פוטנציאל שלא מנוצל.",
    producing_unsatisfied: "אתם עושים - אבל לא רואים צמיחה. זה לא מקרי.",
    known_plateau: "הגעתם לתקרה - ואתם יודעים שצריך משהו אחר כדי לפרוץ.",
    exploring: "עסק מבוסס צריך שיווק מבוסס. בואו נבנה.",
  },
  company_brand: {
    not_producing: "מותג בלי נוכחות דיגיטלית - זה פער שאפשר לסגור.",
    producing_unsatisfied: "יש לכם תוכן - אבל הוא לא עובד מספיק חזק.",
    known_plateau: "אתם יודעים שהשיווק יכול להיות יותר טוב - ואתם צודקים.",
    exploring: "בואו נבין מה צריך כדי לקחת את המותג לרמה הבאה.",
  },
};

// ============================================
// DIAGNOSIS - by Stage + Pain
// ============================================

const DIAGNOSIS: Record<Stage, Record<Pain, { problem: string; consequence: string; socialProof: string }>> = {
  beginner: {
    not_producing: {
      problem: "אתם בתחילת הדרך - ועדיין לא התחלתם ליצור תוכן.",
      consequence: "בלי תוכן - אין נוכחות. ובלי נוכחות - קשה להביא לקוחות.",
      socialProof: "הרבה עסקים נשארים בשלב הזה יותר מדי זמן - מחכים שמשהו יקרה.",
    },
    producing_unsatisfied: {
      problem: "התחלתם ליצור תוכן - אבל זה מרגיש אקראי ולא ממוקד.",
      consequence: "תוכן בלי שיטה - זה אנרגיה שמתבזבזת.",
      socialProof: "זה נורמלי בהתחלה - אבל אפשר לעבוד יותר חכם.",
    },
    known_plateau: {
      problem: "אתם יודעים שמשהו חסר - אבל לא בטוחים מה.",
      consequence: "בלי כיוון ברור - קשה לדעת מה הצעד הבא.",
      socialProof: "הרבה מתחילים מרגישים ככה - זה בדיוק הזמן לבנות בסיס.",
    },
    exploring: {
      problem: "אתם בשלב של חקירה - מנסים להבין מה מתאים לכם.",
      consequence: "זה שלב חשוב - אבל אפשר להתקדם גם תוך כדי.",
      socialProof: "הרבה עסקים מצליחים התחילו מאותו מקום.",
    },
  },
  active_business: {
    not_producing: {
      problem: "יש לכם עסק פעיל - אבל אתם לא יוצרים תוכן.",
      consequence: "עסק בלי נוכחות דיגיטלית - זה לקוחות שלא מגיעים.",
      socialProof: "הרבה בעלי עסקים מתמקדים בעבודה - ושוכחים את השיווק.",
    },
    producing_unsatisfied: {
      problem: "אתם עושים - אבל בלי שיטה שמחברת את זה ללקוחות.",
      consequence: "בלי שיטה - זה פשוט נשאר אותו דבר.",
      socialProof: "זה המקום שבו הרבה עסקים נשארים שנים - עושים, אבל לא גדלים.",
    },
    known_plateau: {
      problem: "אתם יודעים שהגעתם לתקרה - ושצריך משהו אחר.",
      consequence: "להמשיך לעשות אותו דבר - זה להישאר באותו מקום.",
      socialProof: "זה הרגע שבו צריך לשנות גישה - לא לעבוד יותר קשה.",
    },
    exploring: {
      problem: "אתם מחפשים את הדרך הנכונה להתקדם.",
      consequence: "בלי כיוון - קל להתפזר.",
      socialProof: "בואו נמצא את הצעד שבאמת יזיז.",
    },
  },
  established: {
    not_producing: {
      problem: "יש לכם עסק מבוסס - אבל בלי נוכחות דיגיטלית אמיתית.",
      consequence: "עסק מבוסס בלי שיווק - זה פוטנציאל שיושב על השולחן.",
      socialProof: "הרבה עסקים מבוססים גילו שזה בדיוק מה שחסר לצמיחה הבאה.",
    },
    producing_unsatisfied: {
      problem: "אתם יוצרים תוכן - אבל הוא לא מביא את התוצאות שציפיתם.",
      consequence: "תוכן בלי אסטרטגיה - זה אנרגיה בלי כיוון.",
      socialProof: "עסקים מבוססים צריכים שיווק מבוסס - לא ניסויים.",
    },
    known_plateau: {
      problem: "הגעתם לתקרה - ואתם יודעים שצריך משהו אחר כדי לפרוץ.",
      consequence: "התקרה לא תיפרץ מעצמה - צריך שיטה.",
      socialProof: "זה בדיוק הרגע שבו עסקים מבוססים עושים את הקפיצה.",
    },
    exploring: {
      problem: "אתם מחפשים את הדרך הנכונה לקחת את העסק לרמה הבאה.",
      consequence: "בלי תוכנית - קשה לדעת לאן לכוון.",
      socialProof: "בואו נבנה תוכנית שמתאימה לעסק שלכם.",
    },
  },
  company_brand: {
    not_producing: {
      problem: "יש לכם מותג - אבל הנוכחות הדיגיטלית לא משקפת אותו.",
      consequence: "מותג בלי קול דיגיטלי - זה הזדמנויות שמתפספסות.",
      socialProof: "מותגים שבונים נוכחות נכונה - רואים את זה בתוצאות.",
    },
    producing_unsatisfied: {
      problem: "יש לכם תוכן - אבל הוא לא עובד ברמה שמותג צריך.",
      consequence: "תוכן שלא ממיר - זה תקציב שלא חוזר.",
      socialProof: "מותגים צריכים שיטה - לא רק יצירתיות.",
    },
    known_plateau: {
      problem: "אתם יודעים שהשיווק יכול לעבוד יותר חזק - ואתם צודקים.",
      consequence: "להישאר באותו מקום - זה לתת למתחרים להתקדם.",
      socialProof: "זה הרגע לבנות שיטה שמניעה צמיחה אמיתית.",
    },
    exploring: {
      problem: "אתם מחפשים את הדרך להפוך את המותג לחזק יותר.",
      consequence: "בלי כיוון ברור - קשה למקסם את הפוטנציאל.",
      socialProof: "בואו נבנה אסטרטגיה שמתאימה למותג שלכם.",
    },
  },
};

// ============================================
// BRIDGES - by Preference
// ============================================

const BRIDGES: Record<Preference, string> = {
  diy_learning: "אתם רוצים ללמוד לבד ולעשות בעצמכם - וזה בדיוק מה שאפשר כאן.",
  structured_learning: "כאן עוברים מלנסות - לעבוד נכון.",
  personal_guidance: "כאן מקבלים כיוון אישי - לא רק תוכן.",
  full_service: "כאן מקבלים מערכת שלמה - לא רק כלים.",
};

// ============================================
// CONFIDENCE LEVELS
// ============================================

const CONFIDENCE_TEXT: Record<number, string> = {
  1: "התאמה בסיסית",
  2: "התאמה סבירה",
  3: "התאמה טובה",
  4: "התאמה גבוהה",
  5: "התאמה מצוינת",
};

// ============================================
// INCOHERENCE DETECTION
// ============================================

const INCOHERENCE_WARNINGS: Record<string, string> = {
  beginner_premium: "בתחילת הדרך השקעה גדולה היא החלטה משמעותית - כדאי להתחיל בצעד שנותן ערך בלי סיכון גדול.",
  beginner_full_service: "שירות מלא מתאים יותר לעסק שכבר יודע מה הוא צריך - בתחילת הדרך עדיף ללמוד את הבסיס קודם.",
  company_brand_low: "מותג בדרך כלל צריך השקעה ברמה שתתאים לגודל שלו - אבל אפשר להתחיל בצעד שנותן ערך מיידי.",
};

function detectIncoherence(profile: UserProfile): string | null {
  const { stage, budget, preference } = profile;

  if (stage === "beginner" && budget === "premium") {
    return "beginner_premium";
  }

  if (stage === "beginner" && preference === "full_service") {
    return "beginner_full_service";
  }

  if (stage === "company_brand" && budget === "low") {
    return "company_brand_low";
  }

  return null;
}

// ============================================
// CONFIDENCE CALCULATION
// ============================================

function calculateConfidence(profile: UserProfile): { level: number; percentage: number } {
  let score = 3; // baseline

  // Clear pain = higher confidence
  if (profile.pain === "producing_unsatisfied" || profile.pain === "known_plateau") {
    score += 1;
  }

  // Ready urgency = higher confidence
  if (profile.urgency === "ready_now") {
    score += 1;
  } else if (profile.urgency === "exploring") {
    score -= 1;
  }

  // Incoherence = lower confidence
  if (detectIncoherence(profile)) {
    score -= 1;
  }

  const level = Math.max(1, Math.min(5, score));
  const percentage = 60 + level * 8; // 68%, 76%, 84%, 92%, 100% -> capped

  return { level, percentage: Math.min(percentage, 97) };
}

// ============================================
// MAIN BUILDER FUNCTION
// ============================================

export function buildNarrative(answers: Answer[]): NarrativeOutput {
  const profile = mapAnswersToProfile(answers);
  const { stage, pain, preference } = profile;

  // Get headline
  const headline = HEADLINES[stage];

  // Get subline
  const subline = SUBLINES[stage][pain];

  // Get diagnosis
  const diagnosis = DIAGNOSIS[stage][pain];

  // Get bridge
  const bridge = BRIDGES[preference];

  // Calculate confidence
  const { level, percentage } = calculateConfidence(profile);

  // Check for incoherence
  const incoherenceKey = detectIncoherence(profile);
  const incoherenceWarning = incoherenceKey ? INCOHERENCE_WARNINGS[incoherenceKey] : undefined;

  return {
    headline,
    subline,
    diagnosis,
    bridge,
    confidence: {
      level,
      percentage,
      text: CONFIDENCE_TEXT[level],
    },
    incoherenceWarning,
  };
}

// ============================================
// HELPER: Get profile from answers (for debugging/logging)
// ============================================

export function getProfileSummary(answers: Answer[]): string {
  const profile = mapAnswersToProfile(answers);
  return `${profile.stage} + ${profile.pain} + ${profile.preference} + ${profile.urgency} + ${profile.budget}`;
}
