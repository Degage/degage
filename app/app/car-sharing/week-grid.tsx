'use client';

import type { SharedCarSearchResult } from '@/domain/shared-car-search.model';
import { type WeekRide, periodOverlapsDay, rideLabel, weekContaining } from '@/app/car-sharing/week';

type CarSharingWeekGridProps = {
  cars: SharedCarSearchResult[];
  rides: WeekRide[];
  period: { from: string; until: string };
};

export function CarSharingWeekGrid({ cars, rides, period }: CarSharingWeekGridProps) {
  const days = weekContaining(period.from);

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-stone-500">
            <th className="px-3 py-2 font-medium" />
            {days.map((day) => (
              <th key={day.key} className="px-3 py-2 font-medium">
                {day.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id} className="border-b border-stone-100 last:border-b-0">
              <th className="px-3 py-3 font-medium text-stone-900">{car.name}</th>
              {days.map((day) => {
                const labels = rides
                  .filter((ride) => ride.sharedCarId === car.id)
                  .flatMap((ride) => {
                    const label = rideLabel(ride, day);
                    return label ? [label] : [];
                  });
                const highlighted = periodOverlapsDay(period, day);
                const cellClassName = highlighted ? 'bg-amber-50 px-3 py-3' : 'px-3 py-3';
                return (
                  <td key={day.key} data-highlighted={highlighted ? 'true' : 'false'} className={cellClassName}>
                    {labels.map((label) => (
                      <div key={label}>{label}</div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
