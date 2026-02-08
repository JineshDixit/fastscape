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
          className="group fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full bg-gradient-to-br from-primary via-primary to-secondary shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl lg:hidden"
          size="icon"
        >
          <div className="relative">
            <Search className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
            <Sparkles className="absolute -right-1 -top-1 h-3 w-3 animate-pulse text-primary-foreground" />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-3xl border-t-4 border-primary">
        <SheetHeader className="space-y-3">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-muted" />
          <SheetTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent">
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
