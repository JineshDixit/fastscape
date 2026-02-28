import { useState, useEffect } from 'react';
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
import { policyService, type Policy } from '@/api/services/adminService';
import { Key, Plus, X, Shield, Terminal, Zap } from 'lucide-react';
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

const COMMON_PERMISSIONS = [
  'admin.users.create',
  'admin.users.read',
  'admin.users.update',
  'admin.users.delete',
  'admin.roles.create',
  'admin.roles.read',
  'admin.roles.update',
  'admin.roles.delete',
  'admin.policies.create',
  'admin.policies.read',
  'admin.policies.update',
  'admin.policies.delete',
  'admin.analytics.read',
  'admin.reports.generate',
  'admin.system.settings',
];

const PolicySheet = ({ open, onClose, onSuccess, policy, mode }: PolicySheetProps) => {
  const [loading, setLoading] = useState(false);
  const [newPermission, setNewPermission] = useState('');
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

  useEffect(() => {
    if (open) {
      if (isCreate) {
        form.reset({
          name: '',
          description: '',
          permissions: [],
        });
        setPermissions([]);
      } else if (policy) {
        form.reset({
          name: policy.name,
          description: policy.description || '',
          permissions: policy.permissions,
          isActive: policy.isActive,
        });
        setPermissions(policy.permissions);
      }
    }
  }, [open, policy, mode, form]);

  const addPermission = (permission: string) => {
    const trimmed = permission.trim();
    if (trimmed && !permissions.includes(trimmed)) {
      const updated = [...permissions, trimmed];
      setPermissions(updated);
      form.setValue('permissions', updated);
      setNewPermission('');
    }
  };

  const removePermission = (permission: string) => {
    const updated = permissions.filter((p) => p !== permission);
    setPermissions(updated);
    form.setValue('permissions', updated);
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      if (isCreate) {
        await policyService.createPolicy(data);
        toast.success('Policy launched successfully');
      } else if (policy) {
        await policyService.updatePolicy(policy.id, data);
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
      maxWidth="sm:max-w-[600px]"
      loading={loading}
      isViewOnly={isView}
      onPrimaryAction={form.handleSubmit(onSubmit)}
      primaryActionText={isCreate ? 'Launch Policy' : 'Update Registry'}
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
                  <Badge
                    key={perm}
                    variant="secondary"
                    className="bg-background border px-2 py-1 font-mono text-[10px]"
                  >
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
                      className="min-h-[80px] resize-none"
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
                  {permissions.length} STRINGS
                </Badge>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Terminal className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                  <Input
                    placeholder="Add custom string..."
                    value={newPermission}
                    onChange={(e) => setNewPermission(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPermission(newPermission);
                      }
                    }}
                    className="pl-9"
                  />
                </div>
                <Button type="button" size="icon" onClick={() => addPermission(newPermission)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                  Active Permissions
                </p>
                <ScrollArea className="bg-muted/10 h-28 rounded-xl border p-3">
                  <div className="flex flex-wrap gap-1.5 focus:outline-none">
                    {permissions.map((p) => (
                      <Badge
                        key={p}
                        variant="secondary"
                        className="border-none bg-orange-500/10 py-0.5 pr-1 pl-2 font-mono text-[9px] text-orange-700"
                      >
                        {p}
                        <button
                          type="button"
                          onClick={() => removePermission(p)}
                          className="ml-1 rounded-sm hover:bg-orange-500/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {permissions.length === 0 && (
                      <span className="text-muted-foreground text-xs italic">Registry is empty.</span>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-3">
                <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                  Standard Presets
                </p>
                <ScrollArea className="bg-muted/10 h-32 rounded-xl border p-1">
                  <div className="grid grid-cols-2 gap-1 px-2 py-2">
                    {COMMON_PERMISSIONS.map((perm) => (
                      <Button
                        key={perm}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="hover:bg-background h-7 justify-start font-mono text-[10px]"
                        onClick={() => addPermission(perm)}
                        disabled={permissions.includes(perm)}
                      >
                        {perm}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
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
