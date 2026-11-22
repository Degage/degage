import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/storage/car-onboarding/car-onboarding.read', () => ({
  dbCarOnboardingReadWithRelations: vi.fn(),
}));

vi.mock('@/actions/car-onboarding/save-with-preparation', () => ({
  saveCarOnboardingWithPreparationCheck: vi.fn(),
}));

vi.mock('@/actions/car-onboarding/notify-notification-emails', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/actions/car-onboarding/notify-notification-emails')>();
  return {
    ...actual,
    notifyCarOnboardingOwnerWelcome: vi.fn(),
  };
});

import { CarOnboardingCarValueStatus } from '@/domain/car-onboarding.model';
import { notifyCarOnboardingOwnerWelcome } from '@/actions/car-onboarding/notify-notification-emails';
import { updateCarOnboarding } from '@/actions/car-onboarding/update';
import { dbCarOnboardingReadWithRelations } from '@/storage/car-onboarding/car-onboarding.read';
import { saveCarOnboardingWithPreparationCheck } from '@/actions/car-onboarding/save-with-preparation';
import { carOnboarding } from '../../builders/car-onboarding.builder';

const onboardingId = '550e8400-e29b-41d4-a716-446655440000';

describe('updateCarOnboarding', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('transitions car value status to proposal when admin changes car value from todo', async () => {
    const existing = carOnboarding({ id: onboardingId, carValue: 10_000, carValueStatus: CarOnboardingCarValueStatus.TODO });
    const updatedBody = carOnboarding({ id: onboardingId, carValue: 12_000, carValueStatus: CarOnboardingCarValueStatus.TODO });

    vi.mocked(dbCarOnboardingReadWithRelations).mockResolvedValueOnce(existing);
    vi.mocked(saveCarOnboardingWithPreparationCheck).mockResolvedValueOnce(updatedBody);

    await updateCarOnboarding(updatedBody);

    expect(saveCarOnboardingWithPreparationCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        carValue: 12_000,
        carValueStatus: CarOnboardingCarValueStatus.PROPOSAL,
      }),
    );
    expect(notifyCarOnboardingOwnerWelcome).not.toHaveBeenCalled();
  });

  it('sends owner welcome when owner is assigned for the first time', async () => {
    const existing = carOnboarding({ id: onboardingId, owner: null });
    const saved = carOnboarding({ id: onboardingId, owner: { id: 'user-1', name: 'Jane Doe' } });

    vi.mocked(dbCarOnboardingReadWithRelations).mockResolvedValueOnce(existing);
    vi.mocked(saveCarOnboardingWithPreparationCheck).mockResolvedValueOnce(saved);

    await updateCarOnboarding(saved);

    expect(notifyCarOnboardingOwnerWelcome).toHaveBeenCalledWith(saved);
  });

  it('does not send owner welcome when owner was already set', async () => {
    const existing = carOnboarding({ id: onboardingId, owner: { id: 'user-1', name: 'Jane' } });
    const saved = carOnboarding({ id: onboardingId, owner: { id: 'user-2', name: 'Other' } });

    vi.mocked(dbCarOnboardingReadWithRelations).mockResolvedValueOnce(existing);
    vi.mocked(saveCarOnboardingWithPreparationCheck).mockResolvedValueOnce(saved);

    await updateCarOnboarding(saved);

    expect(notifyCarOnboardingOwnerWelcome).not.toHaveBeenCalled();
  });
});
