// skills/tracking.js
module.exports = {
  canHandle(input) {
    const t = input.toLowerCase();
    return (
      t.includes("track") ||
      t.includes("tracking") ||
      /#?\b(1z|cn|pro)[a-z0-9\-]{6,}\b/i.test(t) || // rough tracking/pro number pattern
      /\b(pro|bol|load|shipment)\s*(#|no\.?|number)?\s*[a-z0-9\-]{5,}\b/i.test(t)
    );
  },

  handle(input) {
    // Try to extract something that looks like a tracking / pro / BOL
    const idMatch =
      input.match(/(?:pro|bol|load|shipment|tracking)\s*(?:#|no\.?|number)?\s*([a-z0-9\-]{5,})/i) ||
      input.match(/(#?\b(?:1z|cn|pro)[a-z0-9\-]{6,}\b)/i);

    if (!idMatch) {
      return "No problem. Please send your **tracking / PRO / BOL number**, and I’ll check the latest status. Example: `PRO 4821937`";
    }

    const trackingId = idMatch[1] || idMatch[0];

    // Live integration comes later—return a clean, believable stub for now
    return [
      `Got it — tracking **${trackingId.toUpperCase()}**.`,
      "🔎 Current status: *In transit*",
      "📍 Last scan: *Kansas City, MO*",
      "⏱ ETA: *Tomorrow by 5pm local*",
      "",
      "Want updates by SMS or email? Say `notify me`."
    ].join("\n");
  }
};
