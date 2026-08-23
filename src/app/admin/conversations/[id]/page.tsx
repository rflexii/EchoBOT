"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

interface Conversation {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  messages: { id: string; role: string; content: string; createdAt: string; escalated: boolean }[];
  tickets: { id: string; ticketNumber: string; subject: string; status: string }[];
  leads: { id: string; name: string | null; email: string | null; status: string }[];
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/conversations/${id}`)
      .then((r) => {
        if (r.status === 401) throw new Error("unauthorized");
        return r.json();
      })
      .then((d) => setData(d.conversation))
      .catch((e) => setError(e.message === "unauthorized" ? "unauthorized" : "Failed to load"));
  }, [id]);

  if (error) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        {error === "unauthorized" ? <Link href="/admin/login" className="text-brand-600 underline">Sign in</Link> : error}
      </div>
    );
  }
  if (!data) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/conversations" className="text-xs font-medium text-brand-600 hover:underline">
          ← Back to conversations
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {data.visitorName || "Anonymous"} {data.visitorEmail && <span className="text-sm font-normal text-slate-400">({data.visitorEmail})</span>}
        </h1>
      </div>

      {(data.tickets.length > 0 || data.leads.length > 0) && (
        <div className="flex gap-2">
          {data.tickets.map((t) => (
            <span key={t.id} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              Ticket {t.ticketNumber} · {t.status}
            </span>
          ))}
          {data.leads.map((l) => (
            <span key={l.id} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Lead · {l.status}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {data.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-white text-slate-800 shadow-sm"
              }`}
            >
              {m.content}
              <div className={`mt-1 text-[10px] ${m.role === "user" ? "text-white/60" : "text-slate-400"}`}>
                {formatDateTime(m.createdAt)}
                {m.escalated ? " · escalated" : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
