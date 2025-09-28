import axios from "axios";
import { prisma } from "../utils/supabase";
import { calculateAQI } from "../services/aqi";
import { canonicalPollutant, normalizePollutant } from "../services/normalize";

type OpenAQMeasurement = {
  parameter: string;
  value: number;
  unit: string;
  date?: { utc?: string };
  lastUpdated?: string;
};

type OpenAQResult = {
  coordinates?: { latitude?: number; longitude?: number };
  location?: string;
  measurements?: OpenAQMeasurement[];
};

const openAQParamToPollutant: Record<string, string> = {
  pm25: "PM25",
  o3: "O3",
  no2: "NO2",
  hcho: "HCHO",
};

async function fetchOpenAQLatest(
  coordinates: string,
  radius: number
): Promise<OpenAQResult[]> {
  const url = `https://api.openaq.org/v2/latest?coordinates=${coordinates}&radius=${radius}`;
  const res = await axios.get(url, { timeout: 30000 });
  const data = res.data;
  return Array.isArray(data?.results) ? data.results : [];
}

async function main() {
  const coordinates = process.env.OPENAQ_COORDINATES ?? "27.7172,85.3240";
  const radius = Number.parseInt(process.env.OPENAQ_RADIUS ?? "10000", 10);

  const results = await fetchOpenAQLatest(coordinates, radius);

  for (const r of results) {
    const lat = r.coordinates?.latitude ?? null;
    const lon = r.coordinates?.longitude ?? null;

    for (const m of r.measurements ?? []) {
      const pollutant = openAQParamToPollutant[m.parameter?.toLowerCase?.() || ""];
      if (!pollutant) continue;

      const { value: normalizedValue, unit } = normalizePollutant(
        pollutant,
        m.value,
        m.unit
      );
      const aqi = calculateAQI(pollutant, normalizedValue);

      const timestampStr = m.lastUpdated ?? m.date?.utc ?? new Date().toISOString();

      await prisma.airQualityRecord.create({
        data: {
          source: "OpenAQ",
          pollutant: canonicalPollutant(pollutant),
          value: normalizedValue,
          unit,
          aqi,
          lat,
          lon,
          timestamp: new Date(timestampStr),
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log("OpenAQ ingestion complete");
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
}