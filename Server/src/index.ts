import "dotenv/config";
import express, { Request, Response } from "express";
import { prisma } from "./utils/supabase";
import { canonicalPollutant } from "./services/normalize";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 3000);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/airquality/latest", async (req: Request, res: Response) => {
  try {
    const qPollutant = req.query.pollutant as string | undefined;
    if (!qPollutant) {
      return res.status(400).json({ error: "pollutant is required" });
    }
    const pollutant = canonicalPollutant(qPollutant);

    const record = await prisma.airQualityRecord.findFirst({
      where: { pollutant },
      orderBy: { timestamp: "desc" },
    });

    if (!record) {
      return res.status(404).json({ error: "No data" });
    }

    return res.json({
      pollutant: record.pollutant,
      aqi: record.aqi,
      value: record.value,
      unit: record.unit,
      source: record.source,
      lat: record.lat,
      lon: record.lon,
      timestamp: record.timestamp,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/airquality/history", async (req: Request, res: Response) => {
  try {
    const qPollutant = req.query.pollutant as string | undefined;
    if (!qPollutant) {
      return res.status(400).json({ error: "pollutant is required" });
    }
    const pollutant = canonicalPollutant(qPollutant);

    const startStr = (req.query.start as string | undefined) ?? "";
    const endStr = (req.query.end as string | undefined) ?? "";

    const end = endStr ? new Date(endStr) : new Date();
    const start = startStr
      ? new Date(startStr)
      : new Date(end.getTime() - 24 * 60 * 60 * 1000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid start or end date" });
    }

    const records = await prisma.airQualityRecord.findMany({
      where: {
        pollutant,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    return res.json(
      records.map((r) => ({
        pollutant: r.pollutant,
        aqi: r.aqi,
        value: r.value,
        unit: r.unit,
        source: r.source,
        lat: r.lat,
        lon: r.lon,
        timestamp: r.timestamp,
      }))
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AirSight server listening on :${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});