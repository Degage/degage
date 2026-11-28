import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const replace = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { distance?: number }) => (values?.distance == null ? key : `${values.distance} km`),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/app/lib/auth', () => ({
  authClient: {
    useSession: () => ({ data: { user: { id: 'user-1' } }, isPending: false }),
  },
}));

vi.mock('@/app/lib/use-car-sharing-enabled', () => ({
  useCarSharingEnabled: () => 'enabled',
}));

import CarSharingPage, { CarSharingContent } from '@/app/car-sharing/page';

const jsonResponse = (status: string) => ({
  ok: true,
  json: async () => ({ status }),
});

describe('CarSharingContent', () => {
  afterEach(() => {
    cleanup();
    replace.mockClear();
    vi.unstubAllGlobals();
  });

  it('shows the period form without a connect link', () => {
    render(<CarSharingContent />);

    expect(screen.getByRole('heading', { name: 'title' })).toBeTruthy();
    expect(screen.getByText('intro')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'search' })).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('sends a visitor without a working Degapp connection back to the dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('missing')));

    render(<CarSharingPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/app/dashboard');
    });
    expect(screen.queryByRole('heading', { name: 'title' })).toBeNull();
  });

  it('shows the page when Degapp is connected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('success')));

    render(<CarSharingPage />);

    expect(await screen.findByRole('heading', { name: 'title' })).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it('lists the cars that are free for the chosen period', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse('success'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            cars: [
              {
                id: '550e8400-e29b-41d4-a716-446655440010',
                playCarId: 1793,
                name: 'Near car',
                distanceKm: 1.7,
                brandModel: 'Renault Captur',
                year: 2019,
                fuel: 'Benzine',
                features: ['gps'],
              },
            ],
          }),
        }),
    );

    render(<CarSharingPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'search' }));

    expect(await screen.findByText('Near car')).toBeTruthy();
    expect(screen.getByText('Renault Captur')).toBeTruthy();
    expect(screen.getByText('gps')).toBeTruthy();
    expect(screen.getByText('1.7 km')).toBeTruthy();
  });

  it('keeps the list and skips the grid when the car calendar is not intervals', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse('success'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            cars: [{ id: '550e8400-e29b-41d4-a716-446655440010', playCarId: 1793, name: 'Near car', distanceKm: 1.7 }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ available: false, cars: [], rides: [] }),
        }),
    );

    render(<CarSharingPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'search' }));
    fireEvent.click(await screen.findByRole('button', { name: 'week' }));

    expect(await screen.findByText('weekUnavailable')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('asks for a week of the ten nearest cars', async () => {
    const cars = Array.from({ length: 11 }, (_, index) => ({
      id: `550e8400-e29b-41d4-a716-4466554400${index.toString(16).padStart(2, '0')}`,
      playCarId: index + 1,
      name: `Car ${index + 1}`,
      distanceKm: index + 1,
    }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse('success'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cars }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ available: true, cars: [], rides: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    render(<CarSharingPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'search' }));
    fireEvent.click(await screen.findByRole('button', { name: 'week' }));

    const table = await screen.findByRole('table');
    const calendarBody = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body)) as { playCarIds: number[] };
    expect(calendarBody.playCarIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(screen.getAllByRole('row')).toHaveLength(11);
    expect(table.textContent).not.toContain('Car 11');
    expect(screen.getByText('Car 11')).toBeTruthy();
  });
});
