'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Search, Sparkles } from 'lucide-react';
import { CarSearchForm } from './carSearchForm';
import { useTranslations } from 'next-intl';

export function MobileSearchSheet() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('home');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="group from-primary via-primary to-secondary fixed right-6 bottom-6 z-40 h-16 w-16 rounded-full bg-linear-to-br shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl lg:hidden"
          size="icon"
        >
          <div className="relative">
            <Search className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[calc(100vh-12rem)] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="space-y-3">
          <SheetTitle className="from-primary to-secondary bg-linear-to-r bg-clip-text text-xl font-bold text-transparent">
            {t('rentCar')}
          </SheetTitle>
        </SheetHeader>
        <div className="m-6">
          <CarSearchForm />
        </div>
      </SheetContent>
    </Sheet>
  );
}
