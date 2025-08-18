// skills/dispatch.js
module.exports = {
  canHandle(input) {
    const t = input.toLowerCase();
    return (
      t.includes("dispatch") ||
      t.includes("pickup") ||
      t.includes("book a load") ||
      t.includes("schedule a pickup") ||
      t.includes("need a truck") ||
      t.includes("quote and pickup")
    );
  },

  handle(input) {
    // Simple slot prompts (we’ll wire a real form/API later)
    // Ask for what we most often need to start a dispatch ticket
    return [
      "Great — let’s get a pickup started. I’ll need:",
      "• **Origin city/state & pickup date**",
      "• **Destination city/state**",
      "• **Commodity & weight**",
      "• **Equipment** (van, reefer, flatbed, step, etc.)",
      "",
      "Reply in one line if you can. Example:",
      "`Pickup Chicago, IL 3/28 → Dallas, TX | 22 pallets paper | 40,000 lb | 53' dry van`"
    ].join("\n");
  }
};
