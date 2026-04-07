export interface QuizSession {
  name: string;
  email: string;
  phone: string;
  userId: string;
  recommendedProduct: string;
  secondProduct?: string;
  matchPercent: number;
  answers: Record<string, string>;
  completedAt: string;
}

const SESSION_KEY = 'quiz_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function saveQuizSession(data: QuizSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    document.cookie = `quiz_user=${encodeURIComponent(data.userId)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } catch {
    // Storage unavailable
  }
}

export function getQuizSession(): QuizSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as QuizSession;
    const age = Date.now() - new Date(session.completedAt).getTime();
    if (age > SESSION_MAX_AGE_MS) {
      clearQuizSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function isQuizAuthenticated(): boolean {
  return getQuizSession() !== null;
}

export function clearQuizSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = 'quiz_user=; path=/; max-age=0';
  } catch {
    // Storage unavailable
  }
}

// ── Generic user details (populated after ANY signup) ─────────

export interface UserDetails {
  name: string;
  email: string;
  phone: string;
  userId: string;
}

const USER_KEY = 'user_details';

export function saveUserDetails(data: UserDetails): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
    document.cookie = `quiz_user=${encodeURIComponent(data.userId)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } catch {
    // Storage unavailable
  }
}

/**
 * Returns a unified user record from whichever source is available.
 * Priority: quiz session > plain user details > null.
 * Use this everywhere you need name/email/phone/userId — regardless of
 * whether the user came through the quiz or signed up directly.
 */
export function getSessionUser(): UserDetails | null {
  // Quiz session takes priority (richer data, same fields)
  const quiz = getQuizSession();
  if (quiz) {
    return { name: quiz.name, email: quiz.email, phone: quiz.phone, userId: quiz.userId };
  }

  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserDetails;
  } catch {
    return null;
  }
}
