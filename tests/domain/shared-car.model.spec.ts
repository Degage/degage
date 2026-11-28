import { describe, expect, it } from 'vitest';

import { sharedCarSchema } from '@/domain/shared-car.model';
import { sharedCar } from '../builders/shared-car.builder';

describe('sharedCarSchema', () => {
  it('accepts a car without an owner', () => {
    const result = sharedCarSchema.safeParse(sharedCar({ ownerUserId: null, onboardingId: null }));
    expect(result.success).toBe(true);
  });

  it('fails when the name is empty', () => {
    const result = sharedCarSchema.safeParse(sharedCar({ name: '' }));
    expect(result.success).toBe(false);
  });

  it('fails when the Degapp car id is not positive', () => {
    const result = sharedCarSchema.safeParse(sharedCar({ playCarId: 0 }));
    expect(result.success).toBe(false);
  });
});
