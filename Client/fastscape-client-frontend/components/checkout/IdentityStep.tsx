'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { User, MapPin, ShieldCheck, ArrowRight, Plus, Check, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/common/interfaces';
import DocumentUploadForm from './DocumentUploadForm';
import AddressForm from './AddressForm';
import { useAuth } from '@/app/axios';
import { useAddress } from '@/app/axios/hooks';
import loginModel from '@/components/auth/loginModel';
import registerModel from '@/components/auth/registerModel';
import forgotPassword from '@/components/auth/forgotPassword';

const LoginModel = loginModel;
const RegisterModel = registerModel;
const ForgotPasswordModel = forgotPassword;

interface IdentityStepProps {
  profile: UserProfile | null;
  onNext: (profileData?: any, files?: Record<string, File>) => void;
  onBack: () => void;
  isLoading?: boolean;
  bookingType?: 'SELF_DRIVE' | 'CHAUFFEUR';
  enableSmartDocumentHandling?: boolean;
  showProgressIndicators?: boolean;
}

const IdentityStep: React.FC<IdentityStepProps> = ({
  profile,
  onNext,
  onBack,
  isLoading,
  bookingType = 'SELF_DRIVE',
  enableSmartDocumentHandling = true,
  showProgressIndicators = true
}) => {
  const { user } = useAuth();
  const { addresses, createAddress, fetchAddresses, isLoading: addressLoading } = useAddress();
  const t = useTranslations('auth');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'NONE' | 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('NONE');
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const hasRequiredDocs = !!(profile?.driverLicenseFront && profile?.passportPhoto && profile?.selfieWithLicense);

  useEffect(() => {
    if (!hasRequiredDocs) {
      setShowDocUpload(true);
    }
  }, [hasRequiredDocs]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user, fetchAddresses]);

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id || null);
    }
  }, [addresses]);

  const handleAddressSubmit = async (addressData: any) => {
    try {
      const newAddress = await createAddress(addressData);
      if (newAddress) {
        setShowAddressForm(false);
        // Refresh addresses
        await fetchAddresses();
      }
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  if (!user) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center space-y-6 py-12 duration-700">
        <div className="bg-primary/10 text-primary rounded-full p-4">
          <LogIn className="h-12 w-12" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-2xl font-black tracking-tighter uppercase italic">Authentication Required</h3>
          <p className="mx-auto max-w-xs text-sm text-gray-400">
            Please log in or create an account to continue with your elite rental reservation.
          </p>
        </div>
        <Button
          onClick={() => setAuthView('LOGIN')}
          className="shadow-primary/20 h-12 rounded-xl px-10 font-black tracking-widest uppercase shadow-xl"
        >
          Access Terminal
        </Button>
        <LoginModel
          open={authView === 'LOGIN'}
          onOpenChange={(open) => !open && setAuthView('NONE')}
          onRegisterClick={() => setAuthView('REGISTER')}
          onForgotPasswordClick={() => setAuthView('FORGOT_PASSWORD')}
        />
        <RegisterModel
          open={authView === 'REGISTER'}
          onOpenChange={(open) => !open && setAuthView('NONE')}
          onLoginClick={() => setAuthView('LOGIN')}
        />
        <ForgotPasswordModel
          open={authView === 'FORGOT_PASSWORD'}
          onOpenChange={(open) => !open && setAuthView('NONE')}
        />
      </div>
    );
  }

  const handleNext = () => {
    // If user selected an address, we might want to ensure it's marked as default or passed along
    // For now, if profile already has it, we just continue.
    // If we were adding/updating, we'd pass data here.
    onNext(undefined, selectedFiles);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 space-y-10 duration-700">
      {/* Profile Summary */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <User className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-black tracking-[0.2em] uppercase">Pilot Profile</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
            <p className="mb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">Full Name</p>
            <p className="font-black text-gray-950 uppercase dark:text-white">{profile?.fullName}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
            <p className="mb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">Email Connection</p>
            <p className="font-bold text-gray-600 dark:text-gray-400">{profile?.email}</p>
          </div>
        </div>
      </section>

      {/* Address Management */}
      {!showAddressForm ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary rounded-lg p-2">
                <MapPin className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black tracking-[0.2em] uppercase">Deployment Address</h3>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowAddressForm(true)}
              className="hover:bg-primary/10 hover:text-primary gap-2 text-[10px] font-black tracking-widest uppercase"
            >
              <Plus className="h-3 w-3" /> New Sector
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {addresses?.map((addr) => (
              <div
                key={addr.id}
                onClick={() => setSelectedAddressId(addr.id || null)}
                className={cn(
                  'group relative cursor-pointer overflow-hidden rounded-3xl border-2 p-5 transition-all duration-300',
                  selectedAddressId === addr.id
                    ? 'border-primary bg-primary/5 ring-primary/5 ring-4'
                    : 'border-gray-100 bg-white hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900',
                )}
              >
                <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-gray-500 uppercase dark:bg-gray-800">
                        {addr.type || 'Home'}
                      </span>
                      {addr.isDefault && <Check className="text-primary h-3 w-3" />}
                    </div>
                    <p className="text-sm font-bold text-gray-950 dark:text-white">{addr.addressLine1}</p>
                    <p className="text-[11px] font-medium text-gray-400 lowercase">
                      {addr.city}, {addr.state}, {addr.country}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                      selectedAddressId === addr.id ? 'border-primary bg-primary' : 'border-gray-200',
                    )}
                  >
                    {selectedAddressId === addr.id && <Check className="h-3 w-3 stroke-3 text-white" />}
                  </div>
                </div>
                <div
                  className={cn(
                    'bg-primary absolute -right-4 -bottom-4 h-16 w-16 opacity-0 blur-2xl transition-opacity group-hover:opacity-10',
                    selectedAddressId === addr.id && 'opacity-20',
                  )}
                />
              </div>
            ))}
            {(!addresses || addresses.length === 0) && (
              <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/30 py-10 dark:border-gray-800">
                <MapPin className="h-8 w-8 text-gray-200" />
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  No Deployment Sectors Identified
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowAddressForm(true)}
                  className="h-8 rounded-lg text-[9px] font-black tracking-widest uppercase"
                >
                  Initial Set Up
                </Button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <AddressForm
          onSubmit={handleAddressSubmit}
          onCancel={() => setShowAddressForm(false)}
          isLoading={isLoading || addressLoading}
        />
      )}

      {/* Document Upload */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-lg p-2">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black tracking-[0.2em] uppercase">Auth Credentials</h3>
          </div>
          {hasRequiredDocs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDocUpload(!showDocUpload)}
              className="text-[10px] font-black tracking-widest uppercase"
            >
              {showDocUpload ? 'Minimize' : 'Update Credentials'}
            </Button>
          )}
        </div>

        {hasRequiredDocs && !showDocUpload ? (
          <div className="flex items-center justify-between rounded-3xl border-2 border-green-500/20 bg-green-500/5 p-6 transition-all duration-500">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black tracking-tight text-gray-950 uppercase dark:text-white">
                  Credentials Synchronized
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase">
                    <Check className="h-3 w-3" /> Identity Verified
                  </span>
                  <span className="h-1 w-1 rounded-full bg-gray-200" />
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase">
                    <Check className="h-3 w-3" /> License Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DocumentUploadForm
            initialData={profile}
            onChange={(files) => setSelectedFiles(files)}
            onBack={onBack}
          />
        )}
      </section>

      {/* Action Footer */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-10 md:flex-row dark:border-gray-800">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 w-full rounded-xl border-2 px-10 text-xs font-black tracking-widest uppercase transition-all hover:bg-gray-50 active:scale-95 md:w-auto"
        >
          Recalibrate Journey
        </Button>

        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="group bg-primary hover:shadow-primary/30 relative overflow-hidden rounded-xl px-12 py-6 text-xs font-black tracking-widest uppercase transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl md:w-auto"
        >
          <span className="relative z-10 flex items-center gap-3">
            {isLoading ? 'Processing...' : 'Authorize Mission'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transition-all duration-500 group-hover:h-full group-hover:bg-white/10" />
        </Button>
      </div>
    </div>
  );
};

export default IdentityStep;
