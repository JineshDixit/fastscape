import { VehicleCardPropType } from '@/common/propTypes';
import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '../ui/aspect-ratio';
import { Users2 } from 'lucide-react';

const VehicleCard: FC<VehicleCardPropType> = ({ vehicle, onClick }) => {
  const t = useTranslations('carList');
  const tEnum = useTranslations('vehicleDetails.enums');

  const fetchImage = (imagePath: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://3.111.162.90:5000';
    return `${baseUrl}/${imagePath.replace(/\\/g, '/')}`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getDisplayImage = () => {
    const primaryMedia = vehicle.media?.find((m) => m.isPrimary);
    return primaryMedia?.leftSideImage ? fetchImage(primaryMedia.leftSideImage) : '/placeholder-car.png';
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="relative z-10 -mb-8 w-full max-w-60">
        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
          <img src={getDisplayImage()} alt={vehicle.model} className="h-full w-full object-cover" />
        </AspectRatio>
      </div>

      <div className="flex w-full flex-col gap-2 rounded-2xl border-gray-100 bg-gray-50 px-6 pt-10 pb-5">
        <h3 className="text-sm font-semibold">{vehicle.make}</h3>

        <div className="border-foreground/70 flex w-full shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b-2 pb-2 text-xs">
          <span>{tEnum(vehicle.fuelType.toLowerCase() as any)}</span>
          <span className="flex items-center gap-1">
            <Users2 className="text-primary h-3.5 w-3.5" /> {vehicle.passengerCapacity}
          </span>
          <span>{tEnum(vehicle.transmission.toLowerCase() as any)}</span>
          <span>{tEnum(vehicle.drivetrain.toLowerCase() as any)}</span>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">${vehicle.pricePerDay}</h3>
          <Button onClick={handleClick} className="h-6.5 rounded-full px-4 text-xs">
            {t('viewDetails')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
