<!-- skills/quote.js -->
<script>
(function () {
  // ensure registry exists
  window.TG_SKILLS = window.TG_SKILLS || [];

  /* ---------------------------- helpers ---------------------------- */

  // detect equipment from text
  function detectEquipment(t) {
    const x = (t || "").toLowerCase();
    if (/\b(reefer|refrigerated|temp|temperature)\b/.test(x)) return "reefer";
    if (/\b(flatbed|step ?deck)\b/.test(x)) return "flatbed";
    return "van";
  }

  // parse weight -> tons (0–25 clamp)
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

  // parse "from X to Y" or "X to Y"
  function parseLane(text) {
    let m = text.match(/\bfrom\s+(.+?)\s+to\s+(.+?)\s*$/i);
    if (m) return { origin: m[1].trim(), destination: m[2].trim() };
    const idx = text.toLowerCase().lastIndexOf(" to ");
    if (idx > 2) {
      const a = text.slice(0, idx).trim();
      const b = text.slice(idx + 4).trim();
      if (a && b && a.includes(" ")) return { origin: a, destination: b };
    }
    return null;
  }

  // geocode with free OpenStreetMap (Nominatim)
  async function geocode(place) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(place)}`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("geocode http " + res.status);
    const j = await res.json();
    if (!j || !j.length) throw new Error("no geocode results");
    const pt = j[0];
    return {
      lon: parseFloat(pt.lon),
      lat: parseFloat(pt.lat),
      label: pt.display_name || place
    };
  }

  // route miles with free OSRM
  async function routeMiles(a, b) {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false&alternatives=false&steps=false`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("route http " + res.status);
    const j = await res.json();
    const m = j && j.routes && j.routes[0] && j.routes[0].distance;
    if (!m) throw new Error("no route");
    return Math.max(1, Math.round(m / 1609.344)); // meters -> whole miles
  }

  function usd(n){ return "$" + Math.round(n).toLocaleString(); }

  function priceQuote(miles, tons, equipment) {
    // use config if present; else sensible defaults
    const P = (window.TG_CONFIG && window.TG_CONFIG.PRICING) || {
      basePerMile: { van: 2.00, reefer: 2.40, flatbed: 2.30 },
      fuelSurchargePerMile: 0.35,
      perTonAdder: 50,
      minimum: 300
    };
    const base = P.basePerMile[equipment] ?? P.basePerMile.van;
    const fsc  = P.fuelSurchargePerMile || 0;
    const perT = P.perTonAdder || 0;

    const linehaul = miles * base;
    const fuel     = miles * fsc;
    const weight   = Math.max(0, tons) * perT;
    const total    = Math.max(P.minimum || 0, linehaul + fuel + weight);

    return {
      total, linehaul, fuel, weight, base, fsc, perT,
      text(lines){
        return [
          lines?.lane || "",
          `• Distance: <b>${miles.toLocaleString()}</b> mi`,
          `• Linehaul @ ${usd(base)}/mi: <b>${usd(linehaul)}</b>`,
          `• Fuel @ ${usd(fsc)}/mi: <b>${usd(fuel)}</b>`,
          `• Weight @ ${usd(perT)}/t × ${tons.toFixed(1)}t: <b>${usd(weight)}</b>`,
          `<b>Total:</b> ${usd(total)}`,
          "",
          `<i>Quick estimate. Final rate may vary with dates, accessorials, and market.</i>`
        ].filter(Boolean).join("<br>");
      }
    };
  }

  /* ----------------------------- skill ----------------------------- */

  window.TG_SKILLS.push({
    name: "quote",
    canHandle(input) {
      const t = (input || "").toLowerCase();
      return /\b(rate|quote|price|lane|miles?)\b/.test(t) || /\bfrom\b.+\bto\b/.test(t) || t.includes(" to ");
    },
    async handle(input) {
      const t = (input || "").trim();
      const lane = parseLane(t);
      const tons = parseWeight(t);
      const equip = detectEquipment(t);

      if (!lane) {
        return [
          "Tell me origin and destination like:",
          "• <b>From Grand Rapids, MI to New York, NY</b>",
          "Optionally add weight/equipment:",
          "• <b>42,000 lbs reefer from Dallas to Miami</b>"
        ].join("<br>");
      }

      try {
        const a = await geocode(lane.origin);
        const b = await geocode(lane.destination);
        const miles = await routeMiles(a, b);
        const q = priceQuote(miles, tons, equip);
        const laneLine = `📍 <b>Lane:</b> ${a.label.split(",").slice(0,3).join(", ")} → ${b.label.split(",").slice(0,3).join(", ")}`;
        return q.text({ lane: laneLine });
      } catch (err) {
        console.warn("quote error:", err);
        return "❌ I couldn’t calculate that lane yet. Please include city + state (e.g., <b>Grand Rapids, MI → Newark, NJ</b>).";
      }
    }
  });
})();
</script>
