import { SharedCar, SharedCarUpsert } from '@/domain/shared-car.model';
import { getPrismaClient } from '@/storage/utils';
import { dbSharedCarToDomain } from './shared-car.mappers';

export const dbSharedCarUpsertByPlayCarId = async (car: SharedCarUpsert): Promise<SharedCar> => {
  const prisma = getPrismaClient();
  const saved = await prisma.sharedCar.upsert({
    where: { playCarId: car.playCarId },
    create: {
      playCarId: car.playCarId,
      name: car.name,
      ownerUserId: car.ownerUserId,
      onboardingId: car.onboardingId,
    },
    update: {
      name: car.name,
      ownerUserId: car.ownerUserId,
      onboardingId: car.onboardingId,
    },
  });
  return dbSharedCarToDomain(saved);
};
