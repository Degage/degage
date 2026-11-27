import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/actions/play-connector/get-session-cookie', () => ({
  getPlaySessionCookie: vi.fn(),
}));
vi.mock('@/play-connector/client', () => ({
  fetchPlay: vi.fn(),
}));
vi.mock('@/storage/shared-car/shared-car.find-by-play-car-ids', () => ({
  dbSharedCarFindByPlayCarIds: vi.fn(),
}));
vi.mock('@/storage/user/user.find-by-degapp-user-ids', () => ({
  dbUserFindIdsByDegappUserIds: vi.fn(),
}));
vi.mock('@/storage/ride/ride.replace-for-shared-car', () => ({
  dbRideReplaceForSharedCar: vi.fn(),
}));

import { syncSharedCarCalendar } from '@/actions/shared-car/calendar';
import { getPlaySessionCookie } from '@/actions/play-connector/get-session-cookie';
import { fetchPlay } from '@/play-connector/client';
import { dbSharedCarFindByPlayCarIds } from '@/storage/shared-car/shared-car.find-by-play-car-ids';
import { dbUserFindIdsByDegappUserIds } from '@/storage/user/user.find-by-degapp-user-ids';
import { dbRideReplaceForSharedCar } from '@/storage/ride/ride.replace-for-shared-car';
import { parsePlayLocalDateTime } from '@/domain/play-local-time';

const car = { id: '550e8400-e29b-41d4-a716-446655440010', playCarId: 1793, name: 'Near car' };
const borrower = { id: '550e8400-e29b-41d4-a716-446655440011', degappUserId: '42' };

describe('syncSharedCarCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPlaySessionCookie).mockResolvedValue({ cookieHeader: 'PLAY_SESSION=1' });
    vi.mocked(dbSharedCarFindByPlayCarIds).mockResolvedValue([car]);
    vi.mocked(dbUserFindIdsByDegappUserIds).mockResolvedValue([borrower]);
    vi.mocked(dbRideReplaceForSharedCar).mockImplementation(async (_sharedCarId, rides) =>
      rides.map((ride, index) => ({
        ...ride,
        id: `550e8400-e29b-41d4-a716-44665544001${index}`,
        lastSyncedAt: new Date('2026-12-01T00:00:00Z'),
        createdAt: new Date('2026-12-01T00:00:00Z'),
        updatedAt: new Date('2026-12-01T00:00:00Z'),
      })),
    );
  });

  it('stores one car calendar and links a borrower who already has an account', async () => {
    vi.mocked(fetchPlay).mockResolvedValue({
      html: JSON.stringify([{ id: 123, start: '2026-12-02 10:00', end: '2026-12-02 12:00', status: 'ACCEPTED', userId: '42' }]),
      status: 200,
    });

    const calendar = await syncSharedCarCalendar('user-1', { playCarIds: [1793] });

    expect(fetchPlay).toHaveBeenCalledTimes(1);
    expect(fetchPlay).toHaveBeenCalledWith('/calendarevents/car?id=1793', 'PLAY_SESSION=1');
    expect(dbRideReplaceForSharedCar).toHaveBeenCalledWith(car.id, [
      {
        sharedCarId: car.id,
        borrowerId: borrower.id,
        status: 'confirmed',
        startsAt: parsePlayLocalDateTime('2026-12-02 10:00'),
        endsAt: parsePlayLocalDateTime('2026-12-02 12:00'),
        playReservationId: 123,
      },
    ]);
    expect(calendar.available).toBe(true);
    expect(calendar.cars).toEqual([car]);
    expect(calendar.rides).toHaveLength(1);
  });

  it('stops after one unrecognized body and does not store rides', async () => {
    vi.mocked(dbSharedCarFindByPlayCarIds).mockResolvedValue([
      car,
      { id: '550e8400-e29b-41d4-a716-446655440012', playCarId: 1401, name: 'Far car' },
    ]);
    vi.mocked(fetchPlay).mockResolvedValue({ html: '<div>not intervals</div>', status: 200 });

    const calendar = await syncSharedCarCalendar('user-1', { playCarIds: [1793, 1401] });

    expect(fetchPlay).toHaveBeenCalledTimes(1);
    expect(dbRideReplaceForSharedCar).not.toHaveBeenCalled();
    expect(calendar).toEqual({ available: false, cars: [], rides: [] });
  });
});
