type PBEvent = "mile" | "5k" | "10k" | "half" | "marathon";

const DISTANCES_METERS: Record<PBEvent, number> = {
  mile: 1609.34,
  "5k": 5000,
  "10k": 10000,
  half: 21097.5,
  marathon: 42195,
};

// Helper: Parse "hh:mm:ss" or "mm:ss" to seconds
export function parseHMS(hms: string): number {
  const parts = hms.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  throw new Error("Invalid time format");
}

// Helper: Format seconds/km to "m:ss/km"
export function paceStrSecondsPerKm(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

// Helper: Format seconds/mile to "m:ss/mi"
export function paceStrSecondsPerMile(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}/mi`;
}

// Helper: Riegel's formula to project time (in seconds) for a new distance
export function riegelProjectTime(
  t1: number,
  d1: number,
  d2: number,
  exponent = 1.06
): number {
  return t1 * Math.pow(d2 / d1, exponent);
}

// Main function
export function pacesFromPB(
  event: PBEvent,
  timeHMS: string
): {
  input: { event: PBEvent; timeHMS: string; dist_m: number; time_s: number };
  threshold: { s_per_km: number; per_km: string; per_mile: string };
  zones: Record<
    | "easy"
    | "steady"
    | "threshold"
    | "interval"
    | "speed"
    | "long",
    {
      min_s_per_km: number;
      max_s_per_km: number;
      min: string;
      max: string;
      min_mi: string;
      max_mi: string;
    }
  >;
  notes: string;
} {
  const dist_m = DISTANCES_METERS[event];
  const time_s = parseHMS(timeHMS);

  // Project to 10k if not already 10k (threshold anchor)
  let thresholdTime_s: number;
  let thresholdDist_m: number = 10000;
  let notes = "";

  if (event === "10k") {
    thresholdTime_s = time_s;
    notes = "10K PB used directly as threshold pace.";
  } else {
    thresholdTime_s = riegelProjectTime(time_s, dist_m, thresholdDist_m, 1.06);
    notes = `PB projected to 10K using Riegel's formula (exponent 1.06).`;
  }

  // Threshold pace in s/km
  const threshold_s_per_km = thresholdTime_s / 10;

  // Zone multipliers
  const ZONES = {
    easy:    [1.15, 1.30],
    steady:  [1.08, 1.15],
    threshold: [0.98, 1.03],
    interval: [0.90, 0.95],
    speed:   [0.80, 0.88],
    long:    [1.10, 1.25],
  } as const;

  // Convert s/km to s/mi
  const KM_TO_MI = 1 / 1.60934;

  // Build zones
  const zones = Object.fromEntries(
    Object.entries(ZONES).map(([zone, [minMul, maxMul]]) => {
      const min_s_per_km = threshold_s_per_km * minMul;
      const max_s_per_km = threshold_s_per_km * maxMul;
      const min = paceStrSecondsPerKm(min_s_per_km);
      const max = paceStrSecondsPerKm(max_s_per_km);
      const min_mi = paceStrSecondsPerMile(min_s_per_km / KM_TO_MI);
      const max_mi = paceStrSecondsPerMile(max_s_per_km / KM_TO_MI);
      return [
        zone,
        { min_s_per_km, max_s_per_km, min, max, min_mi, max_mi },
      ];
    })
  ) as ReturnType<typeof pacesFromPB>["zones"];

  return {
    input: { event, timeHMS, dist_m, time_s },
    threshold: {
      s_per_km: threshold_s_per_km,
      per_km: paceStrSecondsPerKm(threshold_s_per_km),
      per_mile: paceStrSecondsPerMile(threshold_s_per_km / KM_TO_MI),
    },
    zones,
    notes,
  };
}

// Example usage:
const result = pacesFromPB("mile", "6:07");
console.log(result.threshold, result.zones.threshold, result.zones.easy);

export type PacesFromPBResult = ReturnType<typeof pacesFromPB>;