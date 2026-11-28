import { Ride } from '@/domain/ride.model';
import { Prisma } from '@/storage/client/client';

export const dbRideToDomain = (ride: Prisma.RideGetPayload<object>): Ride => {
  return {
    id: ride.id,
    sharedCarId: ride.sharedCarId,
    borrowerId: ride.borrowerId,
    status: ride.status,
    startsAt: ride.startsAt,
    endsAt: ride.endsAt,
    playReservationId: ride.playReservationId,
    lastSyncedAt: ride.lastSyncedAt,
    createdAt: ride.createdAt,
    updatedAt: ride.updatedAt,
  };
};
