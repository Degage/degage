import { cleanup, render, screen } from '@testing-library/react';
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
      carSharing: { title: 'Car sharing', description: 'Find a shared car.', cta: 'Open car sharing' },
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

describe('DashboardPage car sharing card', () => {
  afterEach(() => {
    cleanup();
    availability.current = 'disabled';
  });

  it('hides the car-sharing card while the flag is off or still loading', () => {
    availability.current = 'disabled';
    renderDashboard();
    expect(screen.queryByRole('link', { name: 'Open car sharing' })).toBeNull();

    cleanup();
    availability.current = 'loading';
    renderDashboard();
    expect(screen.queryByRole('link', { name: 'Open car sharing' })).toBeNull();
  });

  it('links to the car-sharing page when the flag is on', () => {
    availability.current = 'enabled';
    renderDashboard();

    expect(screen.getByRole('link', { name: 'Open car sharing' }).getAttribute('href')).toBe('/app/car-sharing');
  });
});
