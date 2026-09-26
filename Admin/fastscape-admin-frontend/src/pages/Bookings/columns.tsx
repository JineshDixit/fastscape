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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useBookingLocalization } from '@/utils/modelLocalization.utils';

const BookingStatusCell = ({ status }: { status: string }) => {
  const { localizeBookingStatus } = useBookingLocalization();
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
      {localizeBookingStatus(status)}
    </Badge>
  );
};

const PaymentStatusCell = ({ status }: { status: PaymentStatus }) => {
  const { localizePaymentStatus } = useBookingLocalization();
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
      {localizePaymentStatus(status)}
    </Badge>
  );
};

const BookingTypeCell = ({ type }: { type: string }) => {
  const { localizeBookingType } = useBookingLocalization();
  return <span className="capitalize">{localizeBookingType(type)}</span>;
};

export const columns: ColumnDef<Booking>[] = [
  {
    accessorKey: 'user',
    header: 'Customer',
    enableSorting: true,
    cell: ({ row }) => {
      const user = row.original.User;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="">
            {user?.firstName} {user?.lastName}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'vehicle',
    header: 'Vehicle',
    enableSorting: true,
    cell: ({ row }) => {
      const vehicle = row.original.Vehicle;
      return (
        <span>
          {vehicle?.make} {vehicle?.model}
        </span>
      );
    },
  },
  {
    accessorKey: 'chauffeur',
    header: 'Chauffeur',
    enableSorting: true,
    cell: ({ row }) => {
      const chauffeur = row.original.Chauffeur;
      if (!chauffeur) return <span className="text-muted-foreground text-[11px] italic">Not assigned</span>;
      return <span>{chauffeur?.fullName}</span>;
    },
  },
  {
    accessorKey: 'bookingType',
    header: 'Service',
    enableSorting: true,
    cell: ({ row }) => {
      const type = row.getValue('bookingType') as string;
      return <BookingTypeCell type={type} />;
    },
  },
  {
    accessorKey: 'bookingStatus',
    header: 'Status',
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.original.bookingStatus;
      return <BookingStatusCell status={status} />;
    },
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Payment',
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.getValue('paymentStatus') as PaymentStatus;
      return <PaymentStatusCell status={status} />;
    },
  },
  {
    id: 'amount',
    accessorFn: (row) => row.BookingFinancial?.totalAmount,
    header: () => <div>Amount</div>,
    enableSorting: true,
    cell: ({ row }) => {
      const amountStr = row.original.BookingFinancial?.totalAmount || '0';
      const amount = parseFloat(amountStr);
      const currency = row.original.BookingFinancial?.currency || 'AED';

      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: 'startDatetime',
    header: 'Pickup Date',
    enableSorting: true,
    cell: ({ row }) => {
      const dateStr = row.getValue('startDatetime') as string;
      if (!dateStr) return <div className="text-muted-foreground text-sm italic">N/A</div>;
      const date = new Date(dateStr);
      return (
        <div className="flex flex-col gap-0.5">
          <span>{date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span className="text-muted-foreground text-[11px]">
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    enableSorting: false,
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
          <DropdownMenuContent align="end" className="w-48 p-1">
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-bold uppercase">
              Booking Operations
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="rounded-md">
              <Link to={`/bookings/${booking.id}`} className="flex cursor-pointer items-center">
                <Eye className="text-muted-foreground mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(booking.id);
                toast.success('Booking ID copied');
              }}
              className="rounded-md"
            >
              <Copy className="text-muted-foreground mr-2 h-4 w-4" /> Copy Identifier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
