import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, Shield, Key, Zap, ListChecks, ShieldCheck, Box } from "lucide-react";
import { toast } from "sonner";
import { roleService, policyService, rolePolicyService } from "@/api/services/adminService";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedPolicy, setSelectedPolicy] = useState<string>("");
  const [assignedPolicies, setAssignedPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePolicies(selectedRole);
    } else {
      setAssignedPolicies([]);
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      const response = await roleService.getAllRoles({ page: 1, limit: 100 });
      setRoles(response.roles || []);
    } catch (error) {
      toast.error("Failed to fetch roles");
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await policyService.getAllPolicies({ page: 1, limit: 100 });
      setPolicies(response.policies || []);
    } catch (error) {
      toast.error("Failed to fetch policies");
    }
  };

  const fetchRolePolicies = async (roleId: string) => {
    setLoading(true);
    try {
      const response = await rolePolicyService.getRolePolicies(roleId);
      setAssignedPolicies(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch role policies");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPolicy = async () => {
    if (!selectedRole || !selectedPolicy) {
      toast.error("Please select both role and policy");
      return;
    }

    setAssigning(true);
    try {
      await rolePolicyService.assignPolicy(selectedRole, selectedPolicy);
      toast.success("Policy integrated successfully");
      setSelectedPolicy("");
      fetchRolePolicies(selectedRole);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign policy");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemovePolicy = async (policyId: string) => {
    if (!selectedRole) return;

    try {
      await rolePolicyService.removePolicy(selectedRole, policyId);
      toast.success("Policy detached successfully");
      fetchRolePolicies(selectedRole);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove policy");
    }
  };

  const currentRole = roles.find(r => r.id === selectedRole);
  const availablePolicies = policies.filter(
    (policy) => !assignedPolicies.some((ap) => ap.id === policy.id)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Left Column: Context Selector */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="border border-gray-100 bg-white shadow-sm rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-primary/5 text-primary border border-primary/10">
                <Shield className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm uppercase tracking-widest font-bold text-gray-900">Policy Context</CardTitle>
            </div>
            <CardDescription className="text-xs">Select a role to manage its security policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-1">Primary Role Cluster</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="rounded-xl h-11 bg-white border-gray-200 text-sm focus:ring-primary/20">
                  <SelectValue placeholder="Identify role context..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id} className="rounded-lg my-0.5">
                      <div className="flex items-center gap-2">
                        <Box className="h-3.5 w-3.5 text-primary/60" />
                        <span className="text-sm">{role.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentRole && (
              <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Role Status</span>
                  <Badge className={`text-[9px] rounded-full px-2.5 h-5 font-bold uppercase tracking-tighter ${currentRole.isActive ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-100 text-gray-500 border-gray-200"}`} variant="outline">
                    {currentRole.isActive ? "Operational" : "Suspended"}
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-600 line-clamp-3 leading-relaxed">
                  {currentRole.description || "No specific metadata associated."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedRole && (
          <Card className="border border-primary/10 bg-primary/[0.02] shadow-sm rounded-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none text-primary">
              <Zap className="h-12 w-12" />
            </div>
            <CardHeader className="pb-3 pt-5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Bridge Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-1">Attach Policy Registry</label>
                <div className="space-y-4">
                  <Select
                    value={selectedPolicy}
                    onValueChange={setSelectedPolicy}
                  >
                    <SelectTrigger className="rounded-xl h-11 bg-white border-gray-200 text-sm focus:ring-primary/20">
                      <SelectValue placeholder="Choose policy string..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {availablePolicies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id} className="rounded-lg my-0.5">
                          <div className="flex items-center gap-2">
                            <Key className="h-3.5 w-3.5 text-orange-400" />
                            <span className="text-sm">{policy.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {availablePolicies.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground italic">All policies linked.</div>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssignPolicy}
                    disabled={!selectedPolicy || assigning}
                    className="w-full rounded-xl h-11 text-sm font-semibold shadow-md transition-all active:scale-[0.98]"
                  >
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    {assigning ? "Linking..." : "Establish Link"}
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
          <div className="h-full min-h-[450px] flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-gray-200 bg-gray-50/30">
            <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100 mb-5">
              <Shield className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">No Context Selected</h3>
            <p className="text-sm text-gray-400 max-w-xs mt-2 leading-relaxed">
              Select an access role cluster from the menu to initiate and manage its live security policy registry.
            </p>
          </div>
        ) : (
          <div className="h-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Policy Registry Matrix</h3>
                    <p className="text-xs text-gray-500">Active permission strings for <span className="text-primary font-semibold">{currentRole?.name}</span></p>
                  </div>
                </div>
                <Badge variant="secondary" className="font-bold text-[10px] rounded-lg bg-gray-100 text-gray-600 border-none px-3 h-6 tracking-widest uppercase">
                  {assignedPolicies.length} Registry Units
                </Badge>
              </div>
            </div>
            <div className="p-6 flex-1 bg-white">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                  <span className="text-sm font-medium text-gray-400 tracking-widest uppercase">Syncing Registry...</span>
                </div>
              ) : assignedPolicies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
                  <ShieldCheck className="h-12 w-12 text-gray-200 mb-3" />
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Access Layer Null</p>
                  <p className="text-[11px] text-gray-400 italic mt-1">This role cluster currently operates without extended permissions.</p>
                </div>
              ) : (
                <ScrollArea className="h-[550px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
                    {assignedPolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className="group relative p-5 rounded-xl border border-gray-100 hover:border-primary/20 bg-white hover:bg-gray-50/40 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-500 border border-orange-100/50">
                              <Key className="h-3.5 w-3.5" />
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors">{policy.name}</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePolicy(policy.id)}
                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-[11px] text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                          {policy.description || "Standard system-wide protection layout."}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {policy.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-[9px] font-bold px-2 py-0 border-gray-100 bg-gray-50/50 text-gray-500 h-5 tracking-tighter uppercase">
                              {permission}
                            </Badge>
                          ))}
                          {policy.permissions.length > 3 && (
                            <span className="text-[10px] text-gray-400 font-medium ml-1">
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
