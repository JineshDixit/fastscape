'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { type Booking, BookingStatus, PaymentStatus } from '@/api/services/bookingService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const columns: ColumnDef<Booking>[] = [
  {
    accessorKey: 'user',
    header: 'Customer',
    cell: ({ row }) => {
      const user = row.original.User;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="text-muted-foreground text-[11px] leading-tight">{user?.email || 'No email'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'vehicle',
    header: 'Vehicle',
    cell: ({ row }) => {
      const vehicle = row.original.Vehicle;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">
            {vehicle?.make} {vehicle?.model}
          </span>
          <span className="text-muted-foreground text-[11px] tracking-wider uppercase">{vehicle?.bodyType}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'chauffeur',
    header: 'Chauffeur',
    cell: ({ row }) => {
      const chauffeur = row.original.Chauffeur;
      if (!chauffeur) return <span className="text-muted-foreground text-[11px] italic">Not assigned</span>;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">
            {chauffeur?.firstName} {chauffeur?.lastName}
          </span>
          <span className="text-muted-foreground text-[11px]">{chauffeur?.phone || 'No phone'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'bookingType',
    header: 'Service',
    cell: ({ row }) => {
      const type = row.getValue('bookingType') as string;
      return (
        <div className="text-sm font-medium text-gray-600 capitalize">{type?.replace(/_/g, ' ').toLowerCase()}</div>
      );
    },
  },
  {
    accessorKey: 'bookingStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.bookingStatus;
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

      switch (status) {
        case BookingStatus.CONFIRMED:
        case BookingStatus.COMPLETED:
          variant = 'default';
          break;
        case BookingStatus.PENDING:
          variant = 'secondary';
          break;
        case BookingStatus.CANCELLED:
          variant = 'destructive';
          break;
        default:
          variant = 'outline';
      }

      return (
        <Badge variant={variant} className="rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Payment',
    cell: ({ row }) => {
      const status = row.getValue('paymentStatus') as PaymentStatus;
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';

      switch (status) {
        case PaymentStatus.PAID:
          variant = 'default';
          break;
        case PaymentStatus.UNPAID:
          variant = 'destructive';
          break;
        case PaymentStatus.PARTIALLY_PAID:
          variant = 'secondary';
          break;
        case PaymentStatus.REFUNDED:
          variant = 'outline';
          break;
      }
      return (
        <Badge variant={variant} className="rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'amount',
    accessorFn: (row) => row.BookingFinancial?.totalAmount,
    header: () => <div>Amount</div>,
    cell: ({ row }) => {
      const amountStr = row.original.BookingFinancial?.totalAmount || '0';
      const amount = parseFloat(amountStr);
      const currency = row.original.BookingFinancial?.currency || 'AED';

      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);

      return <div className="text-gray-900">{formatted}</div>;
    },
  },
  {
    accessorKey: 'startDatetime',
    header: 'Pickup Date',
    cell: ({ row }) => {
      const dateStr = row.getValue('startDatetime') as string;
      if (!dateStr) return <div className="text-muted-foreground text-sm italic">N/A</div>;
      const date = new Date(dateStr);
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-gray-900">
            {date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-muted-foreground text-[11px]">
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const booking = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-muted-foreground text-xs">Booking Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(booking.id)}
              className="flex items-center gap-2 text-xs"
            >
              Copy booking ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-xs">
              <Link to={`/bookings/${booking.id}`} className="flex cursor-pointer items-center gap-2">
                <Eye className="h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
