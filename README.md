# GIANT 40th Anniversary & Christmas Celebration – inschrijving

Een kleine webapp waarmee collega's reageren op de uitnodiging (via de QR-code op de flyer) met:
**naam – afdeling – bedrijf – RSVP ja/nee – dieetwens** (geen / halal / vegan-vegetarisch, alleen bij "ja").
Bedrijf en afdeling zijn vrije invulvelden met suggesties uit de tabellen `companies` en `departments`.

| Pagina | Wat |
|---|---|
| `/` | Uitnodiging + inschrijfformulier (mobiel) |
| `/admin` | Overzicht met aantallen (aanwezig, halal, vegan/vegetarisch), filters, CSV-export, suggesties beheren |

Stack: Next.js (Pages Router), Supabase, Vercel.

## Opzetten (eenmalig)

1. **GitHub**: maak een nieuwe (private) repository aan, bv. `giant-feest`, en push deze code.
2. **Supabase**: maak een nieuw project aan → SQL Editor → plak en run `supabase/schema.sql`.
   - Authentication → Sign In / Providers → zet **"Allow new users to sign up" uit** (alleen jij maakt accounts aan).
   - Authentication → Users → **Add user** (e-mail + wachtwoord) voor elke beheerder.
   - Run in de SQL Editor: `insert into public.admins (email) values ('jouw@email.com');`
3. **Vercel**: importeer de GitHub-repo en zet de environment variables uit `.env.local.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Supabase → Authentication → URL Configuration → Site URL = je Vercel-adres.

## Teksten aanpassen

Datum, tijd, locatie, deadline, programma en teksten staan in `lib/event.js`.
De afbeelding bovenaan de pagina (`public/hero.webp`) is de bovenkant van het flyerontwerp.

## Bedrijven en afdelingen

Medewerkers typen hun bedrijf en afdeling zelf in; bekende waarden verschijnen als suggestie.
Typt iemand een bekende waarde in andere hoofdletters (bv. "gehq"), dan wordt de vaste schrijfwijze opgeslagen.
Suggesties beheer je via `/admin` → *Company suggestions* / *Department suggestions*.

Wil iemand zijn antwoord wijzigen? Verwijder de reactie in `/admin` en laat het formulier opnieuw invullen.

## Database bijwerken

`supabase/schema.sql` kan altijd opnieuw worden uitgevoerd: het werkt een bestaande database bij naar de nieuwste versie
zonder inschrijvingen te verliezen.

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
