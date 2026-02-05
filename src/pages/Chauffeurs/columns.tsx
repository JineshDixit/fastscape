'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
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
import { type Chauffeur, ChauffeurStatus, chauffeurService } from '@/api/services/chauffeurService';
import { toast } from 'sonner';

export const columns: ColumnDef<Chauffeur>[] = [
  {
    accessorKey: 'fullName',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue('fullName') as string;
      const email = row.original.email;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground text-xs">{email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as ChauffeurStatus;
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

      switch (status) {
        case ChauffeurStatus.AVAILABLE:
          variant = 'default'; // or success if available
          break;
        case ChauffeurStatus.BUSY:
          variant = 'secondary';
          break;
        case ChauffeurStatus.OFF_DUTY:
          variant = 'destructive';
          break;
        case ChauffeurStatus.ON_BREAK:
          variant = 'outline';
          break;
      }

      return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
    },
  },
  {
    accessorKey: 'rating',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Rating
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rating = parseFloat(row.getValue('rating'));
      return <div className="font-medium">{rating.toFixed(1)} ★</div>;
    },
  },
  {
    accessorKey: 'totalTrips',
    header: 'Trips',
    cell: ({ row }) => <div className="text-center">{row.getValue('totalTrips')}</div>,
  },
  {
    accessorKey: 'hourlyRate',
    header: 'Rate/Hr',
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue('hourlyRate'));
      const currency = row.original.currency || 'USD';
      return (
        <div className="font-medium">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
          }).format(rate)}
        </div>
      );
    },
  },
  {
    accessorKey: 'isVerified',
    header: 'Verified',
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.isVerified ? (
          <span className="font-bold text-green-600">✓</span>
        ) : (
          <span className="text-red-500">✗</span>
        )}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const chauffeur = row.original;

      const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this chauffeur?')) {
          try {
            await chauffeurService.deleteChauffeur(chauffeur.id);
            toast.success('Chauffeur deleted');
            // Note: Page refresh or state update needed.
            // In a real app, strict state management would handle this.
            // For simplified implementation, we rely on parent to refresh or window reload.
            window.location.reload();
          } catch (error) {
            toast.error('Failed to delete');
          }
        }
      };

      const handleVerify = async () => {
        try {
          await chauffeurService.verifyChauffeur(chauffeur.id);
          toast.success('Chauffeur verified');
          window.location.reload();
        } catch (error) {
          toast.error('Failed to verify');
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(chauffeur.id)}>Copy ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            {!chauffeur.isVerified && <DropdownMenuItem onClick={handleVerify}>Verify Chauffeur</DropdownMenuItem>}
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              Delete Chauffeur
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
