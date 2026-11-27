import { parsePlayLocalDateTime } from '@/domain/play-local-time';
import { type RideStatus } from '@/domain/ride.model';

export type ParsedCarRide = {
  playReservationId: number;
  status: RideStatus;
  startsAt: Date;
  endsAt: Date;
  degappUserId: string | null;
};

export type CalendarEventsParse = { recognized: true; rides: ParsedCarRide[] } | { recognized: false };

const STATUS_BY_TOKEN: Record<string, RideStatus> = {
  request: 'requested',
  requested: 'requested',
  tentative: 'requested',
  accepted: 'confirmed',
  confirmed: 'confirmed',
  reserved: 'confirmed',
  refused: 'declined',
  declined: 'declined',
  cancelled: 'declined',
  canceled: 'declined',
};

const statusFromToken = (value: unknown): RideStatus | null => {
  if (value == null || value === '') return 'confirmed';
  if (typeof value !== 'string') return null;
  return STATUS_BY_TOKEN[value.trim().toLowerCase()] ?? null;
};

const reservationIdFrom = (value: unknown): number | null => {
  const match = String(value ?? '').match(/(\d+)\s*$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const rideFromFields = (fields: { id: unknown; start: unknown; end: unknown; status: unknown; userId: unknown }): ParsedCarRide | null => {
  const playReservationId = reservationIdFrom(fields.id);
  const status = statusFromToken(fields.status);
  const startsAt = typeof fields.start === 'string' ? parsePlayLocalDateTime(fields.start) : null;
  const endsAt = typeof fields.end === 'string' ? parsePlayLocalDateTime(fields.end) : null;
  if (!playReservationId || !status || !startsAt || !endsAt || endsAt <= startsAt) return null;
  const degappUserId = fields.userId == null || fields.userId === '' ? null : String(fields.userId);
  return { playReservationId, status, startsAt, endsAt, degappUserId };
};

const parseJsonEvents = (body: string): CalendarEventsParse | null => {
  const trimmed = body.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { recognized: false };
  }
  const wrapped = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as { events?: unknown }).events : null;
  const events = Array.isArray(parsed) ? parsed : Array.isArray(wrapped) ? wrapped : null;
  if (!events) return { recognized: false };

  const rides: ParsedCarRide[] = [];
  for (const event of events) {
    if (!event || typeof event !== 'object') return { recognized: false };
    const record = event as Record<string, unknown>;
    const ride = rideFromFields({
      id: record.id ?? record.reservationId,
      start: record.start ?? record.from,
      end: record.end ?? record.until,
      status: record.status,
      userId: record.userId ?? record.degappUserId,
    });
    if (!ride) return { recognized: false };
    rides.push(ride);
  }
  return { recognized: true, rides };
};

const unfoldIcal = (body: string): string => body.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');

const parseIcalEvents = (body: string): CalendarEventsParse | null => {
  if (!body.includes('BEGIN:VEVENT')) return null;
  const rides: ParsedCarRide[] = [];
  for (const block of unfoldIcal(body).split('BEGIN:VEVENT').slice(1)) {
    const event = block.split('END:VEVENT')[0] ?? '';
    const value = (name: string): string | null => {
      const line = event.split(/\r?\n/).find((row) => row.startsWith(`${name}:`) || row.startsWith(`${name};`));
      if (!line) return null;
      return line.slice(line.indexOf(':') + 1).trim();
    };
    const ride = rideFromFields({
      id: value('UID'),
      start: value('DTSTART'),
      end: value('DTEND'),
      status: value('STATUS'),
      userId: value('X-DEGAGE-USER'),
    });
    if (!ride) return { recognized: false };
    rides.push(ride);
  }
  return { recognized: true, rides };
};

export const parseCalendarEvents = (body: string): CalendarEventsParse => {
  const json = parseJsonEvents(body);
  if (json) return json;
  const ical = parseIcalEvents(body);
  if (ical) return ical;
  return { recognized: false };
};

export const calendarEventsPath = (playCarId: number): string => `/calendarevents/car?id=${playCarId}`;
