import { SharedCar } from '@/domain/shared-car.model';
import { Prisma } from '@/storage/client/client';

export const dbSharedCarToDomain = (car: Prisma.SharedCarGetPayload<object>): SharedCar => {
  return {
    id: car.id,
    playCarId: car.playCarId,
    name: car.name,
    ownerUserId: car.ownerUserId,
    onboardingId: car.onboardingId,
    createdAt: car.createdAt,
    updatedAt: car.updatedAt,
  };
};
