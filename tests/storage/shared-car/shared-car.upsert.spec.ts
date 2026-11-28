import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/storage/utils', () => ({
  getPrismaClient: vi.fn(),
}));

import { dbSharedCarUpsertByPlayCarId } from '@/storage/shared-car/shared-car.upsert';
import { getPrismaClient } from '@/storage/utils';

describe('dbSharedCarUpsertByPlayCarId', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('upserts on the Degapp car id and returns the domain car', async () => {
    const now = new Date('2025-01-01T00:00:00Z');
    const mockPrisma = {
      sharedCar: {
        upsert: vi.fn().mockResolvedValue({
          id: '550e8400-e29b-41d4-a716-446655440010',
          playCarId: 1793,
          name: 'Reno',
          ownerUserId: null,
          onboardingId: null,
          createdAt: now,
          updatedAt: now,
        }),
      },
    };
    vi.mocked(getPrismaClient).mockReturnValue(mockPrisma as never);

    const result = await dbSharedCarUpsertByPlayCarId({
      playCarId: 1793,
      name: 'Reno',
      ownerUserId: null,
      onboardingId: null,
    });

    expect(mockPrisma.sharedCar.upsert).toHaveBeenCalledWith({
      where: { playCarId: 1793 },
      create: { playCarId: 1793, name: 'Reno', ownerUserId: null, onboardingId: null },
      update: { name: 'Reno', ownerUserId: null, onboardingId: null },
    });
    expect(result.playCarId).toBe(1793);
    expect(result.name).toBe('Reno');
  });
});
