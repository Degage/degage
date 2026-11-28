import {
  type SharedCarSearchPeriod,
  type SharedCarSearchResult,
  sharedCarSearchPeriodSchema,
  sharedCarSearchResultSchema,
  toDegappPeriod,
} from '@/domain/shared-car-search.model';
import { getPlaySessionCookie } from '@/actions/play-connector/get-session-cookie';
import { fetchPlay } from '@/play-connector/client';
import { calendarListPath, parseCalendarList } from '@/play-connector/parsers/calendar-list.parser';
import { dbCarOnboardingFindByCarPcIds } from '@/storage/car-onboarding/car-onboarding.find-by-car-pc-ids';
import { dbSharedCarUpsertByPlayCarId } from '@/storage/shared-car/shared-car.upsert';

export const searchAvailableSharedCars = async (userId: string, period: SharedCarSearchPeriod): Promise<SharedCarSearchResult[]> => {
  const validated = sharedCarSearchPeriodSchema.parse(period);
  const { cookieHeader } = await getPlaySessionCookie(userId);
  const path = calendarListPath(toDegappPeriod(validated.from), toDegappPeriod(validated.until), validated.limit);
  const { html } = await fetchPlay(path, cookieHeader);
  const available = parseCalendarList(html).slice(0, validated.limit);
  const links = await dbCarOnboardingFindByCarPcIds(available.map((car) => car.playCarId));
  const linkByPlayCarId = new Map(links.map((link) => [link.carPcId, link]));

  const results: SharedCarSearchResult[] = [];
  for (const car of available) {
    const link = linkByPlayCarId.get(car.playCarId);
    const saved = await dbSharedCarUpsertByPlayCarId({
      playCarId: car.playCarId,
      name: car.name,
      ownerUserId: link?.ownerId ?? null,
      onboardingId: link?.id ?? null,
    });
    results.push(
      sharedCarSearchResultSchema.parse({
        id: saved.id,
        playCarId: saved.playCarId,
        name: saved.name,
        distanceKm: car.distanceKm,
        brandModel: car.brandModel,
        category: car.category,
        vehicleKind: car.vehicleKind,
        seats: car.seats,
        doors: car.doors,
        year: car.year,
        fuel: car.fuel,
        features: car.features,
      }),
    );
  }
  return results;
};
