import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';

import { PublicLoginDialog } from '@/app/components/public/public-login-dialog';

const messages = {
  landing: {
    header: {
      loginDialog: {
        title: 'Sign in',
        degapp: { title: 'Degapp', badge: 'Most people', description: 'Book on Degapp.' },
        onboarding: { title: 'New owner onboarding', description: 'Enrol your car.' },
      },
    },
  },
};

const renderDialog = () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PublicLoginDialog open onOpenChange={() => undefined} />
    </NextIntlClientProvider>,
  );
};

describe('PublicLoginDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('offers Degapp and new-owner onboarding, and no car-sharing sign-in', () => {
    renderDialog();

    expect(screen.queryByRole('link', { name: /Car sharing/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Degapp/ }).getAttribute('href')).toBe('https://degapp.be/');
    expect(screen.getByRole('link', { name: /Degapp/ }).getAttribute('target')).toBe('_blank');
    expect(screen.getByRole('link', { name: /New owner onboarding/ }).getAttribute('href')).toContain('/app/auth/sign-in');
  });
});
