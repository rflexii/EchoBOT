"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  escalated?: boolean;
}

export interface VisitorInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface RamatChatProps {
  apiBase?: string;
  visitor?: VisitorInfo;
  page?: string;
  primaryColor?: string;
  title?: string;
  subtitle?: string;
  greeting?: string;
}

const DEFAULT_GREETING =
  "Hi there! 👋 I'm Ramat, the Echo Systems assistant. How can I help you today? Ask me about our services, pricing, or anything else.";

export function RamatChat({
  apiBase = "",
  visitor,
  page,
  title = "Ramat",
  subtitle = "Echo Systems AI Assistant",
  greeting = DEFAULT_GREETING,
}: RamatChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [publicId] = useState(() => Math.random().toString(32).slice(2, 10));
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with a greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: greeting,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      const endpoint = `${apiBase}/api/chat`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          publicId,
          message: text,
          visitor: {
            name: visitor?.name,
            email: visitor?.email,
            phone: visitor?.phone,
            page: page ?? (typeof window !== "undefined" ? window.location.href : undefined),
          },
          lead: leadCaptured ? undefined : undefined,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          for (const line of event.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              if (json.type === "meta") {
                if (json.conversationId) setConversationId(json.conversationId);
              } else if (json.type === "token") {
                setMessages((prev) =>
                  prev.map((m) => (m.id === aiMsg.id ? { ...m, content: m.content + json.content } : m))
                );
              } else if (json.type === "done") {
                if (json.escalated) setShowLeadForm(true);
              } else if (json.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsg.id
                      ? {
                          ...m,
                          content:
                            "I'm having trouble responding right now. I'll open a ticket for a senior executive to assist you.",
                        }
                      : m
                  )
                );
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsg.id
            ? { ...m, content: "I'm having trouble connecting. Please try again shortly." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="ramat-widget" style={{ fontFamily: "inherit" }}>
      {/* Floating launcher button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className={cn(
          "ramat-launcher flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-300/40",
          open ? "rotate-0" : "ramat-bounce"
        )}
        style={{ background: "linear-gradient(135deg, #1c6ff5, #1457e1)" }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="ramat-panel animate-slide-up mb-4 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-chat"
          style={{ maxHeight: "min(640px, calc(100vh - 120px))" }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 text-white"
            style={{ background: "linear-gradient(135deg, #1c6ff5, #1457e1)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                R
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{title}</div>
                <div className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  Online — typically replies instantly
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-scroll flex flex-col gap-3 overflow-y-auto bg-slate-50 px-4 py-4" style={{ height: "min(360px, 50vh)" }}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-bubble",
                    m.role === "user"
                      ? "rounded-br-sm bg-brand-600 text-white"
                      : "rounded-bl-sm bg-white text-slate-800"
                  )}
                >
                  {m.content}
                  {m.escalated && (
                    <div className="mt-2 text-xs text-amber-600">This will be escalated to our team.</div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            {showLeadForm && !leadCaptured && (
              <LeadCaptureInline
                onSubmit={async (data) => {
                  try {
                    await fetch(`${apiBase}/api/leads`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ conversationId, ...data }),
                    });
                  } catch {}
                  setLeadCaptured(true);
                  setShowLeadForm(false);
                }}
              />
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type your message…"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-400">
              Powered by <span className="font-semibold text-brand-600">Ramat</span> · Echo Systems
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCaptureInline({ onSubmit }: { onSubmit: (data: any) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
        Thanks! A senior executive will reach out to you shortly. ✅
      </div>
    );
  }

  return (
    <div className="animate-slide-up rounded-xl border border-brand-200 bg-brand-50 p-3">
      <div className="mb-2 text-sm font-medium text-brand-800">
        Share your details so our team can follow up:
      </div>
      <div className="flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          type="email"
          className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        />
        <button
          onClick={() => onSubmit({ name, email }).then(() => setSent(true))}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
