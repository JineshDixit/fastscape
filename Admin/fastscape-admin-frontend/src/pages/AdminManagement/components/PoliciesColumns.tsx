'use client';

import type { ColumnDef } from '@tanstack/react-table';
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
import { MoreHorizontal, Edit, Trash2, Key, ShieldCheck, ShieldX } from 'lucide-react';
import type { Policy } from '@/api/services/adminService';

interface ColumnsProps {
  onEdit: (policy: Policy) => void;
  onToggleStatus: (policy: Policy) => void;
  onDelete: (policy: Policy) => void;
}

export const getColumns = ({ onEdit, onToggleStatus, onDelete }: ColumnsProps): ColumnDef<Policy>[] => [
  {
    accessorKey: 'name',
    header: 'Security Policy',
    cell: ({ row }) => {
      const policy = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-500/5 p-2 text-orange-600 transition-colors group-hover:bg-orange-500/10">
            <Key className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-gray-900">{policy.name}</span>
            <span className="text-muted-foreground truncate text-[10px] font-bold tracking-tight uppercase">
              Access Rule
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'permissions',
    header: 'Permission Set',
    cell: ({ row }) => {
      const permissions = row.original.permissions;
      return (
        <div className="flex max-w-[300px] flex-wrap gap-1">
          {permissions?.slice(0, 4).map((permission) => (
            <code key={permission} className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 text-[9px]">
              {permission}
            </code>
          )) || <span className="text-muted-foreground text-xs italic">No permissions defined</span>}
          {(permissions?.length || 0) > 4 && (
            <span className="text-muted-foreground flex items-center text-[10px] font-medium">
              + {permissions.length - 4} more
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <div className="flex items-center">
          {isActive ? (
            <Badge className="flex items-center gap-1 rounded-full border-none bg-green-500/10 px-2 py-0 text-green-600">
              <ShieldCheck className="h-3 w-3" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Active</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-full border-none bg-gray-100 px-2 py-0 text-gray-500">
              <ShieldX className="h-3 w-3" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Disabled</span>
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const policy = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1">
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-bold uppercase">
              Policy Actions
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(policy)} className="rounded-md">
              <Edit className="text-muted-foreground mr-2 h-4 w-4" /> Modify Policy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleStatus(policy)} className="rounded-md">
              {policy.isActive ? (
                <span className="flex items-center text-orange-500">
                  <ShieldX className="mr-2 h-4 w-4" /> Deactivate
                </span>
              ) : (
                <span className="flex items-center text-green-500">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Activate
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(policy)}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground rounded-md font-medium"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Erase Policy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
