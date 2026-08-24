"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.tickets)) setTickets(d.tickets); else setError("Invalid data"); })
      .catch(() => setError("Failed to load"));
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
                <td className="px-5 py-3"><Link href={`/admin/tickets/${t.id}`} className="font-medium text-brand-600 hover:underline">{t.ticketNumber || "Unknown"}</Link><div className="text-xs text-slate-400