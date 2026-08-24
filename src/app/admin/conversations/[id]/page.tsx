"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/conversations/${id}`)
      .then((r) => { if (r.status === 401) throw new Error("unauthorized"); if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((d) => { if (!d.conversation) throw new Error("not found"); setData(d.conversation); })
      .catch((e) => setError(e.message === "unauthorized" ? "unauthorized" : "not found"));
  }, [id]);

  if (error) {
    return (<div className="py-20 text-center text-sm text-slate-500">{error === "unauthorized" ? <Link href="/admin/login" className="text-brand-600 underline">Sign in</Link> : <div>Conversation not found. <Link href="/admin/conversations" className="text-brand-600 underline">Back</Link></div>}</div>);
  }
  if (!data) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;

  const messages = Array.isArray(data.messages) ? data.messages : [];
  const visitorName = data.visitorName || "Anonymous";
  const visitorEmail = data.visitorEmail || "";

  function fmtDate(d: any) { try { return new Date(d).toLocaleString("en-NG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/conversations" className="text-xs font-medium text-brand-600 hover:underline">← Back to conversations</Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {visitorName}{visitorEmail && <span className="text-sm font-normal text-slate-400"> ({visitorEmail})</span>}
        </h1>
      </div>
      <div className="space-y-3">
        {messages.length === 0 && <div className="py-10 text-center text-sm text-slate-400">No messages.</div>}
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-white text-slate-800 shadow-sm"}`}>
              {m.content || ""}
              <div className={`mt-1 text-[10px] ${m.role === "user" ? "text-white/60" : "text-slate-400"}`}>{fmtDate(m.createdAt)}{m.escalated ? " · escalated" : ""}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}