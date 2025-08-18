// skills/help.js
module.exports = {
  canHandle(input) {
    const t = input.toLowerCase();
    return t.includes("help") || t.includes("what can you do") || t === "menu";
  },

  handle() {
    return [
      "Here’s what I can help with:",
      "• **Rate** – quick spot quote. Try: `rate Chicago to Dallas 40k dry van`",
      "• **Tracking** – status by PRO/BOL. Try: `tracking PRO 4821937`",
      "• **Dispatch** – book a pickup. Try: `schedule pickup`",
      "",
      "Just say the keyword (rate, tracking, dispatch) to begin."
    ].join("\n");
  }
};
