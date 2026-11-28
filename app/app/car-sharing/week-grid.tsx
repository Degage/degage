'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';
import { type TrackBlock, type WeekRide, periodBlock, rideBlock, weekContaining } from '@/app/car-sharing/week';
import type { SharedCarSearchResult } from '@/domain/shared-car-search.model';

type CarSharingWeekGridProps = {
  cars: SharedCarSearchResult[];
  rides: WeekRide[];
  period: { from: string; until: string };
};

const TICKS = [25, 50, 75];

function Track({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-5 rounded-sm bg-stone-100">
      {TICKS.map((position) => (
        <span key={position} className="pointer-events-none absolute inset-y-0 w-px bg-stone-300/80" style={{ left: `${position}%` }} />
      ))}
      {children}
    </div>
  );
}

function Block({ block, className, kind }: { block: TrackBlock; className: string; kind: 'reserved' | 'searched' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={block.label}
          data-kind={kind}
          data-left={block.left}
          data-width={block.width}
          className={`absolute inset-y-0 hover:opacity-80 ${className}`}
          style={{ left: `${block.left}%`, width: `${block.width}%` }}
        />
      </TooltipTrigger>
      <TooltipContent>{block.label}</TooltipContent>
    </Tooltip>
  );
}

export function CarSharingWeekGrid({ cars, rides, period }: CarSharingWeekGridProps) {
  const t = useTranslations('carSharingPage');
  const days = weekContaining(period.from);

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-stone-200 px-3 py-2 text-xs text-stone-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-stone-900" />
          {t('reserved')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-[var(--public-brand)]" />
          {t('searched')}
        </span>
        <span className="text-stone-400">7:00–23:00</span>
      </div>
      <TooltipProvider>
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="w-36 px-3 py-2 font-medium" />
              {days.map((day) => (
                <th key={day.key} className="px-1.5 py-2 font-medium">
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id} className="border-b border-stone-100 last:border-b-0">
                <th className="w-36 px-3 py-2 font-medium whitespace-nowrap text-stone-900">{car.name}</th>
                {days.map((day) => {
                  const reserved = rides
                    .filter((ride) => ride.sharedCarId === car.id)
                    .flatMap((ride) => {
                      const block = rideBlock(ride, day);
                      return block ? [block] : [];
                    });
                  const searched = periodBlock(period, day);
                  return (
                    <td key={day.key} className="px-1.5 py-2">
                      <Track>
                        {searched ? <Block block={searched} kind="searched" className="z-10 bg-[var(--public-brand)]" /> : null}
                        {reserved.map((block) => (
                          <Block key={`${block.label}-${block.left}`} block={block} kind="reserved" className="z-20 bg-stone-900" />
                        ))}
                      </Track>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TooltipProvider>
    </div>
  );
}
