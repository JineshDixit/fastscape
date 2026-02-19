'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  addButtonIcon?: React.ReactNode;
  addButtonOnClick?: () => void;
  customActions?: React.ReactNode;
  // Server-side props
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onSearchChange?: (value: string) => void;
  totalRows?: number;
  tableContainerClassName?: string;
  loading?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Filter...',
  showAddButton,
  addButtonText,
  addButtonIcon,
  addButtonOnClick,
  customActions,
  pageCount,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sorting: externalSorting,
  onSortingChange,
  onSearchChange,
  totalRows,
  tableContainerClassName,
  loading,
  rowSelection: externalRowSelection,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});

  const isServerSide = pageCount !== undefined;

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? undefined,
    onSortingChange: (updaterOrValue) => {
      const newSortingValue =
        typeof updaterOrValue === 'function' ? updaterOrValue(externalSorting ?? internalSorting) : updaterOrValue;
      if (onSortingChange) {
        onSortingChange(newSortingValue);
      } else {
        setInternalSorting(newSortingValue);
      }
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: isServerSide ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServerSide ? undefined : getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updaterOrValue) => {
      const newRowSelectionValue =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(externalRowSelection ?? internalRowSelection)
          : updaterOrValue;
      if (onRowSelectionChange) {
        onRowSelectionChange(newRowSelectionValue);
      } else {
        setInternalRowSelection(newRowSelectionValue);
      }
    },
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    manualFiltering: onSearchChange !== undefined,
    state: {
      sorting: externalSorting ?? internalSorting,
      columnFilters,
      columnVisibility,
      rowSelection: externalRowSelection ?? internalRowSelection,
      ...(isServerSide
        ? {
          pagination: {
            pageIndex: pageIndex ?? 0,
            pageSize: pageSize ?? 10,
          },
        }
        : {}),
    },
  });

  const [searchValue, setSearchValue] = React.useState('');

  // Handle server-side search with debounce
  React.useEffect(() => {
    if (!onSearchChange) return;

    const timeoutId = setTimeout(() => {
      onSearchChange(searchValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue, onSearchChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center justify-between gap-2">
          {onSearchChange ? (
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="h-9 w-50 bg-white lg:w-75"
            />
          ) : searchKey ? (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
              className="h-9 w-50 bg-white lg:w-75"
            />
          ) : null}
          <div className="flex items-center gap-2">
            {customActions}
            {showAddButton && (
              <Button onClick={addButtonOnClick} className="gap-2">
                {addButtonIcon}
                {addButtonText}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <Table tableContainerClassName={tableContainerClassName}>
          <TableHeader className="sticky top-0 bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-gray-200 hover:bg-transparent">
                {headerGroup.headers.map((header, index) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={`font-medium select-none ${canSort ? 'cursor-pointer' : ''} ${index === 0 ? 'pl-6' : ''
                        }`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && sortDirection === 'asc' && ' ↑'}
                        {canSort && sortDirection === 'desc' && ' ↓'}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="text-start border-gray-100 hover:bg-gray-50/50 data-[state=selected]:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell key={cell.id} className={`py-3 ${index === 0 ? 'pl-6' : ''}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-[1px] transition-all duration-300">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        )}
      </div>

      {/* Pagination & Footer */}
      <div className="flex flex-col items-center justify-between gap-4 px-2 md:flex-row">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {isServerSide ? (totalRows ?? 0) : table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${isServerSide ? pageSize : table.getState().pagination?.pageSize || 10}`}
              onValueChange={(value) => {
                if (isServerSide && onPageSizeChange) {
                  onPageSizeChange(Number(value));
                } else {
                  table.setPageSize(Number(value));
                }
              }}
            >
              <SelectTrigger className="h-8 w-17.5 bg-white">
                <SelectValue placeholder={isServerSide ? pageSize : table.getState().pagination?.pageSize || 10} />
              </SelectTrigger>
              <SelectContent side="top" className="bg-white">
                {[5, 10, 20, 30, 40, 50].map((pageSizeOption) => (
                  <SelectItem key={pageSizeOption} value={`${pageSizeOption}`}>
                    {pageSizeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-25 items-center justify-center text-sm font-medium">
            Page {isServerSide ? (pageIndex ?? 0) + 1 : (table.getState().pagination?.pageIndex ?? 0) + 1} of{' '}
            {isServerSide ? pageCount : (table.getPageCount?.() ?? 1)}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 bg-white p-0"
              onClick={() => {
                if (isServerSide && onPageChange) {
                  onPageChange((pageIndex ?? 0) - 1);
                } else {
                  table.previousPage();
                }
              }}
              disabled={isServerSide ? (pageIndex ?? 0) === 0 : !(table.getCanPreviousPage?.() ?? true)}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 bg-white p-0"
              onClick={() => {
                if (isServerSide && onPageChange) {
                  onPageChange((pageIndex ?? 0) + 1);
                } else {
                  table.nextPage();
                }
              }}
              disabled={isServerSide ? (pageIndex ?? 0) >= (pageCount ?? 0) - 1 : !(table.getCanNextPage?.() ?? true)}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
