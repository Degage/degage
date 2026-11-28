import * as z from 'zod';

export const rideStatusValues = ['requested', 'confirmed', 'declined'] as const;

export const rideStatusSchema = z.enum(rideStatusValues);

export type RideStatus = z.infer<typeof rideStatusSchema>;

export const rideSchema = z
  .object({
    id: z.uuid().nullable(),
    sharedCarId: z.uuid(),
    borrowerId: z.uuid().nullable().default(null),
    status: rideStatusSchema,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    playReservationId: z.number().int().positive().nullable().default(null),
    lastSyncedAt: z.coerce.date().nullable().default(null),
    createdAt: z.coerce.date().nullable().default(null),
    updatedAt: z.coerce.date().nullable().default(null),
  })
  .strict();

export type Ride = z.infer<typeof rideSchema>;

export const rideSyncSchema = rideSchema.pick({
  sharedCarId: true,
  borrowerId: true,
  status: true,
  startsAt: true,
  endsAt: true,
  playReservationId: true,
});

export type RideSync = z.infer<typeof rideSyncSchema>;
