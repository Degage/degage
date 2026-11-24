import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DashboardPage } from '@/app/components/dashboard/dashboard-page';
import { type CarSharingAvailability } from '@/app/lib/use-car-sharing-enabled';

const availability = vi.hoisted(() => ({ current: 'disabled' as CarSharingAvailability }));

vi.mock('@/app/lib/use-car-sharing-enabled', () => ({
  useCarSharingEnabled: () => availability.current,
}));

vi.mock('@/app/lib/role', () => ({
  useIsAdmin: () => ({ isAdmin: false, isPending: false }),
}));

const messages = {
  dashboard: {
    title: 'Welcome back, {name}',
    intro: 'Here is what you can do.',
    cards: {
      simulation: { title: 'New simulation', description: 'Check a car.', cta: 'Start simulation' },
      faq: { title: 'Help & FAQ', description: 'Browse articles.', cta: 'Open help' },
      admin: { title: 'Admin', description: 'Manage users.', cta: 'Go to admin' },
      carSharing: {
        title: 'Car sharing',
        description: 'Find a shared car.',
        cta: 'Open car sharing',
        connect: 'Connect Degapp',
        loadError: 'The Degapp connection could not be loaded.',
      },
    },
  },
};

const renderDashboard = () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DashboardPage name="Ada" />
    </NextIntlClientProvider>,
  );
};

const jsonResponse = (status: string) => ({
  ok: true,
  json: async () => ({ status }),
});

describe('DashboardPage car sharing card', () => {
  afterEach(() => {
    cleanup();
    availability.current = 'disabled';
    vi.unstubAllGlobals();
  });

  it('hides the car-sharing card while the flag is off or still loading', () => {
    availability.current = 'disabled';
    renderDashboard();
    expect(screen.queryByRole('heading', { name: 'Car sharing' })).toBeNull();

    cleanup();
    availability.current = 'loading';
    renderDashboard();
    expect(screen.queryByRole('heading', { name: 'Car sharing' })).toBeNull();
  });

  it('opens car sharing when Degapp is connected', async () => {
    availability.current = 'enabled';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('success')));
    renderDashboard();

    expect((await screen.findByRole('link', { name: 'Open car sharing' })).getAttribute('href')).toBe('/app/car-sharing');
  });

  it('sends a missing Degapp connection to the existing settings tab', async () => {
    availability.current = 'enabled';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('missing')));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Connect Degapp' }).getAttribute('href')).toBe(
        '/app/account/settings?tab=play-connector&redirectTo=%2Fapp%2Fcar-sharing',
      );
    });
  });

  it('shows a load error and no link when Degapp status cannot be read', async () => {
    availability.current = 'enabled';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    renderDashboard();

    expect(await screen.findByText('The Degapp connection could not be loaded.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Open car sharing' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Connect Degapp' })).toBeNull();
  });
});
