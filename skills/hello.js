// skills/hello.js

module.exports = {
  canHandle(input) {
    return input.toLowerCase().includes("hello");
  },

  handle(input) {
    return "👋 Hi there! Team Green Bot reporting for duty.";
  }
};
