<!-- skills/coverage.js -->
<script>
/* skills/coverage.js */
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];
  window.TG_SKILLS.push({
    name: "coverage",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return (
        t.includes("coverage") ||
        t.includes("lanes") ||
        t.includes("where do you run") ||
        t.includes("regions") ||
        t.includes("equipment") ||
        t.includes("dry van") ||
        t.includes("reefer") ||
        t.includes("flatbed") ||
        t.includes("step deck")
      );
    },
    handle() {
      return [
        "Coverage & Equipment:",
        "",
        "• **Regions** – Lower 48, with strength on **Midwest ↔ Southeast** and **TX ↔ Midwest**.",
        "• **Dry Van (53’)** – general freight, palletized, non-haz.",
        "• **Reefer (53’)** – temp-controlled, food & pharma compliant.",
        "• **Flatbed / Step Deck** – machinery, building products; tarps & straps available.",
        "",
        "Ask for a lane (e.g., “**ATL → CHI dry van**”) and I’ll start a quote."
      ].join("\n");
    }
  });
})();
</script>
