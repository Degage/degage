import { getPrismaClient } from '@/storage/utils';

export type CarOnboardingCarLink = {
  id: string;
  carPcId: number;
  ownerId: string | null;
};

export const dbCarOnboardingFindByCarPcIds = async (carPcIds: number[]): Promise<CarOnboardingCarLink[]> => {
  if (carPcIds.length === 0) return [];
  const prisma = getPrismaClient();
  const rows = await prisma.carOnboarding.findMany({
    where: { carPcId: { in: carPcIds } },
    select: { id: true, carPcId: true, ownerId: true },
  });
  return rows.flatMap((row) => (row.carPcId == null ? [] : [{ id: row.id, carPcId: row.carPcId, ownerId: row.ownerId }]));
};
