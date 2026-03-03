import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, Camera, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDocument } from '@/app/axios/hooks';
import type { UserProfile } from '@/common/interfaces';
import { toast } from 'sonner';

interface DocumentUploadFormProps {
  initialData: Partial<UserProfile> | null;
  onChange: (files: Record<string, File>) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://3.111.162.90:5000';
  // Ensure we don't end up with double slashes if baseUrl ends with one or path starts with one
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBaseUrl}${cleanPath.replace(/\\/g, '/')}`;
};

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ initialData, onChange, onBack, isLoading }) => {
  const tCommon = useTranslations('common');
  const tDoc = useTranslations('documentStep.fields');
  const { uploadDocuments, isLoading: documentLoading } = useDocument();
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>(() => {
    // Load previews from session storage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('documentPreviews');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.warn('Failed to parse stored document previews');
        }
      }
    }
    return {};
  });
  const [isUploading, setIsUploading] = useState(false);

  // Initialize previews from existing data
  React.useEffect(() => {
    if (initialData) {
      const initialPreviews: Record<string, string> = {};
      documentFields.forEach((field) => {
        const value = (initialData as any)?.[field.id];
        // Only set preview if we have a value and we don't already have a preview in state/session
        if (value && typeof value === 'string' && !previews[field.id]) {
          initialPreviews[field.id] = value;
        }
      });

      if (Object.keys(initialPreviews).length > 0) {
        setPreviews((prev) => ({ ...prev, ...initialPreviews }));
      }
    }
  }, [initialData]);

  // Persist previews to session storage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('documentPreviews', JSON.stringify(previews));
    }
  }, [previews]);

  const documentFields = [
    {
      id: 'driverLicenseFront',
      label: tDoc('driverLicenseFront'),
      icon: FileText,
      desc: tDoc('driverLicenseFrontDesc'),
    },
    {
      id: 'driverLicenseBack',
      label: tDoc('driverLicenseBack'),
      icon: FileText,
      desc: tDoc('driverLicenseBackDesc'),
    },
    {
      id: 'passportPhoto',
      label: tDoc('passportPhoto'),
      icon: FileText,
      desc: tDoc('passportPhotoDesc'),
    },
    {
      id: 'internationalDrivingPermit',
      label: tDoc('internationalDrivingPermit'),
      icon: FileText,
      desc: tDoc('internationalDrivingPermitDesc'),
    },
    {
      id: 'selfieWithLicense',
      label: tDoc('selfieWithLicense'),
      icon: Camera,
      desc: tDoc('selfieWithLicenseDesc'),
    },
  ] as const;

  const handleFileChange = async (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(tCommon('fileSizeTooLarge'));
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [fieldId]: reader.result as string }));
      };
      reader.readAsDataURL(file);

      // Upload immediately
      setIsUploading(true);
      try {
        // Pass file as object property, not FormData
        const uploadData = { [fieldId]: file };

        const response = await uploadDocuments(uploadData as any);

        if (response) {
          toast.success(`Document uploaded successfully`);
          const updatedFiles = { ...selectedFiles, [fieldId]: file };
          setSelectedFiles(updatedFiles);
          onChange(updatedFiles);
        } else {
          toast.error('Upload failed');
          // Remove preview on failure
          setPreviews((prev) => {
            const newPreviews = { ...prev };
            delete newPreviews[fieldId];
            return newPreviews;
          });
        }
      } catch (error: any) {
        toast.error(error.message || 'Upload failed');
        // Remove preview on failure
        setPreviews((prev) => {
          const newPreviews = { ...prev };
          delete newPreviews[fieldId];
          return newPreviews;
        });
      } finally {
        setIsUploading(false);
      }
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
    (f) => selectedFiles[f] || (initialData as any)?.[f] || previews[f],
  );

  return (
    <div className="space-y-6">
      {isUploading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Uploading document...</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documentFields.map((field) => {
          const preview = previews[field.id] || (initialData as any)?.[field.id];
          const hasFile = !!selectedFiles[field.id] || !!(initialData as any)?.[field.id];
          const Icon = field.icon;

          return (
            <div key={field.id} className="group relative flex flex-col gap-2">
              <div
                className={cn(
                  'relative flex aspect-4/3 flex-col items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300',
                  hasFile
                    ? 'border-primary/20 bg-primary/5'
                    : 'hover:border-primary/30 border-gray-100 bg-gray-50/30 hover:bg-white',
                )}
              >
                {preview ? (
                  <>
                    <img
                      src={
                        preview.startsWith('data:') || preview.startsWith('blob:') || preview.startsWith('http')
                          ? preview
                          : getImageUrl(preview)
                      }
                      alt={field.label}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        console.warn(`Failed to load image for ${field.id}:`, preview);
                        // Remove broken preview
                        setPreviews((prev) => {
                          const newPreviews = { ...prev };
                          delete newPreviews[field.id];
                          return newPreviews;
                        });
                      }}
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
