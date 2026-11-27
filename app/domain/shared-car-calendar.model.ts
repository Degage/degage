import * as z from 'zod';

import { rideStatusSchema } from '@/domain/ride.model';

export const sharedCarCalendarRequestSchema = z
  .object({
    playCarIds: z.array(z.number().int().positive()).min(1).max(10),
  })
  .strict();

export type SharedCarCalendarRequest = z.infer<typeof sharedCarCalendarRequestSchema>;

export const sharedCarCalendarRideSchema = z
  .object({
    id: z.uuid(),
    sharedCarId: z.uuid(),
    status: rideStatusSchema,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .strict();

export type SharedCarCalendarRide = z.infer<typeof sharedCarCalendarRideSchema>;
