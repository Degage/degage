import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/actions/play-connector/get-session-cookie', () => ({
  getPlaySessionCookie: vi.fn(),
}));
vi.mock('@/play-connector/client', () => ({
  fetchPlay: vi.fn(),
}));
vi.mock('@/storage/car-onboarding/car-onboarding.find-by-car-pc-ids', () => ({
  dbCarOnboardingFindByCarPcIds: vi.fn(),
}));
vi.mock('@/storage/shared-car/shared-car.upsert', () => ({
  dbSharedCarUpsertByPlayCarId: vi.fn(),
}));

import { searchAvailableSharedCars } from '@/actions/shared-car/search';
import { getPlaySessionCookie } from '@/actions/play-connector/get-session-cookie';
import { fetchPlay } from '@/play-connector/client';
import { dbCarOnboardingFindByCarPcIds } from '@/storage/car-onboarding/car-onboarding.find-by-car-pc-ids';
import { dbSharedCarUpsertByPlayCarId } from '@/storage/shared-car/shared-car.upsert';

const html = `
<div id="rij">
  <a href="#collapse-car-1793">Near car</a>
  <div>1.7 km</div>
</div>
`;

describe('searchAvailableSharedCars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPlaySessionCookie).mockResolvedValue({ cookieHeader: 'PLAY_SESSION=1' });
    vi.mocked(fetchPlay).mockResolvedValue({ html, status: 200 });
    vi.mocked(dbCarOnboardingFindByCarPcIds).mockResolvedValue([
      { id: '550e8400-e29b-41d4-a716-446655440099', carPcId: 1793, ownerId: 'owner-1' },
    ]);
    vi.mocked(dbSharedCarUpsertByPlayCarId).mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440010',
      playCarId: 1793,
      name: 'Near car',
      ownerUserId: 'owner-1',
      onboardingId: '550e8400-e29b-41d4-a716-446655440099',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    });
  });

  it('requests one calendar list and stores the owner when enrollment already has the car', async () => {
    const results = await searchAvailableSharedCars('user-1', { from: '2026-12-02T10:00', until: '2026-12-03T18:00' });

    expect(fetchPlay).toHaveBeenCalledTimes(1);
    const path = vi.mocked(fetchPlay).mock.calls[0]?.[0] ?? '';
    expect(path.startsWith('/calendar/list?')).toBe(true);
    expect(path).toContain('pageSize=10');
    expect(dbSharedCarUpsertByPlayCarId).toHaveBeenCalledWith({
      playCarId: 1793,
      name: 'Near car',
      ownerUserId: 'owner-1',
      onboardingId: '550e8400-e29b-41d4-a716-446655440099',
    });
    expect(results).toEqual([
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        playCarId: 1793,
        name: 'Near car',
        distanceKm: 1.7,
        brandModel: null,
        category: null,
        vehicleKind: null,
        seats: null,
        doors: null,
        year: null,
        fuel: null,
        features: [],
      },
    ]);
  });

  it('passes the requested limit through as the Degapp page size', async () => {
    await searchAvailableSharedCars('user-1', { from: '2026-12-02T10:00', until: '2026-12-03T18:00', limit: 4 });

    const path = vi.mocked(fetchPlay).mock.calls[0]?.[0] ?? '';
    expect(path).toContain('pageSize=4');
  });
});
