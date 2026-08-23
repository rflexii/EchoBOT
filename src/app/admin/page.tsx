"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totals: {
    conversations: number;
    messages: number;
    tickets: number;
    leads: number;
    openTickets: number;
    newLeads: number;
  };
  escalationRate: number;
  avgLatencyMs: number;
  perDay: { day: string; count: number }[];
  ticketsByStatus: { status: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
}

function StatCard({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: string }) {
  const tones: Record<string, string> = {
    blue: "from-brand-500 to-brand-700",
    emerald: "from-emerald-500 to-emerald-700",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
          {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
        </div>
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${tones[tone || "blue"]} opacity-80`} />
      </div>
    </div>
  );
}

function MiniBar({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-32 items-end gap-1">
      {data.length === 0 && <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No data yet</div>}
      {data.map((d) => (
        <div key={d.day} className="group relative flex-1">
          <div
            className="w-full rounded-t bg-brand-500 transition group-hover:bg-brand-600"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
          />
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
            {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 401) throw new Error("unauthorized");
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message === "unauthorized" ? "unauthorized" : "Failed to load stats"));
  }, []);

  if (error === "unauthorized") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-sm text-slate-500">Your session expired.</div>
        <Link href="/admin/login" className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Sign in again
        </Link>
      </div>
    );
  }

  if (!stats) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-400">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Ramat performance at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Conversations" value={stats.totals.conversations} tone="blue" />
        <StatCard label="Messages" value={stats.totals.messages} tone="blue" />
        <StatCard label="Leads" value={stats.totals.leads} sub={`${stats.totals.newLeads} new`} tone="emerald" />
        <StatCard label="Tickets" value={stats.totals.tickets} sub={`${stats.totals.openTickets} open`} tone="amber" />
        <StatCard label="Escalation rate" value={`${stats.escalationRate}%`} tone="rose" />
        <StatCard label="Avg response time" value={`${Math.round(stats.avgLatencyMs / 1000) || 0}s`} sub="assistant messages" tone="blue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Conversations (last 30 days)</h2>
            <Link href="/admin/conversations" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <MiniBar data={stats.perDay} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-slate-900">Pipeline</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Tickets</div>
              <div className="space-y-2">
                {stats.ticketsByStatus.length === 0 && <div className="text-xs text-slate-400">No tickets</div>}
                {stats.ticketsByStatus.map((t) => (
                  <div key={t.status} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-600">{t.status}</span>
                    <span className="font-semibold text-slate-900">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Leads</div>
              <div className="space-y-2">
                {stats.leadsByStatus.length === 0 && <div className="text-xs text-slate-400">No leads</div>}
                {stats.leadsByStatus.map((l) => (
                  <div key={l.status} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-600">{l.status}</span>
                    <span className="font-semibold text-slate-900">{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
