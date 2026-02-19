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
                        <Avatar className="h-9 w-9 border ring-2 ring-transparent transition-all shrink-0">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold uppercase">
                                {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm truncate text-gray-900">{user.fullName}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
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
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {roles?.map((role) => (
                            <Badge
                                key={role.id}
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider rounded-sm bg-purple-500/10 text-purple-700 dark:text-purple-300 border-none"
                            >
                                {role.name}
                            </Badge>
                        )) || <span className="text-xs text-muted-foreground italic">Restricted Access</span>}
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
                            className={`h-2 w-2 rounded-full mr-2 ${isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-400'
                                }`}
                        />
                        <span
                            className={`text-xs font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                                }`}
                        >
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
                    <span className="text-xs font-mono text-muted-foreground">
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
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-bold px-2 py-1.5">
                                User Operations
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onView(user)} className="rounded-md">
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(user)} className="rounded-md">
                                <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                                Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPasswordChange(user)} className="rounded-md">
                                <Key className="mr-2 h-4 w-4 text-muted-foreground" />
                                Security Key
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleStatus(user)} className="rounded-md">
                                {user.isActive ? (
                                    <>
                                        <UserX className="mr-2 h-4 w-4 text-orange-500" />
                                        <span className="text-orange-500 font-medium">Suspend Access</span>
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                                        <span className="text-green-500 font-medium">Re-activate</span>
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(user)}
                                className="text-destructive rounded-md focus:bg-destructive focus:text-destructive-foreground"
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
