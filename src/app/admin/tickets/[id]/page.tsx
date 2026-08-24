"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadTicket = () => {
    if (!params?.id) { setError("No ticket id"); return; }
    fetch(`/api/tickets/${params.id}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "not found"); return d; })
      .then((d) => { if (!d.ticket) throw new Error("not found"); setTicket(d.ticket); })
      .catch((e) => setError(e.message === "not found" ? "Ticket not found" : "Failed to load"));
  };

  useEffect(() => { loadTicket(); }, [params?.id]);

  async function updateStatus(status: string) {
    const r = await fetch(`/api/tickets/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (r.ok) setTicket({ ...ticket, status });
  }

  async function sendResponse(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`/api/tickets/${params.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: note }),
      });
      if (r.ok) {
        setNote("");
        loadTicket();
      }
    } finally { setSending(false); }
  }

  if (error) return (<div className="py-20 text-center text-sm text-slate-500"><div>{error}</div><Link href="/admin/tickets" className="mt-2 inline-block text-brand-600 underline">Back to tickets</Link></div>);
  if (!ticket) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;

  function fmtDate(d: any) { try { return new Date(d).toLocaleString("en-NG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }

  const responses = Array.isArray(ticket.responses) ? ticket.responses : [];

  return (
    <div className="space-y-6">
      <div><Link href="/admin/tickets" className="text-xs font-medium text-brand-600 hover:underline">← Back to tickets</Link></div>

      {/* Contact Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Visitor Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div><span className="text-slate-400 block">Name</span><span className="font-medium">{ticket.visitorName || "Anonymous"}</span></div>
          <div><span className="text-slate-400 block">Email</span><span className="font-medium">{ticket.visitorEmail || "—"}</span></div>
          <div><span className="text-slate-400 block">Phone</span><span className="font-medium">{ticket.visitorPhone || "—"}</span></div>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div><h1 className="text-xl font-bold">{ticket.ticketNumber || "Unknown"}</h1><p className="text-sm text-slate-500">{ticket.subject || "No subject"}</p></div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 capitalize">{ticket.status || "open"}</span>
        </div>
        <div className="mt-3 text-xs text-slate-400">Created {fmtDate(ticket.createdAt)} · Priority: <span className="capitalize">{ticket.priority || "medium"}</span></div>
        {ticket.description && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm"><span className="text-slate-400">Description:</span><p className="mt-1 whitespace-pre-wrap">{ticket.description}</p></div>}
        <div className="mt-4 flex gap-2">
          {(ticket.status === "open" || !ticket.status) && <button onClick={() => updateStatus("in_progress")} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">Start Progress</button>}
          {ticket.status === "in_progress" && <button onClick={() => updateStatus("resolved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Resolve</button>}
          {ticket.status !== "closed" && <button onClick={() => updateStatus("closed")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Close</button>}
        </div>
      </div>

      {/* Responses */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Responses</h2>
        <div ref={scrollRef} className="space-y-3 max-h-64 overflow-y-auto mb-4">
          {responses.length === 0 && <div className="text-sm text-slate-400">No responses yet.</div>}
          {responses.map((r: any, i: number) => (
            <div key={i} className={`flex ${r.role === "admin" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${r.role === "admin" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                <div>{r.message}</div>
                <div className={`mt-1 text-[10px] ${r.role === "admin" ? "text-white/60" : "text-slate-400"}`}>{fmtDate(r.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendResponse} className="flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type a response to the visitor..." className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          <button type="submit" disabled={sending || !note.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{sending ? "..." : "Send"}</button>
        </form>
      </div>
    </div>
  );
}