import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, X } from 'lucide-react';
import { type AdminUser } from '@/api/services/adminService';

interface ColumnProps {
  onRemoveRole: (userId: string, roleId: string) => void;
  canRemoveRole?: boolean;
}

export const getColumns = ({ onRemoveRole, canRemoveRole = false }: ColumnProps): ColumnDef<AdminUser>[] => [
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
            <span className="text-sm font-semibold text-gray-900">{user.fullName}</span>
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
        <div className="flex max-w-[400px] flex-wrap gap-1.5">
          {user.roles?.map((role) => (
            <Badge
              key={role.id}
              variant="secondary"
              className="group/badge h-6 rounded border border-purple-100/50 bg-purple-50 pr-1 text-purple-700"
            >
              <Shield className="mr-1 h-3 w-3 opacity-50" />
              <span className="text-[10px] font-bold tracking-tight uppercase">{role.name}</span>
              {canRemoveRole && (
                <button
                  onClick={() => onRemoveRole(user.id, role.id)}
                  className="ml-1 rounded p-0.5 transition-colors hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover/badge:opacity-100"
                >
                  <X className="h-2 w-2" />
                </button>
              )}
            </Badge>
          ))}
          {!user.roles?.length && <span className="text-[10px] text-gray-400 italic">Unassigned</span>}
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
            <Badge className="rounded-full border border-green-100 bg-green-50 text-[10px] font-bold text-green-700 uppercase">
              Authorized
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="rounded-full border border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase"
            >
              Restricted
            </Badge>
          )}
        </div>
      );
    },
  },
];
