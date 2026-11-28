import { Ride, RideSync } from '@/domain/ride.model';
import { getPrismaClient } from '@/storage/utils';
import { dbRideToDomain } from './ride.mappers';

export const dbRideReplaceForSharedCar = async (sharedCarId: string, rides: RideSync[]): Promise<Ride[]> => {
  const prisma = getPrismaClient();
  const syncedAt = new Date();
  const ids = rides.flatMap((ride) => (ride.playReservationId == null ? [] : [ride.playReservationId]));
  const stale = ids.length === 0 ? { sharedCarId } : { sharedCarId, OR: [{ playReservationId: null }, { playReservationId: { notIn: ids } }] };

  const saved = await prisma.$transaction(async (tx) => {
    await tx.ride.deleteMany({ where: stale });
    const rows = [];
    for (const ride of rides) {
      if (ride.playReservationId == null) continue;
      rows.push(
        await tx.ride.upsert({
          where: { playReservationId: ride.playReservationId },
          create: { ...ride, sharedCarId, lastSyncedAt: syncedAt },
          update: { ...ride, sharedCarId, lastSyncedAt: syncedAt },
        }),
      );
    }
    return rows;
  });

  return saved.map(dbRideToDomain);
};
