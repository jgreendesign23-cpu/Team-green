/* skills/config.js */
(function () {
  window.TG_CONFIG = Object.assign({}, window.TG_CONFIG || {}, {
    // 🔑 Add your Google Maps JavaScript API key (Directions API must be enabled)
    GMAPS_KEY: "PASTE_YOUR_GOOGLE_MAPS_KEY_HERE",

    // Optional: a Google Apps Script/Sheet endpoint for logging leads/quotes
    SHEET_URL: "",

    // Pricing knobs (you can tweak anytime)
    PRICING: {
      basePerMile: { van: 2.25, reefer: 2.65, flatbed: 2.55 },
      fuelSurchargePerMile: 0.35,
      perTonAdder: 50,       // +$ per ton
      minimum: 250           // minimum ticket
    }
  });
})();
