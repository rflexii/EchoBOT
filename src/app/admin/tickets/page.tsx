"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tickets")
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Failed"); return d; })
      .then((d) => { if (Array.isArray(d.tickets)) setTickets(d.tickets); else setError("Invalid data"); })
      .catch((e) => setError(e.message || "Failed to load"));
  }, []);

  function fmtDate(d: any) { try { return new Date(d).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }); } catch { return ""; } }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Tickets</h1><p className="mt-1 text-sm text-slate-500">Escalated requests for senior executives.</p></div>
      </div>
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-5 py-3">Ticket</th><th className="px-5 py-3">Visitor</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.length === 0 && !error && (<tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No tickets yet.</td></tr>)}
            {tickets.map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-5 py-3"><Link href={`/admin/tickets/${t.id}`} className="font-medium text-brand-600 hover:underline">{t.ticketNumber || "Unknown"}</Link><div className="text-xs text-slate-400 truncate max-w-xs">{t.subject || ""}</div></td>
                <td className="px-5 py-3"><div className="text-slate-900">{t.visitorName || "Anonymous"}</div><div className="text-xs text-slate-400">{t.visitorEmail || "—"}</div></td>
                <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_COLORS[t.status] || "bg-slate-100 text-slate-600"}`}>{t.status?.replace("_", " ") || "open"}</span></td>
                <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}