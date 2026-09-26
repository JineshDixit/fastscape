import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { policyService, type Policy, type PermissionPresetGroup } from '@/api/services/adminService';
import { Key, X, Shield, Terminal, Zap } from 'lucide-react';
import ManagementSheet from './ManagementSheet';

const createPolicySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

const editPolicySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  isActive: z.boolean(),
});

type CreatePolicyFormData = z.infer<typeof createPolicySchema>;
type EditPolicyFormData = z.infer<typeof editPolicySchema>;

interface PolicySheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  policy: Policy | null;
  mode: 'create' | 'edit' | 'view';
}

const PolicySheet = ({ open, onClose, onSuccess, policy, mode }: PolicySheetProps) => {
  const [loading, setLoading] = useState(false);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetGroups, setPresetGroups] = useState<PermissionPresetGroup[]>([]);
  const [presetSearch, setPresetSearch] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  const isView = mode === 'view';
  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';

  const schema = isCreate ? createPolicySchema : editPolicySchema;

  const form = useForm<CreatePolicyFormData | EditPolicyFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
      isActive: true,
    },
  });

  const fetchPermissionPresets = async () => {
    try {
      setPresetLoading(true);
      const response = await policyService.getPermissionPresets();
      setPresetGroups(response.groups || []);
    } catch (error) {
      setPresetGroups([]);
      toast.error('Failed to load permission presets');
    } finally {
      setPresetLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    void fetchPermissionPresets();

    if (isCreate) {
      form.reset({
        name: '',
        description: '',
        permissions: [],
      });
      setPermissions([]);
      setPresetSearch('');
      return;
    }

    if (policy) {
      form.reset({
        name: policy.name,
        description: policy.description || '',
        permissions: policy.permissions,
        isActive: policy.isActive,
      });
      setPermissions(policy.permissions);
      setPresetSearch('');
    }
  }, [open, isCreate, policy, form]);

  const allPresetPermissions = useMemo(() => {
    const set = new Set<string>();
    presetGroups.forEach((group) => {
      group.permissions.forEach((permission) => set.add(permission));
    });
    return set;
  }, [presetGroups]);

  const unknownPermissions = useMemo(() => {
    if (allPresetPermissions.size === 0) {
      return [];
    }

    return permissions.filter((permission) => !allPresetPermissions.has(permission));
  }, [permissions, allPresetPermissions]);

  const filteredPresetGroups = useMemo(() => {
    const query = presetSearch.trim().toLowerCase();
    if (!query) {
      return presetGroups;
    }

    return presetGroups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => permission.toLowerCase().includes(query)),
      }))
      .filter((group) => group.label.toLowerCase().includes(query) || group.permissions.length > 0);
  }, [presetGroups, presetSearch]);

  const updatePermissions = (updated: string[]) => {
    setPermissions(updated);
    form.setValue('permissions', updated, { shouldValidate: true, shouldDirty: true });
  };

  const togglePermission = (permission: string) => {
    if (permissions.includes(permission)) {
      updatePermissions(permissions.filter((p) => p !== permission));
      return;
    }
    updatePermissions([...permissions, permission]);
  };

  const removePermission = (permission: string) => {
    updatePermissions(permissions.filter((p) => p !== permission));
  };

  const onSubmit = async (data: CreatePolicyFormData | EditPolicyFormData) => {
    if (allPresetPermissions.size === 0) {
      toast.error('Permission presets are not loaded yet');
      return;
    }

    if (unknownPermissions.length > 0) {
      toast.error('Remove unsupported permissions before saving');
      return;
    }

    try {
      setLoading(true);
      const payload = { ...data, permissions };

      if (isCreate) {
        await policyService.createPolicy(payload);
        toast.success('Policy launched successfully');
      } else if (policy) {
        await policyService.updatePolicy(policy.id, payload);
        toast.success('Policy configuration updated');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManagementSheet
      open={open}
      onClose={onClose}
      title={isCreate ? 'New Security Policy' : policy?.name || 'Policy Insights'}
      description={isCreate ? 'Define granular permissions for assets' : 'Detailed breakdown of the protection layer'}
      icon={<Key className="h-6 w-6" />}
      iconBgColor="bg-orange-500/10"
      iconColor="text-orange-600"
      maxWidth="sm:max-w-[680px]"
      loading={loading}
      isViewOnly={isView}
      onPrimaryAction={form.handleSubmit(onSubmit)}
      primaryActionText={isCreate ? 'Launch Policy' : 'Update Registry'}
      primaryActionDisabled={
        !isView && (presetLoading || allPresetPermissions.size === 0 || permissions.length === 0 || unknownPermissions.length > 0)
      }
    >
      {isView && policy ? (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6 transition-all">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-2 text-sm text-[10px] font-medium tracking-wider uppercase">
                <Shield className="h-3 w-3" /> Integrity Check
              </p>
              <div className="rounded-2x bg-muted/10 flex items-center justify-between border p-4 font-mono text-xs">
                <span>POLICY_STATUS</span>
                <Badge variant={policy.isActive ? 'default' : 'destructive'}>
                  {policy.isActive ? 'ENFORCED' : 'BYPASSED'}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-2 text-sm text-[10px] font-medium tracking-wider uppercase">
                <Terminal className="h-3 w-3" /> Metadata
              </p>
              <p className="bg-muted/5 text-muted-foreground rounded-xl border p-4 text-sm leading-relaxed italic">
                {policy.description || 'No metadata description associated with this policy.'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-muted-foreground flex items-center gap-2 text-sm text-[10px] font-medium tracking-wider uppercase">
              <Zap className="h-3 w-3" /> Permission Registry ({policy.permissions.length})
            </p>
            <div className="bg-muted/20 rounded-2xl border p-4">
              <div className="flex flex-wrap gap-2">
                {policy.permissions.map((perm) => (
                  <Badge key={perm} variant="secondary" className="bg-background border px-2 py-1 font-mono text-[10px]">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
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
                  <FormLabel>Internal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. content-manager-policy" {...field} />
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
                  <FormLabel>Policy Purpose</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define the scope of this policy..."
                      className="min-h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <FormLabel>Permission Registry</FormLabel>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {permissions.length} SELECTED
                </Badge>
              </div>

              <Input
                placeholder="Search permission presets..."
                value={presetSearch}
                onChange={(e) => setPresetSearch(e.target.value)}
              />

              <div className="space-y-3">
                <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                  Preset Permission Chips
                </p>
                <ScrollArea className="bg-muted/10 h-64 rounded-xl border p-3">
                  {presetLoading ? (
                    <div className="text-muted-foreground py-10 text-center text-sm">Loading presets...</div>
                  ) : filteredPresetGroups.length === 0 ? (
                    <div className="text-muted-foreground py-10 text-center text-sm">No presets found.</div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPresetGroups.map((group) => (
                        <div key={group.key} className="space-y-2">
                          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.permissions.map((permission) => {
                              const selected = permissions.includes(permission);
                              return (
                                <Button
                                  key={permission}
                                  type="button"
                                  variant={selected ? 'secondary' : 'outline'}
                                  size="sm"
                                  onClick={() => togglePermission(permission)}
                                  className="h-6 rounded-full px-2.5 font-mono text-[10px]"
                                >
                                  {permission}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="space-y-3">
                <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                  Active Permissions
                </p>
                <ScrollArea className="bg-muted/10 h-28 rounded-xl border p-3">
                  <div className="flex flex-wrap gap-1.5 focus:outline-none">
                    {permissions.map((permission) => {
                      const isUnknown = allPresetPermissions.size > 0 && !allPresetPermissions.has(permission);
                      return (
                        <Badge
                          key={permission}
                          variant="secondary"
                          className={
                            isUnknown
                              ? 'border-none bg-red-500/10 py-0.5 pr-1 pl-2 font-mono text-[9px] text-red-700'
                              : 'border-none bg-orange-500/10 py-0.5 pr-1 pl-2 font-mono text-[9px] text-orange-700'
                          }
                        >
                          {permission}
                          {isUnknown ? ' (legacy)' : ''}
                          <button
                            type="button"
                            onClick={() => removePermission(permission)}
                            className="ml-1 rounded-sm hover:bg-black/10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    {permissions.length === 0 && (
                      <span className="text-muted-foreground text-xs italic">Select one or more preset chips.</span>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {unknownPermissions.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  Unsupported legacy permissions detected. Remove them before saving.
                </div>
              )}
            </div>

            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="bg-muted/10 flex flex-row items-center justify-between rounded-2xl border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enforcement Status</FormLabel>
                      <p className="text-muted-foreground text-xs">
                        Disabled policies will ignore all their permissions strings.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
      )}
    </ManagementSheet>
  );
};

export default PolicySheet;
