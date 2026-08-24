"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function ProfilePage() {
  const [email, setEmail] = useState(""); const [name, setName] = useState(""); const [cur, setCur] = useState(""); const [next, setNext] = useState(""); const [err, setErr] = useState<string|null>(null); const [ok, setOk] = useState<string|null>(null); const [ld, setLd] = useState(false);
  useEffect(() => { fetch("/api/admin/session").then(r => r.ok ? r.json() : Promise.reject()).then(d => setEmail(d.email)).catch(() => {}); }, []);
  async function save(e: React.FormEvent) { e.preventDefault(); setErr(null); setOk(null); setLd(true); try { const r = await fetch("/api/admin/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, currentPassword: cur, newPassword: next }) }); if (!r.ok) throw new Error((await r.json()).error || "Failed"); setOk("Updated"); setCur(""); setNext(""); } catch (e: any) { setErr(e.message); } finally { setLd(false); } }
  return (<div className="mx-auto max-w-lg space-y-6"><div><h1 className="text-2xl font-bold text-slate-900">My Profile</h1></div>
    {err && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}{ok && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{ok}</div>}
    <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="space-y-4">
      <div><label className="mb-1 block text-xs text-slate-600">Email</label><input disabled value={email} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" /></div>
      <div><label className="mb-1 block text-xs text-slate-600">Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div><hr/><div><label className="mb-1 block text-xs text-slate-600">Current Password</label><input type="password" value={cur} onChange={e => setCur(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
      <div><label className="mb-1 block text-xs text-slate-600">New Password</label><input type="password" value={next} onChange={e => setNext(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
    </div><button disabled={ld} className="mt-6 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{ld ? "..." : "Save"}</button></form></div>);
}
