"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  visitorName: string | null;
  visitorEmail: string | null;
  assignedTo: string | null;
  createdAt: string;
}

const STATUS_TONE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

const PRIORITY_TONE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets))
      .catch(() => setError("Failed to load"));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">Escalated requests for senior executives.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Ticket</th>
              <th className="px-5 py-3">Visitor</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Assigned</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  No tickets yet.
                </td>
              </tr>
            )}
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/tickets/${t.id}`} className="font-medium text-brand-600 hover:underline">
                    {t.ticketNumber}
                  </Link>
                  <div className="max-w-xs truncate text-xs text-slate-400">{t.subject}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="text-slate-900">{t.visitorName || "Anonymous"}</div>
                  <div className="text-xs text-slate-400">{t.visitorEmail || "—"}</div>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_TONE[t.priority] || "bg-slate-100 text-slate-600"}`}>
                    {t.priority}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[t.status] || "bg-slate-100 text-slate-600"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600">{t.assignedTo || "—"}</td>
                <td className="px-5 py-3 text-xs text-slate-500">{formatDateTime(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}