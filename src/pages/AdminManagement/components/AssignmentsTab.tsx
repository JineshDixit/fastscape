import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Settings2 } from 'lucide-react';
import UserRoleAssignments from './UserRoleAssignments';
import RolePolicyAssignments from './RolePolicyAssignments';

const AssignmentsTab = () => {
  const [activeTab, setActiveTab] = useState('user-roles');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-2 px-1">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Access Control Matrix</h2>
          <p className="text-sm text-muted-foreground">Orchestrate permissions across subjects and objects</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="h-12 w-full sm:w-[400px] p-1 bg-gray-100 rounded-lg grid grid-cols-2">
          <TabsTrigger
            value="user-roles"
            className="rounded-md flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-4"
          >
            <Users className="h-4 w-4" />
            <span className="font-semibold text-sm">User Role Links</span>
          </TabsTrigger>
          <TabsTrigger
            value="role-policies"
            className="rounded-md flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-4"
          >
            <Shield className="h-4 w-4" />
            <span className="font-semibold text-sm">Role Policy Links</span>
          </TabsTrigger>
        </TabsList>

        <div className="min-h-[600px]">
          <TabsContent value="user-roles" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <UserRoleAssignments />
          </TabsContent>

          <TabsContent value="role-policies" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <RolePolicyAssignments />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AssignmentsTab;