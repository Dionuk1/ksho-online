export type RangePreset =
  | "all"
  | "today"
  | "week"
  | "month"
  | "last3"
  | "year"
  | "custom";

export const RANGE_LABELS: Record<RangePreset, string> = {
  all: "All time",
  today: "Today",
  week: "This Week",
  month: "This Month",
  last3: "Last 3 Months",
  year: "This Year",
  custom: "Custom Range",
};

function iso(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export function presetRange(preset: RangePreset): { from?: string; to?: string } {
  const now = new Date();
  const today = iso(now);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week": {
      const day = (now.getDay() + 6) % 7; // Monday start
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      return { from: iso(start), to: today };
    }
    case "month":
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case "last3":
      return { from: iso(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to: today };
    case "year":
      return { from: iso(new Date(now.getFullYear(), 0, 1)), to: today };
    default:
      return {};
  }
}

export function inRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}
