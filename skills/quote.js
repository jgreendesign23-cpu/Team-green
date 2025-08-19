// skills/quote.js  (OSRM + Nominatim, no API keys)
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];

  // -------- Helpers: parsing --------
  function detectEquipment(t) {
    const x = (t || "").toLowerCase();
    if (/\b(reefer|refrigerated|temp|temperature)\b/.test(x)) return "reefer";
    if (/\b(flatbed|step ?deck)\b/.test(x)) return "flatbed";
    return "van";
  }
  function parseWeight(text) {
    const t = (text || "").toLowerCase();
    let tons = 0;
    const m1 = t.match(/(\d+(?:\.\d+)?)\s*(?:tons?|t)\b/);
    const m2 = t.match(/(\d{3,6})\s*(?:lb|lbs|pounds?)\b/);
    const m3 = t.match(/(\d{2,3})\s*(?:k|000)\s*(?:lb|lbs)?\b/);
    if (m1) tons = parseFloat(m1[1]);
    else if (m2) tons = parseFloat(m2[1]) / 2000;
    else if (m3) tons = (m3[0].includes("k") ? parseFloat(m3[1]) * 1000 : parseFloat(m3[1])) / 2000;
    if (!isFinite(tons) || tons < 0) tons = 0;
    if (tons > 25) tons = 25;
    return tons;
  }
  function parseLane(text) {
    let m = text.match(/\bfrom\s+(.+?)\s+to\s+(.+)\b/i);
    if (m && m[1] && m[2]) return { origin: m[1].trim(), destination: m[2].trim() };
    const idx = text.toLowerCase().lastIndexOf(" to ");
    if (idx > 2) {
      const a = text.slice(0, idx).trim();
      const b = text.slice(idx + 4).trim();
      if (a && b && a.indexOf(" ") > -1) return { origin: a, destination: b };
    }
    return null;
  }

  // -------- No-key geocoding + routing --------
  const NOMINATIM = "https://nominatim.openstreetmap.org/search";
  const OSRM = "https://router.project-osrm.org/route/v1/driving";

  async function geocode(place) {
    const url = `${NOMINATIM}?format=jsonv2&q=${encodeURIComponent(place)}&limit=1&addressdetails=0`;
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) throw new Error("geocode");
    const j = await r.json();
    if (!j || !j[0]) throw new Error("no geocode");
    return {
      lat: parseFloat(j[0].lat),
      lon: parseFloat(j[0].lon),
      label: j[0].display_name
    };
  }

  async function routeMiles(a, b) {
    const url = `${OSRM}/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false&steps=false&alternatives=false`;
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) throw new Error("route");
    const j = await r.json();
    if (!j || !j.routes || !j.routes[0]) throw new Error("no route");
    const meters = j.routes[0].distance || 0;
    return Math.max(1, Math.round(meters / 1609.344));
  }

  // -------- Pricing --------
  function usd(n) { return `$${Math.round(n).toLocaleString()}`; }
  function priceQuote(miles, tons, equipment) {
    const P = {
      basePerMile: { van: 2.25, reefer: 2.65, flatbed: 2.55 },
      fuelSurchargePerMile: 0.35,
      perTonAdder: 50,
      minimum: 250
    };
    const base = (P.basePerMile[equipment] || P.basePerMile.van);
    const fsc = P.fuelSurchargePerMile;
    const linehaul = miles * base;
    const fuel = miles * fsc;
    const weight = Math.max(0, tons) * P.perTonAdder;
    const total = Math.max(P.minimum, linehaul + fuel + weight);
    return [
      `<b>Estimated Quote</b> (${equipment}): ${usd(total)}`,
      `• Distance: ~<b>${miles.toLocaleString()}</b> miles`,
      `• Linehaul @ ${usd(base)}/mi: ${usd(linehaul)}`,
      `• Fuel @ ${usd(fsc)}/mi: ${usd(fuel)}`,
      `• Weight adj @ ${usd(P.perTonAdder)}/ton × ${tons.toFixed(1)}t: ${usd(weight)}`,
      `<i>Quick estimate. Final rate may vary with dates, accessorials, and market conditions.</i>`
    ].join("<br>");
  }

  // -------- Skill --------
  window.TG_SKILLS.push({
    name: "quote-osrm",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return /\b(rate|quote|price|lane|miles?)\b/.test(t) || /\bfrom\b.+\bto\b/.test(t) || t.includes(" to ");
    },
    async handle(input) {
      const lane = parseLane(input || "");
      const tons = parseWeight(input || "");
      const equip = detectEquipment(input || "");

      if (!lane) {
        return [
          "Tell me origin and destination like:",
          "• <b>From Grand Rapids, MI to Newark, NJ</b>",
          "Optionally add weight/equipment:",
          "• <b>42,000 lbs reefer from Dallas to Miami</b>"
        ].join("<br>");
      }

      try {
        const [A, B] = await Promise.all([geocode(lane.origin), geocode(lane.destination)]);
        const miles = await routeMiles(A, B);
        const details = priceQuote(miles, tons, equip);
        return [
          `<b>Lane:</b> ${A.label} → ${B.label}`,
          tons ? `<b>Weight:</b> ~${tons.toFixed(1)} tons` : `<b>Weight:</b> not specified`,
          `<b>Equipment:</b> ${equip}`,
          "",
          details
        ].join("<br>");
      } catch (e) {
        console.warn("quote-osrm error:", e);
        return "❌ I couldn’t calculate miles. Try adding state abbreviations (e.g., MI → NJ) or ZIP codes.";
      }
    }
  });
})();
