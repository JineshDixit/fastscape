import { useEffect, useState, useCallback } from 'react';
import { financeService, type FinancialRecord, type FinanceStats } from '@/api/services/financeService';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import type { SortingState, RowSelectionState } from '@tanstack/react-table';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import FinanceFilters, { type FinanceFilterValues } from '@/components/finance/FinanceFilters';
import { ExportButton } from '@/components/shared/ExportButton';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';

const Financials = () => {
  const [data, setData] = useState<FinancialRecord[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Server-side state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FinanceFilterValues>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { canPerformAction } = usePermissions();

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

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await financeService.getFinancialStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch financial stats:', error);
      toast.error('Failed to load financial statistics.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchFinancials = useCallback(async () => {
    try {
      setLoading(true);

      const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
      const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'DESC' : 'ASC') : undefined;

      const { financials, pagination } = await financeService.getAllFinancials({
        page: pageIndex + 1,
        limit: pageSize,
        search,
        sortBy,
        sortOrder,
        ...filters,
      });

      if (financials && Array.isArray(financials)) {
        setData(financials);
        if (pagination) {
          setPageCount(pagination.totalPages || 0);
          setTotalRows(pagination.total || 0);
        }
      } else {
        setData([]);
        setPageCount(0);
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Failed to fetch financials:', error);
      toast.error('Failed to load financials. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, search, sorting, filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  const handlePrintInvoice = async () => {
    const selectedIndices = Object.keys(rowSelection).filter((key) => rowSelection[key]);

    if (selectedIndices.length === 0) {
      toast.error('Please select at least one invoice to print');
      return;
    }

    const selectedFinancials = selectedIndices.map((index) => data[parseInt(index)]);
    const bookingIds = selectedFinancials.map((f) => f.bookingId);

    try {
      toast.loading('Generating invoice(s)...');

      const blob = await financeService.downloadBulkInvoices(bookingIds);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(`Downloaded ${selectedFinancials.length} invoice(s)`);

      // Clear selection after downloading
      setRowSelection({});
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to generate invoices');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Completed Payment Card */}
        <Card>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-green-100 p-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Completed Payment</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats?.completed.amount || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{stats?.completed.count || 0} invoices</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      +2.77%
                    </span>
                    <span>from last week</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Awaiting Payment Card */}
        <Card>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Awaiting Payment</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats?.awaiting.amount || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{stats?.awaiting.count || 0} invoices</span>
                    <span className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-3 w-3" />
                      -1.09%
                    </span>
                    <span>from last week</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Card */}
        <Card>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-full bg-red-100 p-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Overdue</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats?.overdue.amount || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{stats?.overdue.count || 0} invoices</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      +4.48%
                    </span>
                    <span>from last week</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search invoices..."
        pageCount={pageCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRows={totalRows}
        onPageChange={setPageIndex}
        onPageSizeChange={handlePageSizeChange}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        onSearchChange={handleSearchChange}
        tableContainerClassName="!max-h-[calc(100vh-26rem)]"
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        customActions={
          <div className="flex items-center gap-2">
            <FinanceFilters
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
            <PermissionGuard module="financials" action="export">
              <ExportButton
                onExport={() => financeService.exportFinancials({ search, ...filters })}
                filename="financials"
              />
            </PermissionGuard>
            {canPerformAction('financials', 'generateInvoice') && (
              <Button
                onClick={handlePrintInvoice}
                variant="default"
                size="sm"
                className="gap-2"
                disabled={Object.keys(rowSelection).length === 0}
              >
                <FileDown className="h-4 w-4" />
                Print Invoice ({Object.keys(rowSelection).filter((key) => rowSelection[key]).length})
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
};

export default Financials;
