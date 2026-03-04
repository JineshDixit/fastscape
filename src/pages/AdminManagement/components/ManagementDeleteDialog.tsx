import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ManagementDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description: React.ReactNode;
  onDelete: () => Promise<void>;
  entityName?: string;
  confirmButtonText?: string;
  loadingButtonText?: string;
  successMessage?: string;
  errorMessage?: string;
}

const ManagementDeleteDialog = ({
  open,
  onClose,
  onSuccess,
  title = 'Are you absolutely sure?',
  description,
  onDelete,
  entityName,
  confirmButtonText = 'Delete',
  loadingButtonText = 'Deleting...',
  successMessage,
  errorMessage,
}: ManagementDeleteDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onDelete();
      toast.success(successMessage || `${entityName || 'Entity'} updated successfully`);
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || errorMessage || `Failed to update ${entityName?.toLowerCase() || 'entity'}`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? loadingButtonText : confirmButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ManagementDeleteDialog;
