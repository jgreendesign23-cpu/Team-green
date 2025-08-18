/* script.js – Team Green Bot (browser build)
   - Injects UI
   - Wires to window.TG_SKILLS (loaded from /skills/*.js)
   - Routes messages to the first skill that canHandle(input)
*/

(function () {
  // ========= Config (safe to tweak) =========
  const BOT_NAME = "Team Green Bot";
  const BOT_TAGLINE = "Smart Dispatch • Live Logistics";
  const STORAGE_KEY = "tg_chat_history_v1";
  const MAX_HISTORY = 50;

  // ========= Skills bootstrap =========
  // skills/*.js will do: window.TG_SKILLS = window.TG_SKILLS || []; window.TG_SKILLS.push({...})
  const skills = (window.TG_SKILLS = window.TG_SKILLS || []);

  // ========= UI Injection =========
  const style = document.createElement("style");
  style.textContent = `
    .tg-fab {
      position: fixed; right: 18px; bottom: 18px; z-index: 9999;
      width: 64px; height: 64px; border-radius: 50%;
      display: grid; place-items: center; box-shadow: 0 12px 24px rgba(0,0,0,.18);
      background: white; border: 0; cursor: pointer;
    }
    .tg-fab:active { transform: translateY(1px); }

    .tg-panel {
      position: fixed; right: 16px; bottom: 96px; z-index: 9998;
      width: min(420px, calc(100vw - 32px)); height: 60vh; max-height: 640px;
      background: #fff; border-radius: 18px; box-shadow: 0 24px 48px rgba(0,0,0,.18);
      display: none; overflow: hidden;
    }
    .tg-panel.open { display: grid; grid-template-rows: auto 1fr auto; }

    .tg-header {
      padding: 14px 16px; color: #fff;
      background: linear-gradient(90deg, #1677ff, #00b894, #00a67d);
      display: flex; align-items: center; gap: 12px;
    }
    .tg-header h4 { margin: 0; font-size: 16px; line-height: 1.2; }
    .tg-header small { display:block; opacity:.9; font-weight:500 }

    .tg-close {
      margin-left: auto; background: rgba(255,255,255,.2); border: none;
      color: #fff; padding: 6px 10px; border-radius: 8px; font-weight: 600; cursor: pointer;
    }

    .tg-chat {
      padding: 12px; overflow-y: auto; background: #f7f9fb;
    }
    .tg-msg { max-width: 85%; padding: 12px 14px; border-radius: 14px; margin: 8px 0;
              box-shadow: 0 6px 16px rgba(0,0,0,.06); white-space: pre-wrap; }
    .tg-bot { background: #eaf6ef; border: 1px solid #d7eee1; }
    .tg-user { background: #fff; margin-left: auto; border: 1px solid #e8eaec; }

    .tg-input {
      display: grid; grid-template-columns: 1fr auto; gap: 8px;
      padding: 12px; border-top: 1px solid #eceff3; background: #fff;
    }
    .tg-field {
      width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid #dfe5ec;
      outline: none; font-size: 15px;
    }
    .tg-send {
      padding: 12px 16px; border-radius: 12px; border: 0; cursor: pointer;
      background: #1677ff; color: #fff; font-weight: 700;
    }
  `;
  document.head.appendChild(style);

  const fab = document.createElement("button");
  fab.className = "tg-fab";
  fab.setAttribute("aria-label", "Open chat");
  fab.innerHTML = "💬";

  const panel = document.createElement("section");
  panel.className = "tg-panel";
  panel.innerHTML = `
    <header class="tg-header">
      <div>
        <h4>${BOT_NAME}</h4>
        <small>${BOT_TAGLINE}</small>
      </div>
      <button class="tg-close" type="button">Close</button>
    </header>

    <div class="tg-chat" id="tg-chat"></div>

    <div class="tg-input">
      <input id="tg-input" class="tg-field" type="text" placeholder="Type a message and press Enter…" />
      <button id="tg-send" class="tg-send" type="button">Send</button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  // ========= DOM refs =========
  const chatEl = panel.querySelector("#tg-chat");
  const inputEl = panel.querySelector("#tg-input");
  const sendBtn = panel.querySelector("#tg-send");
  const closeBtn = panel.querySelector(".tg-close");

  // ========= History helpers =========
  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }
  function saveHistory(items) {
    try {
      const trimmed = items.slice(-MAX_HISTORY);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (_) {}
  }

  function appendMessage(text, who) {
    const msg = document.createElement("div");
    msg.className = `tg-msg ${who === "user" ? "tg-user" : "tg-bot"}`;
    msg.textContent = text;
    chatEl.appendChild(msg);
    chatEl.scrollTop = chatEl.scrollHeight;
    // persist
    const hist = loadHistory();
    hist.push({ who, text });
    saveHistory(hist);
  }

  function renderHistory() {
    chatEl.innerHTML = "";
    const hist = loadHistory();
    hist.forEach((m) => appendMessage(m.text, m.who));
    // Ensure we don’t double save while rendering
    saveHistory(hist);
  }

  // ========= Router (skills) =========
  function routeToSkill(input) {
    const t = (input || "").toLowerCase();
    for (const sk of skills) {
      try {
        if (sk && typeof sk.canHandle === "function" && sk.canHandle(t)) {
          const out =
            typeof sk.handle === "function" ? sk.handle(t) : null;
          if (typeof out === "string") return out;
          if (out && typeof out.text === "string") return out.text;
          return "Okay.";
        }
      } catch (err) {
        console.error("Skill error:", sk?.name || "unknown", err);
        return "Hmm, I hit an error in that skill.";
      }
    }
    return "🧭 I’m not sure yet. Try: **help**, **rate**, **tracking**, or **dispatch**.";
  }

  // ========= Send flow =========
  function handleSend() {
    const val = (inputEl.value || "").trim();
    if (!val) return;
    inputEl.value = "";
    appendMessage(val, "user");

    // Simple thinking delay for UX
    setTimeout(() => {
      const reply = routeToSkill(val);
      appendMessage(reply, "bot");
    }, 120);
  }

  // ========= Open/close =========
  function openPanel() {
    panel.classList.add("open");
    renderHistory();
    if (loadHistory().length === 0) {
      // First-run greeting
      appendMessage("Hey there! I’m your logistics helper. Ask about loads, lanes, rates, or tracking. 🚚", "bot");
      appendMessage("Online and ready to help with dispatching, quotes, and tracking.", "bot");
    }
    inputEl.focus();
  }
  function closePanel() {
    panel.classList.remove("open");
  }

  // ========= Events =========
  fab.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  sendBtn.addEventListener("click", handleSend);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });

  // Optional: open with hash (#chat)
  if (location.hash === "#chat") openPanel();
})();
