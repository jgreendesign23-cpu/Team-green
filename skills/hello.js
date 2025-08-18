// skills/hello.js
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];
  window.TG_SKILLS.push({
    name: "hello",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return ["hi", "hello", "hey", "yo"].some(w => t.includes(w));
    },
    handle() {
      return "👋 Hi there! Team Green Bot here. Say *help* to see what I can do.";
    }
  });
})();
