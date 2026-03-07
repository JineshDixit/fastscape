import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { type FC } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface DataTablePaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  selectedCount?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

const DataTablePagination: FC<DataTablePaginationProps> = ({
  totalItems,
  pageSize,
  currentPage,
  selectedCount = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 40, 50],
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-sm">
        {selectedCount} of {totalItems} row(s) selected.
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:gap-4 lg:gap-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-17.5 bg-white">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          Page {currentPage} of {totalPages || 1}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTablePagination;
