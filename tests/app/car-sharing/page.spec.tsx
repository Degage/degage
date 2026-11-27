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
            cars: [{ id: '550e8400-e29b-41d4-a716-446655440010', playCarId: 1793, name: 'Near car', distanceKm: 1.7 }],
          }),
        }),
    );

    render(<CarSharingPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'search' }));

    expect(await screen.findByText('Near car')).toBeTruthy();
    expect(screen.getByText('1.7 km')).toBeTruthy();
  });
});
