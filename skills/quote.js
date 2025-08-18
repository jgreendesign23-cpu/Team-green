// skills/quote.js
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];
  window.TG_SKILLS.push({
    name: "quote",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return t.includes("rate") || t.includes("quote") || t.includes("pricing");
    },
    handle() {
      return "Tell me origin, destination, and weight/class (or equipment). I’ll give a quick estimate.";
    }
  });
})();
