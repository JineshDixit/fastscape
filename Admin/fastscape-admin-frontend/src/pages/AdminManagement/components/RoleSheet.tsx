import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { roleService, policyService, type Role, type Policy } from '@/api/services/adminService';
import { Shield, Info, ListChecks, CheckCircle2 } from 'lucide-react';
import ManagementSheet from './ManagementSheet';

const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  description: z.string().optional(),
  policyIds: z.array(z.string()).optional(),
});

const editRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;
type EditRoleFormData = z.infer<typeof editRoleSchema>;

interface RoleSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
  mode: 'create' | 'edit' | 'view';
}

const RoleSheet = ({ open, onClose, onSuccess, role, mode }: RoleSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);

  const isView = mode === 'view';
  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';

  const schema = isCreate ? createRoleSchema : editRoleSchema;

  const form = useForm<CreateRoleFormData | EditRoleFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      policyIds: [],
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (isCreate) {
        fetchPolicies();
        form.reset({
          name: '',
          description: '',
          policyIds: [],
        });
        setSelectedPolicyIds([]);
      } else if (role) {
        form.reset({
          name: role.name,
          description: role.description || '',
          isActive: role.isActive,
        });
        setSelectedPolicyIds(role.policies?.map((p) => p.id) || []);
      }
    }
  }, [open, role, mode, form]);

  const fetchPolicies = async () => {
    try {
      const response = await policyService.getAllPolicies({ limit: 100 });
      setPolicies(response.policies);
    } catch (error) {
      toast.error('Failed to load policies');
    }
  };

  const handlePolicyToggle = (policyId: string, checked: boolean) => {
    let newIds;
    if (checked) {
      newIds = [...selectedPolicyIds, policyId];
    } else {
      newIds = selectedPolicyIds.filter((id) => id !== policyId);
    }
    setSelectedPolicyIds(newIds);
    if (isCreate) {
      (form as any).setValue('policyIds', newIds);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      if (isCreate) {
        await roleService.createRole({ ...data, policyIds: selectedPolicyIds });
        toast.success('Role created successfully');
      } else if (role) {
        await roleService.updateRole(role.id, data);
        toast.success('Role updated successfully');
      }
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManagementSheet
      open={open}
      onClose={onClose}
      title={isCreate ? 'Create Access Role' : role?.name || 'Role Details'}
      description={isCreate ? 'Define a new set of permissions' : 'View or manage role configuration'}
      icon={<Shield className="h-6 w-6" />}
      iconBgColor="bg-purple-500/10"
      iconColor="text-purple-600"
      loading={loading}
      isViewOnly={isView}
      onPrimaryAction={form.handleSubmit(onSubmit)}
      primaryActionText={isCreate ? 'Launch Role' : 'Commit Updates'}
    >
      {isView && role ? (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6 transition-all">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-2 text-sm text-[10px] font-medium tracking-wider uppercase">
                <Info className="h-3 w-3" /> Description
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed italic">
                {role.description || 'No description provided for this role.'}
              </p>
            </div>

            <div className="bg-muted/20 flex items-center justify-between rounded-xl border p-3">
              <span className="text-sm font-medium">System Permissions Status</span>
              <Badge variant={role.isActive ? 'default' : 'secondary'}>
                {role.isActive ? 'Operational' : 'Suspended'}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground flex items-center gap-2 text-sm text-[10px] font-medium tracking-wider uppercase">
                <ListChecks className="h-3 w-3" /> Assigned Policies ({role.policies?.length || 0})
              </p>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {role.policies?.map((policy) => (
                  <div
                    key={policy.id}
                    className="bg-background hover:border-primary/20 group rounded-xl border p-4 transition-all"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <h4 className="text-sm font-semibold">{policy.name}</h4>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {policy.permissions.length} PERMS
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">{policy.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {policy.permissions.slice(0, 4).map((p) => (
                        <code key={p} className="bg-muted rounded border px-1.5 py-0.5 text-[9px]">
                          {p}
                        </code>
                      ))}
                      {policy.permissions.length > 4 && (
                        <span className="text-muted-foreground text-[9px]">+{policy.permissions.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )) || <p className="py-10 text-center text-sm italic opacity-50">No policies assigned</p>}
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="animate-in fade-in slide-in-from-right-4 space-y-6 transition-all"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. System Administrator" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain what this role grants access to..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="bg-muted/30 flex flex-row items-center justify-between rounded-2xl border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-muted-foreground text-xs">
                        Inactive roles prevent all assigned users from accessing permissions.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {isCreate && (
              <div className="space-y-4">
                <FormLabel className="flex items-center gap-2">
                  Select Initial Policies
                  <Badge variant="secondary" className="rounded-full">
                    {selectedPolicyIds.length}
                  </Badge>
                </FormLabel>
                <ScrollArea className="bg-muted/30 h-56 rounded-2xl border p-4">
                  <div className="space-y-4">
                    {policies.map((policy) => (
                      <div key={policy.id} className="group flex items-start gap-3">
                        <Checkbox
                          id={policy.id}
                          checked={selectedPolicyIds.includes(policy.id)}
                          onCheckedChange={(checked) => handlePolicyToggle(policy.id, !!checked)}
                          className="mt-1"
                        />
                        <div className="grid gap-1">
                          <label
                            htmlFor={policy.id}
                            className="group-hover:text-primary cursor-pointer text-sm font-semibold transition-colors"
                          >
                            {policy.name}
                          </label>
                          <p className="text-muted-foreground line-clamp-1 text-xs">{policy.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </form>
        </Form>
      )}
    </ManagementSheet>
  );
};

export default RoleSheet;
