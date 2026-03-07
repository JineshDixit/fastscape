import { useEffect, useState, useCallback } from 'react';
import { type Booking, bookingService } from '@/api/services/bookingService';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import type { SortingState } from '@tanstack/react-table';
import BookingFilters, { type BookingFilterValues } from '@/components/bookings/BookingFilters';
import { ExportButton } from '@/components/shared/ExportButton';
import PermissionGuard from '@/components/auth/PermissionGuard';

const Bookings = () => {
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Server-side state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<BookingFilterValues>({});

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPageIndex(0);
  }, []);

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    setPageIndex(0);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPageIndex(0);
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);

      const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
      const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'DESC' : 'ASC') : undefined;

      const { bookings, pagination } = await bookingService.getAllBookings({
        page: pageIndex + 1,
        limit: pageSize,
        search,
        sortBy,
        sortOrder,
        ...filters,
      });

      if (bookings && Array.isArray(bookings)) {
        setData(bookings);
        if (pagination) {
          setPageCount(pagination.pages || pagination.totalPages || 0);
          setTotalRows(pagination.total || 0);
        }
      } else {
        setData([]);
        setPageCount(0);
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, search, sorting, filters]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  if (loading && data.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col space-y-8">
      <div className="p-1">
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder="Search bookings..."
          pageCount={pageCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRows={totalRows}
          onPageChange={setPageIndex}
          onPageSizeChange={handlePageSizeChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          onSearchChange={handleSearchChange}
          tableContainerClassName="!max-h-[calc(100vh-15rem)]"
          customActions={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <BookingFilters
                currentFilters={filters}
                onApplyFilters={(newFilters) => {
                  setFilters(newFilters);
                  setPageIndex(0);
                }}
                onResetFilters={() => {
                  setFilters({});
                  setPageIndex(0);
                }}
              />
              <PermissionGuard module="bookings" action="export">
                <ExportButton
                  onExport={() => bookingService.exportBookings({ search, ...filters })}
                  filename="bookings"
                />
              </PermissionGuard>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default Bookings;
