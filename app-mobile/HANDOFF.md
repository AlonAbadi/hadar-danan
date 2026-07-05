# כוורת האות — חבילת מסירה לפרסום בחנויות

אפליקציית הצילום של כוורת האות (beegood.online): המשתמשת מתחברת עם אותו חשבון
מהאתר, בוחרת תסריט מיום הצילום שלה, מצלמת מול טלפרומפטר על המצלמה הקדמית
הנייטיבית, והשרת הקיים עושה את כל השאר (תמלול, כתוביות, צריבה). האפליקציה היא
לקוח דק — אין בה שום לוגיקת עיבוד, הכול מול `https://www.beegood.online/api/broadcast/*`.

מסמך זה מיועד למי שמחזיק ברישיונות הפרסום ומבצע את ההגשה לחנויות.

## מה יש בתיקייה

- Expo (React Native, TypeScript), SDK 57. קוד המקור כולו ב-`App.tsx` + `src/`.
- `app.json` — כל הקונפיגורציה: שם עברי, Bundle IDs, הרשאות, פלאגינים.
- אין תיקיות `ios/`/`android/` בריפו — EAS מייצר אותן בענן בזמן build.

## זהויות (כבר מוגדרות ב-app.json)

| | ערך |
|---|---|
| שם בחנות | כוורת האות |
| iOS bundleIdentifier | `online.beegood.kaveret` |
| Android package | `online.beegood.kaveret` |

## מה בעל הרישיונות צריך לספק

1. **Apple Developer Program** — 99$ לשנה (חשבון ארגון או יחיד).
2. **Google Play Console** — 25$ חד-פעמי.
3. חשבון Expo (חינמי) — `npx expo login`.
4. חיבור החתימות ל-EAS (הוא מנהל אותן אוטומטית): באמצע `eas build` הוא מבקש
   התחברות ל-Apple ID ומייצר certificates/profiles לבד. באנדרואיד הוא מייצר
   keystore ושומר אותו בענן EAS — לא לאבד את חשבון ה-Expo.

## צעדי build והגשה

```bash
cd app-mobile
npm install
npx expo login                 # חשבון ה-Expo של המפרסם
npx eas init                   # מקשר לפרויקט EAS (יוצר projectId ב-app.json)
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
npx eas submit --platform ios      # ל-TestFlight → App Store review
npx eas submit --platform android  # ל-Internal testing → Production
```

אם אין קובץ `eas.json`, `eas build` מייצר אחד — ברירות המחדל של profile
`production` נכונות לאפליקציה הזו (אין צורך בהתאמות).

## צ'ק-ליסט חנות

- **תיאור בעברית** (טיוטה): "אולפן הצילום האישי של כוורת האות. התסריטים שלכם
  מיום הצילום, טלפרומפטר על המצלמה הקדמית, והבמאית של TrueSignal הופכת כל
  טייק לרילס עם כתוביות. מצולם, לא מיוצר."
- **קטגוריה**: Productivity / Photo & Video.
- **צילומי מסך**: לצלם מהאפליקציה על מכשיר אמיתי (מסך תסריטים, מסך צילום עם
  הטלפרומפטר, מסך תוצר). iPhone 6.7" + 6.1", ואנדרואיד אחד.
- **מדיניות פרטיות**: קיימת — `https://www.beegood.online/privacy`.
- **הצהרות הרשאה** (כבר ב-app.json, יופיעו בעברית): מצלמה, מיקרופון, שמירה
  לתמונות.
- **App Privacy (Apple)**: נאסף — אימייל (חשבון), תוכן משתמש (וידאו). לא
  למעקב. הווידאו נשמר ב-storage פרטי של Supabase עם RLS.
- **חשבון דמו לסוקר של אפל** (חובה — יש לוגין): לבקש מאלון
  (alonabadi9@gmail.com) משתמש בדיקה פעיל עם תסריטים, ולהזין ב-App Review
  Information.
- **גיל**: 4+ / Everyone.

## מה אסור לשנות

- `BASE` ב-`src/api.ts` חייב להישאר `https://www.beegood.online`.
- ה-anon key של Supabase ב-`src/api.ts` הוא מפתח ציבורי בתכנון (זהה לזה
  שנשלח לכל דפדפן באתר) — הוא לא סוד, אבל אין להחליף אותו.
- Bundle IDs — שינוי שלהם אחרי פרסום ראשון = אפליקציה חדשה בחנות.

## עדכונים אחרי הפרסום

שינויי JavaScript בלבד אפשר לדחוף בלי review דרך `eas update` (OTA). שינוי
native (הוספת פלאגין/הרשאה) מחייב build+submit מחדש.

## תמיכה

שאלות קוד/שרת: אלון — alonabadi9@gmail.com.
