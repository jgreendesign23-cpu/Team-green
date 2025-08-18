// skills/tracking.js
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];
  window.TG_SKILLS.push({
    name: "tracking",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return t.includes("track") || t.includes("status");
    },
    handle() {
      return "Share a PRO/BOL/PO and I’ll fetch the latest tracking status.";
    }
  });
})();
