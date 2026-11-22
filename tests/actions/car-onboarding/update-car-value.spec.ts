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
    notifyCarOnboardingCarValueCounter: vi.fn(),
  };
});

import { CarOnboardingCarValueStatus } from '@/domain/car-onboarding.model';
import { Role } from '@/domain/role.model';
import { CarOnboardingForbiddenError } from '@/actions/car-onboarding/car-onboarding-forbidden.error';
import { CarOnboardingInvalidCarValueStatusError } from '@/actions/car-onboarding/car-onboarding-invalid-car-value-status.error';
import { notifyCarOnboardingCarValueCounter } from '@/actions/car-onboarding/notify-notification-emails';
import { updateCarOnboardingCarValue } from '@/actions/car-onboarding/update-car-value';
import { dbCarOnboardingReadWithRelations } from '@/storage/car-onboarding/car-onboarding.read';
import { saveCarOnboardingWithPreparationCheck } from '@/actions/car-onboarding/save-with-preparation';
import { carOnboarding } from '../../builders/car-onboarding.builder';

const onboardingId = '550e8400-e29b-41d4-a716-446655440000';
const owner = { id: 'user-1', role: 'user', banned: false };
const admin = { id: 'admin-1', role: Role.ADMIN, banned: false };

describe('updateCarOnboardingCarValue', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('submits counter proposal and notifies backoffice', async () => {
    vi.mocked(dbCarOnboardingReadWithRelations).mockResolvedValueOnce(
      carOnboarding({
        id: onboardingId,
        owner: { id: owner.id },
        carValue: 12_000,
        carValueStatus: CarOnboardingCarValueStatus.PROPOSAL,
      }),
    );
    const saved = carOnboarding({
      id: onboardingId,
      owner: { id: owner.id },
      carValue: 12_000,
      carValueCounterProposal: 14_000,
      carValueCounterProposalMessage: 'Based on recent listings',
      carValueStatus: CarOnboardingCarValueStatus.COUNTER,
    });
    vi.mocked(saveCarOnboardingWithPreparationCheck).mockResolvedValueOnce(saved);

    const body = {
      carValueCounterProposal: 14_000,
      carValueCounterProposalMessage: 'Based on recent listings',
    };

    await updateCarOnboardingCarValue(onboardingId, body, owner);

    expect(saveCarOnboardingWithPreparationCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        carValueCounterProposal: 14_000,
        carValueCounterProposalMessage: 'Based on recent listings',
        carValueStatus: CarOnboardingCarValueStatus.COUNTER,
      }),
    );
    expect(notifyCarOnboardingCarValueCounter).toHaveBeenCalledWith(saved);
  });

  it('does not notify when an admin submits a counter', async () => {
    vi.mocked(dbCarOnboardingReadWithRelations).mockResolvedValueOnce(
      carOnboarding({
        id: onboardingId,
        owner: { id: owner.id },
        carValueStatus: CarOnboardingCarValueStatus.PROPOSAL,
      }),
    );
    vi.mocked(saveCarOnboardingWithPreparationCheck).mockResolvedValueOnce(carOnboarding({ id: onboardingId }));

    await updateCarOnboardingCarValue(onboardingId, { carValueCounterProposal: 14_000, carValueCounterProposalMessage: null }, admin);

    expect(notifyCarOnboardingCarValueCounter).not.toHaveBeenCalled();
  });

  it('throws when status is not proposal', async () => {
    vi.mocked(dbCarOnboardingReadWithRelations).mockResolvedValueOnce(carOnboarding({ id: onboardingId, owner: { id: owner.id } }));

    await expect(
      updateCarOnboardingCarValue(onboardingId, { carValueCounterProposal: 14_000, carValueCounterProposalMessage: null }, owner),
    ).rejects.toThrow(CarOnboardingInvalidCarValueStatusError);
  });

  it('throws when user is not the owner', async () => {
    vi.mocked(dbCarOnboardingReadWithRelations).mockResolvedValueOnce(
      carOnboarding({
        id: onboardingId,
        owner: { id: owner.id },
        carValueStatus: CarOnboardingCarValueStatus.PROPOSAL,
      }),
    );

    await expect(
      updateCarOnboardingCarValue(
        onboardingId,
        { carValueCounterProposal: 14_000, carValueCounterProposalMessage: null },
        { id: 'other-user', role: 'user', banned: false },
      ),
    ).rejects.toThrow(CarOnboardingForbiddenError);
  });
});
