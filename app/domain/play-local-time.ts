import { PLAY_TIME_ZONE } from '@/domain/play-connector.model';

const pad2 = (value: number): string => String(value).padStart(2, '0');

const playTimeZoneOffset = (date: Date): string => {
  const timeZoneName = new Intl.DateTimeFormat('en-US', {
    timeZone: PLAY_TIME_ZONE,
    timeZoneName: 'longOffset',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
  const offset = timeZoneName?.replace(/^GMT/i, '') ?? '+00:00';
  return offset === '' ? '+00:00' : offset;
};

const zonedCivilTime = (civil: string): Date => {
  const utcGuess = new Date(`${civil}Z`);
  const zoned = new Date(`${civil}${playTimeZoneOffset(utcGuess)}`);
  return new Date(`${civil}${playTimeZoneOffset(zoned)}`);
};

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;
const COMPACT_DATE_TIME = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z?$/;

export const parsePlayLocalDateTime = (value: string): Date | null => {
  const trimmed = value.trim();
  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T'));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const local = trimmed.match(LOCAL_DATE_TIME);
  if (local) {
    const civil = `${local[1]}-${local[2]}-${local[3]}T${local[4]}:${local[5]}:${local[6] ?? '00'}`;
    return zonedCivilTime(civil);
  }

  const compact = trimmed.match(COMPACT_DATE_TIME);
  if (!compact) return null;
  const civil = `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6] ?? '00'}`;
  return zonedCivilTime(civil);
};

export const formatPlayLocalTime = (value: Date): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PLAY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${pad2(Number(hour))}:${pad2(Number(minute))}`;
};

export const formatPlayLocalDay = (value: Date): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PLAY_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(value);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  return `${weekday} ${day} ${month}`;
};
