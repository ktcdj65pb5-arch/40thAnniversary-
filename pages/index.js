import { useEffect, useState } from "react";
import Head from "next/head";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { EVENT } from "../lib/event";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) {
      setError("Sign-up is not available yet (database not configured).");
      setLoadingDepts(false);
      return;
    }
    supabase
      .from("departments")
      .select("id, code, name")
      .eq("active", true)
      .order("sort_order")
      .order("code")
      .then(({ data, error }) => {
        if (error) setError("Could not load departments. Please try again later.");
        setDepartments(data || []);
        setLoadingDepts(false);
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (cleanName.length < 2) return setError("Please enter your full name.");
    if (!departmentId) return setError("Please choose your department.");

    setStatus("sending");
    setError("");
    const { error } = await supabase
      .from("registrations")
      .insert({ name: cleanName, department_id: departmentId });

    if (error) {
      setStatus("error");
      setError(
        error.code === "23505"
          ? "You're already signed up with this name and department. See you there!"
          : "Something went wrong. Please try again."
      );
      return;
    }
    setStatus("done");
  }

  const dept = departments.find((d) => d.id === departmentId);
  const details = [EVENT.date, EVENT.time, EVENT.location].filter(Boolean);

  return (
    <>
      <Head>
        <title>{`${EVENT.company} ${EVENT.title} – Sign up`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#071a33" />
      </Head>

      <main className={styles.page}>
        <section className={styles.hero}>
          <img src="/giant-logo.svg" alt="GIANT" className={styles.logo} />
          <div className={styles.badge}>
            <span className={styles.badgeNum}>{EVENT.anniversary}</span>
            <span className={styles.badgeLabel}>{EVENT.anniversaryLabel}</span>
          </div>
          <h1 className={styles.title}>{EVENT.title}</h1>
          <p className={styles.tagline}>{EVENT.tagline}</p>
          {details.length > 0 && (
            <ul className={styles.details}>
              {details.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
        </section>

        <section className={styles.card}>
          {status === "done" ? (
            <div className={styles.success}>
              <div className={styles.check} aria-hidden>✓</div>
              <h2>You're on the list!</h2>
              <p>
                Thanks, <strong>{name.trim()}</strong>
                {dept ? ` (${dept.code})` : ""}. We look forward to celebrating with you.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className={styles.formTitle}>Sign up</h2>
              {EVENT.deadline && <p className={styles.deadline}>{EVENT.deadline}</p>}

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

              <span className={styles.label}>Department</span>
              <div className={styles.depts} role="radiogroup" aria-label="Department">
                {loadingDepts && <span className={styles.muted}>Loading…</span>}
                {departments.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    role="radio"
                    aria-checked={departmentId === d.id}
                    className={`${styles.dept} ${departmentId === d.id ? styles.deptActive : ""}`}
                    onClick={() => setDepartmentId(d.id)}
                  >
                    <span className={styles.deptCode}>{d.code}</span>
                    {d.name && <span className={styles.deptName}>{d.name}</span>}
                  </button>
                ))}
              </div>

              {error && <p className={styles.error} role="alert">{error}</p>}

              <button type="submit" className={styles.submit} disabled={status === "sending"}>
                {status === "sending" ? "Signing up…" : "Count me in"}
              </button>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
