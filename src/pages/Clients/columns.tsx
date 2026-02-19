'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { type User, VerificationStatus } from '@/api/services/userService';
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

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'firstName',
    header: 'Name',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </span>
          <span className="text-muted-foreground text-[11px] leading-tight">{user.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => {
      const phone = row.getValue('phone') as string;
      return <div className="text-sm text-gray-900">{phone || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => {
      const user = row.original;
      const location = [user.city, user.state, user.country].filter(Boolean).join(', ');
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-gray-900">{location || 'N/A'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'verificationStatus',
    header: 'Verification',
    cell: ({ row }) => {
      const status = row.getValue('verificationStatus') as VerificationStatus;
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';

      switch (status) {
        case VerificationStatus.VERIFIED:
          variant = 'default';
          break;
        case VerificationStatus.PENDING:
          variant = 'secondary';
          break;
        case VerificationStatus.REJECTED:
          variant = 'destructive';
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
    accessorKey: 'isBlocked',
    header: 'Status',
    cell: ({ row }) => {
      const isBlocked = row.getValue('isBlocked') as boolean;
      return (
        <Badge
          variant={isBlocked ? 'destructive' : 'default'}
          className="rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
        >
          {isBlocked ? 'BLOCKED' : 'ACTIVE'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'dateOfBirth',
    header: 'Date of Birth',
    cell: ({ row }) => {
      const dateStr = row.getValue('dateOfBirth') as string;
      if (!dateStr) return <div className="text-muted-foreground text-sm italic">N/A</div>;
      const date = new Date(dateStr);
      return (
        <div className="text-sm text-gray-900">
          {date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined Date',
    cell: ({ row }) => {
      const dateStr = row.getValue('createdAt') as string;
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
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-muted-foreground text-xs">User Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
              className="flex items-center gap-2 text-xs"
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-xs">
              <Link to={`/clients/${user.id}`} className="flex cursor-pointer items-center gap-2">
                <Eye className="h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
