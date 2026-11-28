import { describe, expect, it } from 'vitest';

import { parsePlayLocalDateTime } from '@/play-connector/play-local-time';
import { calendarEventsPath, parseCalendarEvents } from '@/play-connector/parsers/calendar-events.parser';

const jsonEvents = JSON.stringify([{ id: 123, start: '2026-12-02 10:00', end: '2026-12-02 12:00', status: 'ACCEPTED', userId: '42' }]);

const icalEvents = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:reservation-456
DTSTART:20261202T140000
DTEND:20261202T160000
STATUS:TENTATIVE
END:VEVENT
END:VCALENDAR
`;

describe('parseCalendarEvents', () => {
  it('reads reservation intervals from a JSON list', () => {
    const parsed = parseCalendarEvents(jsonEvents);
    expect(parsed.recognized).toBe(true);
    if (!parsed.recognized) return;
    expect(parsed.rides).toEqual([
      {
        playReservationId: 123,
        status: 'confirmed',
        startsAt: parsePlayLocalDateTime('2026-12-02 10:00'),
        endsAt: parsePlayLocalDateTime('2026-12-02 12:00'),
        degappUserId: '42',
      },
    ]);
  });

  it('reads reservation intervals from an iCalendar body', () => {
    const parsed = parseCalendarEvents(icalEvents);
    expect(parsed.recognized).toBe(true);
    if (!parsed.recognized) return;
    expect(parsed.rides[0]).toMatchObject({ playReservationId: 456, status: 'requested', degappUserId: null });
  });

  it('does not treat an availability page as reservation intervals', () => {
    expect(parseCalendarEvents('<div id="car-availability-panel">10:00</div>')).toEqual({ recognized: false });
  });
});

describe('calendarEventsPath', () => {
  it('asks for one car and includes the separator Degapp requires', () => {
    expect(calendarEventsPath(1793)).toBe('/calendarevents/car?id=1793&separator=');
  });
});
