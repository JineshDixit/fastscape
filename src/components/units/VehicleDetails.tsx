import { Fragment, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Car,
  CreditCard,
  Fuel,
  Gauge,
  Settings,
  Users,
  Activity,
  MapPin,
  Palette,
  Zap,
  Route,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { AspectRatio } from '../ui/aspect-ratio';
import { useVehicle } from '@/api/hooks/useVehicle';

const VehicleDetails = () => {
  const { vehicle, isLoading, fetchVehicleById } = useVehicle();
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicleById(id!);
  }, [fetchVehicleById]);

  const fetchImage = (imagePath: string) => {
    return `http://localhost:3001/${imagePath.replace(/\\/g, '/')}`;
  };

  const onCancel = () => {
    navigate('/units');
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

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="size-5" />
              Vehicle Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Car className="size-4" /> Make
                </span>
                <p className="font-medium">{vehicle?.make}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Car className="size-4" /> Model
                </span>
                <p className="font-medium">{vehicle?.model}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Activity className="size-4" /> Trim
                </span>
                <p className="font-medium">{vehicle?.trim || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Calendar className="size-4" /> Year
                </span>
                <p className="font-medium">{vehicle?.year}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Palette className="size-4" /> Exterior Color
                </span>
                <p className="font-medium">{vehicle?.exteriorColor || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Palette className="size-4" /> Interior Color
                </span>
                <p className="font-medium">{vehicle?.interiorColor || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Settings className="size-4" /> Transmission
                </span>
                <p className="font-medium">{vehicle?.transmission}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Route className="size-4" /> Drivetrain
                </span>
                <p className="font-medium">{vehicle?.drivetrain || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Fuel className="size-4" /> Fuel Type
                </span>
                <p className="font-medium">{vehicle?.fuelType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Gauge className="size-4" /> Engine
                </span>
                <p className="font-medium">{vehicle?.engine || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Zap className="size-4" /> Horsepower
                </span>
                <p className="font-medium">{vehicle?.horsepower || 'N/A'} HP</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Users className="size-4" /> Capacity
                </span>
                <p className="font-medium">{vehicle?.passengerCapacity || '5'} Passengers</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Car className="size-4" /> Body Type
                </span>
                <p className="font-medium">{vehicle?.bodyType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Gauge className="size-4" /> Mileage/Consumption
                </span>
                <p className="font-medium">{vehicle?.fuelConsumption}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <MapPin className="size-4" /> Location
                </span>
                <p className="font-medium">{vehicle?.city || 'Dubai'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Pricing & Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-muted-foreground text-sm">Price Per Day</span>
                <p className="text-primary text-2xl font-bold">
                  {vehicle?.currency} {vehicle?.pricePerDay}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-sm">Status</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      vehicle?.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {vehicle?.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-sm">Deposit</span>
                <p className="font-medium">{vehicle?.depositPercentage || '0'}%</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-sm">Delay Charge</span>
                <p className="font-medium">
                  {vehicle?.currency} {vehicle?.delayChargePerHour || '0'}/hr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Fragment>
  );
};

export default VehicleDetails;
