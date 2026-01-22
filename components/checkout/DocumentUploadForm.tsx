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
  onChange: (files: Record<string, File>) => void;
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

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3001';
  return `${baseUrl}/${path.replace(/\\/g, '/')}`;
};

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ initialData, onChange, onBack, isLoading }) => {
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
      const updatedFiles = { ...selectedFiles, [fieldId]: file };
      setSelectedFiles(updatedFiles);
      onChange(updatedFiles);

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
    onChange(newFiles);

    const newPreviews = { ...previews };
    delete newPreviews[fieldId];
    setPreviews(newPreviews);
  };

  const isComplete = ['driverLicenseFront', 'passportPhoto', 'selfieWithLicense'].every(
    (f) => selectedFiles[f] || (initialData as any)?.[f],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documentFields.map((field) => {
          const preview = previews[field.id] || (initialData as any)?.[field.id];
          const hasFile = !!selectedFiles[field.id] || !!(initialData as any)?.[field.id];
          const Icon = field.icon;

          return (
            <div key={field.id} className="group relative flex flex-col gap-2">
              <div
                className={cn(
                  'relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300',
                  hasFile
                    ? 'border-primary/20 bg-primary/5'
                    : 'hover:border-primary/30 border-gray-100 bg-gray-50/30 hover:bg-white',
                )}
              >
                {preview ? (
                  <>
                    <img
                      src={getImageUrl(preview)}
                      alt={field.label}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => removeFile(field.id)}
                        className="rounded-full bg-white/20 p-2 text-white backdrop-blur-md hover:bg-white/40 active:scale-95"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2">
                    <Icon className="group-hover:text-primary h-6 w-6 text-gray-400 transition-colors" />
                    <div className="text-center">
                      <p className="text-[10px] font-black tracking-widest text-gray-900 uppercase">{field.label}</p>
                      <p className="text-[9px] font-medium text-gray-400">{field.desc}</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileChange(field.id, e)}
                    />
                  </label>
                )}
                {hasFile && (
                  <div className="absolute top-2 right-2 rounded-full bg-green-500 p-1 shadow-md">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentUploadForm;
