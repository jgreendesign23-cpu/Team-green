// skills/dispatch.js
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];
  window.TG_SKILLS.push({
    name: "dispatch",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return t.includes("dispatch") || t.includes("pickup") || t.includes("book");
    },
    handle() {
      return "Great—what’s the pickup city/zip, delivery city/zip, ready time, and commodity?";
    }
  });
})();
