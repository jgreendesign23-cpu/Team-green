// skills/quote.js
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];

  // --- Load Google Maps JS API on demand ---
  let mapsPromise;
  function loadGoogleMaps() {
    if (window.google && window.google.maps) return Promise.resolve(window.google.maps);
    if (mapsPromise) return mapsPromise;

    const key = (window.TG_CONFIG && window.TG_CONFIG.GMAPS_KEY) || "";
    if (!key) {
      return Promise.reject(new Error("Missing Google Maps API key in TG_CONFIG.GMAPS_KEY"));
    }
    mapsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-tg="gmaps"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.google.maps));
        existing.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
      s.async = true;
      s.defer = true;
      s.dataset.tg = "gmaps";
      s.onload = () => resolve(window.google.maps);
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return mapsPromise;
  }

  // --- Helpers ---
  const EQUIP_ALIASES = [
    ["reefer","refrigerated","temp","temperature"],
    ["flatbed","step deck","stepdeck","step-deck"],
    ["van","dry van","box"]
  ];
  function detectEquipment(t) {
    const x = t.toLowerCase();
    if (/\b(reefer|refrigerated|temp|temperature)\b/.test(x)) return "reefer";
    if (/\b(flatbed|step ?deck)\b/.test(x)) return "flatbed";
    return "van";
  }
  function parseWeight(text) {
    const t = text.toLowerCase();
    let tons = 0;

    const m1 = t.match(/(\d+(?:\.\d+)?)\s*(?:tons?|t)\b/);       // "2 tons" / "2t"
    const m2 = t.match(/(\d{3,6})\s*(?:lb|lbs|pounds?)\b/);      // "42000 lbs"
    const m3 = t.match(/(\d{2,3})\s*(?:k|000)\s*(?:lb|lbs)?\b/); // "42k lb"

    if (m1) tons = parseFloat(m1[1]);
    else if (m2) tons = parseFloat(m2[1]) / 2000;
    else if (m3) tons = (m3[0].includes("k") ? parseFloat(m3[1]) * 1000 : parseFloat(m3[1])) / 2000;

    // Clamp to reasonable trucking weights
    if (!isFinite(tons) || tons < 0) tons = 0;
    if (tons > 25) tons = 25;
    return tons;
  }
  function parseLane(text) {
    // Prefer “from X to Y”
    let m = text.match(/\bfrom\s+(.+?)\s+to\s+(.+)\b/i);
    if (m && m[1] && m[2]) return { origin: m[1].trim(), destination: m[2].trim() };

    // fallback “X to Y” (avoid single word before ‘to’)
    const idx = text.toLowerCase().lastIndexOf(" to ");
    if (idx > 2) {
      const a = text.slice(0, idx).trim();
      const b = text.slice(idx + 4).trim();
      if (a && b && a.indexOf(" ") > -1) return { origin: a, destination: b };
    }
    return null;
  }

  async function getMiles(origin, destination) {
    const maps = await loadGoogleMaps();
    const svc = new maps.DirectionsService();
    const routeReq = { origin, destination, travelMode: "DRIVING" };
    const result = await new Promise((resolve, reject) => {
      svc.route(routeReq, (res, status) => {
        if (status === "OK" && res && res.routes && res.routes[0]) resolve(res);
        else reject(new Error(status || "No route"));
      });
    });
    const legs = (result.routes[0].legs || []);
    let meters = 0;
    for (const leg of legs) meters += (leg.distance && leg.distance.value) || 0;
    const miles = meters / 1609.344;
    return Math.max(1, Math.round(miles)); // round to whole miles
  }

  function formatUSD(n) { return `$${(Math.round(n)).toLocaleString()}`; }

  function priceQuote(miles, tons, equipment) {
    const P = (window.TG_CONFIG && window.TG_CONFIG.PRICING) || {
      basePerMile: { van: 2.25, reefer: 2.65, flatbed: 2.55 },
      fuelSurchargePerMile: 0.35,
      perTonAdder: 50,
      minimum: 250
    };
    const base = (P.basePerMile[equipment] || P.basePerMile.van);
    const fsc  = P.fuelSurchargePerMile || 0;
    const perTon = P.perTonAdder || 0;

    const linehaul = miles * base;
    const fuel     = miles * fsc;
    const weight   = Math.max(0, tons) * perTon;
    const total    = Math.max(P.minimum || 0, linehaul + fuel + weight);

    return {
      total, linehaul, fuel, weight, base, fsc, perTon,
      summary: [
        `<b>Estimated Quote</b> (${equipment}): ${formatUSD(total)}`,
        "",
        `• Distance: ~<b>${miles.toLocaleString()}</b> miles`,
        `• Linehaul @ ${formatUSD(base)}/mi: ${formatUSD(linehaul)}`,
        `• Fuel @ ${formatUSD(fsc)}/mi: ${formatUSD(fuel)}`,
        `• Weight adj @ ${formatUSD(perTon)}/ton × ${tons.toFixed(1)}t: ${formatUSD(weight)}`,
        "",
        `<i>This is a quick estimate. Final rate may vary with dates, accessorials, and market conditions.</i>`
      ].join("<br>")
    };
  }

  // --- The skill ---
  window.TG_SKILLS.push({
    name: "quote",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return /\b(rate|quote|price|lane|miles?)\b/.test(t) || /\bfrom\b.+\bto\b/.test(t) || t.includes(" to ");
    },
    async handle(input) {
      const t = input.trim();
      const lane = parseLane(t);
      const tons = parseWeight(t);
      const equip = detectEquipment(t);

      if (!lane) {
        return [
          "Tell me origin and destination like:",
          "• <b>From Grand Rapids, MI to Newark, NJ</b>",
          "Optionally add weight/equipment:",
          "• <b>42,000 lbs reefer from Dallas to Miami</b>"
        ].join("<br>");
      }

      try {
        const miles = await getMiles(lane.origin, lane.destination);
        const q = priceQuote(miles, tons, equip);
        return [
          `<b>Lane:</b> ${lane.origin} → ${lane.destination}`,
          tons ? `<b>Weight:</b> ~${tons.toFixed(1)} tons` : `<b>Weight:</b> not specified`,
          `<b>Equipment:</b> ${equip}`,
          "",
          q.summary
        ].join("<br>");
      } catch (err) {
        console.warn("Distance error:", err);
        return "I couldn’t calculate miles yet—please check the cities (try including state abbreviations).";
      }
    }
  });
})();
