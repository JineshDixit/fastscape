'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Star, ShieldCheck, ExternalLink } from 'lucide-react';
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
import { Link } from 'react-router-dom';

export const columns: ColumnDef<Chauffeur>[] = [
  {
    accessorKey: 'fullName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4 hover:bg-transparent"
        >
          Chauffeur
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const chauffeur = row.original;

      return (
        <Link to={`/drivers/${chauffeur.id}`} className="group flex items-center justify-center gap-3">
          <div className="flex flex-col items-center">
            <span className="group-hover:text-primary flex items-center gap-1 font-bold text-gray-900 transition-colors">
              {chauffeur.fullName}
              {chauffeur.isVerified && <ShieldCheck className="text-primary h-3 w-3" />}
            </span>
            <span className="text-muted-foreground text-xs font-medium">{chauffeur.email}</span>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as ChauffeurStatus;
      const getStatusVariant = (status?: ChauffeurStatus) => {
        switch (status) {
          case ChauffeurStatus.AVAILABLE:
            return 'default';
          case ChauffeurStatus.BUSY:
            return 'secondary';
          case ChauffeurStatus.OFF_DUTY:
            return 'destructive';
          case ChauffeurStatus.ON_BREAK:
            return 'outline';
          default:
            return 'outline';
        }
      };

      return (
        <Badge
          variant={getStatusVariant(status)}
          className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
        >
          {status.replace('_', ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'nationality',
    header: 'Nationality',
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium">{row.getValue('nationality') || 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'experienceLevel',
    header: 'Experience',
    cell: ({ row }) => {
      const level = row.getValue('experienceLevel') as string;
      return (
        <Badge variant="outline" className="text-xs">
          {level || 'Beginner'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => {
      const rating = parseFloat(row.getValue('rating') || '0');
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="flex w-fit items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 font-bold text-gray-900">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span className="text-xs">{rating.toFixed(1)}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'totalTrips',
    header: 'Total Trips',
    cell: ({ row }) => (
      <div className="flex flex-col items-center">
        <span className="font-medium text-gray-900">{row.getValue('totalTrips')}</span>
        <span className="text-muted-foreground mt-0.5 text-[10px] leading-none font-bold tracking-widest uppercase">
          Trips
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'hourlyRate',
    header: 'Rate/Hr',
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue('hourlyRate') || '0');
      const currency = row.original.currency || 'AED';
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
              maximumFractionDigits: 0,
            }).format(rate)}
          </span>
          <span className="text-muted-foreground text-[10px] font-bold uppercase">per hour</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const chauffeur = row.original;

      const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete ${chauffeur.fullName}?`)) {
          try {
            await chauffeurService.deleteChauffeur(chauffeur.id);
            toast.success('Chauffeur deleted');
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
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-gray-100">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1">
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-bold tracking-widest uppercase">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={`/drivers/${chauffeur.id}`} className="flex cursor-pointer items-center gap-2">
                <ExternalLink className="h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(chauffeur.id)}
              className="flex items-center gap-2"
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!chauffeur.isVerified && (
              <DropdownMenuItem onClick={handleVerify} className="font-medium text-blue-600">
                Verify Chauffeur
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="font-medium text-red-600">
              Delete Chauffeur
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
