import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UnitCard from '@/pages/Units/UnitCard';
import VehicleFormStepper from '@/pages/Units/VehicleFormStepper';
import DataTablePagination from '@/components/shared/DataTablePagination';
import { useVehicle } from '@/api/hooks/useVehicle';
import type { Vehicle } from '@/common/interface/vehicleInterface';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import debounce from 'lodash.debounce';
import VehicleFilters from '@/pages/Units/VehicleFilters';
import type { VehicleFilters as FilterInterface } from '@/common/interface/vehicleInterface';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';

const Units = () => {
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filters, setFilters] = useState<FilterInterface>({});
  const { canUpdate, canDelete } = usePermissions();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    vehicles,
    vehicle,
    isLoading,
    fetchVehicles,
    pagination,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    fetchVehicleById,
  } = useVehicle();

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        const trimmed = value.trim();

        if (trimmed.length === 0) {
          fetchVehicles({
            page: 1,
            limit: pageSize,
            ...filters,
          });
          return;
        }

        if (trimmed.length < 2) return;

        fetchVehicles({
          search: trimmed,
          ...filters,
        });
      }, 400),
    [fetchVehicles],
  );

  const handleAddVehicle = async (formData: FormData) => {
    try {
      if (selectedVehicle) {
        await updateVehicle(selectedVehicle.id, formData);
        toast.success('Vehicle updated successfully!');
      } else {
        await createVehicle(formData);
        toast.success('Vehicle created successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save vehicle');
      throw error;
    }
  };

  const handleFormSuccess = () => {
    const wasCreating = !selectedVehicle;

    setShowAddForm(false);
    setSelectedVehicle(null);
    setSearchParams({}); // Clear query params

    // Explicit refresh is required because list query dependencies may not change.
    // For create flow, move to page 1 so newly created records are visible with default sorting.
    if (wasCreating && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    fetchVehicles({ page: currentPage, limit: pageSize, ...filters });
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setSelectedVehicle(null);
    setSearchParams({}); // Clear query params
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleVehicleDetails = (vehicleId: string) => {
    navigate(`/units/${vehicleId}`);
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      await deleteVehicle(vehicleId);
      toast.success('Vehicle deleted successfully!');
      // Explicit refresh is okay here if state doesn't change,
      // but let's see if we should just rely on state.
      // Actually, deleteVehicle doesn't change currentPage or filters, so we DO need an explicit refresh or local filter.
      // Base on useVehicle, it already does setVehicles((prev) => prev.filter(...)).
      // So no need to fetch again!
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete vehicle');
    }
  };

  const handleSearchVehicle = (value: string) => {
    debouncedSearch(value);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    fetchVehicles({ page: currentPage, limit: pageSize, ...filters });
  }, [currentPage, pageSize, filters]);

  // Handle edit query parameter
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && !showAddForm) {
      fetchVehicleById(editId);
    }
  }, [searchParams, fetchVehicleById, showAddForm]);

  // When vehicle is loaded from fetchVehicleById, show the form
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && vehicle && vehicle.id === editId && !showAddForm) {
      setSelectedVehicle(vehicle);
      setShowAddForm(true);
    }
  }, [vehicle, searchParams, showAddForm]);

  const handleApplyFilters = (newFilters: FilterInterface) => {
    setFilters(newFilters);
    // Reset to page 1 when filters change
    setCurrentPage(1);
    // Removed redundant fetchVehicles - state update triggers useEffect
  };

  const handleResetFilters = () => {
    setFilters({});
    setCurrentPage(1);
    // Removed redundant fetchVehicles - state update triggers useEffect
  };

  // Show form view
  if (showAddForm) {
    return (
      <VehicleFormStepper
        vehicle={selectedVehicle || undefined}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
        onSubmit={handleAddVehicle}
        isLoading={isLoading}
      />
    );
  }

  // Show list view
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="text-foreground/50 absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search car name..."
              className="h-10 pl-10"
              onChange={(e) => handleSearchVehicle(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <VehicleFilters
            currentFilters={filters}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        </div>

        <PermissionGuard module="vehicles" action="create">
          <Button onClick={() => setShowAddForm(true)} className="w-full xl:w-auto">
            Add Unit
          </Button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && vehicles.length === 0 ? (
          <div className="col-span-full flex justify-center py-20">
            <div className="flex flex-col items-center gap-2">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <p className="text-muted-foreground mt-2">Loading vehicles...</p>
            </div>
          </div>
        ) : vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <UnitCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDetails={handleVehicleDetails}
              canUpdate={canUpdate('vehicles')}
              canDelete={canDelete('vehicles')}
            />
          ))
        ) : (
          <div className="bg-muted/20 col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-20">
            <p className="text-muted-foreground text-lg font-medium">No vehicles found</p>
            <p className="text-muted-foreground mt-1 text-sm">Try adjusting your filters or search terms</p>
            <Button variant="link" onClick={handleResetFilters} className="mt-2">
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      <DataTablePagination
        totalItems={pagination?.total || 0}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 30, 40, 50]}
      />
    </div>
  );
};

export default Units;
