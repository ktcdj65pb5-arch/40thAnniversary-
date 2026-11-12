import Head from "next/head";
import { EVENT } from "../lib/event";
import { siteUrl, qrSvg, shortUrl } from "../lib/qr";
import styles from "../styles/Flyer.module.css";

// A5-flyer (148 × 210 mm). Open /flyer en print als PDF (A5, marges: geen, achtergrond aan),
// of gebruik `npm run flyer` om automatisch een PDF te maken.
export async function getServerSideProps(ctx) {
  const url = siteUrl(ctx);
  return { props: { url, qr: await qrSvg(url) } };
}

export default function Flyer({ url, qr }) {
  return (
    <>
      <Head>
        <title>{`A5 flyer – ${EVENT.title}`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <style jsx global>{`
        @page { size: 148mm 210mm; margin: 0; }
        html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media screen { body { background: #d9dee6; } }
        @media print { body { background: none; } }
      `}</style>

      <div className={styles.sheet}>
        <div className={styles.art}>
          <img src="/hero.webp" alt="" />
        </div>

        <div className={styles.body}>
          <h1 className={styles.title}>You are invited!</h1>
          <p className={styles.subtitle}>Our {EVENT.title}</p>
          <p className={styles.text}>
            Celebrate <b><i>40 years</i></b> as a company and the Christmas season with good food
            (Halal and vegetarian options included), drinks, live music – and a <b><i>Christmas
            package</i></b> for every employee as a thank-you for your hard work this year.
          </p>

          <div className={styles.bottom}>
            <div className={styles.program}>
              <div className={styles.programTitle}>Time:</div>
              {EVENT.program.map(([t, what]) => (
                <div key={t}>{t} {what}</div>
              ))}
            </div>
            <div className={styles.divider} />
            <div className={styles.rsvp}>
              <div className={styles.qr} dangerouslySetInnerHTML={{ __html: qr }} />
              <div className={styles.rsvpText}>
                <strong>Scan to RSVP</strong>
                <span>before <b>{EVENT.rsvpBefore}</b></span>
                <span className={styles.url}>{shortUrl(url)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
