import { VehicleCardPropType } from '@/common/propTypes';
import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '../ui/aspect-ratio';

const VehicleCard: FC<VehicleCardPropType> = ({ vehicle }) => {
  const t = useTranslations('carList');
  const fetchImage = (imagePath: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3001';
    return `${baseUrl}/${imagePath.replace(/\\/g, '/')}`;
  };

  const getDisplayImage = () => {
    const primaryMedia = vehicle.media?.find((m) => m.isPrimary);
    return primaryMedia?.leftSideImage ? fetchImage(primaryMedia.leftSideImage) : '/placeholder-car.png';
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="relative z-10 -mb-8 w-[240px]">
        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
          <img src={getDisplayImage()} alt={vehicle.model} className="h-full w-full object-cover" />
        </AspectRatio>
      </div>

      <div className="bg-foreground/10 flex w-full flex-col gap-2 rounded-2xl px-6 pt-10 pb-5">
        <h3 className="text-sm font-semibold">{vehicle.make}</h3>

        <div className="border-foreground/70 flex w-full shrink-0 items-center justify-between gap-2 border-b-2 pb-2 text-xs data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px">
          <span>{vehicle.fuelType}</span>
          <span>{vehicle.transmission}</span>
          <span>{vehicle.drivetrain}</span>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">${vehicle.pricePerDay}</h3>
          <Button className="h-6.5 rounded-full px-4 text-xs">{t('viewDetails')}</Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
