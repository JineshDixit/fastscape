'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { FinancialRecord } from '@/api/services/financeService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PaymentStatus } from '@/api/services/bookingService';

export const columns: ColumnDef<FinancialRecord>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'invoiceId',
    accessorFn: (row) => row.bookingId,
    header: 'Invoice ID',
    enableSorting: true,
    cell: ({ row }) => {
      const id = row.original.bookingId;
      return <span className="font-mono text-xs">{id.slice(0, 8).toUpperCase()}</span>;
    },
  },
  {
    id: 'clientName',
    accessorFn: (row) => `${row.Booking?.User?.firstName} ${row.Booking?.User?.lastName}`,
    header: 'Client Name',
    enableSorting: true,
    cell: ({ row }) => {
      const user = row.original.Booking?.User;
      if (!user) return <span className="text-muted-foreground text-xs italic">N/A</span>;
      return (
        <span>
          {user.firstName} {user.lastName}
        </span>
      );
    },
  },
  {
    id: 'carModel',
    accessorFn: (row) => `${row.Booking?.Vehicle?.make} ${row.Booking?.Vehicle?.model}`,
    header: 'Car Model',
    enableSorting: true,
    cell: ({ row }) => {
      const vehicle = row.original.Booking?.Vehicle;
      if (!vehicle) return <span className="text-muted-foreground text-xs italic">N/A</span>;
      return (
        <span>
          {vehicle.make} {vehicle.model}
        </span>
      );
    },
  },
  {
    id: 'ratePerDay',
    accessorFn: (row) => {
      const baseAmount = parseFloat(row.baseAmount || '0');
      const start = new Date(row.Booking?.startDatetime || '');
      const end = new Date(row.Booking?.endDatetime || '');
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return baseAmount / days;
    },
    header: () => <div>Rate per Day</div>,
    enableSorting: false,
    cell: ({ row }) => {
      const baseAmount = parseFloat(row.original.baseAmount || '0');
      const start = new Date(row.original.Booking?.startDatetime || '');
      const end = new Date(row.original.Booking?.endDatetime || '');
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const ratePerDay = baseAmount / days;
      const currency = row.original.currency || 'AED';

      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(ratePerDay);

      return <div>{formatted}</div>;
    },
  },
  {
    id: 'rentalPeriod',
    accessorFn: (row) => {
      const start = new Date(row.Booking?.startDatetime || '');
      const end = new Date(row.Booking?.endDatetime || '');
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return days;
    },
    header: 'Rental Period',
    enableSorting: false,
    cell: ({ row }) => {
      const start = new Date(row.original.Booking?.startDatetime || '');
      const end = new Date(row.original.Booking?.endDatetime || '');
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return <span>{days} {days === 1 ? 'Day' : 'Days'}</span>;
    },
  },
  {
    id: 'totalAmount',
    accessorFn: (row) => parseFloat(row.totalAmount),
    header: () => <div>Amount</div>,
    enableSorting: true,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.totalAmount || '0');
      const currency = row.original.currency || 'AED';

      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    id: 'dueDate',
    accessorFn: (row) => row.Booking?.endDatetime,
    header: 'Due Date',
    enableSorting: true,
    cell: ({ row }) => {
      const dateStr = row.original.Booking?.endDatetime;
      if (!dateStr) return <div className="text-muted-foreground text-sm italic">N/A</div>;
      const date = new Date(dateStr);
      return (
        <div className="flex flex-col gap-0.5">
          <span>{date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      );
    },
  },
  {
    id: 'status',
    accessorFn: (row) => row.Booking?.paymentStatus,
    header: 'Status',
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.original.Booking?.paymentStatus;
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';

      switch (status) {
        case PaymentStatus.PAID:
          variant = 'default';
          break;
        case PaymentStatus.PARTIALLY_PAID:
          variant = 'secondary';
          break;
        case PaymentStatus.UNPAID:
        case PaymentStatus.OVERDUE:
          variant = 'destructive';
          break;
        case PaymentStatus.REFUNDED:
          variant = 'outline';
          break;
      }

      return (
        <Badge variant={variant} className="rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
          {status === PaymentStatus.PAID ? 'Completed' : status === PaymentStatus.UNPAID ? 'Awaiting' : status === PaymentStatus.OVERDUE ? 'Overdue' : status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    enableSorting: false,
    cell: ({ row }) => {
      const financial = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1">
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-bold px-2 py-1.5">
              Finance Operations
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="rounded-md">
              <Link to={`/financials/${financial.bookingId}`} className="flex cursor-pointer items-center">
                <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
