// updateStations.js
const dotenv = require("dotenv");
dotenv.config();
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function updateStations() {
  let page = 1;
  let allStations = [];
  let hasMore = true;

  while (hasMore) {
    const res = await axios.get("https://api.openaq.org/v3/locations", {
      params: { limit: 1000, page },
      headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
    });

    const { results } = res.data;
    if (!results || results.length === 0) break;

    allStations = allStations.concat(results);
    page++;
    hasMore = results.length === 1000;
  }

  for (const station of allStations) {
    await supabase
      .from("stations")
      .upsert({
        id: station.id,
        name: station.name,
        latitude: station.coordinates.latitude,
        longitude: station.coordinates.longitude,
        parameters: station.parameters,
      })
      .select();
  }

  console.log(`Updated ${allStations.length} stations.`);
}

module.exports = { updateStations };
