"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/admin/tickets/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((d) => setTicket(d.ticket))
      .catch(() => setError("Failed to load"));
  }, [params?.id]);

  if (error) return <div className="py-20 text-center text-sm text-slate-500">{error}</div>;
  if (!ticket) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;

  async function updateStatus(status: string) {
    const r = await fetch(`/api/admin/tickets/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (r.ok) setTicket({ ...ticket, status });
  }

  return (
    <div className="space-y-6">
      <div><Link href="/admin/tickets" className="text-xs font-medium text-brand-600 hover:underline">← Back to tickets</Link></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div><h1 className="text-xl font-bold">{ticket.ticketNumber}</h1><p className="text-sm text-slate-500">{ticket.subject}</p></div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 capitalize">{ticket.status}</span>
        </div>
        <div className="mt-4 grid gap-3 text-sm">
          <div><span className="text-slate-400">From:</span> <span>{ticket.visitorName || "Anonymous"} {ticket.visitorEmail && `(${ticket.visitorEmail})`}</span></div>
          {ticket.visitorPhone && <div><span className="text-slate-400">Phone:</span> {ticket.visitorPhone}</div>}
          <div><span className="text-slate-400">Priority:</span> <span className="capitalize">{ticket.priority}</span></div>
          <div><span className="text-slate-400">Created:</span> {formatDateTime(ticket.createdAt)}</div>
          <div className="mt-2 rounded-lg bg-slate-50 p-3"><span className="text-slate-400">Description:</span><p className="mt-1 whitespace-pre-wrap">{ticket.description}</p></div>
        </div>
        <div className="mt-4 flex gap-2">
          {ticket.status === "open" && <button onClick={() => updateStatus("in_progress")} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">Start Progress</button>}
          {ticket.status === "in_progress" && <button onClick={() => updateStatus("resolved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Resolve</button>}
          {ticket.status !== "closed" && <button onClick={() => updateStatus("closed")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Close</button>}
        </div>
      </div>
    </div>
  );
}