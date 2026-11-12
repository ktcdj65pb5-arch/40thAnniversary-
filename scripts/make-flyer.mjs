// Maakt een drukklare A5-PDF van de flyer.
// Gebruik (met de app draaiend via `npm run dev` of `npm start`):
//   npm run flyer -- https://jouw-domein.nl
// Optioneel tweede argument: adres van de draaiende app (standaard http://localhost:3000).
// Vereist Playwright: npm i -D playwright && npx playwright install chromium
import { chromium } from "playwright";

const target = process.argv[2];
const app = process.argv[3] || "http://localhost:3000";
const out = process.argv[4] || "flyer-a5.pdf";

const page = `${app}/flyer${target ? `?url=${encodeURIComponent(target)}` : ""}`;
const browser = await chromium.launch();
const tab = await browser.newPage();
await tab.goto(page, { waitUntil: "networkidle" });
await tab.evaluate(() => document.fonts.ready);
await tab.pdf({ path: out, width: "148mm", height: "210mm", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`Flyer opgeslagen als ${out} (QR → ${target || "standaard-URL"})`);
