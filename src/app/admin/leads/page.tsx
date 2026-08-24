"use client";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";

interface Lead { id: string; name: string | null; email: string | null; phone: string | null; company: string | null; serviceInterest: string | null; status: string; createdAt: string; }

const STATUS_TONE: Record<string, string> = { new: "bg-blue-100 text-blue-700", contacted: "bg-indigo-100 text-indigo-700", qualified: "bg-violet-100 text-violet-700", proposal: "bg-amber-100 text-amber-700", won: "bg-emerald-100 text-emerald-700", lost: "bg-slate-100 text-slate-600" };

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetch("/api/leads").then((r) => r.json()).then((d) => setLeads(d.leads)).catch(() => setError("Failed to load")); }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Leads</h1><p className="mt-1 text-sm text-slate-500">Sales pipeline captured from conversations.</p></div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Service</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 && (<tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No leads yet.</td></tr>)}
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-5 py-3"><div className="font-medium text-slate-900">{l.name || "—"}</div><div className="text-xs text-slate-400">{l.email || "—"}</div></td>
                <td className="px-5 py-3 text-slate-600">{l.serviceInterest || "—"}</td>
                <td className="px-5 py-3 text-slate-600">{l.phone || "—"}</td>
                <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[l.status] || "bg-slate-100 text-slate-600"}`}>{l.status}</span></td>
                <td className="px-5 py-3 text-xs text-slate-500">{formatDateTime(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}