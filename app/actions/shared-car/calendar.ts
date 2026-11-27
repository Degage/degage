import { getPlaySessionCookie } from '@/actions/play-connector/get-session-cookie';
import { type SharedCarCalendarRequest, type SharedCarCalendarRide, sharedCarCalendarRequestSchema } from '@/domain/shared-car-calendar.model';
import { fetchPlay } from '@/play-connector/client';
import { type ParsedCarRide, calendarEventsPath, parseCalendarEvents } from '@/play-connector/parsers/calendar-events.parser';
import { dbRideReplaceForSharedCar } from '@/storage/ride/ride.replace-for-shared-car';
import { type SharedCarIdentity, dbSharedCarFindByPlayCarIds } from '@/storage/shared-car/shared-car.find-by-play-car-ids';
import { dbUserFindIdsByDegappUserIds } from '@/storage/user/user.find-by-degapp-user-ids';

export type SharedCarCalendar = {
  available: boolean;
  cars: SharedCarIdentity[];
  rides: SharedCarCalendarRide[];
};

const unavailable = (): SharedCarCalendar => ({ available: false, cars: [], rides: [] });

export const syncSharedCarCalendar = async (userId: string, request: SharedCarCalendarRequest): Promise<SharedCarCalendar> => {
  const playCarIds = [...new Set(sharedCarCalendarRequestSchema.parse(request).playCarIds)];
  const known = await dbSharedCarFindByPlayCarIds(playCarIds);
  const byPlayCarId = new Map(known.map((car) => [car.playCarId, car]));
  const cars = playCarIds.flatMap((playCarId) => {
    const car = byPlayCarId.get(playCarId);
    return car ? [car] : [];
  });
  if (cars.length === 0) return unavailable();

  const { cookieHeader } = await getPlaySessionCookie(userId);
  const parsed: { car: SharedCarIdentity; rides: ParsedCarRide[] }[] = [];
  for (const car of cars) {
    const { html } = await fetchPlay(calendarEventsPath(car.playCarId), cookieHeader);
    const events = parseCalendarEvents(html);
    if (!events.recognized) return unavailable();
    parsed.push({ car, rides: events.rides });
  }

  const degappUserIds = [...new Set(parsed.flatMap((item) => item.rides.flatMap((ride) => (ride.degappUserId ? [ride.degappUserId] : []))))];
  const borrowers = await dbUserFindIdsByDegappUserIds(degappUserIds);
  const borrowerByDegappUserId = new Map(borrowers.map((borrower) => [borrower.degappUserId, borrower.id]));

  const rides: SharedCarCalendarRide[] = [];
  for (const item of parsed) {
    const saved = await dbRideReplaceForSharedCar(
      item.car.id,
      item.rides.map((ride) => ({
        sharedCarId: item.car.id,
        borrowerId: ride.degappUserId ? (borrowerByDegappUserId.get(ride.degappUserId) ?? null) : null,
        status: ride.status,
        startsAt: ride.startsAt,
        endsAt: ride.endsAt,
        playReservationId: ride.playReservationId,
      })),
    );
    rides.push(
      ...saved.flatMap((ride) =>
        ride.id ? [{ id: ride.id, sharedCarId: ride.sharedCarId, status: ride.status, startsAt: ride.startsAt, endsAt: ride.endsAt }] : [],
      ),
    );
  }

  return { available: true, cars, rides };
};
