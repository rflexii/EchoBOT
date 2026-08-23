"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

interface ReportData {
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

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="py-20 text-center text-sm text-slate-400">Loading reports…</div>;

  const totalTickets = data.totals.tickets || 0;
  const totalLeads = data.totals.leads || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Performance metrics and trends for Ramat.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Response Quality */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Response Quality</h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-600">Escalation rate</span>
                <span className="font-semibold text-slate-900">{data.escalationRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600" style={{ width: `${Math.min(data.escalationRate, 100)}%` }} />
              </div>
              <div className="mt-1 text-xs text-slate-400">% of conversations escalated to a human</div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-xs text-slate-400">Avg response time</div>
                <div className="text-xl font-bold text-slate-900">{Math.round(data.avgLatencyMs / 1000) || 0}s</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Total messages</div>
                <div className="text-xl font-bold text-slate-900">{data.totals.messages}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Conversion Funnel</h2>
          <div className="space-y-3">
            <FunnelRow label="Conversations" value={data.totals.conversations} max={data.totals.conversations} color="bg-brand-500" />
            <FunnelRow label="Leads captured" value={data.totals.leads} max={data.totals.conversations} color="bg-emerald-500" />
            <FunnelRow label="Tickets opened" value={data.totals.tickets} max={data.totals.conversations} color="bg-amber-500" />
          </div>
        </div>

        {/* Ticket Resolution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Ticket Status Breakdown</h2>
          {data.ticketsByStatus.length === 0 ? (
            <div className="text-sm text-slate-400">No tickets to report.</div>
          ) : (
            <div className="space-y-2">
              {data.ticketsByStatus.map((t) => (
                <div key={t.status} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-slate-600">{t.status.replace("_", " ")}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${(t.count / totalTickets) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right font-semibold text-slate-900">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lead Pipeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Lead Pipeline</h2>
          {data.leadsByStatus.length === 0 ? (
            <div className="text-sm text-slate-400">No leads to report.</div>
          ) : (
            <div className="space-y-2">
              {data.leadsByStatus.map((l) => (
                <div key={l.status} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-slate-600">{l.status}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(l.count / totalLeads) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right font-semibold text-slate-900">{l.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
