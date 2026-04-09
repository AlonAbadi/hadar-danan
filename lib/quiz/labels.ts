// Shared quiz question/answer text mapping.
// Source of truth for quiz labels - used by TrueSignal diagnosis to decode
// stored answer keys (e.g. "q1":"B") into human-readable text for Claude.

export const QUIZ_QUESTION_MAP: Record<string, { title: string; answers: Record<string, string> }> = {
  q1: {
    title: "איפה העסק שלך עכשיו?",
    answers: {
      A: "רק מתחיל - עדיין בונה את הבסיס",
      B: "יש לי עסק פעיל - רוצה יותר לקוחות",
      C: "יש לי עסק מבוסס - רוצה לצמוח בגדול",
      D: "חברה / מותג - מחפשים שותף אסטרטגי",
    },
  },
  q2: {
    title: "מה הכי עוצר אותך בשיווק?",
    answers: {
      A: "לא יודע מה לומר מול המצלמה",
      B: "מייצר תוכן אבל לא רואה תוצאות",
      C: "אין לי זמן לעשות הכל לבד",
      D: "השיווק לא משקף את האיכות האמיתית שלי",
    },
  },
  q3: {
    title: "מה הקשר שלך לתוכן כרגע?",
    answers: {
      A: "לא מייצר תוכן בכלל",
      B: "מנסה לפה ולשם, לא עקבי",
      C: "מייצר תוכן אבל לא מרוצה מהאיכות",
      D: "רוצה ליצור תוכן ברמה מקצועית גבוהה",
    },
  },
  q4: {
    title: "איך אתה לומד הכי טוב?",
    answers: {
      A: "סרטון קצר + מיידי לפעולה",
      B: "קורס מובנה שאוכל לעבור בקצב שלי",
      C: "ליווי אישי עם פידבק אמיתי",
      D: "מישהו שפשוט עושה את זה בשבילי",
    },
  },
  q5: {
    title: "מה רמת הדחיפות שלך?",
    answers: {
      A: "רוצה להבין לפני שאני מחליט",
      B: "מוכן להתחיל בקרוב - שבוע-שבועיים",
      C: "דחוף - רוצה תוצאות עכשיו",
      D: "יש לי פרויקט ספציפי שצריך פתרון מהיר",
    },
  },
  q6: {
    title: "מה ההשקעה שנוחה לך?",
    answers: {
      A: 'מעדיף להתחיל חינם ולראות',
      B: 'עד 2,000 ש"ח - השקעה נוחה',
      C: '2,000-15,000 ש"ח - מוכן להשקיע ברצינות',
      D: 'מעל 15,000 ש"ח - תוצאות חשובות יותר מעלות',
    },
  },
};

export function mapQuizAnswersToText(
  answers: Record<string, string>,
): Array<{ q: string; chose: string }> {
  return Object.entries(answers).map(([qId, chosenKey]) => ({
    q:     QUIZ_QUESTION_MAP[qId]?.title  ?? qId,
    chose: QUIZ_QUESTION_MAP[qId]?.answers[chosenKey] ?? chosenKey,
  }));
}
