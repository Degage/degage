import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/actions/shared-car/search', () => ({
  searchAvailableSharedCars: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
  cookies: vi.fn().mockResolvedValue({ get: () => undefined }),
}));

import { POST } from '@/api/car-sharing/search/route';
import { auth } from '@/auth';
import { searchAvailableSharedCars } from '@/actions/shared-car/search';

const mockUser = {
  id: 'user-id',
  name: 'User',
  email: 'user@example.com',
  role: 'user',
  banned: false,
};

const request = (body: unknown) =>
  new Request('http://localhost/api/car-sharing/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/car-sharing/search', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    const response = await POST(request({ from: '2026-12-02T10:00', until: '2026-12-03T18:00' }) as never, {} as never);

    expect(response.status).toBe(401);
  });

  it('returns 400 when the period ends first', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: mockUser, session: {} } as never);

    const response = await POST(request({ from: '2026-12-03T18:00', until: '2026-12-02T10:00' }) as never, {} as never);

    expect(response.status).toBe(400);
    expect(searchAvailableSharedCars).not.toHaveBeenCalled();
  });

  it('returns the cars in Degapp order', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: mockUser, session: {} } as never);
    vi.mocked(searchAvailableSharedCars).mockResolvedValueOnce([
      { id: '550e8400-e29b-41d4-a716-446655440010', playCarId: 1793, name: 'Near car', distanceKm: 1.7 },
    ]);

    const response = await POST(request({ from: '2026-12-02T10:00', until: '2026-12-03T18:00' }) as never, {} as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      cars: [{ id: '550e8400-e29b-41d4-a716-446655440010', playCarId: 1793, name: 'Near car', distanceKm: 1.7 }],
    });
  });
});
