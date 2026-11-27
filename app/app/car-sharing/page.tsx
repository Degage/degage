'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import {
  CAR_SHARING_DASHBOARD_PATH,
  CAR_SHARING_HOME_PATH,
  type CarSharingConnection,
  carSharingAccess,
  carSharingConnectionFromStatus,
} from '@/app/car-sharing/access';
import { PublicPage } from '@/app/components/public/public-shell';
import { authClient } from '@/app/lib/auth';
import { useCarSharingEnabled } from '@/app/lib/use-car-sharing-enabled';
import { CarSharingSearchForm } from '@/app/car-sharing/search-form';

export function CarSharingContent() {
  const t = useTranslations('carSharingPage');

  return (
    <PublicPage narrow>
      <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-stone-900">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">{t('intro')}</p>
      <CarSharingSearchForm />
    </PublicPage>
  );
}

export default function CarSharingPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const flag = useCarSharingEnabled();
  const access = carSharingAccess(!isPending && Boolean(session), flag);
  const [connection, setConnection] = useState<CarSharingConnection | null>(null);

  useEffect(() => {
    if (access === 'home') {
      router.replace(CAR_SHARING_HOME_PATH);
    }
  }, [access, router]);

  useEffect(() => {
    if (access !== 'page') return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/play-connector');
        if (!response.ok) throw new Error('load failed');
        const data = (await response.json()) as { status?: string };
        if (!cancelled) setConnection(carSharingConnectionFromStatus(data.status));
      } catch {
        if (!cancelled) setConnection('load-error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [access]);

  useEffect(() => {
    if (access === 'page' && connection && connection !== 'success') {
      router.replace(CAR_SHARING_DASHBOARD_PATH);
    }
  }, [access, connection, router]);

  if (access !== 'page' || connection !== 'success') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[var(--public-brand)] border-t-transparent" />
      </div>
    );
  }

  return <CarSharingContent />;
}
