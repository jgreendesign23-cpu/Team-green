/* skills/config.js */
(function () {
  window.TG_CONFIG = window.TG_CONFIG || {};
  window.TG_CONFIG.ORS_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY3YWMxMGE5Y2QzMzRhNmY5ZTZjYmI2ZDVjNDdjYjc5IiwiaCI6Im11cm11cjY0In0=";   // <-- paste your key, in quotes

  // optional pricing knobs
  window.TG_CONFIG.PRICING = {
    basePerMile: { van: 2.50, reefer: 2.65, flatbed: 2.55 },
    fuelSurchargePerMile: 0.35,
    perTonAdder: 50,
    minimum: 250
  };
})();
