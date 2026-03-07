import { useEffect, useState, useMemo } from 'react';
import { locationService, type Location } from '@/api/services/locationService';
import { createColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { LocationForm } from './LocationForm';
import { ExportButton } from '@/components/shared/ExportButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LocationFilters, { type LocationFilterValues } from '@/components/locations/LocationFilters';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGuard from '@/components/auth/PermissionGuard';

const Locations = () => {
  const [data, setData] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<LocationFilterValues>({});
  const { canCreate, canUpdate, canDelete } = usePermissions();

  useEffect(() => {
    fetchLocations();
  }, [filters, search]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationService.getAllLocations({
        limit: 1000,
        search: search || undefined,
        ...filters,
      });
      setData(response.data || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;

    try {
      await locationService.deleteLocation(locationToDelete.id);
      toast.success('Location deleted successfully');
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
      fetchLocations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete location');
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingLocation(null);
  };

  const columns = useMemo(
    () =>
      createColumns({
        onEdit: handleEdit,
        onDelete: (location) => {
          setLocationToDelete(location);
          setDeleteDialogOpen(true);
        },
        onRefresh: fetchLocations,
        canUpdate: canUpdate('locations'),
        canDelete: canDelete('locations'),
      }),
    [canUpdate, canDelete],
  );

  if (loading && data.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50/50">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search locations by name, city, or code..."
        showAddButton={canCreate('locations')}
        addButtonText="Add New Location"
        addButtonIcon={<Plus className="h-4 w-4" />}
        addButtonOnClick={() => setFormOpen(true)}
        tableContainerClassName="!max-h-[calc(100vh-15rem)]"
        onSearchChange={(value) => setSearch(value)}
        customActions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <LocationFilters
              currentFilters={filters}
              onApplyFilters={(newFilters) => setFilters(newFilters)}
              onResetFilters={() => setFilters({})}
            />
            <PermissionGuard module="locations" action="export">
              <ExportButton
                onExport={() => locationService.exportLocations({ search, ...filters })}
                filename="locations"
              />
            </PermissionGuard>
          </div>
        }
      />

      {/* Location Form Dialog */}
      <LocationForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={() => {
          fetchLocations();
          handleFormClose();
        }}
        location={editingLocation}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Locations;
