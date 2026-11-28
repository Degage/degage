import {
  sharedCarSearchPeriodSchema,
  sharedCarSearchResultSchema,
  toDegappPeriod,
  type SharedCarSearchPeriod,
  type SharedCarSearchResult,
} from '@/domain/shared-car-search.model';
import { getPlaySessionCookie } from '@/actions/play-connector/get-session-cookie';
import { fetchPlay } from '@/play-connector/client';
import { CALENDAR_LIST_PAGE_SIZE, calendarListPath, parseCalendarList } from '@/play-connector/parsers/calendar-list.parser';
import { dbCarOnboardingFindByCarPcIds } from '@/storage/car-onboarding/car-onboarding.find-by-car-pc-ids';
import { dbSharedCarUpsertByPlayCarId } from '@/storage/shared-car/shared-car.upsert';

export const searchAvailableSharedCars = async (userId: string, period: SharedCarSearchPeriod): Promise<SharedCarSearchResult[]> => {
  const validated = sharedCarSearchPeriodSchema.parse(period);
  const { cookieHeader } = await getPlaySessionCookie(userId);
  const { html } = await fetchPlay(calendarListPath(toDegappPeriod(validated.from), toDegappPeriod(validated.until)), cookieHeader);
  const available = parseCalendarList(html).slice(0, CALENDAR_LIST_PAGE_SIZE);
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
      }),
    );
  }
  return results;
};
