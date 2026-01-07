import React, { useEffect, useMemo, useState } from 'react';
import { Search, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UnitCard from '@/components/units/UnitCard';
import VehicleFormStepper from '@/components/units/VehicleFormStepper';
import DataTablePagination from '@/components/shared/DataTablePagination';
import { useVehicle } from '@/api/hooks/useVehicle';
import type { Vehicle } from '@/common/interface/vehicleInterface';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
// import VehicleDetails from '@/components/units/VehicleDetails';
import debounce from 'lodash.debounce';

const Units = () => {
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const navigate = useNavigate();

  const {
    vehicles,
    // vehicle,
    isLoading,
    fetchVehicles,
    pagination,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    // fetchVehicleById,
  } = useVehicle();

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        const trimmed = value.trim();

        if (trimmed.length === 0) {
          fetchVehicles({
            page: 1,
            limit: pageSize,
          });
          return;
        }

        if (trimmed.length < 2) return;

        fetchVehicles({
          search: trimmed,
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
    setShowAddForm(false);
    setSelectedVehicle(null);
    fetchVehicles({ page: currentPage, limit: pageSize });
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setSelectedVehicle(null);
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
      fetchVehicles({ page: currentPage, limit: pageSize });
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
    fetchVehicles({ page: currentPage, limit: pageSize });
  }, [currentPage, pageSize]);

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

  // if (showVehicleDetails) {
  //   return (
  //     <VehicleDetails
  //       vehicle={vehicle}
  //       onCancel={handleVehicleDetailsClose}
  //       isLoading={isLoading}
  //       getVehicleDetails={fetchVehicleById}
  //     />
  //   );
  // }

  // Show list view
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-stretch justify-between gap-6 xl:flex-row xl:items-center">
        <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row">
          <div className="relative w-full sm:max-w-md">
            <Search className="text-foreground/50 absolute top-1/2 left-4 size-[18px] -translate-y-1/2" />
            <Input
              placeholder="Search car name"
              className="placeholder:text-foreground/50 pl-11"
              onChange={(e) => handleSearchVehicle(e.target.value)}
            />
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Select defaultValue="all-types">
              <SelectTrigger className="w-full sm:w-[150px]">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="text-foreground/50 size-4" />
                  <SelectValue placeholder="Car Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">Car Type</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all-status">
              <SelectTrigger className="w-full sm:w-[150px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-foreground/50 size-4" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={() => setShowAddForm(true)}>Add Unit</Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && vehicles.length === 0 ? (
          <div className="col-span-full flex justify-center py-12">
            <p className="text-muted-foreground">Loading vehicles...</p>
          </div>
        ) : vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <UnitCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDetails={handleVehicleDetails}
            />
          ))
        ) : (
          <div className="col-span-full flex justify-center py-12">
            <p className="text-muted-foreground">No vehicles found.</p>
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
