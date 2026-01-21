'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, Camera, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/common/interfaces';

interface DocumentUploadFormProps {
  initialData: Partial<UserProfile> | null;
  onNext: (files: Record<string, File>) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const documentFields = [
  {
    id: 'driverLicenseFront',
    label: 'Driver License (Front)',
    icon: FileText,
    desc: 'Ensure all details are clearly visible',
  },
  {
    id: 'driverLicenseBack',
    label: 'Driver License (Back)',
    icon: FileText,
    desc: 'Optional if info is only on front',
  },
  { id: 'passportPhoto', label: 'Passport Bio Page', icon: FileText, desc: 'High resolution scan or photo' },
  { id: 'internationalDrivingPermit', label: 'Intl. Permit', icon: FileText, desc: 'Recommended for travelers' },
  {
    id: 'selfieWithLicense',
    label: 'Identity Verification',
    icon: Camera,
    desc: 'Holding your license next to your face',
  },
] as const;

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ initialData, onNext, onBack, isLoading }) => {
  const tCommon = useTranslations('common');
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const handleFileChange = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Max 5MB.');
        return;
      }
      setSelectedFiles((prev) => ({ ...prev, [fieldId]: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [fieldId]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (fieldId: string) => {
    const newFiles = { ...selectedFiles };
    delete newFiles[fieldId];
    setSelectedFiles(newFiles);

    const newPreviews = { ...previews };
    delete newPreviews[fieldId];
    setPreviews(newPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(selectedFiles);
  };

  const isComplete = ['driverLicenseFront', 'driverLicenseBack', 'passportPhoto', 'selfieWithLicense'].every(
    (f) => selectedFiles[f] || (initialData as any)?.[f],
  );

  return (
    <form onSubmit={handleSubmit} className="animate-in fade-in space-y-6 duration-500">
      {/* Information Alert */}
      <div className="bg-primary/5 border-primary/10 flex items-start gap-4 rounded-2xl border p-5">
        <ShieldCheck className="text-primary h-6 w-6 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-black tracking-tighter text-gray-900 uppercase dark:text-white">
            Secure Document Vault
          </p>
          <p className="text-[11px] leading-relaxed font-medium text-gray-400">
            Your documents are encrypted and only used for rental verification. We follow strict GDPR and data
            protection protocols.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {documentFields.map((field) => {
          const preview = previews[field.id] || (initialData as any)?.[field.id];
          const hasFile = !!selectedFiles[field.id] || !!(initialData as any)?.[field.id];
          const Icon = field.icon;

          return (
            <div key={field.id} className="group space-y-3">
              <div className="flex items-end justify-between px-1">
                <div className="space-y-0.5">
                  <Label className="group-hover:text-primary text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase transition-colors">
                    {field.label}
                  </Label>
                  <p className="text-[10px] font-medium text-gray-400 italic opacity-60">{field.desc}</p>
                </div>
                {hasFile && <CheckCircle2 className="animate-in zoom-in h-4 w-4 text-green-500 duration-300" />}
              </div>

              <div
                className={cn(
                  'relative flex min-h-[160px] flex-col items-center justify-center overflow-hidden rounded-4xl border-2 border-dashed transition-all duration-500',
                  hasFile
                    ? 'border-primary bg-primary/5 ring-primary/5 ring-4'
                    : 'hover:border-primary/40 border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900',
                )}
              >
                {preview ? (
                  <div className="group/preview relative h-full w-full">
                    <img
                      src={preview}
                      alt={field.label}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/preview:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-950/40 opacity-0 transition-opacity duration-300 group-hover/preview:opacity-100">
                      <button
                        type="button"
                        onClick={() => removeFile(field.id)}
                        className="rounded-2xl bg-white/20 p-4 text-white shadow-2xl backdrop-blur-xl transition-all hover:scale-110 hover:bg-white/40 active:scale-95"
                      >
                        <X className="h-6 w-6 stroke-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4 py-8">
                    <div className="group-hover:shadow-primary/20 group-hover:ring-primary/20 relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md ring-1 shadow-gray-200/50 ring-gray-50 transition-all duration-500 group-hover:scale-110 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
                      <Icon className="text-primary h-5 w-5 stroke-[2.5]" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                        <span className="bg-primary relative inline-flex h-3 w-3 rounded-full"></span>
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black tracking-tighter text-gray-900 uppercase dark:text-white">
                        Upload Visual Data
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold text-gray-400">JPG, PNG • MAX 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileChange(field.id, e)}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Area */}
      <div className="flex flex-col items-center justify-end gap-4 border-t border-gray-100 pt-5 md:flex-row dark:border-gray-800">
        {/* <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 w-full rounded-xl border-2 px-10 text-xs font-black tracking-widest uppercase transition-all hover:bg-gray-50 active:scale-95 md:w-auto"
        >
          Back
        </Button> */}

        <Button
          type="submit"
          disabled={isLoading || !isComplete}
          className="group bg-primary hover:shadow-primary/30 animate-in fade-in slide-in-from-right-10 relative px-5 py-5 overflow-hidden rounded-md text-xs font-black tracking-widest uppercase transition-all duration-500 hover:scale-[1.02] hover:shadow-xl md:w-auto"
        >
          <span className="relative z-10 flex items-center gap-3">
            {isLoading ? tCommon('loading') : 'Continue Selection'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transition-all duration-500 group-hover:h-full group-hover:bg-white/5" />
        </Button>
      </div>
    </form>
  );
};

export default DocumentUploadForm;
