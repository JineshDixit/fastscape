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
          variant="outline"
          className="group fixed bottom-6 left-6 z-40 h-16 w-16 rounded-full border-2 border-primary/20 bg-card/95 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-primary hover:shadow-2xl lg:hidden"
          size="icon"
        >
          <div className="relative">
            <SlidersHorizontal className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
            <Filter className="absolute -right-1 -top-1 h-3 w-3 text-primary" />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto border-r-4 border-primary">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="rounded-lg bg-primary/10 p-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            {t('title')}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <CarFilter />
        </div>
      </SheetContent>
    </Sheet>
  );
}
