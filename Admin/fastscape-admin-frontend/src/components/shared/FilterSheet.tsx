import React, { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter } from 'lucide-react';

interface FilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  activeFilterCount: number;
  children: ReactNode;
  sheetFooter?: ReactNode;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  activeFilterCount,
  children,
  sheetFooter,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-9 w-full gap-2 sm:w-auto">
          <Filter className="size-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-dvh w-full max-w-full flex-col overflow-hidden sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {sheetFooter && <SheetFooter className="px-4 pb-4 sm:px-6 sm:pb-6">{sheetFooter}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
};
