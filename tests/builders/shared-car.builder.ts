import { SharedCar } from '@/domain/shared-car.model';

export const sharedCar = (data: Partial<SharedCar> = {}): SharedCar => {
  return {
    id: data.id === undefined ? '550e8400-e29b-41d4-a716-446655440010' : data.id,
    playCarId: data.playCarId ?? 1793,
    name: data.name ?? 'Reno',
    ownerUserId: data.ownerUserId ?? null,
    onboardingId: data.onboardingId ?? null,
    createdAt: data.createdAt ?? new Date('2025-01-01T00:00:00Z'),
    updatedAt: data.updatedAt ?? new Date('2025-01-01T00:00:00Z'),
  };
};
