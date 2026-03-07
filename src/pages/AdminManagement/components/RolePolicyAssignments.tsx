import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, Shield, Key, Zap, ListChecks, ShieldCheck, Box } from 'lucide-react';
import { toast } from 'sonner';
import { roleService, policyService, rolePolicyService } from '@/api/services/adminService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/permissions';

interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Policy {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
}

const RolePolicyAssignments = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');
  const [assignedPolicies, setAssignedPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const { hasPermission } = usePermissions();

  const canReadRoles = hasPermission(PERMISSIONS.ADMIN.ROLES.READ);
  const canReadPolicies = hasPermission(PERMISSIONS.ADMIN.POLICIES.READ);
  const canManageRolePolicies = hasPermission(PERMISSIONS.ADMIN.ROLES.UPDATE);

  useEffect(() => {
    fetchRoles();
    fetchPolicies();
  }, [canReadRoles, canReadPolicies]);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePolicies(selectedRole);
    } else {
      setAssignedPolicies([]);
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    if (!canReadRoles) {
      setRoles([]);
      return;
    }

    try {
      const response = await roleService.getAllRoles({ page: 1, limit: 100 });
      setRoles(response.roles || []);
    } catch (error) {
      toast.error('Failed to fetch roles');
    }
  };

  const fetchPolicies = async () => {
    if (!canReadPolicies) {
      setPolicies([]);
      return;
    }

    try {
      const response = await policyService.getAllPolicies({ page: 1, limit: 100 });
      setPolicies(response.policies || []);
    } catch (error) {
      toast.error('Failed to fetch policies');
    }
  };

  const fetchRolePolicies = async (roleId: string) => {
    if (!canReadRoles) {
      setAssignedPolicies([]);
      return;
    }

    setLoading(true);
    try {
      const response = await rolePolicyService.getRolePolicies(roleId);
      setAssignedPolicies(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch role policies');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPolicy = async () => {
    if (!canManageRolePolicies) {
      toast.error('You do not have permission to assign policies');
      return;
    }

    if (!selectedRole || !selectedPolicy) {
      toast.error('Please select both role and policy');
      return;
    }

    setAssigning(true);
    try {
      await rolePolicyService.assignPolicy(selectedRole, selectedPolicy);
      toast.success('Policy integrated successfully');
      setSelectedPolicy('');
      fetchRolePolicies(selectedRole);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign policy');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemovePolicy = async (policyId: string) => {
    if (!canManageRolePolicies) {
      toast.error('You do not have permission to remove policies');
      return;
    }

    if (!selectedRole) return;

    try {
      await rolePolicyService.removePolicy(selectedRole, policyId);
      toast.success('Policy detached successfully');
      fetchRolePolicies(selectedRole);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove policy');
    }
  };

  const currentRole = roles.find((r) => r.id === selectedRole);
  const availablePolicies = policies.filter((policy) => !assignedPolicies.some((ap) => ap.id === policy.id));

  return (
    <div className="animate-in fade-in slide-in-from-right-4 grid grid-cols-1 gap-8 duration-500 lg:grid-cols-12">
      {/* Left Column: Context Selector */}
      <div className="space-y-6 lg:col-span-4">
        <Card className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="mb-1 flex items-center gap-3">
              <div className="bg-primary/5 text-primary border-primary/10 rounded-xl border p-2.5">
                <Shield className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold tracking-widest text-gray-900 uppercase">
                Policy Context
              </CardTitle>
            </div>
            <CardDescription className="text-xs">Select a role to manage its security policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="pl-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Primary Role Cluster
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole} disabled={!canReadRoles}>
                <SelectTrigger className="focus:ring-primary/20 h-11 rounded-xl border-gray-200 bg-white text-sm">
                  <SelectValue placeholder="Identify role context..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id} className="my-0.5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Box className="text-primary/60 h-3.5 w-3.5" />
                        <span className="text-sm">{role.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentRole && (
              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-tight text-gray-500 uppercase">Role Status</span>
                  <Badge
                    className={`h-5 rounded-full px-2.5 text-[9px] font-bold tracking-tighter uppercase ${currentRole.isActive ? 'border-green-100 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-100 text-gray-500'}`}
                    variant="outline"
                  >
                    {currentRole.isActive ? 'Operational' : 'Suspended'}
                  </Badge>
                </div>
                <p className="line-clamp-3 text-[11px] leading-relaxed text-gray-600">
                  {currentRole.description || 'No specific metadata associated.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedRole && (
          <Card className="border-primary/10 bg-primary/2 relative overflow-hidden rounded-xl border shadow-sm">
            <div className="text-primary pointer-events-none absolute top-0 right-0 p-4 opacity-[0.05]">
              <Zap className="h-12 w-12" />
            </div>
            <CardHeader className="pt-5 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="text-primary h-4 w-4" />
                <CardTitle className="text-primary text-xs font-bold tracking-widest uppercase">
                  Bridge Actions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="pl-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                  Attach Policy Registry
                </label>
                <div className="space-y-4">
                  <Select value={selectedPolicy} onValueChange={setSelectedPolicy} disabled={!canManageRolePolicies}>
                    <SelectTrigger className="focus:ring-primary/20 h-11 rounded-xl border-gray-200 bg-white text-sm">
                      <SelectValue placeholder="Choose policy string..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {availablePolicies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id} className="my-0.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Key className="h-3.5 w-3.5 text-orange-400" />
                            <span className="text-sm">{policy.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {availablePolicies.length === 0 && (
                        <div className="text-muted-foreground p-4 text-center text-xs italic">All policies linked.</div>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssignPolicy}
                    disabled={!selectedPolicy || assigning || !canManageRolePolicies}
                    className="h-11 w-full rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98]"
                  >
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    {assigning ? 'Linking...' : 'Establish Link'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column: Registry View */}
      <div className="lg:col-span-8">
        {!selectedRole ? (
          <div className="flex h-full min-h-112.5 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/30 p-8 text-center">
            <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <Shield className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">No Context Selected</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
              Select an access role cluster from the menu to initiate and manage its live security policy registry.
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-125 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="rounded-xl border border-orange-100 bg-orange-50 p-2.5 text-orange-600">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Policy Registry Matrix</h3>
                    <p className="text-xs text-gray-500">
                      Active permission strings for{' '}
                      <span className="text-primary font-semibold">{currentRole?.name}</span>
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="h-6 rounded-lg border-none bg-gray-100 px-3 text-[10px] font-bold tracking-widest text-gray-600 uppercase"
                >
                  {assignedPolicies.length} Registry Units
                </Badge>
              </div>
            </div>
            <div className="flex-1 bg-white p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                  <Loader2 className="text-primary h-10 w-10 animate-spin opacity-20" />
                  <span className="text-sm font-medium tracking-widest text-gray-400 uppercase">
                    Syncing Registry...
                  </span>
                </div>
              ) : assignedPolicies.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/30 py-20">
                  <ShieldCheck className="mb-3 h-12 w-12 text-gray-200" />
                  <p className="text-sm font-bold tracking-widest text-gray-500 uppercase">Access Layer Null</p>
                  <p className="mt-1 text-[11px] text-gray-400 italic">
                    This role cluster currently operates without extended permissions.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-137.5 pr-4">
                  <div className="grid grid-cols-1 gap-5 pb-4 md:grid-cols-2">
                    {assignedPolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className="group hover:border-primary/20 relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:bg-gray-50/40 hover:shadow-md"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="rounded-lg border border-orange-100/50 bg-orange-50 p-1.5 text-orange-500">
                              <Key className="h-3.5 w-3.5" />
                            </div>
                            <h4 className="group-hover:text-primary text-sm font-bold text-gray-900 transition-colors">
                              {policy.name}
                            </h4>
                          </div>
                          {canManageRolePolicies && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePolicy(policy.id)}
                              className="h-8 w-8 rounded-full opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <p className="mb-4 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                          {policy.description || 'Standard system-wide protection layout.'}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {policy.permissions.slice(0, 3).map((permission) => (
                            <Badge
                              key={permission}
                              variant="outline"
                              className="h-5 border-gray-100 bg-gray-50/50 px-2 py-0 text-[9px] font-bold tracking-tighter text-gray-500 uppercase"
                            >
                              {permission}
                            </Badge>
                          ))}
                          {policy.permissions.length > 3 && (
                            <span className="ml-1 text-[10px] font-medium text-gray-400">
                              +{policy.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePolicyAssignments;
