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

export const getColumns = ({
    onView,
    onEdit,
    onToggleStatus,
    onDelete,
}: ColumnsProps): ColumnDef<Role>[] => [
        {
            accessorKey: 'name',
            header: 'Security Role',
            cell: ({ row }) => {
                const role = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/5 text-purple-600 group-hover:bg-purple-500/10 transition-colors">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm truncate text-gray-900">{role.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-tight">System Object</span>
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
                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {policies?.slice(0, 3).map((policy) => (
                            <Badge
                                key={policy.id}
                                variant="outline"
                                className="text-[9px] bg-background border-muted-foreground/20 rounded-md"
                            >
                                {policy.name}
                            </Badge>
                        )) || <span className="text-xs text-muted-foreground italic">Restricted</span>}
                        {(policies?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 opacity-60">
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
                            <Badge className="bg-green-500/10 text-green-600 border-none rounded-full flex gap-1 items-center px-2 py-0">
                                <ShieldCheck className="h-3 w-3" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Active</span>
                            </Badge>
                        ) : (
                            <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-500 border-none rounded-full px-2 py-0"
                            >
                                <span className="text-[10px] uppercase font-bold tracking-wider">Disabled</span>
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
                return (
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded border">
                        {totalPerms} PERMS
                    </span>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const role = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-bold px-2 py-1.5">
                                Role Settings
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onView(role)} className="rounded-md">
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> View Layout
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(role)} className="rounded-md">
                                <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Modify Config
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleStatus(role)} className="rounded-md">
                                {role.isActive ? (
                                    <span className="text-orange-500 flex items-center">
                                        <ShieldAlert className="mr-2 h-4 w-4" /> Suspend
                                    </span>
                                ) : (
                                    <span className="text-green-500 flex items-center">
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Reactivate
                                    </span>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(role)}
                                className="text-destructive rounded-md focus:bg-destructive focus:text-destructive-foreground font-medium"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Erase Role
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
