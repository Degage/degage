import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { CarSharingWeekGrid } from '@/app/car-sharing/week-grid';
import { brusselsDateTime } from '@/app/car-sharing/brussels-time';

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

  it('places reserved time and the searched period on a 7:00–23:00 track', () => {
    render(
      <CarSharingWeekGrid
        cars={[car]}
        period={period}
        rides={[
          {
            sharedCarId: car.id,
            status: 'confirmed',
            startsAt: brusselsDateTime('2026-12-02 10:00')!,
            endsAt: brusselsDateTime('2026-12-02 12:00')!,
          },
          {
            sharedCarId: car.id,
            status: 'declined',
            startsAt: brusselsDateTime('2026-12-02 13:00')!,
            endsAt: brusselsDateTime('2026-12-02 14:00')!,
          },
        ]}
      />,
    );

    expect(screen.getByText('Near car')).toBeTruthy();
    expect(screen.queryByText('10:00–12:00')).toBeNull();

    const reserved = screen.getByRole('button', { name: '10:00–12:00' });
    expect(reserved.dataset.kind).toBe('reserved');
    expect(reserved.dataset.left).toBe('18.8');
    expect(reserved.dataset.width).toBe('12.5');
    expect(screen.queryByRole('button', { name: '13:00–14:00' })).toBeNull();

    const searched = screen.getAllByRole('button').filter((node) => node.getAttribute('data-kind') === 'searched');
    expect(searched.map((node) => node.getAttribute('aria-label'))).toEqual(['10:00–23:00', '07:00–18:00']);
  });
});
