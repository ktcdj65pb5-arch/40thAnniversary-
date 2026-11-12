import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Zonder deze variabelen (bv. nog niet ingesteld in Vercel) moet de build niet crashen;
// de pagina's tonen dan een duidelijke melding.
export const supabaseConfigured = Boolean(url && key);

export const supabase = createClient(
  url || "https://not-configured.supabase.co",
  key || "not-configured"
);
