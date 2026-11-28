import { getPrismaClient } from '@/storage/utils';

export type SharedCarIdentity = {
  id: string;
  playCarId: number;
  name: string;
};

export const dbSharedCarFindByPlayCarIds = async (playCarIds: number[]): Promise<SharedCarIdentity[]> => {
  if (playCarIds.length === 0) return [];
  const prisma = getPrismaClient();
  return prisma.sharedCar.findMany({
    where: { playCarId: { in: playCarIds } },
    select: { id: true, playCarId: true, name: true },
  });
};
