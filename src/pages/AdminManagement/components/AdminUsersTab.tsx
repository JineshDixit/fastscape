import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { adminUserService, type AdminUser } from '@/api/services/adminService';
import AdminUserSheet from './AdminUserSheet';
import PasswordChangeDialog from './PasswordChangeDialog';
import ManagementDeleteDialog from './ManagementDeleteDialog';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './AdminUsersColumns';
import type { SortingState } from '@tanstack/react-table';

const AdminUsersTab = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('view');
  const [dialogType, setDialogType] = useState<'password' | 'delete' | null>(null);

  // Pagination & Sorting state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const { users, total, totalPages } = await adminUserService.getAllAdminUsers({
        search: search || undefined,
        page: pageIndex + 1,
        limit: pageSize,
      });
      setUsers(users || []);
      setTotalRows(total || 0);
      setPageCount(totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
      toast.error('Failed to load admin users');
      setUsers([]);
    }
  }, [search, pageIndex, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setSheetMode('create');
    setSheetOpen(true);
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setSheetMode('view');
    setSheetOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setSheetMode('edit');
    setSheetOpen(true);
  };

  const handleChangePassword = (user: AdminUser) => {
    setSelectedUser(user);
    setDialogType('password');
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDialogType('delete');
  };

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      if (user.isActive) {
        await adminUserService.deactivateAdminUser(user.id);
        toast.success('User deactivated successfully');
      } else {
        await adminUserService.activateAdminUser(user.id);
        toast.success('User activated successfully');
      }
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  const handleDialogClose = () => {
    setDialogType(null);
    setSelectedUser(null);
  };

  const columns = getColumns({
    onView: handleViewUser,
    onEdit: handleEditUser,
    onPasswordChange: handleChangePassword,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDeleteUser,
  });

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search by name or email..."
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
        addButtonText="Add Administrator"
        addButtonOnClick={handleCreateUser}
        showAddButton={true}
        addButtonIcon={<Plus className="h-4 w-4" />}
      />

      <AdminUserSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        onSuccess={() => {
          fetchUsers();
          handleSheetClose();
        }}
        user={selectedUser}
        mode={sheetMode}
      />

      <PasswordChangeDialog
        open={dialogType === 'password'}
        onClose={handleDialogClose}
        onSuccess={() => {
          fetchUsers();
          handleDialogClose();
        }}
        user={selectedUser}
      />

      <ManagementDeleteDialog
        open={dialogType === 'delete'}
        onClose={handleDialogClose}
        onSuccess={() => {
          fetchUsers();
          handleDialogClose();
        }}
        entityName="Admin user"
        onDelete={() => adminUserService.deleteAdminUser(selectedUser!.id)}
        description={
          <>
            This action cannot be undone. This will permanently delete the admin user{' '}
            <strong>{selectedUser?.fullName}</strong> and remove all their access to the system.
          </>
        }
      />
    </div>
  );
};

export default AdminUsersTab;
