### Public features

- Added: on the car-sharing page you can pick a period and see the nearest free cars as tiles.
- Changed: how many cars come back is a search parameter. It defaults to 10.
- Added: a week of the ten nearest cars appears under that list once their calendars are loaded.

### Technical

- The search is one `GET /calendar/list` with Degapp’s default feature flags. Distance and the tile details stay on the response and are not stored.
- The week view is one `GET /calendarevents/car?id=&separator=` for each of the ten nearest cars. It starts as soon as the list is on screen. If that body is not reservation intervals, the grid stays out.
- Degapp datetime strings are parsed in the play connector. The week grid converts Brussels civil time with `@date-fns/tz`.
