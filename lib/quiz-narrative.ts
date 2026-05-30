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

  // ── v2 value-additions (independent of sale) ──────────
  /** 6-line readable profile (one per dimension) */
  profile: { line: string }[];
  /** Personal observation in Hadar's voice — by stage × pain */
  hadarObservation: string;
  /** 3 mistakes typical at this stage */
  commonMistakes: string[];
  /** Reflection question to sit with */
  reflectionQuestion: string;
  /** Phase map — which of 5 phases user is in */
  phaseMap: {
    phases: { name: string; range: string }[];
    currentIndex: number;
    insight: string;
  };
  /** Closing emotional anchor */
  emotionalAnchor: string;
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
// PROFILE LABELS — by dimension value
// Used to render the "Your profile" card
// ============================================

const STAGE_LABEL: Record<Stage, string> = {
  beginner:        "מתחילים את הדרך",
  active_business: "עסק פעיל - תנועה קיימת",
  established:     "עסק מבוסס - שנתיים פלוס",
  company_brand:   "חברה או מותג",
};

const PAIN_LABEL: Record<Pain, string> = {
  not_producing:        "לא מצליחים לייצר תוכן",
  producing_unsatisfied: "מייצרים ולא רואים תוצאות",
  known_plateau:        "מודעים לתקרה שאתם בה",
  exploring:            "במצב של חקירה וכיוון",
};

const CONTENT_LABEL: Record<ContentMaturity, string> = {
  no_content:          "ללא תוכן קבוע",
  random_content:      "תוכן אקראי, לא עקבי",
  consistent_content:  "תוכן עקבי",
  strategic_content:   "תוכן אסטרטגי",
};

const PREFERENCE_LABEL: Record<Preference, string> = {
  diy_learning:        "לומדים ועושים בעצמכם",
  structured_learning: "מחפשים מסלול מובנה",
  personal_guidance:   "רוצים ליווי אישי",
  full_service:        "מעדיפים שירות מלא",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  exploring:  "בודקים, לא ממהרים",
  warming:    "בשלים לפעולה בקרוב",
  ready_now:  "מוכנים לפעול עכשיו",
};

const BUDGET_LABEL: Record<Budget, string> = {
  low:     "תקציב מצומצם",
  mid:     "תקציב בינוני",
  high:    "תקציב גבוה",
  premium: "פתוחים להשקעה משמעותית",
};

function buildProfile(profile: UserProfile): { line: string }[] {
  return [
    { line: STAGE_LABEL[profile.stage] },
    { line: PAIN_LABEL[profile.pain] },
    { line: CONTENT_LABEL[profile.contentMaturity] },
    { line: PREFERENCE_LABEL[profile.preference] },
    { line: URGENCY_LABEL[profile.urgency] },
    { line: BUDGET_LABEL[profile.budget] },
  ];
}

// ============================================
// HADAR'S OBSERVATION — Stage × Pain (16 variations)
// Written as if Hadar is talking directly after reading the answers
// ============================================

const HADAR_OBSERVATIONS: Record<Stage, Record<Pain, string>> = {
  beginner: {
    not_producing:
      "הסיבה שאתם עוד לא מייצרים תוכן היא לא טכנית - היא כי עוד לא ברור לכם מה אתם רוצים להגיד. ברגע שמתחילים מההגדרה ולא מהמצלמה, התוכן מגיע מאליו.",
    producing_unsatisfied:
      "בתחילת הדרך זה רגיל להרגיש שמשהו לא מצטרף - כי באמת חסר שלב. עוד לפני התוכן, צריך לדעת לאיזה קהל ספציפי אתם מדברים ומה הוא חייב לשמוע מכם כדי להעריך אתכם.",
    known_plateau:
      "אם כבר מהשלב הראשון אתם מרגישים תקרה, זה סימן טוב - אתם רואים מה שהרבה לא רואים בשנים. הצעד הבא לא קשור לעוד נסיון, אלא להגדרה אסטרטגית של מי אתם בשוק.",
    exploring:
      "להיות בשלב חקירה הוא יתרון - אתם לא תקועים בהרגלים. הצעד הראשון הוא לבחור כיוון אחד ולהתחייב לו לזמן מספיק כדי לראות אם הוא עובד.",
  },
  active_business: {
    not_producing:
      "עסק פעיל בלי נוכחות דיגיטלית זה חוסר שמשפיע על המכירה ישירות. הצעד הבא הוא לא לצלם מהר - הוא להבין איזה תוכן בדיוק היה משכנע את הלקוחות שאתם כבר מכירים.",
    producing_unsatisfied:
      "תוכן בלי תוצאות זו לא בעיה של איכות הסרטונים. זו בעיה של מסר - אתם עונים על השאלה הלא נכונה. הלקוח שלכם רוצה לדעת למה אתם לפני שהוא רוצה לדעת איך.",
    known_plateau:
      "להגיע לתקרה ולדעת שזו תקרה - זו רמת מודעות שלא לכל אחד יש. אנשים אחרים פשוט עובדים יותר קשה. אתם מבינים שצריך לחשוב אחרת. זה התנאי לכל מה שיבוא הלאה.",
    exploring:
      "השלב הזה - של חקירה אקטיבית עם עסק שכבר רץ - הוא בדיוק הזמן לבנות אסטרטגיה לפני שמשקיעים עוד באמצעים. רוב התקציב השיווקי שעסק פעיל מבזבז הולך לפעולות בלי בסיס.",
  },
  established: {
    not_producing:
      "עסק מבוסס בלי שיווק אישי זה חסם צמיחה, לא בחירה. הקהל היום קונה את האדם בתוך השירות, וההיעדרות הדיגיטלית של בעלי העסק היא תוצאה ישירה של חוסר ביטחון אסטרטגי - לא טכני.",
    producing_unsatisfied:
      "כשעסק מבוסס מייצר תוכן בלי תוצאות, זה כמעט תמיד אומר שהמסר מתאים לקהל מוקדם יותר ממה שאתם פוגשים. השפה צריכה להתעדכן יחד עם השלב.",
    known_plateau:
      "תקרה בעסק מבוסס היא לא משהו לעבוד יותר קשה כדי לפרוץ. היא איתות שהמודל המסחרי או המיצוב צריכים שיפוץ. צריך לעצור ולחשוב לפני שמוסיפים פעילות.",
    exploring:
      "עסק מבוסס שמחפש את הצעד הבא צריך לזכור - הצעד הזה לא חייב להיות גדול יותר. הוא צריך להיות מדויק יותר. ההבדל בין המבוסס למצליח הוא לרוב בהירות מי הקהל ולמה.",
  },
  company_brand: {
    not_producing:
      "מותג בלי קול אישי דיגיטלי משאיר את הקהל לבנות אותו עבורכם - וזה תמיד פחות מדויק. הצעד הראשון הוא להגדיר את הקול לפני שמתחילים את הפעילות.",
    producing_unsatisfied:
      "מותג שיש לו תוכן שלא ממיר זה לרוב סימן שהאסטרטגיה השיווקית נכתבה בלי קשר לאסטרטגיה העסקית. שני הדברים האלה לא יכולים לחיות בנפרד.",
    known_plateau:
      "תקרה ברמת מותג בדרך כלל לא נפרצת על ידי שינוי פעילות. היא נפרצת על ידי שינוי מיצוב או הגדרה מחדש של למי המותג בכלל מדבר.",
    exploring:
      "מותג בחקירה זו הזדמנות לעשות עבודה אסטרטגית עמוקה לפני שמשקיעים בקמפיינים. כל שקל שייכנס לפעילות לפני שזה ייסגר - הולך לדלף.",
  },
};

// ============================================
// COMMON MISTAKES — 3 per Stage
// Direct, tactical, independent of any product sale
// ============================================

const COMMON_MISTAKES: Record<Stage, string[]> = {
  beginner: [
    "לקנות קורסים שונים על כל פן בנפרד - לפני שהוגדר הכיוון העסקי. סוף הדרך לרוב יותר מבולבל מההתחלה.",
    "לנסות לחקות בעלי עסקים מצליחים בלי להבין למה הם עושים את מה שהם עושים. החיקוי נכשל כי הוא חיצוני.",
    "להתחיל בלצלם תוכן יומי לפני שיש מסר ברור. נפח תוכן בלי בסיס אסטרטגי - מתעייף אותכם ולא מביא לקוחות.",
  ],
  active_business: [
    "להגדיל את התקציב השיווקי לפני שהמשפך מוכח. תקציב מגדיל פעולה, לא מתקן בעיה.",
    "להוסיף עוד ערוצים - אינסטגרם, יוטיוב, פודקאסט - לפני שערוץ אחד עובד. פיזור הופך תקרה לקיר.",
    "להוריד מחירים כדי להגדיל פניות. הקהל שמגיב למחיר נמוך מתחלף תוך 3 חודשים והשם של העסק נחלש.",
  ],
  established: [
    "לשכור עוד ספק שיווק לפני שיש בהירות אסטרטגית. כל ספק מוסיף עוד פעילות בלי כיוון.",
    "להוסיף שירותים או מוצרים חדשים כדי לפרוץ תקרה. הוספה לפני מיקוד - מורידה את כל ההצעה.",
    "להאמין שהבעיה היא ביצועית כשהיא לרוב בידולית. תיקון של חולשת מסר זה לא יותר אופטימיזציה.",
  ],
  company_brand: [
    "להפריד בין אסטרטגיה עסקית לאסטרטגיה שיווקית - ולתת לכל אחת ספק נפרד. השניים חייבים לחיות יחד.",
    "להכניס פעילות שיווקית רחבה לפני שיש בהירות מי המותג מדבר אליו. רוחב בלי עומק - יוצר רעש.",
    "להעריך את ההצלחה לפי מדדי טווח קצר - חשיפות, קליקים - במקום מדדי טווח ארוך של ערך לקוח.",
  ],
};

// ============================================
// REFLECTION QUESTION — by Stage
// One question to sit with, independent of action
// ============================================

const REFLECTION_QUESTIONS: Record<Stage, string> = {
  beginner:
    "אם הייתי בעוד שנתיים מהיום מסתכל אחורה - מה הייתי רוצה שאמרתי לעצמי עכשיו, בשלב הזה של ההתחלה?",
  active_business:
    "אם העסק שלי בעוד שנה ייראה בדיוק כמו היום - מה ארגיש כלפי השנה שעברה? התשובה היא הכיוון.",
  established:
    "מה הופך עסק מבוסס למוצלח באמת - עוד פעילות, או עומק שלא היה קיים קודם? היכן הייתי משקיע אם הייתי חייב לבחור?",
  company_brand:
    "מה הסיפור שהמותג שלי מספר על עצמו - והאם זה הסיפור שהקהל שומע באמת? היכן הפער הכי גדול?",
};

// ============================================
// PHASE MAP — 5 phases, highlight current
// ============================================

const PHASES = [
  { name: "גישוש",  range: "שנה 1"   },
  { name: "הוכחה",  range: "שנה 1-2" },
  { name: "צמיחה",  range: "שנה 2-3" },
  { name: "תקרה",   range: "שנה 3-5" },
  { name: "פריצה",  range: "שנה 5+"  },
];

const PHASE_INSIGHTS: Record<number, string> = {
  0: "השלב הראשון הוא לא להיות חכמים יותר - הוא להתחיל לעשות במכוון. ההתחלה היא הצעד הקשה ביותר, ויותר אנשים נשארים פה ממה שמודים.",
  1: "אחרי הגישוש מגיע השלב הכי קריטי - לבחור התמחות ולהתחייב לה. מי שמדלג על השלב הזה ומנסה לעשות הכל לכולם - חוזר לגישוש בכל פעם.",
  2: "צמיחה היא לא רק מספרים. היא תקופה שבה אתם מתחילים לראות את הדפוסים בעסק. הסכנה כאן היא לחשוב שמה שעבד עד עכשיו ימשיך לעבוד לנצח.",
  3: "תקרה היא לא כשלון - היא אינדיקטור. רוב העסקים המצליחים עברו תקרה אחת לפחות. ההבדל בין מי שפורץ אותה למי שלא - הוא לא בעבודה קשה יותר.",
  4: "פריצה היא לא דרמטית - היא הדרגתית. אם הגעתם לכאן, יש לכם משהו לתת לאחרים. השלב הזה הוא של מסירה והגדלת השפעה, לא של ביסוס.",
};

function getPhaseIndex(stage: Stage, pain: Pain): number {
  // Stage gives rough phase, pain refines (plateau = always phase 3)
  if (pain === "known_plateau") return 3;
  switch (stage) {
    case "beginner":        return 0;
    case "active_business": return 1;
    case "established":     return 2;
    case "company_brand":   return 4;
    default:                return 1;
  }
}

// ============================================
// EMOTIONAL ANCHOR — closing message, by Stage
// Validation + reassurance
// ============================================

const EMOTIONAL_ANCHOR: Record<Stage, string> = {
  beginner:
    "אתם לא מאחור. אתם בנקודת ההתחלה - והעובדה שהשקעתם 2 דקות באבחון הזה היא צעד שרוב האנשים לא עושים. שמרו את התוצאות. תחזרו אליהן בעוד חצי שנה ותראו כמה התקדמתם.",
  active_business:
    "אתם לא תקועים - אתם בתוך שלב שכל בעלי עסקים פעילים עוברים. ההבדל בין מי שיוצא ממנו למי שנשאר בו הוא לא כישרון. הוא ההחלטה לעצור ולחשוב במקום לעשות עוד.",
  established:
    "תקרה היא לא כשלון. היא סימן שהתחלתם להבין את העסק שלכם ברמה שלא ידעתם קודם. הצעד הבא הוא לא עוד פעולה - הוא רמת מודעות חדשה. רוב המי שמגיע לכאן לא חוזר לאחור.",
  company_brand:
    "מותג שמחפש כיוון הוא לא מותג שאבד. הוא מותג שמודע מספיק כדי לדעת שיש מה לדייק. זה דורש שילוב נדיר של ענווה וחזון - והוא קיים אצלכם, אחרת לא הייתם עוברים אבחון.",
};

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

  // ── v2 value-additions ────────────────────────────────
  const profileLines        = buildProfile(profile);
  const hadarObservation    = HADAR_OBSERVATIONS[stage][pain];
  const commonMistakes      = COMMON_MISTAKES[stage];
  const reflectionQuestion  = REFLECTION_QUESTIONS[stage];
  const currentPhaseIndex   = getPhaseIndex(stage, pain);
  const phaseInsight        = PHASE_INSIGHTS[currentPhaseIndex] ?? "";
  const emotionalAnchor     = EMOTIONAL_ANCHOR[stage];

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
    profile: profileLines,
    hadarObservation,
    commonMistakes,
    reflectionQuestion,
    phaseMap: {
      phases: PHASES,
      currentIndex: currentPhaseIndex,
      insight: phaseInsight,
    },
    emotionalAnchor,
  };
}

// ============================================
// HELPER: Get profile from answers (for debugging/logging)
// ============================================

export function getProfileSummary(answers: Answer[]): string {
  const profile = mapAnswersToProfile(answers);
  return `${profile.stage} + ${profile.pain} + ${profile.preference} + ${profile.urgency} + ${profile.budget}`;
}
