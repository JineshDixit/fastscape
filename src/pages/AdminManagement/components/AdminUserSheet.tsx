import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { adminUserService, type AdminUser } from '@/api/services/adminService';
import { Shield, Mail, Calendar, User } from 'lucide-react';
import ManagementSheet from './ManagementSheet';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
  isActive: z.boolean(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

interface AdminUserSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: AdminUser | null;
  mode: 'create' | 'edit' | 'view';
}

const AdminUserSheet = ({ open, onClose, onSuccess, user, mode }: AdminUserSheetProps) => {
  const [loading, setLoading] = useState(false);

  const isView = mode === 'view';
  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';

  const schema = isCreate ? createUserSchema : editUserSchema;

  const form = useForm<CreateUserFormData | EditUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (isCreate) {
        form.reset({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        });
      } else if (user) {
        form.reset({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isActive: user.isActive,
        });
      }
    }
  }, [open, user, mode, form]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      if (isCreate) {
        await adminUserService.createAdminUser(data);
        toast.success('Admin user created successfully');
      } else if (user) {
        await adminUserService.updateAdminUser(user.id, data);
        toast.success('Admin user updated successfully');
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
      title={isCreate ? 'Create Admin User' : user?.fullName || 'Admin User'}
      description={isCreate ? 'Add a new administrator to the system' : `Managing profile for ${user?.email}`}
      icon={
        <Avatar className="border-primary/20 h-full w-full border-2">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary/10 text-primary text-xl uppercase">
            {user ? `${user.firstName[0]}${user.lastName[0]}` : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      }
      maxWidth="sm:max-w-[500px]"
      loading={loading}
      isViewOnly={isView}
      onPrimaryAction={form.handleSubmit(onSubmit)}
      primaryActionText={isCreate ? 'Create User' : 'Save Changes'}
    >
      {isView && user ? (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6 transition-all">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <User className="h-3 w-3" /> Name
              </p>
              <p className="text-base">{user.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Mail className="h-3 w-3" /> Email
              </p>
              <p className="truncate text-base">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-3 w-3" /> Member Since
              </p>
              <p className="text-base">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Shield className="h-3 w-3" /> Status
              </p>
              <div className="pt-1">
                <Switch checked={user.isActive} disabled />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-muted-foreground text-sm font-medium">Assigned Roles</p>
            <div className="flex flex-wrap gap-2">
              {user.roles?.map((role) => (
                <Button key={role.id} variant="secondary" size="sm" className="h-7 rounded-full px-3 text-xs">
                  <Shield className="mr-1.5 h-3 w-3" />
                  {role.name}
                </Button>
              )) || <p className="text-sm italic">No roles assigned</p>}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-muted-foreground text-sm font-medium">Permissions Overview</p>
            <div className="bg-muted/30 rounded-lg border p-4">
              <div className="flex flex-wrap gap-1.5">
                {user.permissions?.map((perm) => (
                  <code key={perm} className="bg-background rounded border px-1.5 py-0.5 text-[10px]">
                    {perm}
                  </code>
                )) || <p className="text-xs italic">No specific permissions</p>}
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCreate && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="bg-muted/20 flex flex-row items-center justify-between rounded-xl border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Account Status</FormLabel>
                      <p className="text-muted-foreground text-xs">
                        Enabled users can access the administrative dashboard.
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

export default AdminUserSheet;
