import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { locationService } from '@/api/services/locationService';

const formSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  city: z.string().min(1, 'City is required'),
  code: z.string().optional(),
  isActive: z.boolean().default(true),
});

type LocationFormValues = z.infer<typeof formSchema>;

interface LocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  location?: any;
}

export function LocationForm({ open, onOpenChange, onSuccess, location }: LocationFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!location;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: location?.name || '',
      city: location?.city || '',
      code: location?.code || '',
      isActive: location?.isActive !== undefined ? location.isActive : true,
    },
  });

  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name || '',
        city: location.city || '',
        code: location.code || '',
        isActive: location.isActive !== undefined ? location.isActive : true,
      });
    }
  }, [location, form]);

  const onSubmit = async (values: LocationFormValues) => {
    try {
      setLoading(true);

      if (isEditMode) {
        await locationService.updateLocation(location.id, values);
        toast.success('Location updated successfully');
      } else {
        await locationService.createLocation(values);
        toast.success('Location created successfully');
      }

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} location`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          form.reset();
        }
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Location' : 'Add New Location'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the location details below.' : 'Fill in the details to create a new location.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dubai International Airport" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dubai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. DXB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable or disable this location for bookings
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Update Location' : 'Create Location'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
