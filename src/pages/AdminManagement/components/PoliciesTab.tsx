import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { policyService, type Policy } from '@/api/services/adminService';
import PolicySheet from './PolicySheet';
import ManagementDeleteDialog from './ManagementDeleteDialog';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './PoliciesColumns';
import type { SortingState } from '@tanstack/react-table';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/permissions';

const PoliciesTab = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('edit');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Pagination & Sorting state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const { hasPermission, hasAnyPermission } = usePermissions();

  const canCreatePolicy = hasPermission(PERMISSIONS.ADMIN.POLICIES.CREATE);
  const canEditPolicy = hasPermission(PERMISSIONS.ADMIN.POLICIES.UPDATE);
  const canDeletePolicy = hasPermission(PERMISSIONS.ADMIN.POLICIES.DELETE);
  const canActivatePolicy = hasAnyPermission([PERMISSIONS.ADMIN.POLICIES.ACTIVATE, PERMISSIONS.ADMIN.POLICIES.UPDATE]);
  const canDeactivatePolicy = hasAnyPermission([
    PERMISSIONS.ADMIN.POLICIES.DEACTIVATE,
    PERMISSIONS.ADMIN.POLICIES.UPDATE,
  ]);

  const fetchPolicies = useCallback(async () => {
    try {
      const { policies, total, totalPages } = await policyService.getAllPolicies({
        search: search || undefined,
        page: pageIndex + 1,
        limit: pageSize,
      });
      setPolicies(policies || []);
      setTotalRows(total || 0);
      setPageCount(totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
      toast.error('Failed to load policies');
      setPolicies([]);
    }
  }, [search, pageIndex, pageSize]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleCreatePolicy = () => {
    if (!canCreatePolicy) return;
    setSelectedPolicy(null);
    setSheetMode('create');
    setSheetOpen(true);
  };

  const handleEditPolicy = (policy: Policy) => {
    if (!canEditPolicy) return;
    setSelectedPolicy(policy);
    setSheetMode('edit');
    setSheetOpen(true);
  };

  const handleDeletePolicy = (policy: Policy) => {
    if (!canDeletePolicy) return;
    setSelectedPolicy(policy);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (policy: Policy) => {
    const allowed = policy.isActive ? canDeactivatePolicy : canActivatePolicy;
    if (!allowed) return;

    try {
      if (policy.isActive) {
        await policyService.deactivatePolicy(policy.id);
        toast.success(`Policy '${policy.name}' deactivated`);
      } else {
        await policyService.activatePolicy(policy.id);
        toast.success(`Policy '${policy.name}' activated`);
      }
      fetchPolicies();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setTimeout(() => setSelectedPolicy(null), 300);
  };

  const columns = getColumns({
    onEdit: handleEditPolicy,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDeletePolicy,
    canEdit: canEditPolicy,
    canToggleStatus: (policy) => (policy.isActive ? canDeactivatePolicy : canActivatePolicy),
    canDelete: canDeletePolicy,
  });

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={policies}
        searchPlaceholder="Search policies by name..."
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
        addButtonText="Create Security Policy"
        addButtonOnClick={handleCreatePolicy}
        showAddButton={canCreatePolicy}
        addButtonIcon={<Plus className="h-4 w-4" />}
      />

      <PolicySheet
        open={sheetOpen}
        onClose={handleSheetClose}
        onSuccess={() => {
          fetchPolicies();
          handleSheetClose();
        }}
        policy={selectedPolicy}
        mode={sheetMode}
      />

      <ManagementDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={() => {
          fetchPolicies();
          setDeleteDialogOpen(false);
        }}
        entityName="Policy"
        onDelete={() => policyService.deletePolicy(selectedPolicy!.id)}
        description={
          <>
            This action cannot be undone. This will permanently delete the policy{' '}
            <strong>{selectedPolicy?.name}</strong> and remove it from all roles.
          </>
        }
      />
    </div>
  );
};

export default PoliciesTab;
