import { useState, type FC } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fuel, Cog, Ellipsis, Users } from 'lucide-react';
import type { Vehicle } from '@/common/interface/vehicleInterface';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useVehicleLocalization } from '@/utils/modelLocalization.utils';
import { useTranslation } from 'react-i18next';

interface UnitCardProps {
  vehicle: Vehicle;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicleId: string) => void;
  onDetails?: (vehicleId: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const UnitCard: FC<UnitCardProps> = ({ vehicle, onEdit, onDelete, onDetails, canUpdate = false, canDelete = false }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { localizeTransmission, localizeFuelType } = useVehicleLocalization();
  const { t } = useTranslation('vehicles');

  const getStatusBadge = (isAvailable: boolean) => {
    if (isAvailable) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700">
          {t('status.available')}
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-muted/90 text-muted-foreground/80">
        {t('status.unavailable')}
      </Badge>
    );
  };

  const fetchImage = (imagePath: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const serverRoot = baseUrl.replace(/\/api$/, '');
    return `${serverRoot}/${imagePath.replace(/\\/g, '/')}`;
  };

  const getDisplayImage = () => {
    const primaryMedia = vehicle.media?.find((m) => m.isPrimary);

    const imagePath = primaryMedia?.leftSideImage;

    if (imagePath) {
      return fetchImage(imagePath);
    }
    return '/placeholder-car.png';
  };

  return (
    <Card className="min-w-0 overflow-hidden py-4">
      <CardHeader className="flex items-start justify-between space-y-0 px-5">
        <div className="space-y-1">
          <h3 className="text-foreground flex flex-col text-xl leading-tight font-semibold tracking-normal">
            <span>{vehicle.model}</span>
            <span className="text-sm">
              {vehicle.make}
              {vehicle.trim ? ` (${vehicle.trim})` : ''}
            </span>
          </h3>
        </div>
        <div className="space-y-1">
          <h3 className="text-foreground text-xl leading-tight font-semibold tracking-normal">
            ${vehicle.pricePerDay}
          </h3>
          <p className="text-foreground/50 text-end text-xs font-semibold tracking-wider">/day</p>
        </div>
      </CardHeader>

      <CardContent className="px-5">
        <div className="space-y-4">
          <AspectRatio ratio={16 / 9}>
            <img
              src={getDisplayImage()}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="h-full w-full rounded-md object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-car.png';
              }}
            />
          </AspectRatio>

          <div className="flex items-center justify-between">
            {getStatusBadge(vehicle.isAvailable)}
            <div className="flex items-center gap-1"></div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center justify-center gap-2">
              <div className="bg-muted/90 rounded-md p-1.5">
                <Cog className="text-foreground/80 size-4" />
              </div>
              <span className="text-foreground w-full truncate text-sm tracking-tight">
                {localizeTransmission(vehicle.transmission)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="bg-muted/90 rounded-md p-1.5">
                <Users className="text-foreground/80 size-4" />
              </div>
              <span className="text-foreground w-full truncate text-sm tracking-tight">
                {vehicle.passengerCapacity || 5} {t('fields.people')}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="bg-muted/90 rounded-md p-1.5">
                <Fuel className="text-foreground/80 size-4" />
              </div>
              <span className="text-foreground w-full truncate text-sm tracking-tight">
                {localizeFuelType(vehicle.fuelType)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3 px-5">
        <Button className="flex-1" onClick={() => onDetails?.(vehicle.id)}>
          {t('actions.viewDetails')}
        </Button>
        {(canUpdate || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {canUpdate && (
                <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit?.(vehicle)}>
                  {t('actions.edit')}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive hover:text-destructive! hover:bg-destructive/10! cursor-pointer"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  {t('actions.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>

      {canDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('messages.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('messages.deleteConfirm', { make: vehicle.make, model: vehicle.model })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDelete?.(vehicle.id);
                  setShowDeleteDialog(false);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t('actions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
};

export default UnitCard;
