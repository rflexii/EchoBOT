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
 *   data-title        — chat panel title (default: Ramat)
 *   data-greeting     — custom greeting message
 *   data-name / data-email / data-phone — prefill visitor info
 */
(function () {
  // Resolve the <script> tag that loaded this file. document.currentScript
  // works for plain <script> tags but is null when Next.js <Script> or other
  // async loaders inject it — so we fall back to scanning for our own src.
  function getSelf() {
    if (document.currentScript) return document.currentScript;
    var src = "embed.js";
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i];
      if (s.src && s.src.indexOf(src) !== -1) return s;
    }
    return null;
  }

  var current = getSelf();
  var apiBase = (current && current.getAttribute("data-api")) || "";
  var title = (current && current.getAttribute("data-title")) || "Ramat";
  var greeting = current && current.getAttribute("data-greeting");
  var visitor = {
    name: current && current.getAttribute("data-name"),
    email: current && current.getAttribute("data-email"),
    phone: current && current.getAttribute("data-phone"),
  };

  // If data-api wasn't set, fall back to the origin that served this script.
  if (!apiBase) {
    var scriptOrigin = "";
    try { scriptOrigin = new URL(current.src).origin; } catch (e) {}
    apiBase = scriptOrigin || window.location.origin;
  }

  function mount() {
    var root = document.createElement("div");
    root.id = "ramat-root";
    // Positioning applied INLINE so it can't be blocked by Content Security Policy.
    root.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:inherit;display:flex;flex-direction:column;align-items:flex-end";
    document.body.appendChild(root);

    // Launcher button
    var launcher = document.createElement("button");
    launcher.setAttribute("aria-label", "Open chat");
    launcher.style.cssText = "cursor:pointer;border:none;outline:none;display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;color:#fff;background:linear-gradient(135deg,#1c6ff5,#1457e1);box-shadow:0 8px 24px -8px rgba(28,111,245,.5);transition:transform .15s ease";
    launcher.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    // Chat panel
    var panel = document.createElement("div");
    panel.style.cssText = "display:none;margin-bottom:16px;width:360px;max-width:calc(100vw - 2rem);max-height:min(640px,calc(100vh - 120px));overflow:hidden;border-radius:16px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 10px 40px -10px rgba(28,111,245,.25);flex-direction:column;font-family:inherit";
    panel.setAttribute("role", "dialog");

    root.appendChild(panel);
    root.appendChild(launcher);

    var open = false;
    var conversationId = null;
    var publicId = Math.random().toString(32).slice(2, 10);

    function setOpen(v) {
      open = v;
      panel.style.display = v ? "flex" : "none";
      if (v) {
        launcher.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      } else {
        launcher.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
      }
      if (v) {
        try { input.focus(); } catch (e) {}
      }
    }

    // Panel header
    panel.innerHTML =
      '<div style="padding:16px 20px;color:#fff;background:linear-gradient(135deg,#1c6ff5,#1457e1);display:flex;align-items:center;gap:12px">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px">R</div>' +
        '<div style="min-width:0;flex:1">' +
          '<div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:15px">' + title + '</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:6px;margin-top:2px">' +
            '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#34d399"></span>' +
            'Online — replies instantly' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ramat-msgs" style="flex:1;overflow-y:auto;background:#f8fafc;padding:16px;display:flex;flex-direction:column;gap:12px;height:min(360px,50vh)"></div>' +
      '<div style="border-top:1px solid #e2e8f0;background:#fff;padding:12px">' +
        '<div style="display:flex;align-items:center;gap:8px;border:1px solid #cbd5e1;border-radius:9999px;background:#f8fafc;padding:8px 16px" class="ramat-input-wrap">' +
          '<input class="ramat-input" placeholder="Type your message…" style="min-width:0;flex:1;background:transparent;border:none;outline:none;font-size:14px;color:#1e293b;font-family:inherit" />' +
          '<button class="ramat-send" aria-label="Send" style="width:32px;height:32px;border-radius:50%;background:#1c6ff5;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
          '</button>' +
        '</div>' +
        '<div style="margin-top:8px;text-align:center;font-size:10px;color:#94a3b8">Powered by <strong style="color:#1c6ff5">Ramat</strong> · Echo Systems</div>' +
      '</div>';

    var msgsEl = panel.querySelector(".ramat-msgs");
    var input = panel.querySelector(".ramat-input");
    var sendBtn = panel.querySelector(".ramat-send");

    // Greeting
    addMsg("assistant", greeting || "Hi there! 👋 I'm Ramat, the Echo Systems assistant. How can I help you today?");

    function addMsg(role, content) {
      var el = document.createElement("div");
      el.style.cssText = "display:flex;" + (role === "user" ? "justify-content:flex-end" : "justify-content:flex-start");
      var bubble = document.createElement("div");
      var isUser = role === "user";
      bubble.style.cssText = "max-width:80%;white-space:pre-wrap;border-radius:16px;padding:10px 14px;font-size:14px;line-height:1.5;box-shadow:0 2px 8px rgba(0,0,0,.08);font-family:inherit;" + (isUser ? "border-bottom-right-radius:4px;background:#1c6ff5;color:#fff" : "border-bottom-left-radius:4px;background:#fff;color:#1e293b");
      bubble.textContent = content;
      el.appendChild(bubble);
      msgsEl.appendChild(el);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return bubble;
    }

    function addTyping() {
      var el = document.createElement("div");
      el.style.cssText = "display:flex;justify-content:flex-start";
      el.innerHTML = '<div style="border-radius:16px;border-bottom-left-radius:4px;background:#fff;padding:12px 14px;box-shadow:0 2px 8px rgba(0,0,0,.08)"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#cbd5e1;margin:0 2px;vertical-align:middle;animation:ramat-pulse 1.4s infinite"></span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#cbd5e1;margin:0 2px;vertical-align:middle;animation:ramat-pulse 1.4s .2s infinite"></span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#cbd5e1;margin:0 2px;vertical-align:middle;animation:ramat-pulse 1.4s .4s infinite"></span></div>';
      msgsEl.appendChild(el);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return el;
    }

    launcher.addEventListener("click", function () { setOpen(!open); });

    async function send() {
      var text = input.value.trim();
      if (!text) return;
      addMsg("user", text);
      input.value = "";
      var typing = addTyping();
      input.disabled = true;

      try {
        var res = await fetch(apiBase + "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationId || undefined,
            publicId: publicId,
            message: text,
            visitor: {
              name: visitor.name || undefined,
              email: visitor.email || undefined,
              phone: visitor.phone || undefined,
              page: window.location.href,
            },
          }),
        });

        if (!res.ok || !res.body) throw new Error("request failed: " + res.status);

        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";
        var aiBubble = null;

        while (true) {
          var result = await reader.read();
          if (result.done) break;
          buffer += decoder.decode(result.value, { stream: true });
          var events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (var ei = 0; ei < events.length; ei++) {
            var lines = events[ei].split("\n");
            for (var li = 0; li < lines.length; li++) {
              var line = lines[li];
              if (line.indexOf("data:") !== 0) continue;
              var data = line.slice(5).trim();
              if (data === "[DONE]") continue;
              try {
                var json = JSON.parse(data);
                if (json.type === "meta" && json.conversationId) {
                  conversationId = json.conversationId;
                } else if (json.type === "token") {
                  if (typing) { typing.remove(); typing = null; }
                  if (!aiBubble) aiBubble = addMsg("assistant", "");
                  aiBubble.textContent += json.content;
                } else if (json.type === "error") {
                  if (typing) { typing.remove(); typing = null; }
                  addMsg("assistant", "I'm having trouble right now. I'll open a ticket for a senior executive.");
                }
              } catch (err) { /* ignore malformed chunk */ }
            }
          }
        }
      } catch (err) {
        if (typing) { typing.remove(); typing = null; }
        addMsg("assistant", "I'm having trouble connecting. Please try again shortly.");
      } finally {
        input.disabled = false;
        try { input.focus(); } catch (e) {}
      }
    }

    sendBtn.addEventListener("click", send);
    input.addEventListener("keydown", function (e) {
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
