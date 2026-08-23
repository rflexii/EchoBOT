"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

interface Conversation {
  id: string;
  publicId: string;
  visitorName: string | null;
  visitorEmail: string | null;
  isLead: boolean;
  escalated: boolean;
  lastMessageAt: Date | string;
  startedAt: Date | string;
  messages: { content: string; role: string }[];
}

export default function AdminConversationsPage() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/conversations?limit=50")
      .then((r) => {
        if (r.status === 401) throw new Error("unauthorized");
        return r.json();
      })
      .then((d) => setConvos(d.conversations))
      .catch((e) => setError(e.message === "unauthorized" ? "unauthorized" : "Failed to load"));
  }, []);

  if (error === "unauthorized") {
    return (
      <div className="py-20 text-center">
        <Link href="/admin/login" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Sign in again
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Conversations</h1>
        <p className="mt-1 text-sm text-slate-500">Every chat Ramat has handled.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Visitor</th>
              <th className="px-5 py-3">Preview</th>
              <th className="px-5 py-3">Flags</th>
              <th className="px-5 py-3">Last message</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {convos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  No conversations yet.
                </td>
              </tr>
            )}
            {convos.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-900">{c.visitorName || "Anonymous"}</div>
                  <div className="text-xs text-slate-400">{c.visitorEmail || "—"}</div>
                </td>
                <td className="max-w-xs truncate px-5 py-3 text-slate-600">
                  {c.messages?.[0]?.content || "—"}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    {c.isLead && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Lead</span>
                    )}
                    {c.escalated && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Escalated</span>
                    )}
                    {!c.isLead && !c.escalated && <span className="text-xs text-slate-300">—</span>}
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">{formatDateTime(c.lastMessageAt)}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/conversations/${c.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
