import * as z from 'zod';

const periodPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const DEFAULT_SHARED_CAR_SEARCH_LIMIT = 10;

export const sharedCarSearchPeriodSchema = z
  .object({
    from: z.string().regex(periodPattern),
    until: z.string().regex(periodPattern),
    limit: z.number().int().min(1).max(50).default(DEFAULT_SHARED_CAR_SEARCH_LIMIT),
  })
  .strict()
  .refine((period) => period.until > period.from, { path: ['until'] });

export type SharedCarSearchPeriod = z.infer<typeof sharedCarSearchPeriodSchema>;

export const sharedCarSearchResultSchema = z
  .object({
    id: z.uuid(),
    playCarId: z.number().int().positive(),
    name: z.string().min(1),
    distanceKm: z.number().nonnegative(),
    brandModel: z.string().min(1).nullable().default(null),
    category: z.string().min(1).nullable().default(null),
    vehicleKind: z.string().min(1).nullable().default(null),
    seats: z.number().int().positive().nullable().default(null),
    doors: z.number().int().positive().nullable().default(null),
    year: z.number().int().nullable().default(null),
    fuel: z.string().min(1).nullable().default(null),
    features: z.array(z.string().min(1)).default([]),
  })
  .strict();

export type SharedCarSearchResult = z.infer<typeof sharedCarSearchResultSchema>;

export const toDegappPeriod = (value: string): string => value.replace('T', ' ');
