import { describe, expect, it } from 'vitest';

import { calendarListPath, parseCalendarList } from '@/play-connector/parsers/calendar-list.parser';

const calendarListHtml = `
<div id="resultsTable">
  <div class="row" id="rij">
    <div class="col-md-1 col-sm-2"><a href="#collapse-car-1793">Near car</a></div>
    <div class="col-md-1">1.7 km</div>
  </div>
  <div class="row" id="rij">
    <div class="col-md-1 col-sm-2"><a href="#collapse-car-1401">Far car</a></div>
    <div class="col-md-1">12,4 km</div>
  </div>
</div>
`;

describe('parseCalendarList', () => {
  it('keeps Degapp order and reads the distance', () => {
    expect(parseCalendarList(calendarListHtml)).toEqual([
      { playCarId: 1793, name: 'Near car', distanceKm: 1.7 },
      { playCarId: 1401, name: 'Far car', distanceKm: 12.4 },
    ]);
  });

  it('returns nothing when the page has no car rows', () => {
    expect(parseCalendarList('<div>empty</div>')).toEqual([]);
  });
});

describe('calendarListPath', () => {
  it('asks for ten cars and leaves the feature flags off', () => {
    const path = calendarListPath('2026-12-02 10:00', '2026-12-03 18:00');
    const params = new URLSearchParams(path.split('?')[1]);
    expect(params.get('pageSize')).toBe('10');
    expect(params.get('filter')).toContain('from=2026-12-02 10:00');
    expect(params.get('filter')).toContain('until=2026-12-03 18:00');
    expect(params.get('filter')).toContain('fuel=ALL');
    expect(params.get('filter')).toContain('automatic=0');
    expect(params.get('filter')).not.toContain('automatic=1');
  });
});
