import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface ManagementSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  loading?: boolean;
  isViewOnly?: boolean;
  onSecondaryAction?: () => void;
  secondaryActionText?: string;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
}

const ManagementSheet = ({
  open,
  onClose,
  title,
  description,
  icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  children,
  footer,
  maxWidth = 'sm:max-w-[550px]',
  loading = false,
  isViewOnly = false,
  onSecondaryAction,
  secondaryActionText = 'Discard changes',
  primaryActionText = 'Save Changes',
  onPrimaryAction,
  primaryActionDisabled = false,
}: ManagementSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className={cn(maxWidth, 'overflow-y-auto')}>
        <SheetHeader className="space-y-4 pr-6 text-left">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-2xl p-3', iconBgColor, iconColor)}>{icon}</div>
            <div className="space-y-1">
              <SheetTitle className="text-2xl font-bold tracking-tight">{title}</SheetTitle>
              <SheetDescription className="text-sm">{description}</SheetDescription>
            </div>
          </div>
          <Separator />
        </SheetHeader>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>

        {!isViewOnly && (
          <SheetFooter className="flex items-center gap-4 pt-4 sm:justify-between">
            <Button type="button" variant="ghost" onClick={onSecondaryAction || onClose} className="rounded-full w-full">
              {secondaryActionText}
            </Button>
            <Button
              type="submit"
              disabled={loading || primaryActionDisabled}
              onClick={onPrimaryAction}
              className="bg-primary hover:shadow-primary/20 rounded-full px-10 shadow-lg w-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  <span>Processing...</span>
                </div>
              ) : (
                primaryActionText
              )}
            </Button>
          </SheetFooter>
        )}

        {isViewOnly && footer && <div className="pt-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
};

export default ManagementSheet;
