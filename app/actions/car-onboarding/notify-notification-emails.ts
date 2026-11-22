import { getRequestLocale } from '@/context/request-context';
import type { CarOnboarding } from '@/domain/car-onboarding.model';
import { type UILocale, defaultUILocale, uiLocales } from '@/i18n/locales';
import { dbUserReadEmailAndLocale } from '@/storage/user/user.read';

function appBaseUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export function buildAdminCarOnboardingUrl(onboardingId: string): string {
  return `${appBaseUrl()}/app/admin/car-onboardings/${onboardingId}`;
}

export function toEmailTemplateLocale(raw: string | null | undefined = getRequestLocale()): UILocale {
  return uiLocales.includes(raw as UILocale) ? (raw as UILocale) : defaultUILocale;
}

export function formatOptionalEuro(value: number | null | undefined): string {
  if (value == null) return '—';
  return `€ ${value.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function resolveOwnerContact(
  onboarding: CarOnboarding,
): Promise<{ email: string; name: string; locale: string | null } | null> {
  if (onboarding.owner?.id == null) return null;
  const owner = await dbUserReadEmailAndLocale(onboarding.owner.id);
  if (owner == null || owner.email.trim() === '') return null;
  const name = onboarding.owner.name?.trim() || owner.email;
  return { email: owner.email, name, locale: owner.locale };
}
