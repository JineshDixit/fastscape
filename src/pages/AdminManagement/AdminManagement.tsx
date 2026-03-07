import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Key, UserCheck } from 'lucide-react';
import AdminUsersTab from './components/AdminUsersTab';
import RolesTab from './components/RolesTab';
import PoliciesTab from './components/PoliciesTab';
import AssignmentsTab from './components/AssignmentsTab';
import StatsOverview from './components/StatsOverview';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/permissions';

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { hasPermission } = usePermissions();

  const canReadUsers = hasPermission(PERMISSIONS.ADMIN.USERS.READ);
  const canReadRoles = hasPermission(PERMISSIONS.ADMIN.ROLES.READ);
  const canReadPolicies = hasPermission(PERMISSIONS.ADMIN.POLICIES.READ);
  const canAccessAssignments = canReadUsers || canReadRoles || canReadPolicies;

  const availableTabs = useMemo(() => {
    const tabs: string[] = [];
    if (canReadUsers) tabs.push('users');
    if (canReadRoles) tabs.push('roles');
    if (canReadPolicies) tabs.push('policies');
    if (canAccessAssignments) tabs.push('assignments');
    return tabs;
  }, [canReadUsers, canReadRoles, canReadPolicies, canAccessAssignments]);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || '');
    }
  }, [availableTabs, activeTab]);

  return (
    <div className="flex h-full w-full flex-col space-y-6">
      <StatsOverview />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-muted/50 inline-flex h-auto min-w-full flex-nowrap rounded-xl p-1 backdrop-blur-sm">
            {canReadUsers && (
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-background flex flex-none items-center gap-2 rounded-lg px-3 text-sm transition-all data-[state=active]:shadow-sm sm:flex-1"
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
            )}
            {canReadRoles && (
              <TabsTrigger
                value="roles"
                className="data-[state=active]:bg-background flex flex-none items-center gap-2 rounded-lg px-3 text-sm transition-all data-[state=active]:shadow-sm sm:flex-1"
              >
                <Shield className="h-4 w-4" />
                <span>Roles</span>
              </TabsTrigger>
            )}
            {canReadPolicies && (
              <TabsTrigger
                value="policies"
                className="data-[state=active]:bg-background flex flex-none items-center gap-2 rounded-lg px-3 text-sm transition-all data-[state=active]:shadow-sm sm:flex-1"
              >
                <Key className="h-4 w-4" />
                <span>Policies</span>
              </TabsTrigger>
            )}
            {canAccessAssignments && (
              <TabsTrigger
                value="assignments"
                className="data-[state=active]:bg-background flex flex-none items-center gap-2 rounded-lg px-3 text-sm transition-all data-[state=active]:shadow-sm sm:flex-1"
              >
                <UserCheck className="h-4 w-4" />
                <span>Assignments</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 transition-all duration-300">
          {canReadUsers && (
            <TabsContent value="users" className="m-0 h-full outline-none">
              <Card className="ring-none border-none shadow-none">
                <CardHeader className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Admin Users</CardTitle>
                      <CardDescription>Manage system administrators and their security status.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-full p-0">
                  <AdminUsersTab />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canReadRoles && (
            <TabsContent value="roles" className="m-0 h-full outline-none">
              <Card className="ring-none border-none shadow-none">
                <CardHeader className="p-0">
                  <CardTitle>Access Roles</CardTitle>
                  <CardDescription>Define permission groups to simplify user management.</CardDescription>
                </CardHeader>
                <CardContent className="h-full p-0">
                  <RolesTab />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canReadPolicies && (
            <TabsContent value="policies" className="m-0 h-full outline-none">
              <Card className="ring-none border-none shadow-none">
                <CardHeader className="p-0">
                  <CardTitle>Security Policies</CardTitle>
                  <CardDescription>Configure granular permission strings for specific features.</CardDescription>
                </CardHeader>
                <CardContent className="h-full p-0">
                  <PoliciesTab />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canAccessAssignments && (
            <TabsContent value="assignments" className="m-0 h-full outline-none">
              <Card className="ring-none border-none shadow-none">
                <CardHeader className="p-0">
                  <CardTitle>Relationship Manager</CardTitle>
                  <CardDescription>Map users to roles and roles to policies in an interactive UI.</CardDescription>
                </CardHeader>
                <CardContent className="h-full p-0">
                  <AssignmentsTab />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default AdminManagement;
