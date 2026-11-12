import { useEffect, useState } from "react";
import Head from "next/head";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { EVENT } from "../lib/event";
import styles from "../styles/Home.module.css";

const clean = (s) => s.trim().replace(/\s+/g, " ");

// Komt de invoer overeen met een bekende waarde, gebruik dan de vaste schrijfwijze
// (bv. "gehq" → "GEHQ"), zodat de tellingen kloppen. Anders blijft de vrije invoer staan.
function canonical(value, list) {
  const v = value.toLowerCase();
  const match = list.find((s) => s.code.toLowerCase() === v || (s.name && s.name.toLowerCase() === v));
  return match ? match.code : value;
}

const DIETARY = [
  { value: "none", label: "No" },
  { value: "halal", label: "Halal" },
  { value: "vegetarian", label: "Vegan / Vegetarian" },
];

function Choice({ options, value, onChange, label }) {
  return (
    <div className={styles.choices} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          className={`${styles.choice} ${value === o.value ? styles.choiceActive : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [companies, setCompanies] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [attending, setAttending] = useState(null); // true | false
  const [dietary, setDietary] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setError("Sign-up is not available yet (database not configured).");
      return;
    }
    // Bedrijven en afdelingen dienen alleen als suggesties; vrije invoer mag ook.
    supabase
      .from("companies")
      .select("code, name")
      .eq("active", true)
      .order("sort_order")
      .order("code")
      .then(({ data }) => setCompanies(data || []));
    supabase
      .from("departments")
      .select("code, name")
      .eq("active", true)
      .order("sort_order")
      .order("code")
      .then(({ data }) => setSuggestions(data || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanName = clean(name);
    const cleanCompany = canonical(clean(company), companies);
    const cleanDept = canonical(clean(department), suggestions);
    if (cleanName.length < 2) return setError("Please enter your full name.");
    if (!cleanCompany) return setError("Please enter your company.");
    if (!cleanDept) return setError("Please enter your department.");
    if (attending === null) return setError("Please let us know if you will attend.");
    if (attending && !dietary) return setError("Please choose your dietary preference.");

    const row = {
      name: cleanName,
      company: cleanCompany,
      department: cleanDept,
      attending,
      dietary: attending ? dietary : null,
    };

    setStatus("sending");
    setError("");
    const { error } = await supabase.from("registrations").insert(row);

    if (error) {
      setStatus("error");
      setError(
        error.code === "23505"
          ? "We already have a response from you. Want to change it? Please contact the organisers."
          : "Something went wrong. Please try again."
      );
      return;
    }
    setSaved(row);
    setStatus("done");
  }

  return (
    <>
      <Head>
        <title>{`${EVENT.title} – RSVP`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#013c6c" />
        <meta name="description" content={`RSVP for the ${EVENT.title} on ${EVENT.date}.`} />
      </Head>

      <main className={styles.page}>
        <div className={styles.heroWrap}>
          <img
            src="/hero.webp"
            alt={`GIANT 40th Anniversary Celebration – ${EVENT.date}`}
            className={styles.hero}
            width={1013}
            height={1200}
          />
        </div>

        <section className={styles.invite}>
          <h1 className={styles.title}>You are invited!</h1>
          <p className={styles.subtitle}>Our {EVENT.title}</p>

          <ul className={styles.facts}>
            <li><span className={styles.factLabel}>Date</span>{EVENT.date}</li>
            <li><span className={styles.factLabel}>Time</span>{EVENT.time}</li>
            <li><span className={styles.factLabel}>Location</span>{EVENT.venue}<br />{EVENT.address}</li>
          </ul>
        </section>

        <section className={styles.card}>
          {status === "done" ? (
            <div className={styles.success}>
              <div className={styles.check} aria-hidden>✓</div>
              {saved.attending ? (
                <>
                  <h2>You're on the list!</h2>
                  <p>
                    Thanks, <strong>{saved.name}</strong>.
                    <br />See you on {EVENT.date}!
                  </p>
                </>
              ) : (
                <>
                  <h2>Thanks for letting us know</h2>
                  <p>
                    Sorry you can't make it, <strong>{saved.name}</strong>.
                    <br />We'll miss you!
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className={styles.formTitle}>RSVP</h2>
              <p className={styles.deadline}>Please respond before <strong>{EVENT.rsvpBefore}</strong></p>

              <label className={styles.label} htmlFor="name">Full name</label>
              <input
                id="name"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={120}
                placeholder="First and last name"
                required
              />

              <label className={styles.label} htmlFor="company">Company</label>
              <input
                id="company"
                className={styles.input}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                list="company-suggestions"
                autoComplete="organization"
                maxLength={40}
                placeholder="e.g. GEM, GE, GEHQ"
                required
              />
              <datalist id="company-suggestions">
                {companies.map((c) => (
                  <option key={c.code} value={c.code}>{c.name || ""}</option>
                ))}
              </datalist>

              <label className={styles.label} htmlFor="department">Department</label>
              <input
                id="department"
                className={styles.input}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                list="department-suggestions"
                autoComplete="off"
                maxLength={80}
                placeholder="e.g. Customer Service, Warehouse"
                required
              />
              <datalist id="department-suggestions">
                {suggestions.map((s) => (
                  <option key={s.code} value={s.code}>{s.name || ""}</option>
                ))}
              </datalist>

              <span className={styles.label}>Will you attend?</span>
              <Choice
                label="Will you attend?"
                value={attending === null ? "" : attending ? "yes" : "no"}
                onChange={(v) => setAttending(v === "yes")}
                options={[
                  { value: "yes", label: "Yes, I'll be there" },
                  { value: "no", label: "No, I can't make it" },
                ]}
              />

              {attending && (
                <>
                  <span className={styles.label}>Dietary requirements</span>
                  <Choice label="Dietary requirements" value={dietary} onChange={setDietary} options={DIETARY} />
                </>
              )}

              {error && <p className={styles.error} role="alert">{error}</p>}

              <button type="submit" className={styles.submit} disabled={status === "sending" || !supabaseConfigured}>
                {status === "sending" ? "Sending…" : "Send RSVP"}
              </button>
            </form>
          )}
        </section>

        <section className={styles.about}>
          {EVENT.intro.map((p) => <p key={p}>{p}</p>)}

          <h3 className={styles.programTitle}>Time:</h3>
          <ul className={styles.program}>
            {EVENT.program.map(([t, what]) => (
              <li key={t}><span>{t}</span>{what}</li>
            ))}
          </ul>
        </section>

        <footer className={styles.footer}>
          <img src="/giant-logo.svg" alt="GIANT" />
        </footer>
      </main>
    </>
  );
}
