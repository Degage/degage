import * as cheerio from 'cheerio';

export type PlayAvailableCar = {
  playCarId: number;
  name: string;
  distanceKm: number;
  brandModel: string | null;
  category: string | null;
  vehicleKind: string | null;
  seats: number | null;
  doors: number | null;
  year: number | null;
  fuel: string | null;
  features: string[];
};

const DISTANCE_PATTERN = /^([\d.,]+)\s*km$/i;

const collapseText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const FUELS = new Set(['benzine', 'diesel', 'elektrisch', 'hybride', 'cng', 'lpg', 'waterstof']);
const VEHICLE_KINDS = new Set(['personenwagen', 'bestelwagen', 'busje', 'monovolume']);

const emptyCarDetails = {
  brandModel: null,
  category: null,
  vehicleKind: null,
  seats: null,
  doors: null,
  year: null,
  fuel: null,
  features: [] as string[],
};

const detailsFromLabels = (labels: string[]) => {
  const details = { ...emptyCarDetails, features: [] as string[] };
  for (const label of labels) {
    if (/^\d{4}$/.test(label)) {
      details.year = Number(label);
      continue;
    }
    const seats = label.match(/^(\d+)\s+(zetels|seats|places)$/i);
    if (seats) {
      details.seats = Number(seats[1]);
      continue;
    }
    const doors = label.match(/^(\d+)\s+(deuren|doors|portes)$/i);
    if (doors) {
      details.doors = Number(doors[1]);
      continue;
    }
    if (FUELS.has(label.toLowerCase())) {
      details.fuel = label;
      continue;
    }
    if (VEHICLE_KINDS.has(label.toLowerCase())) {
      details.vehicleKind = label;
      continue;
    }
    if (/^[A-Z]$/.test(label) && !details.category) {
      details.category = label;
      continue;
    }
    details.features.push(label);
  }
  return details;
};

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

    const reserveText = collapseText($(row).find('a[href*="/reservation/create"]').first().parent().text());
    const brandModel = reserveText.replace(/^(Reserveer|Réserver|Reserve)\s+/i, '') || null;
    const labels = $(row)
      .find('span.label')
      .map((__, label) => collapseText($(label).text()))
      .get()
      .filter(Boolean);

    cars.push({ playCarId, name, distanceKm, ...detailsFromLabels(labels), brandModel });
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

export const DEFAULT_CALENDAR_LIST_PAGE_SIZE = 10;

export const calendarListPath = (from: string, until: string, pageSize = DEFAULT_CALENDAR_LIST_PAGE_SIZE): string => {
  const filter = [`from=${from}`, `until=${until}`, ...CALENDAR_LIST_FILTER_DEFAULTS].join(',');
  const params = new URLSearchParams({
    page: '1',
    pageSize: String(pageSize),
    asc: '1',
    filter,
  });
  return `/calendar/list?${params.toString()}`;
};
