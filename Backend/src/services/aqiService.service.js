const dotenv = require("dotenv");
const axios = require("axios");
const { supabase } = require("../config/supabase");
dotenv.config();

const getLatLon = async (city) => {
  const res = await axios.get(
    `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`
  );
  if (!res.data.length) throw new Error("City not found");
  return { lat: res.data[0].lat, lon: res.data[0].lon };
};

const getWeather = async (lat, lon) => {
  const res = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
  );
  return {
    temperature: res.data.main.temp,
    humidity: res.data.main.humidity,
    wind_speed: res.data.wind.speed,
    visibility: res.data.visibility,
    uv_index: res.data?.uvi || null,
    precipitation: res.data.rain?.["1h"] || 0,
  };
};

const getSensorId = async (lat, lon, parameter = "pm25") => {
  try {
    const res = await axios.get(
      `https://api.openaq.org/v3/locations?coordinates=${lat},${lon}&radius=25000&limit=1000`,
      {
        headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
      }
    );

    const { results } = res.data;
    if (!results?.length) {
      console.warn("⚠️ No nearby stations found.");
      return null;
    }

    // Loop through each station’s sensors
    for (const loc of results) {
      if (Array.isArray(loc.sensors)) {
        const match = loc.sensors.find(
          (s) => s.parameter?.name?.toLowerCase() === parameter.toLowerCase()
        );
        const value = parameter;
        if (match) {
          console.log(
            `✅ Found ${parameter} sensor for station ${loc.name}: ID ${match.id}`
          );
          return match.id;
        }
      }
    }

    console.warn(`❌ No matching sensor for parameter ${parameter}`);
    return null;
  } catch (err) {
    console.error("❌ Failed to fetch sensor ID:", err.message);
    return null;
  }
};

const getPollutant = async (lat, lon, parameter) => {
  const id = await getSensorId(lat, lon, parameter);
  console.log("id:", id);

  if (id != null) {
    const res = await axios.get(
      `https://api.openaq.org/v3/sensors/${id}/hours?parameter=${parameter}`,
      {
        headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
      }
    );

    return res.data.results.length ? res.data.results[0].value : null;
  } else {
    const { data } = await axios.get(
      `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    const result = data.list[0];
    const mapping = {
      pm25: "pm2_5",
      pm10: "pm10",
      no2: "no2",
      o3: "o3",
      so2: "so2",
      co: "co",
    };

    const owKey = mapping[parameter] || parameter;
    const value = result.components[owKey];
    return value !== undefined ? value : 0;
  }
};

function calculateOverallAQI(pollutants) {
  const aqis = Object.entries(pollutants)
    .map(([p, v]) => calculatePollutantAQI(v, p))
    .filter((a) => a !== null);
  return aqis.length ? Math.max(...aqis) : null;
}

const aqiBreakpoints = {
  pm25: [
    { cpLow: 0, cpHigh: 12, aqiLow: 0, aqiHigh: 50 },
    { cpLow: 12.1, cpHigh: 35.4, aqiLow: 51, aqiHigh: 100 },
    { cpLow: 35.5, cpHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
    { cpLow: 55.5, cpHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
    { cpLow: 150.5, cpHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
    { cpLow: 250.5, cpHigh: 350.4, aqiLow: 301, aqiHigh: 400 },
    { cpLow: 350.5, cpHigh: 500.4, aqiLow: 401, aqiHigh: 500 },
  ],
  pm10: [
    { cpLow: 0, cpHigh: 54, aqiLow: 0, aqiHigh: 50 },
    { cpLow: 55, cpHigh: 154, aqiLow: 51, aqiHigh: 100 },
    { cpLow: 155, cpHigh: 254, aqiLow: 101, aqiHigh: 150 },
    { cpLow: 255, cpHigh: 354, aqiLow: 151, aqiHigh: 200 },
    { cpLow: 355, cpHigh: 424, aqiLow: 201, aqiHigh: 300 },
    { cpLow: 425, cpHigh: 504, aqiLow: 301, aqiHigh: 400 },
    { cpLow: 505, cpHigh: 604, aqiLow: 401, aqiHigh: 500 },
  ],
  no2: [
    { cpLow: 0, cpHigh: 53, aqiLow: 0, aqiHigh: 50 },
    { cpLow: 54, cpHigh: 100, aqiLow: 51, aqiHigh: 100 },
    { cpLow: 101, cpHigh: 360, aqiLow: 101, aqiHigh: 150 },
    { cpLow: 361, cpHigh: 649, aqiLow: 151, aqiHigh: 200 },
    { cpLow: 650, cpHigh: 1249, aqiLow: 201, aqiHigh: 300 },
    { cpLow: 1250, cpHigh: 1649, aqiLow: 301, aqiHigh: 400 },
    { cpLow: 1650, cpHigh: 2049, aqiLow: 401, aqiHigh: 500 },
  ],
  o3: [
    { cpLow: 0, cpHigh: 54, aqiLow: 0, aqiHigh: 50 },
    { cpLow: 55, cpHigh: 70, aqiLow: 51, aqiHigh: 100 },
    { cpLow: 71, cpHigh: 85, aqiLow: 101, aqiHigh: 150 },
    { cpLow: 86, cpHigh: 105, aqiLow: 151, aqiHigh: 200 },
    { cpLow: 106, cpHigh: 200, aqiLow: 201, aqiHigh: 300 },
  ],
  so2: [
    { cpLow: 0, cpHigh: 35, aqiLow: 0, aqiHigh: 50 },
    { cpLow: 36, cpHigh: 75, aqiLow: 51, aqiHigh: 100 },
    { cpLow: 76, cpHigh: 185, aqiLow: 101, aqiHigh: 150 },
    { cpLow: 186, cpHigh: 304, aqiLow: 151, aqiHigh: 200 },
    { cpLow: 305, cpHigh: 604, aqiLow: 201, aqiHigh: 300 },
    { cpLow: 605, cpHigh: 804, aqiLow: 301, aqiHigh: 400 },
    { cpLow: 805, cpHigh: 1004, aqiLow: 401, aqiHigh: 500 },
  ],
  co: [
    { cpLow: 0, cpHigh: 4.4, aqiLow: 0, aqiHigh: 50 },
    { cpLow: 4.5, cpHigh: 9.4, aqiLow: 51, aqiHigh: 100 },
    { cpLow: 9.5, cpHigh: 12.4, aqiLow: 101, aqiHigh: 150 },
    { cpLow: 12.5, cpHigh: 15.4, aqiLow: 151, aqiHigh: 200 },
    { cpLow: 15.5, cpHigh: 30.4, aqiLow: 201, aqiHigh: 300 },
    { cpLow: 30.5, cpHigh: 40.4, aqiLow: 301, aqiHigh: 400 },
    { cpLow: 40.5, cpHigh: 50.4, aqiLow: 401, aqiHigh: 500 },
  ],
};

function calculatePollutantAQI(value, pollutant) {
  if (value == null || isNaN(value)) return null;

  const breakpoints = aqiBreakpoints[pollutant];
  if (!breakpoints) {
    console.warn(`⚠️ No AQI breakpoints for ${pollutant}`);
    return null;
  }

  // Find correct range
  const bp = breakpoints.find((b) => value >= b.cpLow && value <= b.cpHigh);

  if (!bp) {
    console.warn(`⚠️ Value ${value} out of range for ${pollutant}`);
    return value > breakpoints[breakpoints.length - 1].cpHigh ? 500 : 0;
  }

  const aqi =
    ((bp.aqiHigh - bp.aqiLow) / (bp.cpHigh - bp.cpLow)) * (value - bp.cpLow) +
    bp.aqiLow;

  return Math.round(aqi);
}

const get24HourTrend = async (lat, lon, parameter) => {
  try {
    const sensorId = await getSensorId(lat, lon, parameter);
    if (!sensorId) {
      console.warn(`⚠️ No sensor found near (${lat}, ${lon}) for ${parameter}`);
      return [];
    }

    const res = await axios.get(
      `https://api.openaq.org/v3/sensors/${sensorId}/hours?limit=24`,
      {
        headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
      }
    );

    const results = res.data?.results || [];
    if (!results.length) {
      console.warn(`⚠️ No hourly data available for sensor ${sensorId}`);
      return [];
    }

    // ✅ Map the correct fields
    const trend = results.map((r) => ({
      date: r.period?.datetimeFrom?.utc || null, // The actual timestamp
      value: r.value || null, // The pollutant value
      parameter: r.parameter?.name || parameter, // e.g., pm25
      units: r.parameter?.units || "",
    }));

    console.log(`✅ 24-hour trend (${parameter}) →`, trend.length, "records");
    return trend.filter((t) => t.date && t.value !== null);
  } catch (err) {
    console.error("❌ Failed to fetch 24-hour trend:", err.message);
    return [];
  }
};

const canonicalPollutant = (pollutants) => {
  const normalized = {};

  if (pollutants.pm25) normalized.pm25 = pollutants.pm25; // µg/m³
  if (pollutants.pm10) normalized.pm10 = pollutants.pm10;
  if (pollutants.no2) normalized.no2 = pollutants.no2;
  if (pollutants.o3) normalized.o3 = pollutants.o3;
  if (pollutants.so2) normalized.so2 = pollutants.so2;

  // ✅ Convert CO µg/m³ → ppm
  if (pollutants.co) {
    const ppm = (pollutants.co * 24.45) / (28.01 * 1000);
    normalized.co = ppm;
  }

  return normalized;
};

// 🔹 Fetch latest measurement for one station
const getStationMeasurements = async (locationId) => {
  try {
    const res = await axios.get("https://api.openaq.org/v3/measurements", {
      headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
      params: {
        location_id: locationId,
        limit: 1,
        order_by: "datetime",
        sort: "desc",
      },
    });

    if (!res.data?.results?.length) {
      return null; // No data for this station
    }

    const latest = res.data.results[0];
    return {
      pollutant: latest.parameter || null,
      value: latest.value || null,
      units: latest.unit || null,
    };
  } catch (err) {
    return null; // ignore failures, just mark as no data
  }
};

// 🔹 Fetch all stations and attach their latest measurement
const getAllStations = async () => {
  let allStations = [];
  let page = 1;
  let hasMore = true;

  console.log("🌍 Fetching OpenAQ global stations...");

  while (hasMore) {
    const res = await axios.get("https://api.openaq.org/v3/locations", {
      headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
      params: { limit: 1000, page },
    });

    const { results } = res.data;
    if (!results?.length) break;

    allStations = allStations.concat(results);
    console.log(
      `✅ Page ${page}: ${results.length} fetched (Total: ${allStations.length})`
    );

    page++;
    hasMore = results.length === 1000;
  }

  console.log(`🎉 Completed fetching ${allStations.length} stations.`);

  // 🔹 Fetch measurements, but keep null if none
  console.log("📡 Fetching station measurements...");

  const withMeasurements = await Promise.all(
    allStations.map(async (s) => {
      const measurements = await getStationMeasurements(s.id).catch(() => null);
      return { ...s, measurements }; // measurements will be null if no data
    })
  );

  console.log("✅ Completed fetching measurements for all stations.");
  return withMeasurements;
};

// 🔹 Store stations in Supabase with latest pollutant info
const storeStations = async (stations) => {
  console.log("💾 Inserting/Updating stations into Supabase...");

  const formatted = stations
    .filter((s) => s.coordinates)
    .map((s) => ({
      location_id: s.id.toString(),
      name: s.name || null,
      city: s.city || null,
      country: s.country || null,
      parameters: s.parameters || [],
      last_updated: s.lastUpdated || null,
      latitude: s.coordinates.latitude,
      longitude: s.coordinates.longitude,
      latest_pollutant: s.latestMeasurement?.pollutant || null,
      latest_value: s.latestMeasurement?.value || null,
      latest_units: s.latestMeasurement?.units || null,
    }));

  const { error } = await supabase.from("stations").upsert(formatted, {
    onConflict: "location_id",
  });

  if (error) throw error;
  console.log(
    `✅ Upserted ${formatted.length} stations with latest pollutant data.`
  );
};

// // 🔹 Run the process
// (async () => {
//   try {
//     const stations = await getAllStations();
//     await storeStations(stations);
//   } catch (err) {
//     console.error("❌ Failed to update stations:", err);
//   }
// })();

//===========================================after liv updates==========================================

// const getHourlyTrend = async (sensorId) => {
//   try {
//     const res = await axios.get(
//       `https://api.openaq.org/v3/sensors/${sensorId}/hours/hourofday`,
//       {
//         headers: {
//           "X-API-Key": process.env.OPENAQ_API_KEY,
//         },
//         params: {
//           parameter: "pm25",
//           limit: 24,
//           sort: "desc",
//         },
//       }
//     );

//     const { results } = res.data;
//     if (!results?.length) return [];

//     // Format for chart: [{ hour: '01:00', value: 12.3 }, ...]
//     const formatted = results
//       .map((r) => ({
//         hour: `${r.hour}:00`,
//         value: r.value,
//         parameter: r.parameter,
//       }))
//       .reverse(); // oldest to newest

//     return formatted;
//   } catch (err) {
//     console.error("❌ Failed to fetch hourly trend:", err.message);
//     return [];
//   }
// };

module.exports = {
  calculateOverallAQI,
  calculatePollutantAQI,
  get24HourTrend,
  getLatLon,
  getPollutant,
  getSensorId,
  getWeather,
  getAllStations,
  storeStations,
  canonicalPollutant,
};
