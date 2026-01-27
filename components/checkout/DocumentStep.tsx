'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight, FileText, Check, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/common/interfaces';
import DocumentUploadForm from './DocumentUploadForm';
import { useUser } from '@/app/axios/hooks';

interface DocumentStepProps {
  profile: UserProfile | null;
  onNext: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

const DocumentStep: React.FC<DocumentStepProps> = ({ profile, onNext, onBack, isLoading: parentLoading }) => {
  const { updateProfile, fetchProfile, isLoading: profileLoading } = useUser();
  const [selectedFiles, setSelectedFiles] = React.useState<Record<string, File>>({});

  const isVerified = profile?.verificationStatus === 'VERIFIED';
  const isPending = profile?.verificationStatus === 'PENDING';
  const isRejected = profile?.verificationStatus === 'REJECTED';

  const isLoading = parentLoading || profileLoading;

  const handleUpload = async () => {
    if (Object.keys(selectedFiles).length === 0) return;
    try {
      await updateProfile(selectedFiles as any);
      await fetchProfile();
      setSelectedFiles({}); // Clear selection after upload
    } catch (err) {
      console.error('Failed to upload documents:', err);
    }
  };

  const hasUploadedBasic = !!(profile?.driverLicenseFront && profile?.passportPhoto);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      <div className="space-y-2">
        <h3 className="text-xl font-black tracking-tight text-gray-950 uppercase italic dark:text-white">
          Credential <span className="text-primary">Sync.</span>
        </h3>
        <p className="max-w-lg text-sm leading-relaxed font-medium text-gray-500">
          Upload your operational permissions. Our automated verification system will synchronize your credentials with
          the mission profile.
        </p>
      </div>

      <div className="rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/30 p-8 dark:border-gray-800 dark:bg-gray-900/30">
        <DocumentUploadForm initialData={profile} onChange={setSelectedFiles} onBack={onBack} />

        {Object.keys(selectedFiles).length > 0 && !isVerified && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleUpload}
              disabled={isLoading}
              className="rounded-xl bg-black px-8 py-4 text-xs font-black tracking-widest text-white uppercase hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Synchronizing...
                </span>
              ) : (
                'Start Orbital Verification'
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-6 border-t border-gray-100 pt-6 sm:flex-row dark:border-gray-800">
        <Button
          type="button"
          onClick={onBack}
          variant="ghost"
          className="group text-[10px] font-black tracking-widest text-gray-400 uppercase transition-colors hover:text-gray-950"
        >
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Previous Sector
        </Button>

        <Button
          onClick={onNext}
          disabled={!isVerified || isLoading}
          className={cn(
            'group bg-primary shadow-primary/20 relative overflow-hidden rounded-xl px-10 py-6 text-xs font-black tracking-widest uppercase shadow-xl transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl',
            !isVerified && 'cursor-not-allowed opacity-50 grayscale',
          )}
        >
          <div className="relative z-10 flex items-center gap-3">
            <span>
              {isVerified
                ? 'Proceed to Financials'
                : isPending || hasUploadedBasic
                  ? 'Verification Pending...'
                  : 'Awaiting Credentials'}
            </span>
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            )}
          </div>
        </Button>
      </div>

      {!isVerified && (
        <div className="flex flex-col items-center gap-2">
          {isPending ? (
            <p className="text-primary animate-pulse text-center text-[9px] font-black tracking-widest uppercase">
              * Documents are currently undergoing orbital verification. This usually takes less than 60 seconds.
            </p>
          ) : isRejected ? (
            <p className="text-center text-[9px] font-black tracking-widest text-red-500 uppercase">
              * Credentials rejected. Please re-upload clear copies of your documents.
            </p>
          ) : (
            <p className="animate-pulse text-center text-[9px] font-black tracking-widest text-gray-400 uppercase">
              * Identity confirmation requires valid driver license and passport photo
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentStep;
