import { getPrismaClient } from '@/storage/utils';

export type UserDegappLink = {
  id: string;
  degappUserId: string;
};

export const dbUserFindIdsByDegappUserIds = async (degappUserIds: string[]): Promise<UserDegappLink[]> => {
  if (degappUserIds.length === 0) return [];
  const prisma = getPrismaClient();
  const rows = await prisma.user.findMany({
    where: { degappUserId: { in: degappUserIds } },
    select: { id: true, degappUserId: true },
  });
  return rows.flatMap((row) => (row.degappUserId == null ? [] : [{ id: row.id, degappUserId: row.degappUserId }]));
};
