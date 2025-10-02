const dotenv = require("dotenv");
const axios = require("axios");
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

const getSensorId = async (lat, lon, parameter) => {
  const res = await axios.get(
    `https://api.openaq.org/v3/locations?coordinates=${lat},${lon}&radius=12000&limit=1000`,
    {
      headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
    }
  );
  if (!res.data.results.length) return null;
  const station = res.data.results[0];
  const sensor = station.sensors.find((s) => s.parameter.name === parameter);
  return sensor ? sensor.id : null;
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
    const value = result.components[parameter];
    return value ? value : 0;
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
  const sensorId = await getSensorId(lat, lon, parameter);
  if (!sensorId) return []; // No sensor found

  const res = await axios.get(
    `https://api.openaq.org/v3/sensors/${sensorId}/days`,
    {
      headers: { "X-API-Key": process.env.OPENAQ_API_KEY },
    }
  );

  if (!res.data.results || !res.data.results.length) return [];

  return res.data.results
    .filter((r) => r.date?.from && r.value !== undefined)
    .map((r) => ({
      date: r.date?.from,
      value: r.value,
    }));
};

module.exports = {
  calculateOverallAQI,
  calculatePollutantAQI,
  get24HourTrend,
  getLatLon,
  getPollutant,
  getSensorId,
  getWeather,
};
