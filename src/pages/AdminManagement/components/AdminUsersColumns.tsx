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
import { MoreHorizontal, Eye, Edit, Key, UserX, UserCheck, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { AdminUser } from '@/api/services/adminService';

interface ColumnsProps {
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onPasswordChange: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

export const getColumns = ({
  onView,
  onEdit,
  onPasswordChange,
  onToggleStatus,
  onDelete,
}: ColumnsProps): ColumnDef<AdminUser>[] => [
  {
    accessorKey: 'fullName',
    header: 'Administrator',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0 border ring-2 ring-transparent transition-all">
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold uppercase">
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-gray-900">{user.fullName}</span>
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'roles',
    header: 'Access Roles',
    cell: ({ row }) => {
      const roles = row.original.roles;
      return (
        <div className="flex max-w-[200px] flex-wrap gap-1.5">
          {roles?.map((role) => (
            <Badge
              key={role.id}
              variant="secondary"
              className="rounded-sm border-none bg-purple-500/10 px-1.5 py-0 text-[10px] font-bold tracking-wider text-purple-700 uppercase dark:text-purple-300"
            >
              {role.name}
            </Badge>
          )) || <span className="text-muted-foreground text-xs italic">Restricted Access</span>}
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
          <div
            className={`mr-2 h-2 w-2 rounded-full ${
              isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-400'
            }`}
          />
          <span className={`text-xs font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
            {isActive ? 'Online' : 'Disabled'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created On',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-muted-foreground font-mono text-xs">
          {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
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
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1">
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-bold uppercase">
              User Operations
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(user)} className="rounded-md">
              <Eye className="text-muted-foreground mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(user)} className="rounded-md">
              <Edit className="text-muted-foreground mr-2 h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPasswordChange(user)} className="rounded-md">
              <Key className="text-muted-foreground mr-2 h-4 w-4" />
              Security Key
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleStatus(user)} className="rounded-md">
              {user.isActive ? (
                <>
                  <UserX className="mr-2 h-4 w-4 text-orange-500" />
                  <span className="font-medium text-orange-500">Suspend Access</span>
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-500">Re-activate</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(user)}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground rounded-md"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Admin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
