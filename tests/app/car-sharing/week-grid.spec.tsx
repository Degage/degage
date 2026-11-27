import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CarSharingWeekGrid } from '@/app/car-sharing/week-grid';
import { parsePlayLocalDateTime } from '@/domain/play-local-time';

const car = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  playCarId: 1793,
  name: 'Near car',
  distanceKm: 1.7,
};

const period = { from: '2026-12-02T10:00', until: '2026-12-03T18:00' };

describe('CarSharingWeekGrid', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows a ride on the surrounding week and highlights the chosen days', () => {
    render(
      <CarSharingWeekGrid
        cars={[car]}
        period={period}
        rides={[
          {
            sharedCarId: car.id,
            status: 'confirmed',
            startsAt: parsePlayLocalDateTime('2026-12-02 10:00')!,
            endsAt: parsePlayLocalDateTime('2026-12-02 12:00')!,
          },
          {
            sharedCarId: car.id,
            status: 'declined',
            startsAt: parsePlayLocalDateTime('2026-12-02 13:00')!,
            endsAt: parsePlayLocalDateTime('2026-12-02 14:00')!,
          },
        ]}
      />,
    );

    expect(screen.getByText('Near car')).toBeTruthy();
    expect(screen.getByText('10:00–12:00')).toBeTruthy();
    expect(screen.queryByText('13:00–14:00')).toBeNull();
    const highlighted = document.querySelectorAll('[data-highlighted="true"]');
    expect(highlighted.length).toBe(2);
  });
});
