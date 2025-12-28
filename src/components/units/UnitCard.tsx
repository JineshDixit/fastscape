import { useState, type FC } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitFork, Fuel, Cog, Ellipsis } from "lucide-react";
import type { Vehicle } from "@/common/interface/vehicleInterface";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnitCardProps {
  vehicle: Vehicle;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicleId: string) => void;
  onDetails?: (vehicleId: string) => void;
}

const UnitCard: FC<UnitCardProps> = ({ vehicle, onEdit, onDelete, onDetails }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const getStatusBadge = (isAvailable: boolean) => {
    if (isAvailable) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700">
          Available
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-muted/90 text-muted-foreground/80">
        Unavailable
      </Badge>
    );
  };

  const fetchImage = (imagePath: string) => {
    return `http://localhost:3001/${imagePath.replace(/\\/g, "/")}`;
  };

  const getDisplayImage = () => {
    const primaryMedia = vehicle.media?.find((m) => m.isPrimary);

    const imagePath = primaryMedia?.leftSideImage;

    if (imagePath) {
      return fetchImage(imagePath);
    }
    return "/placeholder-car.png";
  };

  return (
    <Card className="py-4 overflow-hidden min-w-0">
      <CardHeader className="px-5 flex items-start justify-between space-y-0">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground leading-tight tracking-normal">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-xs font-semibold text-foreground/50 tracking-wider">
            {vehicle.bodyType}
          </p>
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground leading-tight tracking-normal">
            ${vehicle.pricePerDay}
          </h3>
          <p className="text-xs font-semibold text-foreground/50 text-end tracking-wider">
            /day
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-5">
        <div className="space-y-4">
          <AspectRatio ratio={16 / 9}>
            <img
              src={getDisplayImage()}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover rounded-md"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-car.png";
              }}
            />
          </AspectRatio>

          <div className="flex items-center justify-between">
            {getStatusBadge(vehicle.isAvailable)}
            <div className="flex items-center gap-1"></div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center justify-center gap-2">
              <div className="p-1.5 bg-muted/90 rounded-md">
                <Cog className="size-4 text-foreground/80" />
              </div>
              <span className="text-sm text-foreground tracking-tight truncate w-full">
                {vehicle.transmission}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="p-1.5 bg-muted/90 rounded-md">
                <GitFork className="size-4 text-foreground/80" />
              </div>
              <span className="text-sm text-foreground tracking-tight truncate w-full">
                {vehicle.drivetrain}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="p-1.5 bg-muted/90 rounded-md">
                <Fuel className="size-4 text-foreground/80" />
              </div>
              <span className="text-sm text-foreground tracking-tight truncate w-full">
                {vehicle.fuelType}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 flex gap-3">
        <Button className="flex-1" onClick={() => onDetails?.(vehicle.id)}>View Details</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onEdit?.(vehicle)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive hover:text-destructive! hover:bg-destructive/10!"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {vehicle.make} {vehicle.model}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(vehicle.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UnitCard;
