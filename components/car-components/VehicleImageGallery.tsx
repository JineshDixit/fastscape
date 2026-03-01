'use client';

import { FC, useState } from 'react';
import { AspectRatio } from '../ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { VehicleMedia } from '@/common/interfaces';
import { useTranslations } from 'next-intl';

interface VehicleImageGalleryProps {
  media: VehicleMedia[];
  model: string;
}

const VehicleImageGallery: FC<VehicleImageGalleryProps> = ({ media, model }) => {
  const t = useTranslations('vehicleDetails');
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://3.111.162.90:5000';

  const allImages = media.reduce((acc: string[], m) => {
    const images = [
      m.leftSideImage,
      m.rightSideImage,
      m.frontImage,
      m.backImage,
      m.frontLeftImage,
      m.frontRightImage,
      m.interiorFrontImage,
      m.interiorBackImage,
      m.dashboardImage,
      m.engineImage,
    ].filter((img): img is string => !!img);
    return [...acc, ...images];
  }, []);

  const [selectedImage, setSelectedImage] = useState(allImages[0] || '');

  const getFullUrl = (path: string) => {
    if (!path) return '';
    return `${baseUrl}/${path.replace(/\\/g, '/')}`;
  };

  if (allImages.length === 0) {
    return (
      <div className="w-full">
        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-2xl bg-gray-100">
          <div className="flex h-full items-center justify-center text-gray-400">{t('noImage')}</div>
        </AspectRatio>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="relative w-full overflow-hidden rounded-2xl bg-white">
        <AspectRatio ratio={16 / 9}>
          <img src={getFullUrl(selectedImage)} alt={model} className="h-full w-full object-cover" />
        </AspectRatio>
      </div>

      <div className="scrollbar-hide flex w-full gap-4 overflow-x-auto pb-2">
        {allImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(img)}
            className={cn(
              'relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition-all',
              selectedImage === img ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300',
            )}
          >
            <img src={getFullUrl(img)} alt={`${model}-${idx}`} className="h-full w-full rounded-lg object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default VehicleImageGallery;
