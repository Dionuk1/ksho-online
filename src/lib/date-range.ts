export type RangePreset =
  | "all"
  | "today"
  | "week"
  | "month"
  | "lastMonth"
  | "last3"
  | "year"
  | "custom";

export const RANGE_LABELS: Record<RangePreset, string> = {
  all: "Të gjitha",
  today: "Sot",
  week: "Këtë javë",
  month: "Këtë muaj",
  lastMonth: "Muajin e kaluar",
  last3: "3 muajt e fundit",
  year: "Këtë vit",
  custom: "Periudhë e zgjedhur",
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
    case "lastMonth":
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
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

/** yyyy-mm for the current month and the previous one (local time). */
export function currentAndPreviousMonthKeys() {
  const now = new Date();
  return {
    current: iso(new Date(now.getFullYear(), now.getMonth(), 1)).slice(0, 7),
    previous: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7),
  };
}
