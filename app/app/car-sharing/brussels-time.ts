// Civil times on the car-sharing page (the period form and the week columns) are Europe/Brussels,
// the same zone Degapp uses (`PLAY_TIME_ZONE`). `@date-fns/tz` converts them. This file only pins
// that zone and the formats the grid shows.

import { tz } from '@date-fns/tz';
import { format, isValid, parse } from 'date-fns';
import { enGB } from 'date-fns/locale';

import { PLAY_TIME_ZONE } from '@/domain/play-connector.model';

const brussels = tz(PLAY_TIME_ZONE);

const instant = (value: Date): Date | null => (isValid(value) ? new Date(value.getTime()) : null);

export const brusselsDateTime = (value: string): Date | null =>
  instant(parse(value.trim().replace('T', ' '), 'yyyy-MM-dd HH:mm', new Date(), { in: brussels }));

export const formatBrusselsTime = (value: Date): string => format(value, 'HH:mm', { in: brussels, locale: enGB });

export const formatBrusselsDay = (value: Date): string => format(value, 'EEE d MMM', { in: brussels, locale: enGB });

export const brusselsWeekdayShort = (value: Date): string => format(value, 'EEE', { in: brussels, locale: enGB });
