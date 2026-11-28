import { describe, expect, it } from 'vitest';

import { sharedCarSearchPeriodSchema } from '@/domain/shared-car-search.model';

describe('sharedCarSearchPeriodSchema', () => {
  it('accepts a period that ends after it starts', () => {
    const result = sharedCarSearchPeriodSchema.safeParse({ from: '2026-12-02T10:00', until: '2026-12-03T18:00' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(10);
  });

  it('fails when the period ends first', () => {
    const result = sharedCarSearchPeriodSchema.safeParse({ from: '2026-12-03T18:00', until: '2026-12-02T10:00' });
    expect(result.success).toBe(false);
  });
});
