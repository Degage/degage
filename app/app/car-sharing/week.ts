import type { RideStatus } from '@/domain/ride.model';

import { brusselsDateTime, brusselsWeekdayShort, formatBrusselsDay, formatBrusselsTime } from '@/app/car-sharing/brussels-time';

export type WeekDay = {
  key: string;
  start: Date;
  end: Date;
  label: string;
};

export type WeekRide = {
  sharedCarId: string;
  status: RideStatus;
  startsAt: Date;
  endsAt: Date;
};

const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

const addCivilDays = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};

const brusselsWeekdayIndex = (day: string): number => {
  const noon = brusselsDateTime(`${day} 12:00`);
  if (!noon) return 0;
  const weekday = brusselsWeekdayShort(noon);
  return WEEKDAY_INDEX[weekday] ?? 0;
};

export const weekContaining = (from: string): WeekDay[] => {
  const day = from.slice(0, 10);
  const monday = addCivilDays(day, -brusselsWeekdayIndex(day));
  return Array.from({ length: 7 }, (_, index) => {
    const key = addCivilDays(monday, index);
    const start = brusselsDateTime(`${key} 00:00`);
    const end = brusselsDateTime(`${addCivilDays(key, 1)} 00:00`);
    if (!start || !end) return null;
    return { key, start, end, label: formatBrusselsDay(start) };
  }).flatMap((column) => (column ? [column] : []));
};

export const rangesOverlap = (start: Date, end: Date, otherStart: Date, otherEnd: Date): boolean => start < otherEnd && end > otherStart;

export const rideLabel = (ride: WeekRide, day: WeekDay): string | null => {
  if (ride.status === 'declined') return null;
  if (!rangesOverlap(ride.startsAt, ride.endsAt, day.start, day.end)) return null;
  const start = ride.startsAt > day.start ? ride.startsAt : day.start;
  const end = ride.endsAt < day.end ? ride.endsAt : day.end;
  return `${formatBrusselsTime(start)}–${formatBrusselsTime(end)}`;
};

export const periodOverlapsDay = (period: { from: string; until: string }, day: WeekDay): boolean => {
  const from = brusselsDateTime(period.from);
  const until = brusselsDateTime(period.until);
  if (!from || !until) return false;
  return rangesOverlap(from, until, day.start, day.end);
};
