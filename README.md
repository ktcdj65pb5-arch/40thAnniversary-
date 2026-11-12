# GIANT 40th Anniversary & Christmas Celebration – inschrijving

Een kleine webapp waarmee collega's zich via een QR-code op de flyer inschrijven met **naam + afdeling**.
De afdeling is een vrij invulveld met suggesties uit de tabel `departments`.

| Pagina | Wat |
|---|---|
| `/` | Uitnodiging + inschrijfformulier (mobiel) |
| `/admin` | Lijst met inschrijvingen, aantallen per afdeling, CSV-export, afdelingssuggesties beheren |
| `/flyer` | A5-flyer met QR-code naar de app (printbaar als PDF) |
| `/invitation` | Digitale uitnodiging (origineel ontwerp) met de echte QR-code |

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

Datum, tijd, locatie, deadline, programma en teksten staan in `lib/event.js`.
De afbeeldingen komen uit het flyerontwerp: `public/invitation.webp` (volledig) en `public/hero.webp` (bovenkant).

## Afdelingen

Medewerkers typen hun afdeling zelf in; bekende afdelingen verschijnen als suggestie.
Typt iemand een bekende afdeling in andere hoofdletters (bv. "gehq"), dan wordt de vaste schrijfwijze opgeslagen.
Suggesties beheer je via `/admin` → *Department suggestions*.

## Database bijwerken

`supabase/schema.sql` kan altijd opnieuw worden uitgevoerd: het werkt een bestaande database bij naar de nieuwste versie
zonder inschrijvingen te verliezen.

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
