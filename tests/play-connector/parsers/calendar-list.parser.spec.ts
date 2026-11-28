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
      {
        playCarId: 1793,
        name: 'Near car',
        distanceKm: 1.7,
        brandModel: null,
        category: null,
        vehicleKind: null,
        seats: null,
        doors: null,
        year: null,
        fuel: null,
        features: [],
      },
      {
        playCarId: 1401,
        name: 'Far car',
        distanceKm: 12.4,
        brandModel: null,
        category: null,
        vehicleKind: null,
        seats: null,
        doors: null,
        year: null,
        fuel: null,
        features: [],
      },
    ]);
  });

  it('reads the model and the labels, and leaves the street address out', () => {
    const html = `
      <div class="row" id="rij">
        <div><a href="#collapse-car-1793">Near car</a></div>
        <div>1.7 km</div>
        <div><a href="/reservation/create?carId=1793">Reserveer</a> Renault Captur</div>
        <div>
          <span class="label label-car-category">A</span>
          <span class="label label-availability">Personenwagen</span>
          <span class="label label-gps">5 zetels</span>
          <span class="label label-gps">5 deuren</span>
          <span class="label label-gps">2019</span>
          <span class="label label-gps">Benzine</span>
          <span class="label label-gps">gps</span>
          <span class="label label-automatic">automaat</span>
        </div>
        <div>Secret street 1, 9000 Gent</div>
      </div>
    `;

    const [car] = parseCalendarList(html);
    expect(car).toMatchObject({
      brandModel: 'Renault Captur',
      category: 'A',
      vehicleKind: 'Personenwagen',
      seats: 5,
      doors: 5,
      year: 2019,
      fuel: 'Benzine',
      features: ['gps', 'automaat'],
    });
    expect(JSON.stringify(car)).not.toContain('Secret street');
  });

  it('returns nothing when the page has no car rows', () => {
    expect(parseCalendarList('<div>empty</div>')).toEqual([]);
  });
});

describe('calendarListPath', () => {
  it('asks for the given page size and leaves the feature flags off', () => {
    const path = calendarListPath('2026-12-02 10:00', '2026-12-03 18:00', 10);
    const params = new URLSearchParams(path.split('?')[1]);
    expect(params.get('pageSize')).toBe('10');
    expect(params.get('filter')).toContain('from=2026-12-02 10:00');
    expect(params.get('filter')).toContain('until=2026-12-03 18:00');
    expect(params.get('filter')).toContain('fuel=ALL');
    expect(params.get('filter')).toContain('automatic=0');
    expect(params.get('filter')).not.toContain('automatic=1');
  });
});
