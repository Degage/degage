import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/storage/user/user.read', () => ({
  dbUserReadEmailAndLocale: vi.fn(),
}));

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(() => 'en'),
}));

vi.mock('@/context/request-context', () => ({
  getRequestLocale: () => getRequestLocaleMock(),
}));

import {
  buildAdminCarOnboardingUrl,
  formatOptionalEuro,
  resolveOwnerContact,
  toEmailTemplateLocale,
} from '@/actions/car-onboarding/notify-notification-emails';
import { dbUserReadEmailAndLocale } from '@/storage/user/user.read';
import { carOnboarding } from '../../builders/car-onboarding.builder';

const onboardingId = '550e8400-e29b-41d4-a716-446655440000';

describe('notify-notification-emails helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
    getRequestLocaleMock.mockReset();
    getRequestLocaleMock.mockReturnValue('en');
  });

  it('builds the admin car onboarding url', () => {
    expect(buildAdminCarOnboardingUrl(onboardingId)).toBe(`http://localhost:3000/app/admin/car-onboardings/${onboardingId}`);
  });

  it('maps locales and falls back to the default', () => {
    expect(toEmailTemplateLocale('nl')).toBe('nl');
    expect(toEmailTemplateLocale('nope')).toBe('nl');
    expect(toEmailTemplateLocale()).toBe('en');
  });

  it('formats euro amounts for email copy', () => {
    expect(formatOptionalEuro(null)).toBe('—');
    expect(formatOptionalEuro(12_000)).toBe('€ 12.000,00');
  });

  it('resolves owner contact from the onboarding owner', async () => {
    vi.mocked(dbUserReadEmailAndLocale).mockResolvedValueOnce({ email: 'owner@example.com', locale: 'nl' });

    await expect(
      resolveOwnerContact(
        carOnboarding({
          id: onboardingId,
          owner: { id: 'user-1', name: 'Jane Doe' },
        }),
      ),
    ).resolves.toEqual({
      email: 'owner@example.com',
      name: 'Jane Doe',
      locale: 'nl',
    });
  });

  it('returns null when owner email is missing', async () => {
    vi.mocked(dbUserReadEmailAndLocale).mockResolvedValueOnce(null);

    await expect(
      resolveOwnerContact(
        carOnboarding({
          id: onboardingId,
          owner: { id: 'user-1', name: 'Jane Doe' },
        }),
      ),
    ).resolves.toBeNull();
  });
});
