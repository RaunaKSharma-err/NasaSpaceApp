// Breakpoints for AQI calculation (simplified for demo)
const breakpoints: Record<
  string,
  { cLow: number; cHigh: number; iLow: number; iHigh: number }[]
> = {
  PM25: [
    { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  ],
  NO2: [
    { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
    { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
    { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
  ],
  O3: [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
    { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
    { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
  ],
  // Not standardized here; return -1 when unknown
};

export function calculateAQI(pollutant: string, concentration: number): number {
  const p = pollutant.toUpperCase();
  const bps = breakpoints[p];
  if (!bps || Number.isNaN(concentration)) return -1;

  for (const { cLow, cHigh, iLow, iHigh } of bps) {
    if (concentration >= cLow && concentration <= cHigh) {
      return Math.round(
        ((iHigh - iLow) / (cHigh - cLow)) * (concentration - cLow) + iLow
      );
    }
  }
  return -1;
}