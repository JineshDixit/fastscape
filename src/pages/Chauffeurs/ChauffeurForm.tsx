import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { chauffeurService } from '@/api/services/chauffeurService';
import { User, Shield, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiryDate: z.string().min(1, 'License expiry date is required'),
  licenseIssuingCountry: z.string().min(1, 'License issuing country is required'),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT']),
  yearsOfExperience: z.string().min(1, 'Years of experience is required'),
  languages: z.string().min(1, 'Languages are required'),
  specializations: z.string().min(1, 'Specializations are required'),
  hourlyRate: z.string().min(1, 'Hourly rate is required'),
  currency: z.string().default('USD'),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  notes: z.string().optional(),
});

type ChauffeurFormValues = z.infer<typeof formSchema>;

interface ChauffeurFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  chauffeur?: any; // Optional chauffeur data for editing
}

const STEPS = [
  { id: 'bio', title: 'Bio & Contact', icon: User },
  { id: 'professional', title: 'Professional', icon: Shield },
  { id: 'location', title: 'Final Details', icon: MapPin },
];

export function ChauffeurForm({ open, onOpenChange, onSuccess, chauffeur }: ChauffeurFormProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const isEditMode = !!chauffeur;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: chauffeur?.fullName || '',
      email: chauffeur?.email || '',
      phone: chauffeur?.phone || '',
      dateOfBirth: chauffeur?.dateOfBirth ? chauffeur.dateOfBirth.split('T')[0] : '',
      nationality: chauffeur?.nationality || '',
      licenseNumber: chauffeur?.licenseNumber || '',
      licenseExpiryDate: chauffeur?.licenseExpiryDate ? chauffeur.licenseExpiryDate.split('T')[0] : '',
      licenseIssuingCountry: chauffeur?.licenseIssuingCountry || '',
      experienceLevel: chauffeur?.experienceLevel || 'BEGINNER',
      yearsOfExperience: chauffeur?.yearsOfExperience?.toString() || '0',
      languages: chauffeur?.languages ? chauffeur.languages.join(', ') : 'English',
      specializations: chauffeur?.specializations ? chauffeur.specializations.join(', ') : 'Sedan, SUV',
      hourlyRate: chauffeur?.hourlyRate?.toString() || '',
      currency: chauffeur?.currency || 'USD',
      emergencyContactName: chauffeur?.emergencyContactName || '',
      emergencyContactPhone: chauffeur?.emergencyContactPhone || '',
      address: chauffeur?.address || '',
      city: chauffeur?.city || '',
      country: chauffeur?.country || '',
      notes: chauffeur?.notes || '',
    },
  });

  // Reset form when chauffeur prop changes
  useEffect(() => {
    if (chauffeur) {
      form.reset({
        fullName: chauffeur.fullName || '',
        email: chauffeur.email || '',
        phone: chauffeur.phone || '',
        dateOfBirth: chauffeur.dateOfBirth ? chauffeur.dateOfBirth.split('T')[0] : '',
        nationality: chauffeur.nationality || '',
        licenseNumber: chauffeur.licenseNumber || '',
        licenseExpiryDate: chauffeur.licenseExpiryDate ? chauffeur.licenseExpiryDate.split('T')[0] : '',
        licenseIssuingCountry: chauffeur.licenseIssuingCountry || '',
        experienceLevel: chauffeur.experienceLevel || 'BEGINNER',
        yearsOfExperience: chauffeur.yearsOfExperience?.toString() || '0',
        languages: chauffeur.languages ? chauffeur.languages.join(', ') : 'English',
        specializations: chauffeur.specializations ? chauffeur.specializations.join(', ') : 'Sedan, SUV',
        hourlyRate: chauffeur.hourlyRate?.toString() || '',
        currency: chauffeur.currency || 'USD',
        emergencyContactName: chauffeur.emergencyContactName || '',
        emergencyContactPhone: chauffeur.emergencyContactPhone || '',
        address: chauffeur.address || '',
        city: chauffeur.city || '',
        country: chauffeur.country || '',
        notes: chauffeur.notes || '',
      });
    }
  }, [chauffeur, form]);

  const onSubmit = async (values: ChauffeurFormValues) => {
    try {
      setLoading(true);
      const dto = {
        ...values,
        languages: values.languages.split(',').map((l) => l.trim()),
        specializations: values.specializations.split(',').map((s) => s.trim()),
        hourlyRate: Number(values.hourlyRate),
        yearsOfExperience: Number(values.yearsOfExperience),
      };

      if (isEditMode) {
        await chauffeurService.updateChauffeur(chauffeur.id, dto);
        toast.success('Chauffeur updated successfully');
      } else {
        await chauffeurService.createChauffeur(dto);
        toast.success('Chauffeur created successfully');
      }
      
      form.reset();
      setCurrentStep(0);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} chauffeur`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    const fields =
      currentStep === 0
        ? ['fullName', 'email', 'phone', 'dateOfBirth', 'nationality']
        : currentStep === 1
          ? [
              'licenseNumber',
              'licenseExpiryDate',
              'licenseIssuingCountry',
              'experienceLevel',
              'yearsOfExperience',
              'hourlyRate',
            ]
          : [];

    const isValid = await form.trigger(fields as any);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          form.reset();
          setCurrentStep(0);
        }
        onOpenChange(val);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-y-auto p-0 sm:max-w-200">
        {/* Fixed Header */}
        <div className="border-b p-6 pb-4">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Chauffeur' : 'Registration of Chauffeur'}</DialogTitle>
            <DialogDescription>
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="mt-6 flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === idx;
              const isCompleted = currentStep > idx;

              return (
                <div key={step.id} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
                        isActive
                          ? 'bg-primary text-white'
                          : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-400',
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-medium tracking-widest uppercase',
                        isActive ? 'text-primary' : 'text-gray-400',
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'mx-4 h-0.5 flex-1 rounded-full bg-gray-100 transition-colors duration-300',
                        isCompleted && 'bg-green-500',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <Form {...(form as any)}>
            <form id="chauffeur-form" onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
              {currentStep === 0 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Legal Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+971..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. United Arab Emirates" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="D-123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="licenseExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Expiry Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="licenseIssuingCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuing Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country of issue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BEGINNER">Beginner</SelectItem>
                            <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                            <SelectItem value="EXPERIENCED">Experienced</SelectItem>
                            <SelectItem value="EXPERT">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hourly Rate</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="AED" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AED">AED</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control as any}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 High Street, Business Bay" {...field} />
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
                            <Input placeholder="Dubai" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="UAE" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control as any}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+971..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control as any}
                      name="languages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Languages (comma separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="English, Arabic, Hindi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="specializations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specializations (comma separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="Sedan, SUV, Luxury" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control as any}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional driver notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </form>
          </Form>
        </div>

        <div className="border-t p-6">
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? () => onOpenChange(false) : prevStep}
              disabled={loading}
            >
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button form="chauffeur-form" type="submit" disabled={loading}>
                {loading ? (isEditMode ? 'Updating...' : 'Onboarding...') : (isEditMode ? 'Update Chauffeur' : 'Onboard Chauffeur')}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
