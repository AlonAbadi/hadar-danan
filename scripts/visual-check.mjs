// visual-check.mjs
// השוואה ויזואלית בין המוקאפ (מקור האמת) לעמוד המוטמע.
// שימוש: node visual-check.mjs <mockup.html> <http://localhost:3000/route>
// דרישות: npm i -D playwright pixelmatch pngjs && npx playwright install chromium
// יציאה 0 = עבר (הפרש < 1.5% בכל נקודה). יציאה 1 = נכשל, נוצרו קבצי diff.

import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

const [mockup, impl] = process.argv.slice(2);
if (!mockup || !impl) {
  console.error('usage: node visual-check.mjs <mockup.html|url> <impl url>');
  process.exit(2);
}

const VIEW = { width: 390, height: 844 };
// נקודות נגזרות מגובה העמוד בפועל, כולל התחתית
const THRESHOLD_PCT = 1.5;
const OUT = './visual-diffs';
fs.mkdirSync(OUT, { recursive: true });

const toUrl = (p) => p.startsWith('http') ? p : 'file://' + path.resolve(p);

async function capture(browser, url, tag) {
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 2 });
  await page.goto(toUrl(url), { waitUntil: 'networkidle' });
  // לתת לפונטים ולחשיפת הפתיחה להסתיים
  await page.waitForTimeout(3500);
  // להקפיא כל אנימציה בפאזה קבועה וזהה בשני הצילומים - לא בפאזה אקראית
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none !important;}' });
  await page.evaluate(() => document.getAnimations().forEach(a => { a.currentTime = 10000; a.pause(); }));
  // נקודות בדיקה מגובה העמוד בפועל: 0, רבע, חצי, שלושת רבעי, ותחתית מלאה
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const SCROLLS = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxY * f));
  const shots = [];
  for (let i = 0; i < SCROLLS.length; i++) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), SCROLLS[i]);
    await page.waitForTimeout(350);
    const file = `${OUT}/${tag}-${i}.png`;
    await page.screenshot({ path: file });
    shots.push(file);
  }
  await page.close();
  return shots;
}

function diffPair(aFile, bFile, outFile) {
  const a = PNG.sync.read(fs.readFileSync(aFile));
  const b = PNG.sync.read(fs.readFileSync(bFile));
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const diff = new PNG({ width: w, height: h });
  const mismatched = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.12 });
  fs.writeFileSync(outFile, PNG.sync.write(diff));
  return (mismatched / (w * h)) * 100;
}

const browser = await chromium.launch();
const A = await capture(browser, mockup, 'mockup');
const B = await capture(browser, impl, 'impl');
await browser.close();

let failed = false;
for (let i = 0; i < A.length; i++) {
  const pct = diffPair(A[i], B[i], `${OUT}/diff-${i}.png`);
  const ok = pct < THRESHOLD_PCT;
  if (!ok) failed = true;
  console.log(`position ${i}: ${pct.toFixed(2)}% diff ${ok ? 'PASS' : 'FAIL -> see ' + OUT + '/diff-' + i + '.png'}`);
}

if (failed) {
  console.log('\nיש פערים. פתח את קבצי ה-diff, תקן את הערכים המדויקים לפי המוקאפ, והרץ שוב.');
  process.exit(1);
}
console.log('\nכל הנקודות עברו. העיצוב תואם למקור.');
