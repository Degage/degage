import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/actions/email-template/send', () => ({
  sendEmailByCode: vi.fn().mockResolvedValue({ id: 'sent' }),
}));

vi.mock('@/actions/utils', () => ({
  getSupportReplyToEmail: () => 'support@example.com',
}));

vi.mock('@/storage/user/user.read', () => ({
  dbUserReadEmailAndLocale: vi.fn(),
}));

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(() => 'en'),
}));

vi.mock('@/context/request-context', () => ({
  getRequestLocale: () => getRequestLocaleMock(),
}));

import { sendEmailByCode } from '@/actions/email-template/send';
import {
  buildAdminCarOnboardingUrl,
  formatOptionalEuro,
  notifyCarOnboardingCarValueCounter,
  notifyCarOnboardingCreated,
  notifyCarOnboardingOwnerWelcome,
  notifyCarOnboardingPinkFormUploaded,
  resolveOwnerContact,
  toEmailTemplateLocale,
} from '@/actions/car-onboarding/notify-notification-emails';
import { buildPublicCarOnboardingUrl } from '@/actions/car-onboarding/nudge-preparation';
import { TemplatesEnum } from '@/domain/email-template.model';
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

describe('notifyCarOnboardingPinkFormUploaded', () => {
  afterEach(() => {
    vi.clearAllMocks();
    getRequestLocaleMock.mockReset();
    getRequestLocaleMock.mockReturnValue('en');
  });

  it('sends pink form notification to backoffice', async () => {
    vi.mocked(dbUserReadEmailAndLocale).mockResolvedValueOnce({ email: 'owner@example.com', locale: 'nl' });

    await notifyCarOnboardingPinkFormUploaded(
      carOnboarding({
        id: onboardingId,
        owner: { id: 'user-1', name: 'Jane Doe' },
      }),
    );

    expect(sendEmailByCode).toHaveBeenCalledWith({
      to: 'support@example.com',
      code: TemplatesEnum.CarOnboardingPinkFormUploadedNotificationEmail,
      locale: 'en',
      variables: {
        BUTTON_URL: buildAdminCarOnboardingUrl(onboardingId),
        OWNER_NAME: 'Jane Doe',
        OWNER_EMAIL: 'owner@example.com',
      },
      replyTo: 'owner@example.com',
    });
  });

  it('no-ops without owner email', async () => {
    vi.mocked(dbUserReadEmailAndLocale).mockResolvedValueOnce(null);

    await notifyCarOnboardingPinkFormUploaded(
      carOnboarding({
        id: onboardingId,
        owner: { id: 'user-1', name: 'Jane Doe' },
      }),
    );

    expect(sendEmailByCode).not.toHaveBeenCalled();
  });
});

describe('notifyCarOnboardingCarValueCounter', () => {
  afterEach(() => {
    vi.clearAllMocks();
    getRequestLocaleMock.mockReset();
    getRequestLocaleMock.mockReturnValue('en');
  });

  it('sends car value counter notification with values and message', async () => {
    vi.mocked(dbUserReadEmailAndLocale).mockResolvedValueOnce({ email: 'owner@example.com', locale: 'nl' });

    await notifyCarOnboardingCarValueCounter(
      carOnboarding({
        id: onboardingId,
        owner: { id: 'user-1', name: 'Jane Doe' },
        carValue: 12_000,
        carValueCounterProposal: 14_000,
        carValueCounterProposalMessage: 'Based on recent listings',
      }),
    );

    expect(sendEmailByCode).toHaveBeenCalledWith({
      to: 'support@example.com',
      code: TemplatesEnum.CarOnboardingCarValueCounterNotificationEmail,
      locale: 'en',
      variables: {
        BUTTON_URL: buildAdminCarOnboardingUrl(onboardingId),
        OWNER_NAME: 'Jane Doe',
        OWNER_EMAIL: 'owner@example.com',
        PROPOSED_VALUE: '€ 12.000,00',
        COUNTER_VALUE: '€ 14.000,00',
        COUNTER_MESSAGE: 'Based on recent listings',
      },
      replyTo: 'owner@example.com',
    });
  });

  it('uses em dash when counter message is empty', async () => {
    vi.mocked(dbUserReadEmailAndLocale).mockResolvedValueOnce({ email: 'owner@example.com', locale: 'en' });

    await notifyCarOnboardingCarValueCounter(
      carOnboarding({
        id: onboardingId,
        owner: { id: 'user-1', name: 'Jane Doe' },
        carValue: 10_000,
        carValueCounterProposal: 9_000,
        carValueCounterProposalMessage: '   ',
      }),
    );

    expect(sendEmailByCode).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          COUNTER_MESSAGE: '—',
        }),
      }),
    );
  });
});

describe('notifyCarOnboardingOwnerWelcome', () => {
  afterEach(() => {
    vi.clearAllMocks();
    getRequestLocaleMock.mockReset();
    getRequestLocaleMock.mockReturnValue('en');
  });

  it('sends the owner welcome email', async () => {
    vi.mocked(dbUserReadEmailAndLocale).mockResolvedValueOnce({ email: 'owner@example.com', locale: 'nl' });

    await notifyCarOnboardingOwnerWelcome(
      carOnboarding({
        id: onboardingId,
        owner: { id: 'user-1', name: 'Jane Doe' },
      }),
    );

    expect(sendEmailByCode).toHaveBeenCalledWith({
      to: 'owner@example.com',
      code: TemplatesEnum.CarOnboardingCreatedEmail,
      locale: 'nl',
      variables: {
        BUTTON_URL: buildPublicCarOnboardingUrl(onboardingId),
      },
      replyTo: 'support@example.com',
    });
  });
});

describe('notifyCarOnboardingCreated', () => {
  afterEach(() => {
    vi.clearAllMocks();
    getRequestLocaleMock.mockReset();
    getRequestLocaleMock.mockReturnValue('en');
  });

  it('sends owner welcome and backoffice notification when onboarding is created with owner', async () => {
    vi.mocked(dbUserReadEmailAndLocale)
      .mockResolvedValueOnce({ email: 'owner@example.com', locale: 'nl' })
      .mockResolvedValueOnce({ email: 'owner@example.com', locale: 'nl' });

    await notifyCarOnboardingCreated(
      carOnboarding({
        id: onboardingId,
        owner: { id: 'user-1', name: 'Jane Doe' },
      }),
    );

    expect(sendEmailByCode).toHaveBeenCalledTimes(2);
    expect(sendEmailByCode).toHaveBeenNthCalledWith(1, {
      to: 'owner@example.com',
      code: TemplatesEnum.CarOnboardingCreatedEmail,
      locale: 'nl',
      variables: {
        BUTTON_URL: buildPublicCarOnboardingUrl(onboardingId),
      },
      replyTo: 'support@example.com',
    });
    expect(sendEmailByCode).toHaveBeenNthCalledWith(2, {
      to: 'support@example.com',
      code: TemplatesEnum.CarOnboardingCreatedNotificationEmail,
      locale: 'en',
      variables: {
        BUTTON_URL: buildAdminCarOnboardingUrl(onboardingId),
        OWNER_NAME: 'Jane Doe',
        OWNER_EMAIL: 'owner@example.com',
      },
      replyTo: 'owner@example.com',
    });
  });

  it('sends only backoffice notification with dashes when onboarding has no owner', async () => {
    await notifyCarOnboardingCreated(carOnboarding({ id: onboardingId, owner: null }));

    expect(dbUserReadEmailAndLocale).not.toHaveBeenCalled();
    expect(sendEmailByCode).toHaveBeenCalledTimes(1);
    expect(sendEmailByCode).toHaveBeenCalledWith({
      to: 'support@example.com',
      code: TemplatesEnum.CarOnboardingCreatedNotificationEmail,
      locale: 'en',
      variables: {
        BUTTON_URL: buildAdminCarOnboardingUrl(onboardingId),
        OWNER_NAME: '—',
        OWNER_EMAIL: '—',
      },
    });
  });
});
