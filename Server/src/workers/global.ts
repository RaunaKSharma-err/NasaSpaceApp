// src/workers/ingestGlobal.ts
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const LOCATIONS = [
  { name: "Birgunj", lat: 27.017, lon: 84.88 },
  { name: "Delhi", lat: 28.7041, lon: 77.1025 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
];

function calculateAQI(pollutant: string, value: number): number {
  if (pollutant === "PM2.5") {
    if (value <= 12) return Math.round((50 / 12) * value);
    if (value <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (value - 12.1) + 51);
    if (value <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (value - 35.5) + 101);
    if (value <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (value - 55.5) + 151);
    if (value <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (value - 150.5) + 201);
    if (value <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (value - 250.5) + 301);
    if (value <= 500.4) return Math.round(((500 - 401) / (500.4 - 350.5)) * (value - 350.5) + 401);
  }
  return 0;
}

async function fetchPM25FromOpenAQ(lat: number, lon: number) {
  try {
    const apiKey = process.env.OPENAQ_API_KEY;
    if (!apiKey) throw new Error("Missing OpenAQ API key!");
    const res = await axios.get(
      `https://api.openaq.org/v3/measurements?coordinates=${lat},${lon}&radius=20000&parameter=pm25&limit=1&sort=desc&order_by=datetime`
    ,{
      headers:{"X-API-Key" : apiKey as string} ,
    });
    const result = res.data?.results?.[0];
    if (result) {
      return {
        value: result.value,
        unit: result.unit || "µg/m³",
        source: "OpenAQ",
      };
    }
  } catch (err:any) {
    console.error("Failed PM2.5 from OpenAQ:", err.message);
  }
  return null;
}


async function fetchNO2FromSentinel(lat: number, lon: number) {
  try {
    const res = await axios.get(
      `https://api.v2.emissions-api.org/api/v2/no2/average.json?point=${lat},${lon}&radius=10000`
    );
    const avg = res.data?.[0]?.value;
    if (avg) {
      return {
        value: avg * 1e3,
        unit: "ppb",
        source: "Sentinel-5P",
      };
    }
  } catch {}
  return null;
}

async function ingestLocation(location: { name: string; lat: number; lon: number }) {
  const pollutants = [];

  const pm25 = await fetchPM25FromOpenAQ(location.lat, location.lon);
  if (pm25) pollutants.push({ pollutant: "PM2.5", ...pm25 });

  const no2 = await fetchNO2FromSentinel(location.lat, location.lon);
  if (no2) pollutants.push({ pollutant: "NO2", ...no2 });

  for (const p of pollutants) {
    await prisma.airQualityRecord.create({
      data: {
        source: p.source,
        pollutant: p.pollutant,
        value: p.value,
        unit: p.unit,
        aqi: calculateAQI(p.pollutant, p.value),
        lat: location.lat,
        lon: location.lon,
      },
    });
  }
}

async function main() {
  for (const loc of LOCATIONS) {
    await ingestLocation(loc);
  }
  await prisma.$disconnect();
}

main().catch(async () => {
  await prisma.$disconnect();
});
