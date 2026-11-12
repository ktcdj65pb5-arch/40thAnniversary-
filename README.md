# GIANT Christmas Party / 40th anniversary – inschrijving

Een kleine webapp waarmee collega's zich via een QR-code op de flyer inschrijven met **naam + afdeling**.

| Pagina | Wat |
|---|---|
| `/` | Inschrijfformulier (mobiel). Afdelingen komen uit de database |
| `/admin` | Lijst met inschrijvingen, aantallen per afdeling, CSV-export, afdelingen toevoegen/verbergen |
| `/flyer` | A5-flyer met QR-code naar de app (printbaar als PDF) |

Stack: Next.js (Pages Router), Supabase, Vercel.

## Opzetten (eenmalig)

1. **GitHub**: maak een nieuwe (private) repository aan, bv. `giant-feest`, en push deze code.
2. **Supabase**: maak een nieuw project aan → SQL Editor → plak en run `supabase/schema.sql`.
   - Authentication → Sign In / Providers → zet **"Allow new users to sign up" uit** (alleen jij maakt accounts aan).
   - Authentication → Users → **Add user** (e-mail + wachtwoord) voor elke beheerder.
   - Run in de SQL Editor: `insert into public.admins (email) values ('jouw@email.com');`
3. **Vercel**: importeer de GitHub-repo en zet de environment variables uit `.env.local.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`).
4. Supabase → Authentication → URL Configuration → Site URL = je Vercel-adres.

## Teksten aanpassen

Datum, tijd, locatie, deadline en de titels staan in `lib/event.js`.

## Afdelingen toevoegen

Via `/admin` → *Departments* → code invullen → *Add*. "Hide from form" verbergt een afdeling
op het formulier zonder bestaande inschrijvingen te verliezen.

## Flyer maken

Open `https://<jouw-domein>/flyer` en print als PDF (papier A5, marges *geen*, *achtergrondafbeeldingen* aan),
of automatisch:

```bash
npm i -D playwright && npx playwright install chromium
npm run dev
npm run flyer -- https://<jouw-domein>
```

**Controleer na het definitieve domein altijd met je telefoon of de QR-code op de juiste pagina uitkomt.**

## Lokaal draaien

```bash
cp .env.local.example .env.local   # vul de Supabase-sleutels in
npm install
npm run dev
```

## Beveiliging

- Iedereen mag zich inschrijven (insert), maar **alleen beheerders** (tabel `admins`) kunnen de lijst lezen of wissen (RLS).
- Dezelfde naam kan zich niet twee keer bij dezelfde afdeling inschrijven.
- Er wordt geen e-mail of ander persoonsgegeven gevraagd, alleen naam + afdeling.
