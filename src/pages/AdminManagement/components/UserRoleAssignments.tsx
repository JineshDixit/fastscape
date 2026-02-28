import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, ArrowRightLeft, ShieldPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  adminUserService,
  roleService,
  adminUserRoleService,
  type AdminUser,
  type Role,
} from '@/api/services/adminService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './UserRoleColumns';
import type { SortingState } from '@tanstack/react-table';

const UserRoleAssignments = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  // Pagination & Sorting state (keeping local for matrix as per existing logic but using DataTable props)
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        adminUserService.getAllAdminUsers({
          search: search || undefined,
          page: pageIndex + 1,
          limit: pageSize,
        }),
        roleService.getAllRoles({ limit: 100 }),
      ]);
      setUsers(usersResponse.users || []);
      setTotalRows(usersResponse.total || 0);
      setPageCount(usersResponse.totalPages || 0);
      setRoles(rolesResponse.roles || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [search, pageIndex, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select both user and role');
      return;
    }

    try {
      setAssigning(true);
      await adminUserRoleService.assignRoleToUser(selectedUser, selectedRole);
      toast.success('Security context updated successfully');
      setSelectedUser('');
      setSelectedRole('');
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to assign role';
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await adminUserRoleService.removeRoleFromUser(userId, roleId);
      toast.success('Access revoked successfully');
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove role';
      toast.error(message);
    }
  };

  const columns = useMemo(() => getColumns({ onRemoveRole: handleRemoveRole }), [handleRemoveRole]);

  if (loading && users.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <Spinner className="h-8 w-8" />
        <span className="text-muted-foreground text-sm">Synchronizing user-role matrix...</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-500">
      {/* Interactive Linker */}
      <Card className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="text-primary pointer-events-none absolute top-0 right-0 p-4 opacity-[0.03]">
          <ArrowRightLeft className="h-24 w-24" />
        </div>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 text-primary border-primary/10 rounded-xl border p-2.5">
              <ShieldPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Access Linker</CardTitle>
              <CardDescription className="text-xs">Digitally associate users with security roles</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-end gap-6 lg:flex-row">
            <div className="w-full flex-1 space-y-2">
              <label className="text-muted-foreground ml-1 text-[10px] font-bold tracking-widest uppercase">
                Target Subject
              </label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white">
                  <SelectValue placeholder="Identify an admin user..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="my-0.5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-primary/5 text-primary text-[9px]">
                            {user.fullName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.fullName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden h-11 items-center justify-center text-gray-200 lg:flex">
              <ArrowRightLeft className="h-5 w-5" />
            </div>

            <div className="w-full flex-1 space-y-2">
              <label className="text-muted-foreground ml-1 text-[10px] font-bold tracking-widest uppercase">
                Permission Cluster
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white">
                  <SelectValue placeholder="Select an access role..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id} className="my-0.5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShieldPlus className="text-primary/60 h-4 w-4" />
                        <span className="text-sm">{role.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAssignRole}
              disabled={assigning || !selectedUser || !selectedRole}
              className="bg-primary hover:bg-primary/90 h-11 w-full rounded-xl px-8 font-semibold shadow-md transition-all lg:w-auto"
            >
              {assigning ? <Spinner className="h-4 w-4 text-white" /> : <Plus className="mr-2 h-4 w-4" />}
              {assigning ? 'Linking...' : 'Establish Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matrix View */}
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          // Pagination props
          pageCount={pageCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
          totalRows={totalRows}
          // Search/Header props
          searchPlaceholder="Search matrix subjects..."
          onSearchChange={(val) => {
            setSearch(val);
            setPageIndex(0);
          }}
          // Sorting
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </div>
    </div>
  );
};

export default UserRoleAssignments;
