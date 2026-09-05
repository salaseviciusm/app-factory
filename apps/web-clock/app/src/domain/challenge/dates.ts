/**
 * Local calendar dates as `YYYY-MM-DD`. The challenge is about days the athlete
 * lived through, so everything here is local time, never UTC.
 */
export type IsoDate = string;

export function toIsoDate(epochMs: number): IsoDate {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(date: IsoDate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = parseIsoDate(date);
  d.setDate(d.getDate() + days);
  return toIsoDate(d.getTime());
}

/** Whole local days from `start` to `date`; 0 on the start day. */
export function daysBetween(start: IsoDate, date: IsoDate): number {
  const a = parseIsoDate(start);
  const b = parseIsoDate(date);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/** 1-based day of the challenge for a date, or undefined outside the window. */
export function dayIndexFor(startDate: IsoDate, date: IsoDate, days: number): number | undefined {
  const index = daysBetween(startDate, date) + 1;
  return index >= 1 && index <= days ? index : undefined;
}
