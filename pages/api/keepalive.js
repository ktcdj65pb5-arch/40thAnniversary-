// Houdt het Supabase-project actief: het gratis plan pauzeert projecten na ongeveer een week zonder activiteit.
// Vercel roept dit adres dagelijks aan (zie vercel.json → crons) en het doet één kleine leesquery.
import { supabase, supabaseConfigured } from "../../lib/supabase";

export default async function handler(req, res) {
  // Optioneel: zet CRON_SECRET in Vercel, dan mag alleen Vercel Cron dit aanroepen.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false });
  }
  if (!supabaseConfigured) return res.status(500).json({ ok: false, error: "Supabase not configured" });

  const { error } = await supabase.from("companies").select("id", { count: "exact", head: true });
  if (error) return res.status(502).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true, at: new Date().toISOString() });
}
