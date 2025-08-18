// skills/help.js
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];
  window.TG_SKILLS.push({
    name: "help",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return t.includes("help") || t.includes("menu") || t.includes("what can you do");
    },
    handle() {
      return [
        "Here’s what I can help with:",
        "• **Rate** – quick spot quote.",
        "• **Tracking** – status by PRO/BOL/PO.",
        "• **Dispatch** – book a pickup.",
        "",
        "Just say the keyword (rate, tracking, dispatch) to start."
      ].join("\n");
    }
  });
})();
