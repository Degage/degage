import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const replace = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/app/lib/auth', () => ({
  authClient: {
    useSession: () => ({ data: { user: { id: 'user-1' } }, isPending: false }),
  },
}));

vi.mock('@/app/lib/use-car-sharing-enabled', () => ({
  useCarSharingEnabled: () => 'enabled',
}));

import CarSharingPage, { CarSharingContent } from '@/app/car-sharing/page';

const jsonResponse = (status: string) => ({
  ok: true,
  json: async () => ({ status }),
});

describe('CarSharingContent', () => {
  afterEach(() => {
    cleanup();
    replace.mockClear();
    vi.unstubAllGlobals();
  });

  it('shows the empty page without a connect link', () => {
    render(<CarSharingContent />);

    expect(screen.getByRole('heading', { name: 'title' })).toBeTruthy();
    expect(screen.getByText('intro')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('sends a visitor without a working Degapp connection back to the dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('missing')));

    render(<CarSharingPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/app/dashboard');
    });
    expect(screen.queryByRole('heading', { name: 'title' })).toBeNull();
  });

  it('shows the page when Degapp is connected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('success')));

    render(<CarSharingPage />);

    expect(await screen.findByRole('heading', { name: 'title' })).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});
