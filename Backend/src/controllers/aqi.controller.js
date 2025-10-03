const { supabase } = require("../config/supabase");
const {
  calculateOverallAQI,
  get24HourTrend,
  getLatLon,
  getPollutant,
  getWeather,
} = require("../services/aqiService.service");

const handleAddCity = async (req, res) => {
  try {
    const { city } = req.body;
    console.log("Requested city:", city);

    // Check if the city already exists
    const { data: existing, error: fetchError } = await supabase
      .from("air_quality")
      .select("*")
      .eq("city", city)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking existing city:", fetchError.message);
      return res.status(500).json({ error: fetchError.message });
    }

    if (existing) {
      console.log(`City ${city} already exists, returning existing record`);
      return res.status(200).json(existing);
    }

    // Fetch lat/lon
    const { lat, lon } = await getLatLon(city);
    console.log(lat, lon);

    // Fetch weather
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

    // Calculate AQI
    const aqi = calculateOverallAQI(pollutants);
    console.log("AQI:", aqi);

    // Trends
    const trends = {};
    for (const param of Object.keys(pollutants)) {
      trends[param] = await get24HourTrend(lat, lon, param);
    }

    // Insert new record
    const { data, error } = await supabase
      .from("air_quality")
      .insert([
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
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      message: "Data added successfully",
      city,
      aqi,
      pollutants,
      weather,
      trends,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message || err });
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

const handleEnableCity = async (req, res) => {
  const { cityId } = req.body;

  try {
    // Disable all cities first
    await supabase.from("air_quality").update({ enabled: false });

    // Enable the selected city
    const { error } = await supabase
      .from("air_quality")
      .update({ enabled: true })
      .eq("id", cityId);

    if (error) throw error;

    res.json({ message: "City enabled successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getEnabledCity = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("air_quality")
      .select("*")
      .eq("enabled", true)
      .order("created_at", { ascending: false }) // latest first
      .limit(1)
      .single(); // <-- important

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching enabled city:", err);
    res.status(500).json({ error: err.message });
  }
};

const getStations = async (req, res) => {
  try {
    const { limit = 10000 } = req.query;

    const response = await axios.get("https://api.openaq.org/v3/locations", {
      params: { limit },
      headers: {
        "X-API-Key": process.env.OPENAQ_API_KEY,
      },
    });

    const stations = response.data.results
      .filter((loc) => loc.coordinates?.latitude && loc.coordinates?.longitude)
      .map((loc) => ({
        id: loc.id.toString(),
        name: loc.name,
        latitude: loc.coordinates.latitude,
        longitude: loc.coordinates.longitude,
        pm25: loc.parameters.find((p) => p.parameter === "pm25")?.lastValue
          ?.value,
        aqi: loc.parameters[0]?.lastValue?.value ?? null,
        status: "moderate",
      }));

    res.json(stations);
  } catch (err) {
    console.error("Error fetching OpenAQ:", err);
    res.status(500).json({ error: "Failed to fetch stations" });
  }
};

module.exports = {
  cityDetails,
  cityList,
  cityTrends,
  deleteCity,
  handleAddCity,
  handleEnableCity,
  getEnabledCity,
  getStations,
};
