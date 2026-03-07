import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type User, VerificationStatus, userService } from '@/api/services/userService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Mail,
  Phone,
  // MapPin,
  Calendar,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  FileText,
  Car,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [verificationStatusToUpdate, setVerificationStatusToUpdate] = useState<VerificationStatus | ''>('');
  const { canUpdate } = usePermissions();

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await userService.getUserById(id);
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        toast.error('Failed to load client details.');
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

  const handleVerificationStatusUpdate = async () => {
    if (!user || !verificationStatusToUpdate) return;
    try {
      setProcessing(true);
      await userService.updateVerificationStatus(user.id, verificationStatusToUpdate);
      setUser({ ...user, verificationStatus: verificationStatusToUpdate });
      toast.success(`Verification status updated to ${verificationStatusToUpdate}`);
      setVerificationStatusToUpdate('');
    } catch (error) {
      console.error('Failed to update verification status:', error);
      toast.error('Failed to update verification status.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleBlock = async (shouldBlock: boolean) => {
    if (!user) return;
    if (shouldBlock && !blockReason) {
      toast.error('Please provide a reason for blocking');
      return;
    }
    try {
      setProcessing(true);
      await userService.toggleBlockUser(user.id, shouldBlock, blockReason);
      setUser({ ...user, isBlocked: shouldBlock });
      toast.success(`User ${shouldBlock ? 'blocked' : 'unblocked'} successfully`);
      setBlockReason('');
    } catch (error) {
      console.error('Failed to toggle block status:', error);
      toast.error('Failed to update block status.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  if (!user) return null;

  const getVerificationVariant = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return 'default';
      case VerificationStatus.PENDING:
        return 'secondary';
      case VerificationStatus.REJECTED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const DataRow = ({ label, value, icon: Icon }: { label: string; value: string | React.ReactNode; icon?: any }) => (
    <div className="flex flex-col space-y-1.5 py-3 first:pt-0 last:pb-0">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="text-foreground text-sm font-semibold">{value || 'N/A'}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Client Details</h1>
              <Badge variant={getVerificationVariant(user.verificationStatus)} className="h-6">
                {user.verificationStatus}
              </Badge>
              <Badge variant={user.isBlocked ? 'destructive' : 'default'} className="h-6">
                {user.isBlocked ? 'BLOCKED' : 'ACTIVE'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-sm leading-none">ID: {user.id}</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
          {canUpdate('clients') && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-9 w-full gap-2 sm:w-auto">
                    <Shield className="h-4 w-4" /> Update Verification
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Verification Status</DialogTitle>
                    <DialogDescription>Change the verification status of this client.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>New Status</Label>
                      <Select
                        value={verificationStatusToUpdate}
                        onValueChange={(val) => setVerificationStatusToUpdate(val as VerificationStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={VerificationStatus.PENDING}>Pending</SelectItem>
                          <SelectItem value={VerificationStatus.VERIFIED}>Verified</SelectItem>
                          <SelectItem value={VerificationStatus.REJECTED}>Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleVerificationStatusUpdate}
                      disabled={!verificationStatusToUpdate || processing}
                      className="w-full"
                    >
                      Confirm Change
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {user.isBlocked ? (
                <Button variant="default" className="h-9 w-full gap-2 sm:w-auto" onClick={() => handleToggleBlock(false)}>
                  <CheckCircle className="h-4 w-4" /> Unblock User
                </Button>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="h-9 w-full gap-2 sm:w-auto">
                      <Ban className="h-4 w-4" /> Block User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block User</DialogTitle>
                      <DialogDescription>
                        This will prevent the user from accessing the platform. Are you sure?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Reason for Blocking</Label>
                        <Textarea
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          placeholder="Enter reason..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => handleToggleBlock(true)}
                        disabled={!blockReason || processing}
                        className="w-full"
                      >
                        Confirm Block
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Core Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <Card>
            <CardHeader className="border-b [.border-b]:pb-2.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <UserIcon className="text-primary h-4 w-4" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <DataRow label="First Name" value={user.firstName} />
                <DataRow label="Last Name" value={user.lastName} />
                <DataRow label="Email" value={user.email} icon={Mail} />
              </div>
              <div className="space-y-4">
                <DataRow label="Phone" value={user.phone} icon={Phone} />
                <DataRow
                  label="Date of Birth"
                  value={new Date(user.dateOfBirth).toLocaleDateString()}
                  icon={Calendar}
                />
                <DataRow label="Nationality" value={user.nationality} />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          {/* <Card>
            <CardHeader className="border-b [.border-b]:pb-2.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <MapPin className="text-primary h-4 w-4" /> Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <DataRow label="City" value={user.city} />
                <DataRow label="State" value={user.state} />
              </div>
              <div className="space-y-4">
                <DataRow label="Zip Code" value={user.zipCode} />
                <DataRow label="Country" value={user.country} />
              </div>
            </CardContent>
          </Card> */}

          {/* Driving Information */}
          {user.UserDrivingInfo && (
            <Card>
              <CardHeader className="border-b [.border-b]:pb-2.5">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Car className="text-primary h-4 w-4" /> Driving Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <DataRow label="License Issuing Country" value={user.UserDrivingInfo.licenseIssuingCountry} />
                  <DataRow
                    label="License Expiry"
                    value={new Date(user.UserDrivingInfo.licenseExpiryDate).toLocaleDateString()}
                  />
                </div>
                <div className="space-y-4">
                  <DataRow label="Driving Experience" value={`${user.UserDrivingInfo.drivingExperienceYears} years`} />
                  <DataRow label="Visa Status" value={user.UserDrivingInfo.visaStatus} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Bookings */}
          {user.Bookings && user.Bookings.length > 0 && (
            <Card>
              <CardHeader className="border-b [.border-b]:pb-2.5">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <FileText className="text-primary h-4 w-4" /> Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.Bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-gray-500">{booking.id}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {booking.bookingType}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {booking.bookingStatus}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-medium">
                          {new Date(booking.startDatetime).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">{new Date(booking.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Secondary Info */}
        <div className="space-y-6">
          {/* Verification Status */}
          <Card>
            <CardHeader className="border-b [.border-b]:pb-2.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Shield className="text-primary h-4 w-4" /> Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DataRow
                label="Status"
                value={
                  <Badge variant={getVerificationVariant(user.verificationStatus)}>{user.verificationStatus}</Badge>
                }
              />
              {user.verificationDate && (
                <DataRow
                  label="Verified On"
                  value={new Date(user.verificationDate).toLocaleDateString()}
                  icon={Calendar}
                />
              )}
              {user.UserIdentityDocument && (
                <div className="space-y-2">
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Documents Verified</span>
                    {user.UserIdentityDocument.verified ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader className="border-b [.border-b]:pb-2.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <UserIcon className="text-primary h-4 w-4" /> Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DataRow
                label="Account Status"
                value={
                  <Badge variant={user.isBlocked ? 'destructive' : 'default'}>
                    {user.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                  </Badge>
                }
              />
              <DataRow label="Joined Date" value={new Date(user.createdAt).toLocaleDateString()} icon={Calendar} />
              <DataRow label="Last Updated" value={new Date(user.updatedAt).toLocaleDateString()} icon={Calendar} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
