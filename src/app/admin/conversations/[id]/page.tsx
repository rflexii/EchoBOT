"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) { setError("No id"); return; }
    fetch(`/api/admin/conversations/${params.id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load");
        return d;
      })
      .then((d) => {
        if (!d.conversation) throw new Error("Not found");
        setData(d.conversation);
      })
      .catch((e) => setError(e.message || "Failed to load"));
  }, [params?.id]);

  if (error) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        <div className="font-medium text-red-600">{error}</div>
        <Link href="/admin/conversations" className="mt-2 inline-block text-brand-600 underline">Back to conversations</Link>
      </div>
    );
  }
  if (!data) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;

  const messages = Array.isArray(data.messages) ? data.messages : [];

  function fmtDate(d: any) { try { return new Date(d).toLocaleString("en-NG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }

  return (
    <div className="space-y-6">
      <div><Link href="/admin/conversations" className="text-xs font-medium text-brand-600 hover:underline">← Back to conversations</Link></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Visitor Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div><span className="text-slate-400 block">Name</span><span className="font-medium">{data.visitorName || "Anonymous"}</span></div>
          <div><span className="text-slate-400 block">Email</span><span className="font-medium">{data.visitorEmail || "—"}</span></div>
          <div><span className="text-slate-400 block">Phone</span><span className="font-medium">{data.visitorPhone || "—"}</span></div>
        </div>
      </div>
      <div className="space-y-3">
        {messages.length === 0 && <div className="py-10 text-center text-sm text-slate-400">No messages.</div>}
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-white text-slate-800 shadow-sm"}`}>
              {m.content || ""}
              <div className={`mt-1 text-[10px] ${m.role === "user" ? "text-white/60" : "text-slate-400"}`}>{fmtDate(m.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}