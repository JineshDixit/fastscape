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
}

const ManagementDeleteDialog = ({
  open,
  onClose,
  onSuccess,
  title = 'Are you absolutely sure?',
  description,
  onDelete,
  entityName,
}: ManagementDeleteDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onDelete();
      toast.success(`${entityName || 'Entity'} deleted successfully`);
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to delete ${entityName?.toLowerCase() || 'entity'}`;
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
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ManagementDeleteDialog;
