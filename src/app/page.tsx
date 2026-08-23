import Link from "next/link";

/**
 * Landing page for the Ramat deployment.
 * Useful as a sanity check once deployed; the real entry point for visitors
 * is the widget embedded on echosystems.ng.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4 py-16">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white shadow-xl">
          R
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Ramat
        </h1>
        <p className="mt-3 text-lg text-brand-700">Echo Systems AI Assistant</p>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600">
          Ramat is the customer-service and sales agent for{" "}
          <a href="https://echosystems.ng" className="font-medium text-brand-600 underline-offset-2 hover:underline">
            Echo Systems
          </a>
          . It answers questions about our services, qualifies sales conversations,
          and opens tickets for requests that need a senior executive.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-brand-700"
          >
            Open Chat
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Admin Dashboard
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Sales & Support", d: "Answers questions about all Echo Systems services." },
            { t: "Smart Escalation", d: "Opens tickets for a senior executive when needed." },
            { t: "Admin Insights", d: "Conversation logs, tickets, leads, and performance reports." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
              <div className="text-sm font-semibold text-brand-700">{f.t}</div>
              <div className="mt-1 text-sm text-slate-500">{f.d}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-left">
          <h2 className="text-sm font-semibold text-slate-900">Embed on your site</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add this snippet before the closing <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">&lt;/body&gt;</code> tag on echosystems.ng:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-emerald-300">
{`<script
  src="${process.env.NEXT_PUBLIC_APP_URL || "https://ramat.echosystems.ng"}/embed.js"
  data-api="${process.env.NEXT_PUBLIC_APP_URL || "https://ramat.echosystems.ng"}"
  async
></script>`}
          </pre>
        </div>
      </div>
    </main>
  );
}
