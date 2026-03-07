import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  onExport: () => Promise<Blob>;
  filename: string;
  disabled?: boolean;
  className?: string;
}

export const ExportButton = ({ onExport, filename, disabled, className }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.loading('Generating CSV file...');

      const blob = await onExport();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('CSV file downloaded successfully');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className={cn('w-full sm:w-auto', className)}
      disabled={disabled || isExporting}
    >
      <FileDown className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
};
