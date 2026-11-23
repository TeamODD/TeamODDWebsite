import type { ScoredEvent } from "./activityScore";

export type ActivityYears = Record<string, boolean>;

export function recordedActivityYears(events: Record<string, ScoredEvent>, participation: Record<string, boolean>, manualYears: ActivityYears = {}): string[] {
  return [...new Set([
    ...Object.entries(manualYears).filter(([, value]) => value === true).map(([year]) => year),
    ...Object.entries(events)
      .filter(([key]) => participation[key] === true)
      .map(([, event]) => event.reportYear || (/^\d{2}-[12]$/.test(event.semester || "") ? `20${event.semester?.slice(0, 2)}` : "")),
  ].filter(year => /^\d{4}$/.test(year)))].sort();
}
