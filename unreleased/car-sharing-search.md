### Public features
- Added: on the car-sharing page you can pick a period and see the ten nearest cars that are free the whole time.

### Technical
- The search is one `GET /calendar/list` with Degapp’s default feature flags. Distance stays on the response and is not stored.
