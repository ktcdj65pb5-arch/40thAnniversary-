import Head from "next/head";
import { EVENT } from "../lib/event";
import { siteUrl, qrSvg } from "../lib/qr";

// Digitale uitnodiging (origineel ontwerp) met de echte QR-code in het QR-vak.
// Positie van het QR-vak in invitation.webp (1013 × 2000 px): x 728–915, y 1760–1947.
const BOX = { left: 728 / 1013, top: 1760 / 2000, width: 187 / 1013, height: 187 / 2000 };

export async function getServerSideProps(ctx) {
  const url = siteUrl(ctx);
  return { props: { qr: await qrSvg(url) } };
}

export default function Invitation({ qr }) {
  return (
    <>
      <Head>
        <title>{`Invitation – ${EVENT.title}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>
      <style jsx global>{`
        body { background: #0b2440; }
        .inv { position: relative; width: min(100%, 1013px); margin: 0 auto; line-height: 0; }
        .inv img { width: 100%; height: auto; display: block; }
        .inv .qrbox {
          position: absolute;
          left: ${BOX.left * 100}%;
          top: ${BOX.top * 100}%;
          width: ${BOX.width * 100}%;
          height: ${BOX.height * 100}%;
          background: #fff;
          border-radius: 6%;
          padding: 1.3%;
        }
        .inv .qrbox svg { width: 100%; height: 100%; display: block; }
      `}</style>
      <div className="inv" id="invitation">
        <img src="/invitation.webp" alt={`${EVENT.title} – ${EVENT.date}`} width={1013} height={2000} />
        <div className="qrbox" dangerouslySetInnerHTML={{ __html: qr }} />
      </div>
    </>
  );
}
