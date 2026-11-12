import QRCode from "qrcode";

// Het adres waar de QR-code naartoe wijst: ?url=…, anders NEXT_PUBLIC_SITE_URL, anders het huidige domein.
export function siteUrl({ query, req }) {
  if (typeof query.url === "string" && query.url) return query.url;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const proto = req.headers["x-forwarded-proto"] || "http";
  return `${proto}://${req.headers.host}`;
}

export function qrSvg(url) {
  return QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#013c6c", light: "#ffffff" },
  });
}

export const shortUrl = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
