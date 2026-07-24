/**
 * /first — acquisition first-video config.
 *
 * The 3 questions Hadar asks a NEW prospect to produce a 20-30 second
 * script that IS them. Fixed (not per-episode). Question 1 is the story,
 * Question 2 is the stance, Question 3 is optional payoff.
 *
 * If Q1 answer is under MIN_STORY_CHARS, the UI surfaces the probe
 * before letting the user submit — mimicking Hadar's real-time
 * "רגע, תן לי שם" intervention in a shoot day.
 */

export const FIRST_MIN_STORY_CHARS = 40;

export type FirstQuestion = {
  id:    "story" | "stance" | "payoff";
  q:     string;
  hint:  string;   // subtle placeholder to guide answer shape
  probe: string;   // shown if the answer is too thin (only for story)
  required: boolean;
};

export const FIRST_QUESTIONS: FirstQuestion[] = [
  {
    id:    "story",
    q:     "לקוח אחד, פרויקט אחד, רגע ספציפי — שבו עשית או ראית משהו שאף אחד אחר בתחום שלך לא היה עושה או רואה.",
    hint:  "שם, פרט קונקרטי, שני משפטים. לא צריך יותר.",
    probe: "רגע, תן לי משהו יותר ספציפי. מי היה הלקוח? מה בפועל אמרת או ראית שם?",
    required: true,
  },
  {
    id:    "stance",
    q:     "מה זה היה שאתה ראית שאחרים לא ראו?",
    hint:  "כמו שהיית אומר ללקוח בפגישה, במשפט אחד־שניים.",
    probe: "",
    required: true,
  },
  {
    id:    "payoff",
    q:     "מה קרה בסוף? מה הלקוח הרגיש, אמר, או עשה?",
    hint:  "אופציונלי, מדלגים אם רוצים.",
    probe: "",
    required: false,
  },
];

/** Meta for the first-video "episode." Serves the same role as a LabEpisode
 *  in the lab, so the move-selection/script-generation prompts can be
 *  parameterized identically. */
export const FIRST_EPISODE = {
  code:  "FIRST",
  title: "הרגע שהוא אתה",
  focus: "רגע אחד שבו הלקוח (המשתמש) עשה או ראה משהו שאחרים בתחום שלו לא היו עושים או רואים — קצר, חד, מדויק בקול שלו",
  moment: "הסיפור הספציפי + העמדה שהוא הביא לרגע הזה",
};

// Hard-cap on the output length. 20-30 seconds of spoken Hebrew ~ 45-70
// words. We push slightly under so the on-camera delivery has room.
export const FIRST_TARGET_WORDS_MIN = 45;
export const FIRST_TARGET_WORDS_MAX = 70;
export const FIRST_TARGET_SENTENCES = "4-5";
