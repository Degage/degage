import * as cheerio from 'cheerio';

export type PlayAvailableCar = {
  playCarId: number;
  name: string;
  distanceKm: number;
};

const DISTANCE_PATTERN = /^([\d.,]+)\s*km$/i;

const collapseText = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const parseCalendarList = (html: string): PlayAvailableCar[] => {
  const $ = cheerio.load(html);
  const cars: PlayAvailableCar[] = [];

  $('div[id="rij"]').each((_, row) => {
    const nameLink = $(row).find('a[href^="#collapse-car-"]').first();
    const href = nameLink.attr('href') ?? '';
    const idMatch = href.match(/collapse-car-(\d+)/);
    const name = collapseText(nameLink.text());
    const distanceText = $(row)
      .find('div')
      .map((__, div) => collapseText($(div).text()))
      .get()
      .find((text) => DISTANCE_PATTERN.test(text));
    const distanceMatch = distanceText?.match(DISTANCE_PATTERN);
    if (!idMatch || !name || !distanceMatch) return;

    const playCarId = Number(idMatch[1]);
    const distanceKm = Number(distanceMatch[1].replace(',', '.'));
    if (!Number.isInteger(playCarId) || playCarId <= 0 || Number.isNaN(distanceKm)) return;

    cars.push({ playCarId, name, distanceKm });
  });

  return cars;
};

const CALENDAR_LIST_FILTER_DEFAULTS = [
  'seats=',
  'fuel=ALL',
  'category_b=0',
  'gps=0',
  'hook=0',
  'automatic=0',
  'pets=0',
  'student=0',
  'kid_seat=0',
  'bicycle_rack=0',
  'trailer=0',
  'bed=0',
  'trunk_volume=',
  'trunk_width=',
  'trunk_height=',
  'trunk_depth=',
];

export const CALENDAR_LIST_PAGE_SIZE = 10;

export const calendarListPath = (from: string, until: string): string => {
  const filter = [`from=${from}`, `until=${until}`, ...CALENDAR_LIST_FILTER_DEFAULTS].join(',');
  const params = new URLSearchParams({
    page: '1',
    pageSize: String(CALENDAR_LIST_PAGE_SIZE),
    asc: '1',
    filter,
  });
  return `/calendar/list?${params.toString()}`;
};
