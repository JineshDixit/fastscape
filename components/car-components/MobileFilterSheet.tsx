'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Filter } from 'lucide-react';
import CarFilter from './carFilter';
import { useTranslations } from 'next-intl';

export function MobileFilterSheet() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('carList');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="group from-primary via-primary to-secondary fixed right-6 bottom-6 z-40 h-16 w-16 rounded-full bg-linear-to-br shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl lg:hidden"
          size="icon"
        >
          <div className="relative">
            <SlidersHorizontal className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">{t('title')}</SheetTitle>
        </SheetHeader>
        <div className="m-4">
          <CarFilter />
        </div>
      </SheetContent>
    </Sheet>
  );
}
