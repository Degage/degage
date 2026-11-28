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

// The cell draws 07:00–23:00. A reservation outside that window is clipped to the edge of the track.
const TRACK_START = '07:00';
const TRACK_END = '23:00';

export type TrackBlock = {
  left: number;
  width: number;
  label: string;
};

const trackBounds = (day: WeekDay): { start: Date; end: Date } | null => {
  const start = brusselsDateTime(`${day.key} ${TRACK_START}`);
  const end = brusselsDateTime(`${day.key} ${TRACK_END}`);
  if (!start || !end || end <= start) return null;
  return { start, end };
};

const percent = (value: number): number => Math.round(value * 10) / 10;

export const blockOnTrack = (start: Date, end: Date, day: WeekDay): TrackBlock | null => {
  const bounds = trackBounds(day);
  if (!bounds || !rangesOverlap(start, end, bounds.start, bounds.end)) return null;
  const visibleStart = start > bounds.start ? start : bounds.start;
  const visibleEnd = end < bounds.end ? end : bounds.end;
  const span = bounds.end.getTime() - bounds.start.getTime();
  const left = ((visibleStart.getTime() - bounds.start.getTime()) / span) * 100;
  const width = ((visibleEnd.getTime() - visibleStart.getTime()) / span) * 100;
  if (width <= 0) return null;
  return {
    left: percent(left),
    width: percent(width),
    label: `${formatBrusselsTime(visibleStart)}–${formatBrusselsTime(visibleEnd)}`,
  };
};

export const rideBlock = (ride: WeekRide, day: WeekDay): TrackBlock | null => {
  if (ride.status === 'declined') return null;
  return blockOnTrack(ride.startsAt, ride.endsAt, day);
};

export const periodBlock = (period: { from: string; until: string }, day: WeekDay): TrackBlock | null => {
  const from = brusselsDateTime(period.from);
  const until = brusselsDateTime(period.until);
  if (!from || !until) return null;
  return blockOnTrack(from, until, day);
};
