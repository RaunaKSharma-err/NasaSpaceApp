import axios from "axios";
import { prisma } from "../utils/supabase";
import { calculateAQI } from "../services/aqi";
import { canonicalPollutant, normalizePollutant } from "../services/normalize";

type NasaSample = {
  value?: number;
  unit?: string;
  lat?: number;
  lon?: number;
  timestamp?: string;
  [k: string]: unknown;
};

const productToPollutant: Record<string, string> = {
  tempo_no2: "NO2",
  tempo_o3: "O3",
  tempo_pm25: "PM25",
  tempo_aerosol: "Aerosol",
  tempo_hcho: "HCHO",
};

async function fetchProduct(productKey: string): Promise<NasaSample[]> {
  const url = `https://airquality.gsfc.nasa.gov/api/data/products?product=${productKey}`;
  const res = await axios.get(url, { timeout: 30000 });
  const data = res.data;

  // Try to coerce into a flat list of samples; handle flexible shapes
  const list: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.results)
    ? data.results
    : [];

  return list.map((item: any) => {
    // Attempt to derive fields from common names
    const value =
      item?.value ?? item?.measurement ?? item?.average ?? item?.concentration;
    const unit = item?.unit ?? item?.units ?? item?.uom ?? "ppb";
    const lat = item?.lat ?? item?.latitude;
    const lon = item?.lon ?? item?.longitude;
    const timestamp =
      item?.time ??
      item?.timestamp ??
      item?.datetime ??
      item?.dtg ??
      item?.date ??
      new Date().toISOString();

    return { value, unit, lat, lon, timestamp };
  });
}

async function ingestOne(productKey: string) {
  const pollutant = productToPollutant[productKey];
  if (!pollutant) return;

  const samples = await fetchProduct(productKey);

  for (const s of samples) {
    const numericValue =
      typeof s.value === "string" ? Number.parseFloat(s.value) : s.value;
    if (numericValue == null || Number.isNaN(numericValue)) continue;

    const { value: normalizedValue, unit } = normalizePollutant(
      pollutant,
      numericValue,
      String(s.unit ?? "")
    );
    const aqi = calculateAQI(pollutant, normalizedValue);

    await prisma.airQualityRecord.create({
      data: {
        source: "NASA_TEMPO",
        pollutant: canonicalPollutant(pollutant),
        value: normalizedValue,
        unit,
        aqi,
        lat: s.lat ?? null,
        lon: s.lon ?? null,
        timestamp: new Date(s.timestamp ?? Date.now()),
      },
    });
  }
}

async function main() {
  const products = Object.keys(productToPollutant);
  for (const key of products) {
    try {
      await ingestOne(key);
      // eslint-disable-next-line no-console
      console.log(`Ingested NASA product: ${key}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed NASA product ${key}:`, (err as Error).message);
    }
  }
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
}