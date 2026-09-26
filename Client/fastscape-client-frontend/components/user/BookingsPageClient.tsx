'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/localization/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActiveBookingsSection } from './ActiveBookingsSection';
import { BookingHistorySection } from './BookingHistorySection';

const BOOKING_TABS = new Set(['active', 'history']);
const DEFAULT_TAB = 'active';

export const BookingsPageClient = () => {
  const tNav = useTranslations('navigation');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const tab = searchParams.get('tab');
  const activeTab = tab && BOOKING_TABS.has(tab) ? tab : DEFAULT_TAB;

  const handleTabChange = (tab: string) => {
    const nextTab = BOOKING_TABS.has(tab) ? tab : DEFAULT_TAB;
    router.replace(`${pathname}?tab=${nextTab}`);
  };

  return (
    <ProtectedRoute redirectTo="/">
      <div className="container mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-lg sm:grid-cols-2">
            <TabsTrigger value="active" className="rounded-md text-xs sm:text-sm">
              {tNav('activeBookings')}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md text-xs sm:text-sm">
              {tNav('bookingHistory')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <ActiveBookingsSection />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <BookingHistorySection />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};
