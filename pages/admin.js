import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { EVENT } from "../lib/event";
import styles from "../styles/Admin.module.css";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setChecking(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    setChecking(true);
    supabase.rpc("is_admin").then(({ data }) => {
      setIsAdmin(data === true);
      setChecking(false);
    });
  }, [session]);

  return (
    <>
      <Head>
        <title>{`Admin – ${EVENT.title}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>
      <main className={styles.page}>
        {!supabaseConfigured ? (
          <div className={styles.box}>
            <h1 className={styles.h1}>Not configured</h1>
            <p className={styles.muted}>
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel and redeploy.
            </p>
          </div>
        ) : checking ? (
          <p className={styles.muted}>Loading…</p>
        ) : !session ? (
          <Login />
        ) : !isAdmin ? (
          <div className={styles.box}>
            <h1 className={styles.h1}>No access</h1>
            <p className={styles.muted}>{session.user.email} is not an admin.</p>
            <button className={styles.btnGhost} onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        ) : (
          <Dashboard email={session.user.email} />
        )}
      </main>
    </>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Login failed. Check your email and password.");
    setBusy(false);
  }

  return (
    <form className={styles.box} onSubmit={submit}>
      <h1 className={styles.h1}>Admin login</h1>
      <input className={styles.input} type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      <input className={styles.input} type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.btn} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

const DIETARY_LABEL = { none: "No", halal: "Halal", vegetarian: "Vegan / Vegetarian" };
const dietLabel = (r) => DIETARY_LABEL[r.dietary] || "–";

function Dashboard({ email }) {
  const [regs, setRegs] = useState([]);
  const [search, setSearch] = useState("");
  const [fCompany, setFCompany] = useState("all");
  const [fDiet, setFDiet] = useState("all");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("registrations")
      .select("id, name, company, department, dietary, created_at")
      .order("created_at", { ascending: false });
    setRegs(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = [
    { label: "Sign-ups", value: regs.length },
    { label: "Halal", value: regs.filter((r) => r.dietary === "halal").length },
    { label: "Vegan / Vegetarian", value: regs.filter((r) => r.dietary === "vegetarian").length },
    { label: "No dietary req.", value: regs.filter((r) => r.dietary === "none").length },
  ];

  // Bedrijf is vrije tekst: groepeer hoofdletterongevoelig.
  const cKey = (r) => (r.company || "–").trim().toLowerCase();
  const companyGroups = useMemo(() => {
    const m = new Map();
    regs.forEach((r) => { if (!m.has(cKey(r))) m.set(cKey(r), (r.company || "–").trim()); });
    return [...m.entries()].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [regs]);
  const perCompany = companyGroups.map((c) => ({
    ...c,
    count: regs.filter((r) => cKey(r) === c.key).length,
  }));

  const q = search.trim().toLowerCase();
  const visible = regs.filter((r) =>
    (fCompany === "all" || cKey(r) === fCompany) &&
    (fDiet === "all" || r.dietary === fDiet) &&
    (!q || [r.name, r.department, r.company].some((v) => (v || "").toLowerCase().includes(q)))
  );

  async function removeReg(r) {
    if (!confirm(`Remove the sign-up of ${r.name}?`)) return;
    await supabase.from("registrations").delete().eq("id", r.id);
    load();
  }

  function exportCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Name", "Department", "Company", "Dietary", "Signed up"]].concat(
      visible.map((r) => [
        r.name, r.department, r.company, dietLabel(r),
        new Date(r.created_at).toLocaleString("nl-NL"),
      ])
    );
    const csv = "﻿" + rows.map((row) => row.map(esc).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "signups-40th-anniversary.csv";
    a.click();
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.h1}>Sign-ups</h1>
          <p className={styles.muted}>{EVENT.title} · {EVENT.date} · signed in as {email}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={load}>Refresh</button>
          <button className={styles.btnGhost} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>

      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statNum}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {perCompany.length > 0 && (
        <p className={styles.perCompany}>
          Per company:{" "}
          {perCompany.map((c) => (
            <span key={c.key} className={styles.pill}>{c.label} <b>{c.count}</b></span>
          ))}
        </p>
      )}

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <input className={styles.input} placeholder="Search name, department or company…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={styles.select} value={fCompany} onChange={(e) => setFCompany(e.target.value)}>
            <option value="all">All companies</option>
            {companyGroups.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select className={styles.select} value={fDiet} onChange={(e) => setFDiet(e.target.value)}>
            <option value="all">Dietary: all</option>
            <option value="none">Dietary: no</option>
            <option value="halal">Dietary: halal</option>
            <option value="vegetarian">Dietary: vegan / vegetarian</option>
          </select>
          <button className={styles.btn} onClick={exportCsv} disabled={!visible.length}>Export CSV</button>
        </div>
        {visible.length === 0 ? (
          <p className={styles.muted}>No sign-ups yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Name</th><th>Department</th><th>Company</th><th>Dietary</th><th>Signed up</th><th /></tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.department}</td>
                    <td>{r.company || "–"}</td>
                    <td>{dietLabel(r)}</td>
                    <td className={styles.muted}>{new Date(r.created_at).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td><button className={styles.linkBtn} onClick={() => removeReg(r)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className={styles.hint}>
          Someone wants to change their sign-up or cancel? Remove it here (and ask them to sign up again if needed).
        </p>
      </section>

      <ListEditor
        table="companies"
        title="Company suggestions"
        help={"Shown as suggestions while typing. People can also type a company that is not on this list. Typing a known company in other capitals is saved in the spelling below."}
        placeholder="Company (e.g. GEB)"
        maxLength={40}
      />
      <ListEditor
        table="departments"
        title="Department suggestions"
        help={'Shown as suggestions while typing. People can also type a department that is not on this list. Typing a known department in other capitals is saved in the spelling below.'}
        placeholder="Department (e.g. Warehouse)"
        maxLength={80}
      />
    </div>
  );
}

function ListEditor({ table, title, help, placeholder, maxLength }) {
  const [items, setItems] = useState([]);
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from(table).select("*").order("sort_order").order("code");
    setItems(data || []);
  }, [table]);

  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    setMsg("");
    const value = code.trim();
    if (!value) return;
    const sort = Math.max(0, ...items.map((d) => d.sort_order)) + 1;
    const { error } = await supabase.from(table).insert({ code: value, name: desc.trim() || null, sort_order: sort });
    if (error) return setMsg(error.code === "23505" ? `${value} already exists.` : error.message);
    setCode("");
    setDesc("");
    load();
  }

  async function toggle(d) {
    await supabase.from(table).update({ active: !d.active }).eq("id", d.id);
    load();
  }

  async function remove(d) {
    if (!confirm(`Remove ${d.code}? Existing sign-ups are kept.`)) return;
    await supabase.from(table).delete().eq("id", d.id);
    load();
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.h2}>{title}</h2>
      <p className={styles.muted} style={{ marginBottom: 12 }}>{help}</p>
      <ul className={styles.deptList}>
        {items.map((d) => (
          <li key={d.id}>
            <span><strong>{d.code}</strong>{d.name ? ` – ${d.name}` : ""}{!d.active && " (hidden)"}</span>
            <span>
              <button className={styles.linkBtn} onClick={() => toggle(d)}>{d.active ? "Hide" : "Show"}</button>
              <button className={styles.linkBtn} onClick={() => remove(d)}>Remove</button>
            </span>
          </li>
        ))}
        {items.length === 0 && <li className={styles.muted}>None yet.</li>}
      </ul>
      <form className={styles.toolbar} onSubmit={add}>
        <input className={styles.input} placeholder={placeholder} value={code} onChange={(e) => setCode(e.target.value)} maxLength={maxLength} />
        <input className={styles.input} placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <button className={styles.btn}>Add</button>
      </form>
      {msg && <p className={styles.error}>{msg}</p>}
    </section>
  );
}
