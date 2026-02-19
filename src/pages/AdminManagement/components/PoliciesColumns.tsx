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

export const getColumns = ({
    onEdit,
    onToggleStatus,
    onDelete,
}: ColumnsProps): ColumnDef<Policy>[] => [
        {
            accessorKey: 'name',
            header: 'Security Policy',
            cell: ({ row }) => {
                const policy = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/5 text-orange-600 group-hover:bg-orange-500/10 transition-colors">
                            <Key className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm truncate text-gray-900">{policy.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-tight">Access Rule</span>
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
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {permissions?.slice(0, 4).map((permission) => (
                            <code key={permission} className="text-[9px] bg-muted px-1.5 py-0.5 rounded border text-muted-foreground">
                                {permission}
                            </code>
                        )) || <span className="text-xs text-muted-foreground italic">No permissions defined</span>}
                        {(permissions?.length || 0) > 4 && (
                            <span className="text-[10px] text-muted-foreground font-medium flex items-center">
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
                            <Badge className="bg-green-500/10 text-green-600 border-none rounded-full flex gap-1 items-center px-2 py-0">
                                <ShieldCheck className="h-3 w-3" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Active</span>
                            </Badge>
                        ) : (
                            <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-500 border-none rounded-full px-2 py-0"
                            >
                                <ShieldX className="h-3 w-3" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Disabled</span>
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
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-bold px-2 py-1.5">
                                Policy Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(policy)} className="rounded-md">
                                <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Modify Policy
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleStatus(policy)} className="rounded-md">
                                {policy.isActive ? (
                                    <span className="text-orange-500 flex items-center">
                                        <ShieldX className="mr-2 h-4 w-4" /> Deactivate
                                    </span>
                                ) : (
                                    <span className="text-green-500 flex items-center">
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Activate
                                    </span>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(policy)}
                                className="text-destructive rounded-md focus:bg-destructive focus:text-destructive-foreground font-medium"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Erase Policy
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
