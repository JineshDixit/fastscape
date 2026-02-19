import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { roleService, type Role } from '@/api/services/adminService';
import RoleSheet from './RoleSheet';
import ManagementDeleteDialog from './ManagementDeleteDialog';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './RolesColumns';
import type { SortingState } from '@tanstack/react-table';

const RolesTab = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('view');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Pagination & Sorting state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchRoles = useCallback(async () => {
    try {
      const { roles, total, totalPages } = await roleService.getAllRoles({
        search: search || undefined,
        includePolicies: true,
        page: pageIndex + 1,
        limit: pageSize,
      });
      setRoles(roles || []);
      setTotalRows(total || 0);
      setPageCount(totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
      setRoles([]);
    }
  }, [search, pageIndex, pageSize]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setSheetMode('create');
    setSheetOpen(true);
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setSheetMode('view');
    setSheetOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setSheetMode('edit');
    setSheetOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (role: Role) => {
    try {
      if (role.isActive) {
        await roleService.deactivateRole(role.id);
        toast.success(`Role '${role.name}' suspended`);
      } else {
        await roleService.activateRole(role.id);
        toast.success(`Role '${role.name}' reactivated`);
      }
      fetchRoles();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setTimeout(() => setSelectedRole(null), 300);
  };

  const columns = getColumns({
    onView: handleViewRole,
    onEdit: handleEditRole,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDeleteRole,
  });

  return (
    <div className="space-y-6">
        <DataTable
          columns={columns}
          data={roles}
          searchPlaceholder="Search roles by name..."
          pageCount={pageCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRows={totalRows}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
          onSearchChange={(val) => {
            setSearch(val);
            setPageIndex(0);
          }}
          sorting={sorting}
          onSortingChange={setSorting}
          addButtonText="Create Access Role"
          addButtonOnClick={handleCreateRole}
          showAddButton={true}
          addButtonIcon={<Plus className="h-4 w-4" />}
        />

      <RoleSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        onSuccess={() => {
          fetchRoles();
          handleSheetClose();
        }}
        role={selectedRole}
        mode={sheetMode}
      />

      <ManagementDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={() => {
          fetchRoles();
          setDeleteDialogOpen(false);
        }}
        entityName="Role"
        onDelete={() => roleService.deleteRole(selectedRole!.id)}
        description={
          <>
            This action cannot be undone. This will permanently delete the role{' '}
            <strong>{selectedRole?.name}</strong> and remove it from all admin users.
          </>
        }
      />
    </div>
  );
};

export default RolesTab;