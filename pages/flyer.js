import Head from "next/head";
import QRCode from "qrcode";
import { EVENT } from "../lib/event";
import styles from "../styles/Flyer.module.css";

// A5-flyer (148 × 210 mm). Open /flyer en print als PDF (A5, marges: geen, achtergrond aan),
// of gebruik `npm run flyer` om automatisch een PDF te maken.
// De QR-code wijst naar ?url=…, anders naar NEXT_PUBLIC_SITE_URL, anders naar het huidige domein.
export async function getServerSideProps({ query, req }) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const url =
    (typeof query.url === "string" && query.url) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${proto}://${req.headers.host}`;
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#071a33", light: "#ffffff" },
  });
  return { props: { url, qrSvg } };
}

// Vaste "sneeuw" zodat de flyer er bij elke render hetzelfde uitziet.
const FLAKES = Array.from({ length: 60 }, (_, i) => {
  const r = (n) => { const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };
  return { x: r(1) * 148, y: r(2) * 120, s: 0.25 + r(3) * 0.9, o: 0.2 + r(4) * 0.5 };
});

export default function Flyer({ url, qrSvg }) {
  const details = [EVENT.date, EVENT.time, EVENT.location].filter(Boolean);
  const shortUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <>
      <Head>
        <title>{`Flyer – ${EVENT.title}`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <style jsx global>{`
        @page { size: 148mm 210mm; margin: 0; }
        html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media screen { body { background: #d9dee6; } }
        @media print { body { background: none; } }
      `}</style>
      <div className={styles.sheet}>
        <svg className={styles.snow} viewBox="0 0 148 120" preserveAspectRatio="none" aria-hidden>
          {FLAKES.map((f, i) => (
            <circle key={i} cx={f.x} cy={f.y} r={f.s} fill="#fff" opacity={f.o} />
          ))}
        </svg>

        <header className={styles.top}>
          <img src="/giant-logo.svg" alt="GIANT" className={styles.logo} />
        </header>

        <div className={styles.center}>
          <div className={styles.forty}>
            <span className={styles.fortyNum}>{EVENT.anniversary}</span>
            <span className={styles.fortyLabel}>{EVENT.anniversaryLabel}</span>
          </div>
          <div className={styles.amp}>&amp;</div>
          <h1 className={styles.title}>{EVENT.title}</h1>
          <p className={styles.tagline}>{EVENT.tagline}</p>
          {details.length > 0 && (
            <div className={styles.details}>
              {details.map((d, i) => (
                <span key={d}>{i > 0 && <span className={styles.dot}>•</span>}{d}</span>
              ))}
            </div>
          )}
        </div>

        <footer className={styles.bottom}>
          <div className={styles.qr} dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className={styles.cta}>
            <strong>Scan to sign up</strong>
            <span>Your name and department – that's all we need.</span>
            {EVENT.deadline && <span className={styles.deadline}>{EVENT.deadline}</span>}
            <span className={styles.url}>{shortUrl}</span>
          </div>
        </footer>
      </div>
    </>
  );
}
