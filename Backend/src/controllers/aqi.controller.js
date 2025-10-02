const { supabase } = require("../config/supabase");

const handleAddCity = async (req, res) => {
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
    const pm25 = await getPollutant(lat, lon, "pm2_5");
    const pm10 = await getPollutant(lat, lon, "pm10");
    const no2 = await getPollutant(lat, lon, "no2");
    const o3 = await getPollutant(lat, lon, "o3");
    const co = await getPollutant(lat, lon, "co");
    const so2 = await getPollutant(lat, lon, "so2");

    const pollutants = { pm25, pm10, no2, o3, co, so2 };
    console.log(pollutants);
    const aqi = calculateOverallAQI(pollutants);
    console.log(aqi);
    const trends = {};
    for (const param of Object.keys(pollutants)) {
      trends[param] = await get24HourTrend(lat, lon, param);
    }

    const { error } = await supabase.from("air_quality").insert([
      {
        id: Date.now(),
        city,
        lat,
        lon,
        pm25: pollutants.pm25 ?? null,
        aqi,
        temperature: weather.temperature ?? null,
        humidity: weather.humidity ?? null,
        wind_speed: weather.wind_speed ?? null,
        visibility: weather.visibility ?? null,
        uv_index: weather.uv_index ?? null,
        precipitation: weather.precipitation ?? null,
        created_at: new Date(),
      },
    ]);

    if (error) console.error("Supabase insert error:", error.message);
    res.json({
      message: "Data added successfully",
      city,
      aqi,
      pollutants,
      weather,
      trends,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const cityList = async (req, res) => {
  const { data, error } = await supabase
    .from("air_quality")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const cityDetails = async (req, res) => {
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
};

const cityTrends = async (req, res) => {
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
};

const deleteCity = async (req, res) => {
  const { name } = req.params;
  const { error } = await supabase
    .from("air_quality")
    .delete()
    .eq("city", name);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: `${name} deleted successfully` });
};

module.exports = {
  cityDetails,
  cityList,
  cityTrends,
  deleteCity,
  handleAddCity,
};
