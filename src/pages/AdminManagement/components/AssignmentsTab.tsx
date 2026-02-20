import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Settings2 } from 'lucide-react';
import UserRoleAssignments from './UserRoleAssignments';
import RolePolicyAssignments from './RolePolicyAssignments';

const AssignmentsTab = () => {
  const [activeTab, setActiveTab] = useState('user-roles');

  return (
    <div className="animate-in fade-in space-y-8 duration-700">
      <div className="flex items-center gap-2 px-1">
        <div className="bg-primary/10 text-primary rounded-xl p-2">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Access Control Matrix</h2>
          <p className="text-muted-foreground text-sm">Orchestrate permissions across subjects and objects</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-lg bg-gray-100 p-1 sm:w-[400px]">
          <TabsTrigger
            value="user-roles"
            className="flex items-center gap-2 rounded-md px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            <span className="text-sm font-semibold">User Role Links</span>
          </TabsTrigger>
          <TabsTrigger
            value="role-policies"
            className="flex items-center gap-2 rounded-md px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Shield className="h-4 w-4" />
            <span className="text-sm font-semibold">Role Policy Links</span>
          </TabsTrigger>
        </TabsList>

        <div className="min-h-[600px]">
          <TabsContent value="user-roles" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
            <UserRoleAssignments />
          </TabsContent>

          <TabsContent value="role-policies" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
            <RolePolicyAssignments />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AssignmentsTab;
