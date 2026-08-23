"use client";

import { RamatChat } from "@/components/RamatChat";

/**
 * Full-page chat experience. Can be used directly at /chat or embedded
 * in an iframe on the Echo Systems website.
 */
export default function ChatPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white shadow-lg">
            R
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Chat with Ramat</h1>
          <p className="mt-1 text-sm text-slate-500">
            The Echo Systems AI assistant — here to help with sales & support.
          </p>
        </div>
        <div className="flex justify-center">
          <RamatChat />
        </div>
      </div>
    </main>
  );
}
