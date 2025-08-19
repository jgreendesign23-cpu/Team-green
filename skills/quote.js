// skills/quote.js  (OpenRouteService-powered)
(function () {
  window.TG_SKILLS = window.TG_SKILLS || [];

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
  function usd(n){ return `$${Math.round(n).toLocaleString()}`; }

  async function geocode(place, key){
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${encodeURIComponent(key)}&text=${encodeURIComponent(place)}`;
    const resp = await fetch(url);
    if(!resp.ok) throw new Error(`Geocode failed: ${resp.status}`);
    const data = await resp.json();
    const feature = data?.features?.[0];
    if(!feature) throw new Error("No geocode match");
    return feature.geometry.coordinates; // [lng, lat]
  }
  async function getMiles(coordsA, coordsB, key){
    const resp = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: { "Authorization": key, "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: [coordsA, coordsB] })
    });
    if(!resp.ok){
      const txt = await resp.text().catch(()=> "");
      throw new Error(`Route failed: ${resp.status} ${txt}`);
    }
    const data = await resp.json();
    const meters = data?.routes?.[0]?.summary?.distance;
    if(!meters && meters !== 0) throw new Error("No distance returned");
    return Math.max(1, Math.round(meters / 1609.344));
  }

  function makeQuote(miles, tons, equipment){
    const P = (window.TG_CONFIG && window.TG_CONFIG.PRICING) || {
      basePerMile: { van: 2.50, reefer: 2.65, flatbed: 2.55 },
      fuelSurchargePerMile: 0.35,
      perTonAdder: 50,
      minimum: 250
    };
    const base = (P.basePerMile[equipment] || P.basePerMile.van);
    const fuel = P.fuelSurchargePerMile || 0;
    const perTon = P.perTonAdder || 0;

    const linehaul = miles * base;
    const fuelCost = miles * fuel;
    const weightAdj = Math.max(0, tons) * perTon;
    const total = Math.max(P.minimum || 0, linehaul + fuelCost + weightAdj);

    return {
      summary: [
        `<b>Estimated Quote</b> (${equipment}) — <b>${usd(total)}</b>`,
        `• Distance: ~<b>${miles.toLocaleString()}</b> mi`,
        `• Linehaul @ ${usd(base)}/mi: ${usd(linehaul)}`,
        `• Fuel @ ${usd(fuel)}/mi: ${usd(fuelCost)}`,
        `• Weight adj @ ${usd(perTon)}/ton × ${tons.toFixed(1)}t: ${usd(weightAdj)}`,
        `<i>Quick estimate; final can vary with dates & accessorials.</i>`
      ].join("<br>")
    };
  }

  // ---------- the skill ----------
  window.TG_SKILLS.push({
    name: "quote",
    canHandle(input){
      const t = (input || "").toLowerCase();
      return /\b(rate|quote|price|lane|miles?)\b/.test(t) || /\bfrom\b.+\bto\b/.test(t) || t.includes(" to ");
    },
    async handle(input){
      const key = window.TG_CONFIG && window.TG_CONFIG.ORS_KEY;
      if(!key) return "To quote, I need an OpenRouteService key in <b>skills/config.js</b> as <code>TG_CONFIG.ORS_KEY</code>.";

      const lane = parseLane(input);
      const tons = parseWeight(input);
      const equip = detectEquipment(input);

      if(!lane){
        return [
          "Tell me origin and destination like:",
          "• <b>From Grand Rapids, MI to Newark, NJ</b>",
          "Add weight/equipment if you want:",
          "• <b>42,000 lbs reefer from Dallas to Miami</b>"
        ].join("<br>");
      }

      try{
        const [oLng,oLat] = await geocode(lane.origin, key);
        const [dLng,dLat] = await geocode(lane.destination, key);
        const miles = await getMiles([oLng,oLat],[dLng,dLat], key);
        const q = makeQuote(miles, tons, equip);

        return [
          `<b>Lane:</b> ${lane.origin} → ${lane.destination}`,
          `<b>Equipment:</b> ${equip}`,
          tons ? `<b>Weight:</b> ~${tons.toFixed(1)}t` : `<b>Weight:</b> not specified`,
          "",
          q.summary
        ].join("<br>");
      }catch(err){
        console.warn("quote error:", err);
        return "I couldn’t calculate miles. Try including state abbreviations (e.g., MI → NJ).";
      }
    }
  });
})();
