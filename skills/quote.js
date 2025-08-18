// skills/quote.js
module.exports = {
  canHandle(input) {
    return input.toLowerCase().includes("quote");
  },

  handle(input) {
    return `
🚛 HaulNationAI - Quote Request
Please provide the following details:
- Pickup location
- Drop-off location
- Cargo type
- Weight / size
- Date needed

Our dispatcher will review and send you an estimate!
    `;
  }
};
