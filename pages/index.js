import { useEffect, useState } from "react";
import Head from "next/head";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { EVENT } from "../lib/event";
import styles from "../styles/Home.module.css";

const clean = (s) => s.trim().replace(/\s+/g, " ");

export default function Home() {
  const [suggestions, setSuggestions] = useState([]);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);

  // Afdelingen uit de database dienen alleen als suggesties; vrije invoer mag ook.
  useEffect(() => {
    if (!supabaseConfigured) {
      setError("Sign-up is not available yet (database not configured).");
      return;
    }
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
    let cleanDept = clean(department);
    if (cleanName.length < 2) return setError("Please enter your full name.");
    if (!cleanDept) return setError("Please enter your department.");

    // Komt de invoer overeen met een bekende afdeling, gebruik dan de vaste schrijfwijze
    // (bv. "gehq" → "GEHQ"), zodat de tellingen per afdeling kloppen.
    const match = suggestions.find(
      (s) =>
        s.code.toLowerCase() === cleanDept.toLowerCase() ||
        (s.name && s.name.toLowerCase() === cleanDept.toLowerCase())
    );
    if (match) cleanDept = match.code;

    setStatus("sending");
    setError("");
    const { error } = await supabase
      .from("registrations")
      .insert({ name: cleanName, department: cleanDept });

    if (error) {
      setStatus("error");
      setError(
        error.code === "23505"
          ? "You're already signed up with this name and department. See you there!"
          : "Something went wrong. Please try again."
      );
      return;
    }
    setSaved({ name: cleanName, department: cleanDept });
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
              <h2>You're on the list!</h2>
              <p>
                Thanks, <strong>{saved.name}</strong> ({saved.department}).
                <br />See you on {EVENT.date}!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className={styles.formTitle}>RSVP</h2>
              <p className={styles.deadline}>Please sign up before <strong>{EVENT.rsvpBefore}</strong></p>

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

              <label className={styles.label} htmlFor="department">Department</label>
              <input
                id="department"
                className={styles.input}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                list="department-suggestions"
                autoComplete="off"
                maxLength={80}
                placeholder="e.g. GEHQ, Customer Service, Warehouse"
                required
              />
              <datalist id="department-suggestions">
                {suggestions.map((s) => (
                  <option key={s.code} value={s.code}>{s.name || ""}</option>
                ))}
              </datalist>

              {error && <p className={styles.error} role="alert">{error}</p>}

              <button type="submit" className={styles.submit} disabled={status === "sending" || !supabaseConfigured}>
                {status === "sending" ? "Signing up…" : "Count me in"}
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
