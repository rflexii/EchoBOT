"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
interface Admin { id: string; email: string; name: string | null; }
export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const load = () => { fetch("/api/admin/admins").then(r => r.ok ? r.json() : Promise.reject()).then(d => setAdmins(d.admins)).catch(() => {}); };
  useEffect(() => { load(); }, []);
  async function add(e: React.FormEvent) { e.preventDefault(); setError(null); setSuccess(null); setLoading(true); try { const r = await fetch("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name }) }); if (!r.ok) throw new Error((await r.json()).error || "Failed"); setSuccess("Admin added"); setEmail(""); setPassword(""); setName(""); load(); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }
  async function remove(id: string, eml: string) { if (!confirm(`Remove ${eml}?`)) return; try { await fetch("/api/admin/admins", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); load(); } catch (e: any) { setError(e.message); } }
  return (<div className="space-y-8"><div><h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1><p className="mt-1 text-sm text-slate-500">Manage admin users.</p></div>
    {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{success && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-4 text-sm font-semibold">Current Admins</h2>
      {admins.length === 0 ? <div className="text-sm text-slate-400">No admins yet.</div> : admins.map(a => (<div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"><div><div className="text-sm font-medium">{a.email}</div>{a.name && <div className="text-xs text-slate-400">{a.name}</div>}</div><button onClick={() => remove(a.id, a.email)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Remove</button></div>))}
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-4 text-sm font-semibold">Add Admin</h2>
      <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1"><label className="mb-1 block text-xs text-slate-600">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
        <div className="flex-1"><label className="mb-1 block text-xs text-slate-600">Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
        <div className="flex-1"><label className="mb-1 block text-xs text-slate-600">Password</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
        <button disabled={loading} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "..." : "Add"}</button>
      </form>
    </div></div>);
}
