import { tz } from '@date-fns/tz';
import { isValid, parse } from 'date-fns';

import { PLAY_TIME_ZONE } from '@/domain/play-connector.model';

const brussels = tz(PLAY_TIME_ZONE);

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;
const COMPACT_DATE_TIME = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z?$/;

const zonedCivilTime = (civil: string): Date | null => {
  const parsed = parse(civil, "yyyy-MM-dd'T'HH:mm:ss", new Date(), { in: brussels });
  return isValid(parsed) ? new Date(parsed.getTime()) : null;
};

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
