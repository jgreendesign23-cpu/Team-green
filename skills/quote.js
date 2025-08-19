<!-- skills/quote.js -->
<script>
/* skills/quote.js (OSRM + Nominatim edition – no API keys needed) */
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];

  // ---------- APIs (no key required) ----------
  const NOMINATIM = "https://nominatim.openstreetmap.org/search";
  const OSRM = "https://router.project-osrm.org/route/v1/driving";

  // ---------- helpers ----------
  function detectEquipment(t) {
    const x = (t || "").toLowerCase();
    if (/\b(reefer|refrigerated|temp|temperature)\b/.test(x)) return "reefer";
    if (/\b(flatbed|step ?deck)\b/.test(x)) return "flatbed";
    return "van";
  }

  function parseWeight(text) {
    const t = (text || "").toLowerCase();
    let tons = 0;

    const m1 = t.match(/(\d+(?:\.\d+)?)\s*(?:tons?|t)\b/);       // "2 tons" / "2t"
    const m2 = t.match(/(\d{3,6})\s*(?:lb|lbs|pounds?)\b/);      // "42000 lbs"
    const m3 = t.match(/(\d{2,3})\s*(?:k|000)\s*(?:lb|lbs)?\b/); // "42k lb"

    if (m1) tons = parseFloat(m1[1]);
    else if (m2) tons = parseFloat(m2[1]) / 2000;
    else if (m3) tons = (m3[0].includes("k") ? parseFloat(m3[1]) * 1000 : parseFloat(m3[1])) / 2000;

    if (!isFinite(tons) || tons < 0) tons = 0;
    if (tons > 25) tons = 25; // clamp to truck reality
    return tons;
  }

  function parseLane(text) {
    // “from X to Y”
    let m = text.match(/\bfrom\s+(.+?)\s+to\s+(.+)\b/i);
    if (m && m[1] && m[2]) return { origin: m[1].trim(), destination: m[2].trim() };

    // fallback “X to Y”
    const idx = text.toLowerCase().lastIndexOf(" to ");
    if (idx > 2) {
      const a = text.slice(0, idx).trim();
      const b = text.slice(idx + 4).trim();
      if (a && b && a.indexOf(" ") > -1) return { origin: a, destination: b };
    }
    return null;
  }

  function usd(n) { return `$${Math.round(n).toLocaleString()}`; }

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
        `<b>Estimated Quote</b> (${equipment}): ${usd(total)}`,
        "",
        `• Distance: ~<b>${miles.toLocaleString()}</b> miles`,
        `• Linehaul @ ${usd(base)}/mi: ${usd(linehaul)}`,
        `• Fuel @ ${usd(fsc)}/mi: ${usd(fuel)}`,
        `• Weight adj @ ${usd(perTon)}/ton × ${tons.toFixed(1)}t: ${usd(weight)}`,
        "",
        `<i>Quick estimate. Final rate may vary with dates, accessorials, and market.</i>`
      ].join("<br>")
    };
  }

  // ---------- geocode & routing (free OSM) ----------
  async function geocode(place) {
    const url = `${NOMINATIM}?format=json&q=${encodeURIComponent(place)}&limit=1`;
    const resp = await fetch(url, { headers: { /* referer header is auto from your site */ } });
    if (!resp.ok) throw new Error("geocode failed");
    const data = await resp.json();
    if (!data || !data[0]) throw new Error("no geocode result");
    const { lat, lon, display_name } = data[0];
    return { lat: parseFloat(lat), lon: parseFloat(lon), name: display_name };
  }

  async function osrmMiles(start, end) {
    const url = `${OSRM}/${start.lon},${start.lat};${end.lon},${end.lat}?overview=false&alternatives=false&steps=false`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("route failed");
    const data = await resp.json();
    if (!data || !data.routes || !data.routes[0]) throw new Error("no route");
    const meters = data.routes[0].distance || 0;
    return Math.max(1, Math.round(meters / 1609.344)); // whole miles
  }

  // ---------- skill ----------
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
          "• <b>From Grand Rapids, MI to Newark, NJ</b>",
          "Optionally add weight/equipment:",
          "• <b>42,000 lbs reefer from Dallas to Miami</b>"
        ].join("<br>");
      }

      try {
        // geocode both ends
        const [start, end] = await Promise.all([ geocode(lane.origin), geocode(lane.destination) ]);
        // route miles
        const miles = await osrmMiles(start, end);
        // price
        const q = priceQuote(miles, tons, equip);

        return [
          `<b>Lane:</b> ${start.name} → ${end.name}`,
          tons ? `<b>Weight:</b> ~${tons.toFixed(1)} tons` : `<b>Weight:</b> not specified`,
          `<b>Equipment:</b> ${equip}`,
          "",
          q.summary
        ].join("<br>");
      } catch (err) {
        console.warn("Quote error:", err);
        return [
          "❌ I couldn’t calculate that route just now.",
          "Tips:",
          "• Include state abbreviations (e.g. “MI”, “NJ”).",
          "• Try city + state or ZIP.",
          "• Example: <b>From Grand Rapids, MI to Newark, NJ 42000 lbs</b>"
        ].join("<br>");
      }
    }
  });
})();
</script>
