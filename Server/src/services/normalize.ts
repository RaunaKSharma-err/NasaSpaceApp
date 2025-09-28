const molWeights: Record<string, number> = {
  NO2: 46.01,
  O3: 48.0,
  PM25: 1.0, // already µg/m³
  HCHO: 30.03,
  Aerosol: 1.0, // index
};

// normalize pollutant code aliases
export function canonicalPollutant(code: string): string {
  const p = code.replace(/\s+/g, "").toUpperCase();
  if (p === "PM2.5" || p === "PM_2_5" || p === "PM25") return "PM25";
  if (p === "NO2" || p === "NO_2") return "NO2";
  if (p === "O3" || p === "OZONE") return "O3";
  if (p === "HCHO" || p === "FORMALDEHYDE") return "HCHO";
  if (p.includes("AEROSOL")) return "Aerosol";
  return p;
}

// Converts raw concentration to µg/m³ (approximate, 25°C, 1 atm)
export function normalizePollutant(
  pollutant: string,
  value: number,
  unit: string
): { value: number; unit: string } {
  const p = canonicalPollutant(pollutant);
  const u = unit?.toLowerCase?.() ?? unit;

  if (u === "µg/m³" || u === "ug/m3" || u === "μg/m3") {
    return { value, unit: "µg/m³" };
  }

  // Treat common gas units
  if ((u === "ppb" || u === "ppbv") && molWeights[p]) {
    const conv = (value * molWeights[p]) / 24.45;
    return { value: conv, unit: "µg/m³" };
  }

  // Fallback: keep as-is
  return { value, unit };
}