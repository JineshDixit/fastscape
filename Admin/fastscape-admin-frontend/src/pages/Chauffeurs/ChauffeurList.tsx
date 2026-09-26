import { useEffect, useState, useMemo } from 'react';
import { type Chauffeur, ChauffeurStatus, chauffeurService } from '@/api/services/chauffeurService';
import { createColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Plus, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { ChauffeurForm } from './ChauffeurForm';
import { Card, CardContent } from '@/components/ui/card';
import ChauffeurFilters, { type ChauffeurFilterValues } from '@/components/chauffeurs/ChauffeurFilters';
import { ExportButton } from '@/components/shared/ExportButton';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';

const ChauffeurList = () => {
  const [data, setData] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ChauffeurFilterValues>({});
  const { canCreate, canDelete, canPerformAction } = usePermissions();

  const columns = useMemo(
    () =>
      createColumns({
        canVerify: canPerformAction('chauffeurs', 'verify'),
        canDelete: canDelete('chauffeurs'),
      }),
    [canDelete, canPerformAction],
  );

  useEffect(() => {
    fetchChauffeurs();
  }, [filters, search]);

  const fetchChauffeurs = async () => {
    try {
      setLoading(true);
      const response = await chauffeurService.getAllChauffeurs({
        search: search || undefined,
        status: (filters.status || undefined) as ChauffeurStatus | undefined,
        experienceLevel: filters.experienceLevel || undefined,
        isVerified: filters.isVerified,
        minRating: filters.minRating,
        sortBy: 'rating',
        sortOrder: 'DESC',
        limit: 1000,
      });
      if (response && response.chauffeurs) {
        setData(response.chauffeurs);
      } else {
        setData(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Failed to fetch Drivers:', error);
      toast.error('Failed to load Drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = data.length;
    const available = data.filter((c) => c.status === ChauffeurStatus.AVAILABLE).length;
    const busy = data.filter((c) => c.status === ChauffeurStatus.BUSY).length;
    const offDuty = data.filter((c) => c.status === ChauffeurStatus.OFF_DUTY).length;

    return [
      {
        title: 'Total Drivers',
        value: total,
        icon: Users,
        description: 'Registered drivers',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        title: 'Available Now',
        value: available,
        icon: UserCheck,
        description: 'Ready for booking',
        color: 'text-green-600',
        bg: 'bg-green-50',
      },
      {
        title: 'Currently Busy',
        value: busy,
        icon: Clock,
        description: 'On active trips',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
      {
        title: 'Off Duty',
        value: offDuty,
        icon: UserX,
        description: 'Not working today',
        color: 'text-red-600',
        bg: 'bg-red-50',
      },
    ];
  }, [data]);

  if (loading && data.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50/50">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border bg-gray-50/50 shadow-none">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2">
                <stat.icon
                  className={`h-5 w-5 ${stat.color.replace('text-', 'fill-').includes('amber') || stat.color.includes('blue') ? stat.color : 'text-gray-400'}`}
                />
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                {stat.title}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="fullName"
        searchPlaceholder="Search drivers by name, email, phone..."
        showAddButton={canCreate('chauffeurs')}
        addButtonText="Add New Driver"
        addButtonIcon={<Plus className="h-4 w-4" />}
        addButtonOnClick={() => setOpenCreate(true)}
        tableContainerClassName="!max-h-[calc(100vh-22.5rem)]"
        onSearchChange={(value) => setSearch(value)}
        customActions={
          <div className="flex items-center gap-2">
            <ChauffeurFilters
              currentFilters={filters}
              onApplyFilters={(newFilters) => setFilters(newFilters)}
              onResetFilters={() => setFilters({})}
            />
            <PermissionGuard module="chauffeurs" action="export">
              <ExportButton
                onExport={() =>
                  chauffeurService.exportChauffeurs({
                    search,
                    status: filters.status as ChauffeurStatus | undefined,
                    isVerified: filters.isVerified,
                    experienceLevel: filters.experienceLevel,
                    minRating: filters.minRating,
                  })
                }
                filename="chauffeurs"
              />
            </PermissionGuard>
          </div>
        }
      />

      <ChauffeurForm open={openCreate} onOpenChange={setOpenCreate} onSuccess={fetchChauffeurs} />
    </div>
  );
};

export default ChauffeurList;
