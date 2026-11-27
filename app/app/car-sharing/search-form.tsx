'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

import { CarSharingWeekGrid } from '@/app/car-sharing/week-grid';
import type { WeekRide } from '@/app/car-sharing/week';
import type { SharedCarSearchResult } from '@/domain/shared-car-search.model';
import type { RideStatus } from '@/domain/ride.model';

const pad = (value: number): string => String(value).padStart(2, '0');

const toLocalInput = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const defaultPeriod = (): { from: string; until: string } => {
  const from = new Date();
  from.setDate(from.getDate() + 1);
  from.setHours(10, 0, 0, 0);
  const until = new Date(from);
  until.setDate(until.getDate() + 1);
  until.setHours(18, 0, 0, 0);
  return { from: toLocalInput(from), until: toLocalInput(until) };
};

const fieldClassName =
  'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--public-brand)]';

const buttonClassName = [
  'rounded-full bg-[var(--public-brand)] px-5 py-2 text-sm font-semibold text-white',
  'hover:bg-[var(--public-brand-hover)] disabled:opacity-60',
].join(' ');

type CalendarResponse = {
  available?: boolean;
  rides?: Array<{ sharedCarId: string; status: RideStatus; startsAt: string; endsAt: string }>;
};

export function CarSharingSearchForm() {
  const t = useTranslations('carSharingPage');
  const [period, setPeriod] = useState(defaultPeriod);
  const [cars, setCars] = useState<SharedCarSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [week, setWeek] = useState<'hidden' | 'loading' | 'ready' | 'unavailable'>('hidden');
  const [weekRides, setWeekRides] = useState<WeekRide[]>([]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearching(true);
    setFailed(false);
    setWeek('hidden');
    setWeekRides([]);
    try {
      const response = await fetch('/api/car-sharing/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(period),
      });
      if (!response.ok) throw new Error('search failed');
      const data = (await response.json()) as { cars?: SharedCarSearchResult[] };
      setCars(data.cars ?? []);
    } catch {
      setCars(null);
      setFailed(true);
    } finally {
      setSearching(false);
    }
  };

  const onShowWeek = async () => {
    if (!cars?.length) return;
    setWeek('loading');
    try {
      const response = await fetch('/api/car-sharing/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playCarIds: cars.map((car) => car.playCarId) }),
      });
      if (!response.ok) throw new Error('calendar failed');
      const data = (await response.json()) as CalendarResponse;
      if (!data.available) {
        setWeekRides([]);
        setWeek('unavailable');
        return;
      }
      setWeekRides(
        (data.rides ?? []).map((ride) => ({
          sharedCarId: ride.sharedCarId,
          status: ride.status,
          startsAt: new Date(ride.startsAt),
          endsAt: new Date(ride.endsAt),
        })),
      );
      setWeek('ready');
    } catch {
      setWeekRides([]);
      setWeek('unavailable');
    }
  };

  return (
    <div className="mt-8">
      <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={onSubmit}>
        <label className="text-sm font-medium text-stone-700">
          {t('from')}
          <input
            className={fieldClassName}
            type="datetime-local"
            value={period.from}
            onChange={(event) => setPeriod((current) => ({ ...current, from: event.target.value }))}
            required
          />
        </label>
        <label className="text-sm font-medium text-stone-700">
          {t('until')}
          <input
            className={fieldClassName}
            type="datetime-local"
            value={period.until}
            onChange={(event) => setPeriod((current) => ({ ...current, until: event.target.value }))}
            required
          />
        </label>
        <button className={buttonClassName} type="submit" disabled={searching}>
          {searching ? t('searching') : t('search')}
        </button>
      </form>

      {failed ? <p className="mt-4 text-sm text-red-700">{t('error')}</p> : null}

      {cars ? (
        cars.length === 0 ? (
          <p className="mt-6 text-sm text-stone-600">{t('empty')}</p>
        ) : (
          <ul className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {cars.map((car) => (
              <li key={car.id} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <span className="font-medium text-stone-900">{car.name}</span>
                <span className="text-sm text-stone-500">{t('distance', { distance: car.distanceKm })}</span>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {cars && cars.length > 0 && week === 'hidden' ? (
        <button className={`${buttonClassName} mt-4`} type="button" onClick={() => void onShowWeek()}>
          {t('week')}
        </button>
      ) : null}
      {week === 'loading' ? <p className="mt-4 text-sm text-stone-500">{t('weekLoading')}</p> : null}
      {week === 'unavailable' ? <p className="mt-4 text-sm text-stone-600">{t('weekUnavailable')}</p> : null}
      {week === 'ready' && cars ? <CarSharingWeekGrid cars={cars} rides={weekRides} period={period} /> : null}
    </div>
  );
}
