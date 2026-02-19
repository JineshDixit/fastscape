import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, X } from 'lucide-react';
import { type AdminUser } from '@/api/services/adminService';

interface ColumnProps {
    onRemoveRole: (userId: string, roleId: string) => void;
}

export const getColumns = ({ onRemoveRole }: ColumnProps): ColumnDef<AdminUser>[] => [
    {
        accessorKey: 'fullName',
        header: 'Administrative Subject',
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-gray-100">
                        <AvatarFallback className="text-[10px] font-bold">{user.fullName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-gray-900">{user.fullName}</span>
                        <span className="text-[10px] text-gray-500">{user.email}</span>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'roles',
        header: 'Active Role Clusters',
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex flex-wrap gap-1.5 max-w-[400px]">
                    {user.roles?.map((role) => (
                        <Badge
                            key={role.id}
                            variant="secondary"
                            className="bg-purple-50 text-purple-700 border border-purple-100/50 rounded pr-1 group/badge h-6"
                        >
                            <Shield className="h-3 w-3 mr-1 opacity-50" />
                            <span className="text-[10px] uppercase font-bold tracking-tight">{role.name}</span>
                            <button
                                onClick={() => onRemoveRole(user.id, role.id)}
                                className="ml-1 p-0.5 rounded hover:bg-red-50 hover:text-red-600 transition-colors md:opacity-0 md:group-hover/badge:opacity-100"
                            >
                                <X className="h-2 w-2" />
                            </button>
                        </Badge>
                    ))}
                    {!user.roles?.length && (
                        <span className="text-[10px] text-gray-400 italic">Unassigned</span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'isActive',
        header: () => <div className="text-right">Protection Layer</div>,
        cell: ({ row }) => {
            const isActive = row.getValue('isActive') as boolean;
            return (
                <div className="text-right">
                    {isActive ? (
                        <Badge className="bg-green-50 text-green-700 border-green-100 border text-[10px] font-bold uppercase rounded-full">
                            Authorized
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-gray-50 text-gray-500 border-gray-100 border text-[10px] font-bold uppercase rounded-full">
                            Restricted
                        </Badge>
                    )}
                </div>
            );
        },
    },
];
