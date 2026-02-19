import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

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
    iconBgColor = "bg-primary/10",
    iconColor = "text-primary",
    children,
    footer,
    maxWidth = "sm:max-w-[550px]",
    loading = false,
    isViewOnly = false,
    onSecondaryAction,
    secondaryActionText = "Discard changes",
    primaryActionText = "Save Changes",
    onPrimaryAction,
    primaryActionDisabled = false,
}: ManagementSheetProps) => {
    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className={cn(maxWidth, "overflow-y-auto")}>
                <SheetHeader className="space-y-4 pr-6 text-left">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-3 rounded-2xl", iconBgColor, iconColor)}>
                            {icon}
                        </div>
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-bold tracking-tight">
                                {title}
                            </SheetTitle>
                            <SheetDescription className="text-sm">
                                {description}
                            </SheetDescription>
                        </div>
                    </div>
                    <Separator />
                </SheetHeader>

                <div className="py-6">
                    {children}
                </div>

                {!isViewOnly && (
                    <SheetFooter className="pt-4 flex sm:justify-between items-center gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onSecondaryAction || onClose}
                            className="rounded-full"
                        >
                            {secondaryActionText}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || primaryActionDisabled}
                            onClick={onPrimaryAction}
                            className="rounded-full px-10 shadow-lg bg-primary hover:shadow-primary/20"
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

                {isViewOnly && footer && (
                    <div className="pt-4">
                        {footer}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default ManagementSheet;
