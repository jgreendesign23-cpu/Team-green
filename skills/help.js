// skills/help.js

module.exports = {
  canHandle(input) {
    return input.toLowerCase().includes("help");
  },

  handle(input) {
    return `
📚 Team Green Bot Commands:
- "hello" → Greets you
- "help" → Shows this menu
(more coming soon: dispatch, family, jokes...)
    `;
  }
};
