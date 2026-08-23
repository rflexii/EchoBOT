/**
 * Ramat Embeddable Widget
 *
 * Drop this on any page to add the Ramat chat widget:
 *
 *   <script
 *     src="https://ramat.echosystems.ng/embed.js"
 *     data-api="https://ramat.echosystems.ng"
 *     async
 *   ></script>
 *
 * Optional data attributes:
 *   data-api          — base URL of the Ramat deployment (default: current origin)
 *   data-title        — chat panel title
 *   data-greeting     — custom greeting message
 *   data-name / data-email / data-phone — prefill visitor info
 */
(function () {
  const current = document.currentScript;
  const apiBase = (current && current.getAttribute("data-api")) || "";
  const title = (current && current.getAttribute("data-title")) || "Ramat";
  const greeting = current && current.getAttribute("data-greeting");
  const visitor = {
    name: current && current.getAttribute("data-name"),
    email: current && current.getAttribute("data-email"),
    phone: current && current.getAttribute("data-phone"),
  };

  const STYLE = `
    .ramat-widget{position:fixed;bottom:24px;right:24px;z-index:99999;font-family:inherit;display:flex;flex-direction:column;align-items:flex-end}
    .ramat-launcher{cursor:pointer;border:none;outline:none}
    .ramat-bounce{animation:ramat-bounce 2.4s infinite}
    .ramat-panel{display:flex;flex-direction:column}
    .ramat-panel *{box-sizing:border-box;font-family:inherit}
    @keyframes ramat-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes ramat-slide-up{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
    .ramat-panel.animate-slide-up{animation:ramat-slide-up .25s ease-out}
  `;

  function mount() {
    const root = document.createElement("div");
    root.id = "ramat-root";
    document.body.appendChild(root);

    // Inject styles
    const style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    // Build the launcher + panel manually (no framework dependency for the embed)
    const launcher = document.createElement("button");
    launcher.className = "ramat-launcher ramat-bounce";
    launcher.setAttribute("aria-label", "Open chat");
    launcher.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    const panel = document.createElement("div");
    panel.className = "ramat-panel";
    panel.style.cssText =
      "display:none;margin-bottom:16px;width:360px;max-width:calc(100vw - 2rem);max-height:min(640px,calc(100vh - 120px));overflow:hidden;border-radius:16px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 10px 40px -10px rgba(28,111,245,.25);flex-direction:column";

    root.appendChild(panel);
    root.appendChild(launcher);

    let open = false;
    let conversationId = null;
    const publicId = Math.random().toString(32).slice(2, 10);
    const msgs = [];

    function setOpen(v) {
      open = v;
      panel.style.display = v ? "flex" : "none";
      launcher.innerHTML = v
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
      launcher.className = "ramat-launcher" + (v ? "" : " ramat-bounce");
      if (v) input.focus();
    }

    // Build panel DOM
    panel.innerHTML = `
      <div style="padding:16px 20px;color:white;background:linear-gradient(135deg,#1c6ff5,#1457e1);display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:700">R</div>
        <div style="min-width:0;flex:1">
          <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.8);display:flex;align-items:center;gap:6px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#34d399"></span>
            Online — replies instantly
          </div>
        </div>
      </div>
      <div class="ramat-msgs" style="flex:1;overflow-y:auto;background:#f8fafc;padding:16px;display:flex;flex-direction:column;gap:12px;height:min(360px,50vh)">
      </div>
      <div style="border-top:1px solid #e2e8f0;background:#fff;padding:12px">
        <div style="display:flex;align-items:center:center;gap:8px;border:1px solid #cbd5e1;border-radius:9999px;background:#f8fafc;padding:8px 16px" class="ramat-input-wrap">
          <input class="ramat-input" placeholder="Type your message…" style="min-width:0;flex:1;background:transparent;border:none;outline:none;font-size:14px;color:#1e293b" />
          <button class="ramat-send" aria-label="Send" style="width:32px;height:32px;border-radius:50%;background:#1c6ff5;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div style="margin-top:8px;text-align:center;font-size:10px;color:#94a3b8">Powered by <strong style="color:#1c6ff5">Ramat</strong> · Echo Systems</div>
      </div>
    `;

    const msgsEl = panel.querySelector(".ramat-msgs");
    const input = panel.querySelector(".ramat-input");
    const sendBtn = panel.querySelector(".ramat-send");
    const inputWrap = panel.querySelector(".ramat-input-wrap");

    // greet
    addMsg(
      "assistant",
      greeting ||
        "Hi there! 👋 I'm Ramat, the Echo Systems assistant. How can I help you today?"
    );

    function addMsg(role, content) {
      const el = document.createElement("div");
      el.style.cssText = `display:flex;${role === "user" ? "justify-content:flex-end" : "justify-content:flex-start"}`;
      const bubble = document.createElement("div");
      const isUser = role === "user";
      bubble.style.cssText = `max-width:80%;white-space:pre-wrap;border-radius:16px;padding:10px 14px;font-size:14px;line-height:1.5;box-shadow:0 2px 8px rgba(0,0,0,.08);${
        isUser
          ? "border-bottom-right-radius:4px;background:#1c6ff5;color:#fff"
          : "border-bottom-left-radius:4px;background:#fff;color:#1e293b"
      }`;
      bubble.textContent = content;
      el.appendChild(bubble);
      msgsEl.appendChild(el);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return bubble;
    }

    function addTyping() {
      const el = document.createElement("div");
      el.className = "ramat-typing";
      el.style.cssText = "display:flex;justify-content:flex-start";
      el.innerHTML =
        '<div style="border-radius:16px;border-bottom-left-radius:4px;background:#fff;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);display:flex;gap:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#cbd5e1;animation:ramat-pulse 1.4s infinite"></span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#cbd5e1;animation:ramat-pulse 1.4s .2s infinite"></span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#cbd5e1;animation:ramat-pulse 1.4s .4s infinite"></span></div>';
      msgsEl.appendChild(el);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return el;
    }

    function removeTyping() {
      const t = msgsEl.querySelector(".ramat-typing");
      if (t) t.remove();
    }

    launcher.addEventListener("click", () => setOpen(!open));

    async function send() {
      const text = input.value.trim();
      if (!text) return;
      addMsg("user", text);
      input.value = "";
      const typing = addTyping();
      input.disabled = true;

      try {
        const res = await fetch(`${apiBase}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            publicId,
            message: text,
            visitor: {
              name: visitor.name || undefined,
              email: visitor.email || undefined,
              phone: visitor.phone || undefined,
              page: window.location.href,
            },
          }),
        });

        if (!res.ok || !res.body) throw new Error("bad");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let aiBubble = null;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            for (const line of event.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                if (json.type === "meta" && json.conversationId) {
                  conversationId = json.conversationId;
                } else if (json.type === "token") {
                  removeTyping();
                  if (!aiBubble) aiBubble = addMsg("assistant", "");
                  aiBubble.textContent += json.content;
                } else if (json.type === "error") {
                  removeTyping();
                  addMsg(
                    "assistant",
                    "I'm having trouble right now. I'll open a ticket for a senior executive."
                  );
                }
              } catch {}
            }
          }
        }
      } catch {
        removeTyping();
        addMsg("assistant", "I'm having trouble connecting. Please try again shortly.");
      } finally {
        input.disabled = false;
        input.focus();
      }
    }

    sendBtn.addEventListener("click", send);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
