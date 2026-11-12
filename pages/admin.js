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

function Dashboard({ email }) {
  const [regs, setRegs] = useState([]);
  const [depts, setDepts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [r, d] = await Promise.all([
      supabase
        .from("registrations")
        .select("id, name, created_at, department_id, departments(code)")
        .order("created_at", { ascending: false }),
      supabase.from("departments").select("*").order("sort_order").order("code"),
    ]);
    setRegs(r.data || []);
    setDepts(d.data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = {};
    regs.forEach((r) => { c[r.department_id] = (c[r.department_id] || 0) + 1; });
    return c;
  }, [regs]);

  const visible = regs.filter((r) =>
    (filter === "all" || r.department_id === filter) &&
    r.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  async function removeReg(r) {
    if (!confirm(`Remove ${r.name}?`)) return;
    await supabase.from("registrations").delete().eq("id", r.id);
    load();
  }

  async function addDept(e) {
    e.preventDefault();
    setMsg("");
    const code = newCode.trim().toUpperCase();
    if (!code) return;
    const sort = Math.max(0, ...depts.map((d) => d.sort_order)) + 1;
    const { error } = await supabase
      .from("departments")
      .insert({ code, name: newName.trim() || null, sort_order: sort });
    if (error) return setMsg(error.code === "23505" ? `${code} already exists.` : error.message);
    setNewCode("");
    setNewName("");
    load();
  }

  async function toggleDept(d) {
    await supabase.from("departments").update({ active: !d.active }).eq("id", d.id);
    load();
  }

  function exportCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Name", "Department", "Signed up"]].concat(
      visible.map((r) => [r.name, r.departments?.code, new Date(r.created_at).toLocaleString("nl-NL")])
    );
    const csv = "﻿" + rows.map((row) => row.map(esc).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "registrations.csv";
    a.click();
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.h1}>{EVENT.title} – registrations</h1>
          <p className={styles.muted}>Signed in as {email}</p>
        </div>
        <div className={styles.headerActions}>
          <a className={styles.btnGhost} href="/flyer" target="_blank" rel="noreferrer">Flyer</a>
          <button className={styles.btnGhost} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>

      <div className={styles.stats}>
        <button className={`${styles.stat} ${filter === "all" ? styles.statActive : ""}`} onClick={() => setFilter("all")}>
          <span className={styles.statNum}>{regs.length}</span>
          <span className={styles.statLabel}>Total</span>
        </button>
        {depts.map((d) => (
          <button key={d.id} className={`${styles.stat} ${filter === d.id ? styles.statActive : ""}`} onClick={() => setFilter(d.id)}>
            <span className={styles.statNum}>{counts[d.id] || 0}</span>
            <span className={styles.statLabel}>{d.code}{!d.active && " (hidden)"}</span>
          </button>
        ))}
      </div>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <input className={styles.input} placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className={styles.btn} onClick={exportCsv} disabled={!visible.length}>Export CSV</button>
        </div>
        {visible.length === 0 ? (
          <p className={styles.muted}>No registrations yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>Name</th><th>Department</th><th>Signed up</th><th /></tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.departments?.code}</td>
                  <td className={styles.muted}>{new Date(r.created_at).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td><button className={styles.linkBtn} onClick={() => removeReg(r)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.h2}>Departments</h2>
        <ul className={styles.deptList}>
          {depts.map((d) => (
            <li key={d.id}>
              <span><strong>{d.code}</strong>{d.name ? ` – ${d.name}` : ""}</span>
              <button className={styles.linkBtn} onClick={() => toggleDept(d)}>
                {d.active ? "Hide from form" : "Show on form"}
              </button>
            </li>
          ))}
        </ul>
        <form className={styles.toolbar} onSubmit={addDept}>
          <input className={styles.input} placeholder="Code (e.g. GEB)" value={newCode} onChange={(e) => setNewCode(e.target.value)} maxLength={20} />
          <input className={styles.input} placeholder="Description (optional)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className={styles.btn}>Add</button>
        </form>
        {msg && <p className={styles.error}>{msg}</p>}
      </section>
    </div>
  );
}
