// Team-green / skills / config.js
// One place for all knobs your bot/site should use.

window.TG_CONFIG = {
  BRAND: {
    name: "HaulNationAI",
    email: "rates@haulnation.ai",
    phone: "(555) 555-5555"
  },

  // Pricing used by BOTH the chat quote skill and the on-page calculator.
  PRICING: {
    basePerMile: {
      van: 2.00,
      reefer: 2.40,
      flatbed: 2.30
    },
    fuelSurchargePerMile: 0.35, // $/mile
    perTonAdder: 50,            // $ per ton (based on user-entered tons)
    minimum: 300                // minimum total
  }
};
