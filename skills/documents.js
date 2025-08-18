<!-- skills/documents.js -->
<script>
/* skills/documents.js */
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];
  window.TG_SKILLS.push({
    name: "documents",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return (
        t.includes("doc") ||
        t.includes("paper") ||
        t.includes("bol") ||
        t.includes("rate con") ||
        t.includes("ratecon") ||
        t.includes("insurance") ||
        t.includes("coi")
      );
    },
    handle() {
      return [
        "Here’s the docs checklist I can help with:",
        "",
        "• **Rate Confirmation** – signed copy (PDF).",
        "• **BOL** – shipper/consignee info, PO/BOL/REF numbers.",
        "• **COI** – Certificate of Insurance (current).",
        "• **Carrier Packet** – W-9 + Authority if needed.",
        "• **POD** – after delivery (clear photo/scan).",
        "",
        "If you upload or paste details here, I’ll format a neat summary you can forward."
      ].join("\n");
    }
  });
})();
</script>
