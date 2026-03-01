'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Building2, Edit, Trash2, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { type Location, locationService } from '@/api/services/locationService';
import { toast } from 'sonner';

interface ColumnsProps {
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onRefresh: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export const createColumns = ({
  onEdit,
  onDelete,
  onRefresh,
  canUpdate = false,
  canDelete = false,
}: ColumnsProps): ColumnDef<Location>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="pl-0 hover:bg-transparent"
        >
          Location Name
        </Button>
      );
    },
    cell: ({ row }) => {
      const location = row.original;

      return (
        <div className="flex items-center gap-3">
          <span className="">{location.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'city',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent"
        >
          City
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="text-muted-foreground h-4 w-4" />
        <span className="">{row.getValue('city')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => {
      const code = row.getValue('code') as string;
      return code ? (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {code}
          </Badge>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean;
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return (
        <div className="flex flex-col text-start">
          <span className="text-sm">{date.toLocaleDateString()}</span>
          <span className="text-muted-foreground text-xs">{date.toLocaleTimeString()}</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const location = row.original;

      const handleToggleStatus = async () => {
        try {
          await locationService.toggleLocationStatus(location.id);
          toast.success(`Location ${location.isActive ? 'deactivated' : 'activated'} successfully`);
          onRefresh();
        } catch (error: any) {
          toast.error(error.message || 'Failed to toggle location status');
        }
      };

      const handleDelete = () => {
        onDelete(location);
      };

      const handleEdit = () => {
        onEdit(location);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-gray-100">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1">
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-bold uppercase">
              Location Operations
            </DropdownMenuLabel>
            {canUpdate && (
              <DropdownMenuItem onClick={handleEdit} className="flex items-center rounded-md">
                <Edit className="text-muted-foreground mr-2 h-4 w-4" /> Edit Location
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(location.id);
                toast.success('Location ID copied');
              }}
              className="rounded-md"
            >
              <Copy className="text-muted-foreground mr-2 h-4 w-4" /> Copy Identifier
            </DropdownMenuItem>
            {(canUpdate || canDelete) && <DropdownMenuSeparator />}
            {canUpdate && (
              <DropdownMenuItem
                onClick={handleToggleStatus}
                className="text-primary flex items-center rounded-md font-medium"
              >
                {location.isActive ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" /> Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" /> Activate
                  </>
                )}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive-foreground rounded-md font-medium"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remove Location
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
