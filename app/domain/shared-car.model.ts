import * as z from 'zod';

export const sharedCarSchema = z
  .object({
    id: z.uuid().nullable(),
    playCarId: z.number().int().positive(),
    name: z.string().min(1).max(100),
    ownerUserId: z.string().min(1).nullable().default(null),
    onboardingId: z.uuid().nullable().default(null),
    createdAt: z.coerce.date().nullable().default(null),
    updatedAt: z.coerce.date().nullable().default(null),
  })
  .strict();

export type SharedCar = z.infer<typeof sharedCarSchema>;

export const sharedCarUpsertSchema = sharedCarSchema.pick({
  playCarId: true,
  name: true,
  ownerUserId: true,
  onboardingId: true,
});

export type SharedCarUpsert = z.infer<typeof sharedCarUpsertSchema>;
