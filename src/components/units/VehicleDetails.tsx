import { Fragment, useEffect, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Vehicle } from '@/common/interface/vehicleInterface';
import { Card } from '@/components/ui/card';
import { useParams } from 'react-router-dom';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { AspectRatio } from '../ui/aspect-ratio';

interface VehicleFormProps {
  vehicle: Vehicle | null;
  onCancel: () => void;
  getVehicleDetails: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const VehicleDetails: FC<VehicleFormProps> = ({ vehicle, isLoading, onCancel, getVehicleDetails }) => {
  const { id } = useParams();

  const fetchImage = (imagePath: string) => {
    return `http://localhost:3001/${imagePath.replace(/\\/g, '/')}`;
  };

  const getVehicleImages = (media: any) => {
    if (!media) return [];

    return [
      media.frontImage,
      media.backImage,
      media.leftSideImage,
      media.rightSideImage,
      media.frontLeftImage,
      media.frontRightImage,
      media.interiorFrontImage,
      media.interiorBackImage,
      media.dashboardImage,
      media.engineImage,
    ].filter(Boolean);
  };

  useEffect(() => {
    if (!id) return;
    getVehicleDetails(id);
  }, [id, getVehicleDetails]);

  return (
    <Fragment>
      <div className="mb-2 flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="text-xl font-semibold">Vehicle Details</h2>
      </div>
      <Card className="w-full overflow-clip">
        <div className="flex w-full items-center justify-center">
          {vehicle?.media?.[0]?.leftSideImage && (
            <div className="w-full sm:max-w-sm md:max-w-md lg:max-w-lg">
              <AspectRatio ratio={16 / 9}>
                <img
                  src={fetchImage(vehicle?.media?.[0]?.leftSideImage)}
                  alt="Vehicle main"
                  className="h-full w-full rounded-md object-cover"
                />
              </AspectRatio>
            </div>
          )}
        </div>
        <div className="px-15">
          <Carousel opts={{ align: 'start' }}>
            <CarouselContent>
              {getVehicleImages(vehicle?.media?.[0]).map((image, index) => (
                <CarouselItem key={`${index}-${image}`} className="basis-1/4 md:basis-1/5 lg:basis-1/6">
                  <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md">
                    <img
                      src={fetchImage(image)}
                      alt={`Thumbnail ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </AspectRatio>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-11" />
            <CarouselNext className="-right-11" />
          </Carousel>
        </div>
      </Card>
    </Fragment>
  );
};

export default VehicleDetails;
