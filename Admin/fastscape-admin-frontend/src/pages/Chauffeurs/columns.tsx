'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Star, Eye, Copy, ShieldCheck, Trash2 } from 'lucide-react';
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
import { useChauffeurLocalization } from '@/utils/modelLocalization.utils';

const ChauffeurStatusCell = ({ status }: { status: ChauffeurStatus }) => {
  const { localizeStatus } = useChauffeurLocalization();

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
    <Badge variant={getStatusVariant(status)} className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
      {localizeStatus(status)}
    </Badge>
  );
};

const ExperienceLevelCell = ({ level }: { level: string }) => {
  const { localizeExperienceLevel } = useChauffeurLocalization();

  return (
    <Badge variant="outline" className="text-xs">
      {localizeExperienceLevel(level || 'BEGINNER')}
    </Badge>
  );
};

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
          Driver
        </Button>
      );
    },
    cell: ({ row }) => {
      const chauffeur = row.original;

      return <span>{chauffeur.fullName}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as ChauffeurStatus;
      return <ChauffeurStatusCell status={status} />;
    },
  },
  {
    accessorKey: 'nationality',
    header: 'Nationality',
    cell: ({ row }) => <span>{row.getValue('nationality') || 'N/A'}</span>,
  },
  {
    accessorKey: 'experienceLevel',
    header: 'Experience',
    cell: ({ row }) => {
      const level = row.getValue('experienceLevel') as string;
      return <ExperienceLevelCell level={level} />;
    },
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => {
      const rating = parseFloat(row.getValue('rating') || '0');
      return (
        <div className="flex w-fit items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 font-bold text-gray-900">
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          <span className="text-xs">{rating.toFixed(1)}</span>
        </div>
      );
    },
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
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-bold uppercase">
              Chauffeur Operations
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="rounded-md">
              <Link to={`/drivers/${chauffeur.id}`} className="flex cursor-pointer items-center">
                <Eye className="text-muted-foreground mr-2 h-4 w-4" /> View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(chauffeur.id);
                toast.success('Identifier copied to clipboard');
              }}
              className="rounded-md"
            >
              <Copy className="text-muted-foreground mr-2 h-4 w-4" /> Copy Identifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!chauffeur.isVerified && (
              <DropdownMenuItem onClick={handleVerify} className="text-primary rounded-md font-medium">
                <ShieldCheck className="mr-2 h-4 w-4" /> Verify Credentials
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive-foreground rounded-md font-medium"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove Chauffeur
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
