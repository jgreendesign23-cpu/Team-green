<!-- skills/contact.js -->
<script>
/* skills/contact.js */
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];
  window.TG_SKILLS.push({
    name: "contact",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return (
        t.includes("setup") ||
        t.includes("onboard") ||
        t.includes("open an account") ||
        t.includes("new customer") ||
        t.includes("new carrier") ||
        t.includes("contact") ||
        t.includes("call me") ||
        t.includes("email me")
      );
    },
    handle() {
      return [
        "Let’s get you set up. Reply with:",
        "",
        "• **Company / Name**:",
        "• **Role**:",
        "• **Phone**:",
        "• **Email**:",
        "• **Primary Lane(s)**:",
        "",
        "I’ll confirm I have everything and prep the next steps (packet + COI request if applicable)."
      ].join("\n");
    }
  });
})();
</script>
