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
import { MoreHorizontal, Eye, Edit, Shield, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import type { Role } from '@/api/services/adminService';

interface ColumnsProps {
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onToggleStatus: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export const getColumns = ({ onView, onEdit, onToggleStatus, onDelete }: ColumnsProps): ColumnDef<Role>[] => [
  {
    accessorKey: 'name',
    header: 'Security Role',
    cell: ({ row }) => {
      const role = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/5 p-2 text-purple-600 transition-colors group-hover:bg-purple-500/10">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-gray-900">{role.name}</span>
            <span className="text-muted-foreground truncate text-[10px] font-bold tracking-tight uppercase">
              System Object
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'policies',
    header: 'Policies Bundle',
    cell: ({ row }) => {
      const policies = row.original.policies;
      return (
        <div className="flex max-w-[250px] flex-wrap gap-1">
          {policies?.slice(0, 3).map((policy) => (
            <Badge
              key={policy.id}
              variant="outline"
              className="bg-background border-muted-foreground/20 rounded-md text-[9px]"
            >
              {policy.name}
            </Badge>
          )) || <span className="text-muted-foreground text-xs italic">Restricted</span>}
          {(policies?.length || 0) > 3 && (
            <Badge variant="outline" className="px-1 py-0 text-[9px] opacity-60">
              + {policies!.length - 3} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Protection Status',
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
              <span className="text-[10px] font-bold tracking-wider uppercase">Disabled</span>
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'totalPermissions',
    header: 'Total Permissions',
    cell: ({ row }) => {
      const role = row.original;
      const totalPerms = role.policies?.reduce((acc, p) => acc + p.permissions.length, 0) || 0;
      return <span className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">{totalPerms} PERMS</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const role = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1">
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-bold uppercase">
              Role Settings
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(role)} className="rounded-md">
              <Eye className="text-muted-foreground mr-2 h-4 w-4" /> View Layout
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(role)} className="rounded-md">
              <Edit className="text-muted-foreground mr-2 h-4 w-4" /> Modify Config
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleStatus(role)} className="rounded-md">
              {role.isActive ? (
                <span className="flex items-center text-orange-500">
                  <ShieldAlert className="mr-2 h-4 w-4" /> Suspend
                </span>
              ) : (
                <span className="flex items-center text-green-500">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Reactivate
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(role)}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground rounded-md font-medium"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Erase Role
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
