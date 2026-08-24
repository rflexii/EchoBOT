/**
 * Ramat Embeddable Widget — Echo Systems
 * Color: #0c4b2c (green)
 */
(function () {
  function getSelf() {
    if (document.currentScript) return document.currentScript;
    var src = "embed.js";
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) { var s = scripts[i]; if (s.src && s.src.indexOf(src) !== -1) return s; }
    return null;
  }
  var current = getSelf();
  var apiBase = (current && current.getAttribute("data-api")) || "";
  var title = (current && current.getAttribute("data-title")) || "Ramat";
  var greeting = current && current.getAttribute("data-greeting");
  var visitor = { name: current && current.getAttribute("data-name") || "", email: current && current.getAttribute("data-email") || "", phone: current && current.getAttribute("data-phone") || "" };
  if (!apiBase) { try { apiBase = new URL(current.src).origin; } catch (e) {} }

  var GREEN = "#0c4b2c";

  function mount() {
    var root = document.createElement("div");
    root.id = "ramat-root";
    root.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:inherit;display:flex;flex-direction:column;align-items:flex-end";
    document.body.appendChild(root);

    var launcher = document.createElement("button");
    launcher.setAttribute("aria-label", "Open chat");
    launcher.style.cssText = "cursor:pointer;border:none;outline:none;display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;color:#fff;background:" + GREEN + ";box-shadow:0 8px 24px -8px rgba(12,75,44,.5);transition:transform .15s ease";
    launcher.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    var panel = document.createElement("div");
    panel.style.cssText = "display:none;margin-bottom:16px;width:360px;max-width:calc(100vw - 2rem);max-height:min(640px,calc(100vh - 120px));overflow:hidden;border-radius:16px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 10px 40px -10px rgba(12,75,44,.25);flex-direction:column;font-family:inherit";

    root.appendChild(panel);
    root.appendChild(launcher);

    var open = false;
    var conversationId = null;
    var publicId = Math.random().toString(32).slice(2, 10);
    var msgsEl, input, sendBtn;

    function setOpen(v) {
      open = v;
      panel.style.display = v ? "flex" : "none";
      launcher.innerHTML = v ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
      if (v) try { input.focus(); } catch (e) {}
    }

    panel.innerHTML =
      '<div style="padding:16px 20px;color:#fff;background:' + GREEN + ';display:flex;align-items:center;gap:12px">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px">R</div>' +
        '<div style="min-width:0;flex:1"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:15px">' + title + '</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#34d399"></span>Online — replies instantly</div></div></div>' +
      '<div class="ramat-msgs" style="flex:1;overflow-y:auto;background:#f8fafc;padding:16px;display:flex;flex-direction:column;gap:12px;height:min(360px,50vh)"></div>' +
      '<div style="border-top:1px solid #e2e8f0;background:#fff;padding:12px">' +
        '<div style="display:flex;align-items:center;gap:8px;border:1px solid #cbd5e1;border-radius:9999px;background:#f8fafc;padding:8px 16px"><input class="ramat-input" placeholder="Type your message…" style="min-width:0;flex:1;background:transparent;border:none;outline:none;font-size:14px;color:#1e293b;font-family:inherit" />' +
        '<button class="ramat-send" aria-label="Send" style="width:32px;height:32px;border-radius:50%;background:' + GREEN + ';color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>' +
        '<div style="margin-top:8px;text-align:center;font-size:10px;color:#94a3b8">Powered by <strong style="color:' + GREEN + '">Echo Systems Network Ltd</strong></div></div>';

    msgsEl = panel.querySelector(".ramat-msgs");
    input = panel.querySelector(".ramat-input");
    sendBtn = panel.querySelector(".ramat-send");

    addMsg("assistant", greeting || "Hi there! 👋 I'm Ramat, the Echo Systems assistant. What's your name?");

    function addMsg(role, content) {
      var el = document.createElement("div");
      el.style.cssText = "display:flex;" + (role === "user" ? "justify-content:flex-end" : "justify-content:flex-start");
      var bubble = document.createElement("div");
      bubble.style.cssText = "max-width:80%;white-space:pre-wrap;border-radius:16px;padding:10px 14px;font-size:14px;line-height:1.5;box-shadow:0 2px 8px rgba(0,0,0,.08);font-family:inherit;" + (role === "user" ? "border-bottom-right-radius:4px;background:" + GREEN + ";color:#fff" : "border-bottom-left-radius:4px;background:#fff;color:#1e293b");
      bubble.textContent = content;
      el.appendChild(bubble);
      msgsEl.appendChild(el);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return bubble;
    }

    launcher.addEventListener("click", function () { setOpen(!open); });

    async function send() {
      var text = input.value.trim();
      if (!text) return;
      // Capture name from first message if not set
      if (!visitor.name && text.length < 50) {
        var lower = text.toLowerCase();
        if (lower.indexOf("my name is") !== -1 || lower.indexOf("i am") !== -1 || lower.indexOf("i'm") !== -1 || lower.split(" ").length <= 4) {
          visitor.name = text.replace(/my name is|i am|i'm/gi, "").trim();
        }
      }
      addMsg("user", text);
      input.value = "";
      input.disabled = true;
      try {
        var res = await fetch(apiBase + "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: conversationId || undefined, publicId: publicId, message: text, visitor: visitor, escalate: /ticket|human|manager|executive|speak to|someone in charge/i.test(text) }),
        });
        if (!res.ok || !res.body) throw new Error("bad");
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
                if (json.type === "meta" && json.conversationId) conversationId = json.conversationId;
                else if (json.type === "token") { if (!aiBubble) aiBubble = addMsg("assistant", ""); aiBubble.textContent += json.content; }
                else if (json.type === "error") { if (!aiBubble) aiBubble = addMsg("assistant", ""); aiBubble.textContent = "I'll open a ticket for a senior executive."; }
              } catch (e) {}
            }
          }
        }
      } catch (e) { addMsg("assistant", "I'm having trouble connecting. Please try again shortly."); }
      finally { input.disabled = false; try { input.focus(); } catch (e) {} }
    }

    sendBtn.addEventListener("click", send);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
