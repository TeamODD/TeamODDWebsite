export type AttendanceTagSettings = {
  none: string;
  low: string;
  medium: string;
  high: string;
  mediumFrom: number;
  highFrom: number;
  categoryFrom: number;
  categoryNames: Record<"assembly" | "social" | "project" | "external" | "mt" | "other", string>;
};

export const DEFAULT_ATTENDANCE_TAG_SETTINGS: AttendanceTagSettings = {
  none: "참여 기록 없음",
  low: "참여 중",
  medium: "꾸준한 참여",
  high: "적극 참여",
  mediumFrom: 50,
  highFrom: 80,
  categoryFrom: 50,
  categoryNames: { assembly: "모임형", social: "친목형", project: "제작형", external: "대외활동형", mt: "MT형", other: "기타 활동형" },
};

export function attendanceTagSettings(value: unknown): AttendanceTagSettings {
  if (!value || typeof value !== "object") return DEFAULT_ATTENDANCE_TAG_SETTINGS;
  const source = value as Record<string, unknown>;
  return {
    none: typeof source.none === "string" && source.none.trim() ? source.none : DEFAULT_ATTENDANCE_TAG_SETTINGS.none,
    low: typeof source.low === "string" && source.low.trim() ? source.low : DEFAULT_ATTENDANCE_TAG_SETTINGS.low,
    medium: typeof source.medium === "string" && source.medium.trim() ? source.medium : DEFAULT_ATTENDANCE_TAG_SETTINGS.medium,
    high: typeof source.high === "string" && source.high.trim() ? source.high : DEFAULT_ATTENDANCE_TAG_SETTINGS.high,
    mediumFrom: typeof source.mediumFrom === "number" ? source.mediumFrom : DEFAULT_ATTENDANCE_TAG_SETTINGS.mediumFrom,
    highFrom: typeof source.highFrom === "number" ? source.highFrom : DEFAULT_ATTENDANCE_TAG_SETTINGS.highFrom,
    categoryFrom: typeof source.categoryFrom === "number" ? source.categoryFrom : DEFAULT_ATTENDANCE_TAG_SETTINGS.categoryFrom,
    categoryNames: Object.fromEntries(Object.entries(DEFAULT_ATTENDANCE_TAG_SETTINGS.categoryNames).map(([key, fallback]) => [key, typeof (source.categoryNames as Record<string, unknown> | undefined)?.[key] === "string" && String((source.categoryNames as Record<string, unknown>)[key]).trim() ? (source.categoryNames as Record<string, string>)[key] : fallback])) as AttendanceTagSettings["categoryNames"],
  };
}
