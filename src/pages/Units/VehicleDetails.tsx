import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVehicle } from '@/api/hooks/useVehicle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Separator } from '@/components/ui/separator';
import PermissionGuard from '@/components/auth/PermissionGuard';
import {
  Car,
  Calendar,
  Palette,
  Settings,
  Route,
  Fuel,
  Gauge,
  Zap,
  Users,
  MapPin,
  CreditCard,
  Info,
  Edit,
  Trash2,
  Activity,
  DollarSign,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const VehicleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicle, isLoading, fetchVehicleById, toggleAvailability, deleteVehicle } = useVehicle();
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVehicleById(id);
    }
  }, [id, fetchVehicleById]);

  useEffect(() => {
    if (vehicle?.media?.[0]?.leftSideImage) {
      setSelectedImage(fetchImage(vehicle.media[0].leftSideImage));
    }
  }, [vehicle]);

  const fetchImage = (imagePath: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://3.111.162.90:5000/api';
    const serverRoot = baseUrl.replace(/\/api$/, '');
    return `${serverRoot}/${imagePath.replace(/\\/g, '/')}`;
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

  const handleToggleAvailability = async () => {
    if (!vehicle) return;
    try {
      setProcessing(true);
      await toggleAvailability(vehicle.id);
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    try {
      setProcessing(true);
      const success = await deleteVehicle(vehicle.id);
      if (success) {
        navigate('/units');
      }
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading && !vehicle) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  if (!vehicle) return null;

  const vehicleImages = getVehicleImages(vehicle.media?.[0]);

  const DataRow = ({ label, value, icon: Icon }: { label: string; value: string | React.ReactNode; icon?: any }) => (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="text-foreground text-sm font-semibold">{value || 'N/A'}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <Badge
                variant={vehicle.isAvailable ? 'default' : 'destructive'}
                className="px-2.5 py-0.5 text-xs font-medium"
              >
                {vehicle.isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            {vehicle.trim && <p className="text-muted-foreground mt-1 text-sm font-medium">{vehicle.trim}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PermissionGuard module="vehicles" action="update">
            <Button
              variant="outline"
              className="h-10 gap-2 font-medium"
              onClick={() => navigate(`/units?edit=${vehicle.id}`)}
            >
              <Edit className="h-4 w-4" /> Edit Details
            </Button>
          </PermissionGuard>

          <PermissionGuard module="vehicles" action="update">
            <Button
              onClick={handleToggleAvailability}
              disabled={processing}
              className="h-10 gap-2 bg-black font-medium text-white hover:bg-gray-800"
            >
              <Activity className="h-4 w-4" />
              {vehicle.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
            </Button>
          </PermissionGuard>

          <PermissionGuard module="vehicles" action="delete">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Vehicle</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this vehicle? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={handleDelete} disabled={processing} className="w-full">
                    Confirm Deletion
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PermissionGuard>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="border-none bg-gray-50/50 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Car className="mb-2 h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{vehicle.bodyType}</span>
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Body Type</span>
          </CardContent>
        </Card>
        <Card className="border-none bg-gray-50/50 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Users className="mb-2 h-5 w-5 text-purple-500" />
            <span className="text-2xl font-bold">{vehicle.passengerCapacity || 5}</span>
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Passengers</span>
          </CardContent>
        </Card>
        <Card className="border-none bg-gray-50/50 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Zap className="mb-2 h-5 w-5 text-amber-500" />
            <span className="text-2xl font-bold">{vehicle.horsepower || 'N/A'}</span>
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Horsepower</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Main Image */}
                <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-gray-100">
                  {selectedImage ? (
                    <img src={selectedImage} alt="Vehicle main view" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Car className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </AspectRatio>

                {/* Thumbnails */}
                {vehicleImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {vehicleImages.map((image, index) => (
                      <button
                        key={`${index}-${image}`}
                        onClick={() => setSelectedImage(fetchImage(image))}
                        className={`overflow-hidden rounded-md border-2 transition-all ${
                          selectedImage === fetchImage(image)
                            ? 'border-primary ring-primary/20 ring-2'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <AspectRatio ratio={16 / 9}>
                          <img
                            src={fetchImage(image)}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </AspectRatio>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="specifications" className="w-full">
            <TabsList className="mb-4 w-full justify-start gap-4 bg-transparent p-0">
              <TabsTrigger
                value="specifications"
                className="data-[state=active]:border-primary border bg-transparent px-2 pb-2 font-bold shadow-none data-[state=active]:bg-transparent"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="data-[state=active]:border-primary border bg-transparent px-2 pb-2 font-bold shadow-none data-[state=active]:bg-transparent"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="features"
                className="data-[state=active]:border-primary border bg-transparent px-2 pb-2 font-bold shadow-none data-[state=active]:bg-transparent"
              >
                Features
              </TabsTrigger>
            </TabsList>

            <TabsContent value="specifications" className="space-y-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Car className="text-primary h-4 w-4" /> Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="divide-y divide-gray-100/50">
                    <DataRow label="Make" value={vehicle.make} icon={Car} />
                    <DataRow label="Model" value={vehicle.model} icon={Car} />
                    <DataRow label="Trim" value={vehicle.trim} />
                    <DataRow label="Year" value={vehicle.year.toString()} icon={Calendar} />
                    <DataRow label="Body Type" value={vehicle.bodyType} />
                    <DataRow label="Location" value={vehicle.city || 'Dubai'} icon={MapPin} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Palette className="text-primary h-4 w-4" /> Colors & Design
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="divide-y divide-gray-100/50">
                    <DataRow label="Exterior Color" value={vehicle.exteriorColor} icon={Palette} />
                    <DataRow label="Interior Color" value={vehicle.interiorColor} icon={Palette} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Zap className="text-primary h-4 w-4" /> Engine & Power
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="divide-y divide-gray-100/50">
                    <DataRow label="Engine" value={vehicle.engine} icon={Gauge} />
                    <DataRow label="Horsepower" value={`${vehicle.horsepower} HP`} icon={Zap} />
                    <DataRow label="Transmission" value={vehicle.transmission} icon={Settings} />
                    <DataRow label="Drivetrain" value={vehicle.drivetrain} icon={Route} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Fuel className="text-primary h-4 w-4" /> Fuel & Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="divide-y divide-gray-100/50">
                    <DataRow label="Fuel Type" value={vehicle.fuelType} icon={Fuel} />
                    <DataRow label="Fuel Consumption" value={vehicle.fuelConsumption} icon={Gauge} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Users className="text-primary h-4 w-4" /> Capacity & Comfort
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="divide-y divide-gray-100/50">
                    <DataRow
                      label="Passenger Capacity"
                      value={`${vehicle.passengerCapacity || 5} Passengers`}
                      icon={Users}
                    />
                    <DataRow label="Body Type" value={vehicle.bodyType} icon={Car} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Pricing Card */}
          <Card className="overflow-hidden border-none bg-black text-white shadow-lg">
            <CardHeader className="border-b border-white/10 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <CreditCard className="h-4 w-4 text-white" /> Pricing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <span className="mb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Daily Rental Rate
                </span>
                <span className="text-4xl font-black">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: vehicle.currency || 'AED',
                  }).format(parseFloat(vehicle.pricePerDay || '0'))}
                </span>
                <span className="mt-1 text-xs text-gray-400">Per day rental</span>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Deposit Required</span>
                  <span className="font-bold">{vehicle.depositPercentage || '0'}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Delay Charge</span>
                  <span className="font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: vehicle.currency || 'AED',
                    }).format(parseFloat(vehicle.delayChargePerHour || '0'))}
                    /hr
                  </span>
                </div>
              </div>

              <Button className="h-11 w-full bg-white font-bold text-black hover:bg-gray-100" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                View Pricing History
              </Button>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className={vehicle.isAvailable ? 'bg-green-50/50' : 'bg-red-50/50'}>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Activity className="text-primary h-4 w-4" /> Availability Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status</span>
                  <Badge variant={vehicle.isAvailable ? 'default' : 'destructive'}>
                    {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {vehicle.isAvailable
                    ? 'This vehicle is currently available for booking.'
                    : 'This vehicle is not available for booking at the moment.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="bg-gray-50/50">
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Info className="text-primary h-4 w-4" /> System Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase">ID</span>
                  <span className="font-bold text-gray-900">{vehicle.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase">Created</span>
                  <span>{new Date(vehicle.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase">Updated</span>
                  <span>{new Date(vehicle.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
