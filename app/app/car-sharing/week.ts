import { formatPlayLocalDay, formatPlayLocalTime, parsePlayLocalDateTime } from '@/domain/play-local-time';
import type { RideStatus } from '@/domain/ride.model';

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
  const noon = parsePlayLocalDateTime(`${day} 12:00`);
  if (!noon) return 0;
  const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', weekday: 'short' }).format(noon);
  return WEEKDAY_INDEX[weekday] ?? 0;
};

export const weekContaining = (from: string): WeekDay[] => {
  const day = from.slice(0, 10);
  const monday = addCivilDays(day, -brusselsWeekdayIndex(day));
  return Array.from({ length: 7 }, (_, index) => {
    const key = addCivilDays(monday, index);
    const start = parsePlayLocalDateTime(`${key} 00:00`);
    const end = parsePlayLocalDateTime(`${addCivilDays(key, 1)} 00:00`);
    if (!start || !end) return null;
    return { key, start, end, label: formatPlayLocalDay(start) };
  }).flatMap((column) => (column ? [column] : []));
};

export const rangesOverlap = (start: Date, end: Date, otherStart: Date, otherEnd: Date): boolean => start < otherEnd && end > otherStart;

export const rideLabel = (ride: WeekRide, day: WeekDay): string | null => {
  if (ride.status === 'declined') return null;
  if (!rangesOverlap(ride.startsAt, ride.endsAt, day.start, day.end)) return null;
  const start = ride.startsAt > day.start ? ride.startsAt : day.start;
  const end = ride.endsAt < day.end ? ride.endsAt : day.end;
  return `${formatPlayLocalTime(start)}–${formatPlayLocalTime(end)}`;
};

export const periodOverlapsDay = (period: { from: string; until: string }, day: WeekDay): boolean => {
  const from = parsePlayLocalDateTime(period.from.replace('T', ' '));
  const until = parsePlayLocalDateTime(period.until.replace('T', ' '));
  if (!from || !until) return false;
  return rangesOverlap(from, until, day.start, day.end);
};
