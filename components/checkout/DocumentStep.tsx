'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  Check,
  ChevronLeft,
  Loader2,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/common/interfaces';
import DocumentUploadForm from './DocumentUploadForm';
import { useDocument, useUser } from '@/app/axios/hooks';

interface DocumentStepProps {
  profile: UserProfile | null;
  onNext: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

const DocumentStep: React.FC<DocumentStepProps> = ({ profile, onNext, onBack, isLoading }) => {
  const t = useTranslations('documentStep');
  const tCheckout = useTranslations('checkout');
  const { uploadDocuments, isLoading: isUploading } = useDocument();

  const handleDocumentsChange = async (files: Record<string, File>) => {
    if (Object.keys(files).length > 0) {
      await uploadDocuments(files as any);
    }
  };

  const isVerified = profile?.verificationStatus === 'VERIFIED';
  const isPending = profile?.verificationStatus === 'PENDING';
  const isRejected = profile?.verificationStatus === 'REJECTED';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 space-y-10 duration-700">
      {/* Header Info */}
      <div className="space-y-2">
        <h3 className="text-xl font-black tracking-tight text-gray-950 uppercase italic dark:text-white">
          {t('title')} <span className="text-primary">{t('sync')}</span>
        </h3>
        <p className="max-w-lg text-sm leading-relaxed font-medium text-gray-500">{t('description')}</p>
      </div>

      {/* Document Upload Area */}
      <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-8 dark:border-gray-800 dark:bg-gray-800/50">
        {isPending ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-primary/10 text-primary ring-primary/5 relative mb-6 flex h-24 w-24 items-center justify-center rounded-full ring-8">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tight uppercase italic">{t('verificationPendingMsg')}</h3>
            <p className="max-w-xs text-sm font-medium text-gray-400">{t('pendingDisclaimer')}</p>
          </div>
        ) : (
          <DocumentUploadForm
            initialData={profile}
            onChange={handleDocumentsChange}
            onBack={onBack}
            isLoading={isUploading}
          />
        )}
      </div>

      {/* Verification Status Bar */}
      {!isPending && (
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
              isVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400',
            )}
          >
            {isVerified ? <ShieldCheck className="h-5 w-5" /> : <AlertOctagon className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <p className="text-xs font-black tracking-widest text-gray-400 uppercase">{t('status')}</p>
            <p
              className={cn(
                'text-sm font-bold uppercase',
                isVerified ? 'text-green-600' : 'text-gray-950 dark:text-white',
              )}
            >
              {isVerified ? tCheckout('security') : t('awaitingCredentials')}
            </p>
          </div>
          {isVerified && (
            <div className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-green-600 uppercase">
              {tCheckout('intel')} Verified
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentStep;
