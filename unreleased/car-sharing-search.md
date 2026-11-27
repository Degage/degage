### Public features

- Added: on the car-sharing page you can pick a period and see the ten nearest cars that are free the whole time.
- Added: after that list, you can open a week view of the same cars.

### Technical

- The search is one `GET /calendar/list` with Degapp’s default feature flags. Distance stays on the response and is not stored.
- The week view is one `GET /calendarevents/car` per listed car. If that body is not reservation intervals, the grid stays out.
