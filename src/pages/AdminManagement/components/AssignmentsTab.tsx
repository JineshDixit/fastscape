import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Settings2 } from 'lucide-react';
import UserRoleAssignments from './UserRoleAssignments';
import RolePolicyAssignments from './RolePolicyAssignments';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/permissions';

const AssignmentsTab = () => {
  const [activeTab, setActiveTab] = useState('user-roles');
  const { hasPermission } = usePermissions();

  const canReadUsers = hasPermission(PERMISSIONS.ADMIN.USERS.READ);
  const canReadRoles = hasPermission(PERMISSIONS.ADMIN.ROLES.READ);
  const canReadPolicies = hasPermission(PERMISSIONS.ADMIN.POLICIES.READ);

  const canAccessUserRoleTab = canReadUsers || canReadRoles;
  const canAccessRolePolicyTab = canReadRoles || canReadPolicies;

  const availableTabs = useMemo(() => {
    const tabs: string[] = [];
    if (canAccessUserRoleTab) tabs.push('user-roles');
    if (canAccessRolePolicyTab) tabs.push('role-policies');
    return tabs;
  }, [canAccessUserRoleTab, canAccessRolePolicyTab]);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || '');
    }
  }, [availableTabs, activeTab]);

  return (
    <div className="animate-in fade-in space-y-8 duration-700">
      <div className="flex items-center gap-2 px-1">
        <div className="bg-primary/10 text-primary rounded-xl p-2">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">Access Control Matrix</h2>
          <p className="text-muted-foreground text-sm">Orchestrate permissions across subjects and objects</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList
            className="grid h-12 min-w-85 rounded-lg bg-gray-100 p-1 sm:w-100"
            style={{ gridTemplateColumns: `repeat(${Math.max(availableTabs.length, 1)}, minmax(0, 1fr))` }}
          >
            {canAccessUserRoleTab && (
              <TabsTrigger
                value="user-roles"
                className="flex items-center gap-2 rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4" />
                <span className="text-sm font-semibold">User Role Links</span>
              </TabsTrigger>
            )}
            {canAccessRolePolicyTab && (
              <TabsTrigger
                value="role-policies"
                className="flex items-center gap-2 rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm font-semibold">Role Policy Links</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="min-h-150">
          {canAccessUserRoleTab && (
            <TabsContent value="user-roles" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
              <UserRoleAssignments />
            </TabsContent>
          )}

          {canAccessRolePolicyTab && (
            <TabsContent value="role-policies" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
              <RolePolicyAssignments />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default AssignmentsTab;
