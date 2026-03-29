import { redirect } from 'next/navigation';
import { UserProfilePage } from '@/components/user';

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab } = await searchParams;

  if (tab === 'active' || tab === 'history') {
    redirect(`/${locale}/bookings?tab=${tab}`);
  }

  return <UserProfilePage />;
}

export const metadata = {
  title: 'Profile - Fastscape',
  description: 'Manage your profile and documents',
};
