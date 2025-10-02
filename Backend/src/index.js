// index.js
const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const { supabase } = require("./config/supabase");

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const getPM25 = async (lat, lon) => {
  const res = await axios.get(
    `https://api.openaq.org/v3/measurements?coordinates=${lat},${lon}&radius=20000&parameter=pm25&limit=1`,
    {
      headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
    }
  );
  return res.data.results.length ? res.data.results[0].value : null;
};

const calculateAQI = (pm25) => {
  // Simple AQI approximation for PM2.5
  if (pm25 <= 12) return 50;
  if (pm25 <= 35.4) return 100;
  if (pm25 <= 55.4) return 150;
  if (pm25 <= 150.4) return 200;
  if (pm25 <= 250.4) return 300;
  return 500;
};

const getPollutant = async (lat, lon, parameter) => {
  const res = await axios.get(
    `https://api.openaq.org/v3/measurements?coordinates=${lat},${lon}&radius=20000&parameter=${parameter}&limit=1`,
    {
      headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
    }
  );
  return res.data.results.length ? res.data.results[0].value : null;
};

function calculateOverallAQI(pollutants) {
  console.log("calc");
  const aqis = Object.entries(pollutants)
    .map(([p, v]) => calculatePollutantAQI(v, p))
    .filter((a) => a !== null);

  // Return the max AQI if any values exist, otherwise null
  return aqis.length ? Math.max(...aqis) : null;
}

app.get("/", (req, res) => {
  return res.json("running");
});

app.post("/add-city", async (req, res) => {
  try {
    const { city } = req.body;
    console.log(city);
    console.log(req.body);

    const { lat, lon } = await getLatLon(city);
    console.log(lat, lon);

    const weather = await getWeather(lat, lon);
    weather.uv_index = weather.uv_index ?? 0;
    console.log(weather);

    // Fetch pollutants
    const pm25 = await getPollutant(lat, lon, "pm25");
    const pm10 = await getPollutant(lat, lon, "pm10"); // Replace with actual PM10 fetch
    const no2 = await getPollutant(lat, lon, "no2"); // Replace with NO2 fetch
    const o3 = await getPollutant(lat, lon, "o3"); // Replace with O3 fetch
    const co = await getPollutant(lat, lon, "co"); // Replace with CO fetch
    const so2 = await getPollutant(lat, lon, "so2"); // Replace with SO2 fetch

    const pollutants = { pm25, pm10, no2, o3, co, so2 };
    const aqi = calculateOverallAQI(pollutants);
    console.log(aqi);

    // Fetch 24-hour trends
    const trends = {};
    for (const param of Object.keys(pollutants)) {
      trends[param] = await get24HourTrend(lat, lon, param);
    }
    console.log("supabase");

    // Store in Supabase
    const { error } = await supabase.from("air_quality").insert([
      {
        city,
        lat,
        lon,
        ...pollutants,
        aqi,
        temperature: weather.temperature,
        humidity: weather.humidity,
        wind_speed: weather.wind_speed,
        visibility: weather.visibility,
        uv_index: weather.uv_index,
        precipitation: weather.precipitation,
        trends,
        created_at: new Date(),
      },
    ]);

    if (error) throw error;
    res.json({
      message: "Data added successfully",
      city,
      aqi,
      pollutants,
      weather,
      trends,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
  // Add similar breakpoints for PM10, CO, SO2, NO2, O3
};

function calculatePollutantAQI(value, pollutant) {
  const breakpoints = aqiBreakpoints[pollutant];
  if (!breakpoints) return null;
  const bp = breakpoints.find((b) => value >= b.cpLow && value <= b.cpHigh);
  if (!bp) return 500; // Above max limit
  const aqi =
    ((bp.aqiHigh - bp.aqiLow) / (bp.cpHigh - bp.cpLow)) * (value - bp.cpLow) +
    bp.aqiLow;
  return Math.round(aqi);
}

const get24HourTrend = async (lat, lon, parameter) => {
  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const to = now.toISOString();

  const res = await axios.get(
    `https://api.openaq.org/v3/measurements?coordinates=${lat},${lon}&radius=20000&parameter=${parameter}&date_from=${from}&date_to=${to}&limit=1000`,
    {
      headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
    }
  );

  return res.data.results.map((r) => ({ date: r.date.utc, value: r.value }));
};

app.get("/cities", async (req, res) => {
  const { data, error } = await supabase
    .from("air_quality")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/city/:name", async (req, res) => {
  const { name } = req.params;
  const { data, error } = await supabase
    .from("air_quality")
    .select("*")
    .eq("city", name)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(404).json({ error: "City not found" });

  res.json(data[0]);
});

app.get("/city/:name/trends", async (req, res) => {
  const { name } = req.params;
  const { data, error } = await supabase
    .from("air_quality")
    .select("trends, created_at")
    .eq("city", name)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(404).json({ error: "City not found" });

  res.json(data[0]);
});

app.get("/countries/:country", async (req, res) => {
  const { country } = req.params;
  const { data, error } = await supabase
    .from("air_quality")
    .select("*")
    .ilike("city", `%${country}%`) // crude country filter
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  if (!data.length)
    return res.status(404).json({ error: "No cities found for this country" });

  res.json(data);
});

app.delete("/city/:name", async (req, res) => {
  const { name } = req.params;
  const { error } = await supabase
    .from("air_quality")
    .delete()
    .eq("city", name);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: `${name} deleted successfully` });
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
