import * as z from 'zod';

const periodPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const sharedCarSearchPeriodSchema = z
  .object({
    from: z.string().regex(periodPattern),
    until: z.string().regex(periodPattern),
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
  })
  .strict();

export type SharedCarSearchResult = z.infer<typeof sharedCarSearchResultSchema>;

export const toDegappPeriod = (value: string): string => value.replace('T', ' ');
