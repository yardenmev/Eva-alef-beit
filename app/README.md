# Eva Alef Beit - קוד המקור

פרויקט המקור של המשחקים של אווה (React + TypeScript + Vite). האתר החי נמצא בשורש הריפו (`index.html`, `main.js`, `assets/`), וזה הקוד שממנו בונים אותו.

## פקודות (מתוך תיקיית `app`)

```
npm ci               # פעם אחת - מתקין בדיוק את הגרסאות שב-package-lock.json
npm run dev          # שרת פיתוח לבדיקה בזמן עבודה
npm run build        # בודק טיפוסים ובונה לתיקיית dist
npm run preview      # מראה את הבנייה המוכנה לפני פרסום
npm run publish-site # בונה ומעתיק את התוצאה לשורש הריפו (מה ש-GitHub Pages מגיש)
```

אחרי `publish-site` עושים commit ו-push; GitHub Pages מתעדכן תוך כמה דקות. `publish-site` מחליף רק `index.html`, `main.js` ו-`assets/` בשורש.

## מבנה

- `src/App.tsx` - כל המשחקים והמסכים
- `src/data.ts` - האותיות, המילים והאמוג'י
- `src/audio.ts`, `bubbleAudio.ts`, `retryAudio.ts` - ההקלטות המאושרות (מוטמעות כקבצי data)
- `src/style.css` - עיצוב המשחקים; `src/ui.tsx` + `ui.css` - כרטיס, כפתורים, ניווט ושמירת כוכבים בדפדפן
- `scripts/publish.mjs` - מעתיק את הבנייה לשורש

- כל פקודות npm רצות מתוך תיקיית `app`.

## לשים לב

- אל תוסיפו הקלטות חדשות שאווה שומעת בלי אישור של ירדן.
- ההתקדמות (כוכבים) נשמרת ב-localStorage של הדפדפן.
- הניווט משתמש ב-`#` בכתובת (למשל `/#/maze`) כדי לעבוד ב-GitHub Pages.
