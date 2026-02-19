import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Key, UserCheck } from 'lucide-react';
import AdminUsersTab from './components/AdminUsersTab';
import RolesTab from './components/RolesTab';
import PoliciesTab from './components/PoliciesTab';
import AssignmentsTab from './components/AssignmentsTab';
import StatsOverview from './components/StatsOverview';

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="flex h-full w-full flex-col space-y-6">

      <StatsOverview />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 space-y-4">
        <TabsList className="grid w-full grid-cols-4 p-1 bg-muted/50 backdrop-blur-sm rounded-xl">
          <TabsTrigger value="users" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm">
            <Shield className="h-4 w-4" />
            <span>Roles</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm">
            <Key className="h-4 w-4" />
            <span>Policies</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm">
            <UserCheck className="h-4 w-4" />
            <span>Assignments</span>
          </TabsTrigger>
        </TabsList>

        <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <TabsContent value="users" className="m-0 h-full outline-none">
            <Card className="border-none shadow-none ring-none">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Admin Users</CardTitle>
                    <CardDescription>
                      Manage system administrators and their security status.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-full p-0">
                <AdminUsersTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="m-0 h-full outline-none">
            <Card className="border-none shadow-none ring-none">
              <CardHeader className="p-0">
                <CardTitle>Access Roles</CardTitle>
                <CardDescription>
                  Define permission groups to simplify user management.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full p-0">
                <RolesTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="m-0 h-full outline-none">
            <Card className="border-none shadow-none ring-none">
              <CardHeader className='p-0'>
                <CardTitle>Security Policies</CardTitle>
                <CardDescription>
                  Configure granular permission strings for specific features.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full p-0">
                <PoliciesTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="m-0 h-full outline-none">
            <Card className="border-none shadow-none ring-none">
              <CardHeader className='p-0'>
                <CardTitle>Relationship Manager</CardTitle>
                <CardDescription>
                  Map users to roles and roles to policies in an interactive UI.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full p-0">
                <AssignmentsTab />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminManagement;