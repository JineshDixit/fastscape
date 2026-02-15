import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Chauffeur, ChauffeurStatus, chauffeurService } from '@/api/services/chauffeurService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  Phone,
  Users,
  Info,
  ShieldCheck,
  UserCheck,
  Star,
  Award,
  MapPin,
  Globe,
  Calendar,
  CreditCard,
  FileBadge,
  Trash2,
  RefreshCw,
  CheckCircle2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ChauffeurDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chauffeur, setChauffeur] = useState<Chauffeur | any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState<ChauffeurStatus | ''>('');

  useEffect(() => {
    const fetchChauffeur = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await chauffeurService.getChauffeurById(id);
        setChauffeur(data);
      } catch (error) {
        console.error('Failed to fetch chauffeur details:', error);
        toast.error('Failed to load chauffeur details.');
        navigate('/drivers');
      } finally {
        setLoading(false);
      }
    };
    fetchChauffeur();
  }, [id, navigate]);

  const handleStatusUpdate = async () => {
    if (!chauffeur || !statusToUpdate) return;
    try {
      setProcessing(true);
      await chauffeurService.updateChauffeurStatus(chauffeur.id, statusToUpdate as ChauffeurStatus);
      setChauffeur({ ...chauffeur, status: statusToUpdate });
      toast.success(`Chauffeur status updated to ${statusToUpdate}`);
      setStatusToUpdate('');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status.');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!chauffeur) return;
    try {
      setProcessing(true);
      await chauffeurService.verifyChauffeur(chauffeur.id);
      setChauffeur({ ...chauffeur, isVerified: true });
      toast.success('Chauffeur verified successfully');
    } catch (error) {
      console.error('Failed to verify chauffeur:', error);
      toast.error('Failed to verify chauffeur.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!chauffeur) return;
    try {
      setProcessing(true);
      await chauffeurService.deleteChauffeur(chauffeur.id);
      toast.success('Chauffeur deleted successfully');
      navigate('/drivers');
    } catch (error) {
      console.error('Failed to delete chauffeur:', error);
      toast.error('Failed to delete chauffeur.');
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

  if (!chauffeur) return null;

  const getStatusVariant = (status: ChauffeurStatus) => {
    switch (status) {
      case ChauffeurStatus.AVAILABLE:
        return 'default';
      case ChauffeurStatus.BUSY:
        return 'secondary';
      case ChauffeurStatus.OFF_DUTY:
        return 'destructive';
      case ChauffeurStatus.ON_BREAK:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const DataRow = ({ label, value, icon: Icon }: { label: string; value: string | React.ReactNode; icon?: any }) => (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="text-foreground text-sm font-semibold">{value || 'Not provided'}</div>
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
                {chauffeur.fullName || 'Unknown Name'}
              </h1>
              <Badge variant={getStatusVariant(chauffeur.status)} className="px-2.5 py-0.5 text-xs font-medium">
                {chauffeur.status?.replace('_', ' ') || 'Unknown'}
              </Badge>
              {chauffeur.isVerified ? (
                <div className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-green-600/20">
                  <ShieldCheck className="h-3 w-3" /> VERIFIED
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-600/20">
                  <Info className="h-3 w-3" /> PENDING VERIFICATION
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 font-medium">
                <RefreshCw className="h-4 w-4" /> Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Chauffeur Status</DialogTitle>
                <DialogDescription>
                  Modify the current availability status for {chauffeur.fullName || 'this chauffeur'}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>New Status</Label>
                  <Select value={statusToUpdate} onValueChange={(val) => setStatusToUpdate(val as ChauffeurStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ChauffeurStatus.AVAILABLE}>Available</SelectItem>
                      <SelectItem value={ChauffeurStatus.BUSY}>Busy</SelectItem>
                      <SelectItem value={ChauffeurStatus.ON_BREAK}>On Break</SelectItem>
                      <SelectItem value={ChauffeurStatus.OFF_DUTY}>Off Duty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleStatusUpdate} disabled={!statusToUpdate || processing} className="w-full">
                  Update Availability
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {!chauffeur.isVerified && (
            <Button
              onClick={handleVerify}
              disabled={processing}
              className="h-10 gap-2 bg-black font-medium text-white hover:bg-gray-800"
            >
              <UserCheck className="h-4 w-4" /> Verify Profile
            </Button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Chauffeur</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {chauffeur.fullName || 'this chauffeur'}? This action cannot be undone
                  and will remove all their data from the system.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={handleDelete} disabled={processing} className="w-full">
                  Confirm Deletion
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Performance & Highlights */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="border-none bg-gray-50/50 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Star className="mb-2 h-5 w-5 fill-amber-500 text-amber-500" />
            <span className="text-2xl font-bold">{parseFloat(chauffeur.rating || '0').toFixed(1)}</span>
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
              Average Rating
            </span>
          </CardContent>
        </Card>
        <Card className="border-none bg-gray-50/50 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Globe className="mb-2 h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{chauffeur.totalTrips || 0}</span>
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Total Trips</span>
          </CardContent>
        </Card>
        <Card className="border-none bg-gray-50/50 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Award className="mb-2 h-5 w-5 text-purple-500" />
            <span className="text-2xl font-bold">{chauffeur.experienceLevel || 'Beginner'}</span>
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Experience</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-4 w-full justify-start gap-4 bg-transparent p-0">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:border-primary border bg-transparent px-2 pb-2 font-bold shadow-none data-[state=active]:bg-transparent"
              >
                Profile Overview
              </TabsTrigger>
              <TabsTrigger
                value="documentation"
                className="data-[state=active]:border-primary border bg-transparent px-2 pb-2 font-bold shadow-none data-[state=active]:bg-transparent"
              >
                Documentation
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:border-primary border bg-transparent px-2 pb-2 font-bold shadow-none data-[state=active]:bg-transparent"
              >
                Recent Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-8">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Users className="text-primary h-4 w-4" /> Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="divide-y divide-gray-100/50">
                    <DataRow label="Full Name" value={chauffeur.fullName} />
                    <DataRow label="Nationality" value={chauffeur.nationality} icon={Globe} />
                    <DataRow
                      label="Date of Birth"
                      value={chauffeur.dateOfBirth ? new Date(chauffeur.dateOfBirth).toLocaleDateString() : 'N/A'}
                      icon={Calendar}
                    />
                    <DataRow label="Experience" value={`${chauffeur.yearsOfExperience || 0} Years`} icon={Award} />
                    <DataRow label="Email Address" value={chauffeur.email} />
                    <DataRow label="Phone Number" value={chauffeur.phone} icon={Phone} />
                    <DataRow
                      label="Languages"
                      value={chauffeur.languages ? chauffeur.languages.join(', ') : 'Not specified'}
                    />
                    <DataRow
                      label="Specializations"
                      value={chauffeur.specializations ? chauffeur.specializations.join(', ') : 'Not specified'}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <MapPin className="text-primary h-4 w-4" /> Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="divide-y divide-gray-100/50">
                    <DataRow label="Street Address" value={chauffeur.address} />
                    <DataRow label="City / State" value={`${chauffeur.city}, ${chauffeur.state}`} />
                    <DataRow label="Zip Code" value={chauffeur.zipCode} />
                    <DataRow label="Country" value={chauffeur.country} icon={Globe} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Info className="text-primary h-4 w-4" /> Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="text-muted-foreground text-sm leading-relaxed">
                    {chauffeur.notes || 'No additional notes provided for this chauffeur.'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentation">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <FileBadge className="text-primary h-4 w-4" /> License & Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="divide-y divide-gray-100/50">
                    <DataRow label="License Number" value={chauffeur.licenseNumber} />
                    <DataRow label="Issuing Country" value={chauffeur.licenseIssuingCountry} />
                    <DataRow
                      label="Expiry Date"
                      value={
                        chauffeur.licenseExpiryDate ? new Date(chauffeur.licenseExpiryDate).toLocaleDateString() : 'N/A'
                      }
                      icon={Calendar}
                    />
                    <DataRow
                      label="Verification"
                      value={
                        chauffeur.isVerified ? (
                          <span className="flex items-center gap-1.5 text-green-600">
                            <CheckCircle2 className="h-4 w-4" /> Fully Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-600">
                            <Info className="h-4 w-4" /> Documentation Pending
                          </span>
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card className="border-dashed shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="bg-primary/5 mb-4 rounded-full p-3">
                    <Calendar className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold">No Recent Bookings</h3>
                  <p className="text-muted-foreground mt-1 text-xs">
                    This chauffeur hasn't been assigned to any bookings yet.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="overflow-hidden border-none bg-black text-white shadow-lg">
            <CardHeader className="border-b border-white/10 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <CreditCard className="h-4 w-4 text-white" /> Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <span className="mb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Standard Hourly Rate
                </span>
                <span className="text-4xl font-black">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: chauffeur.currency || 'AED',
                  }).format(parseFloat(chauffeur.hourlyRate || '0'))}
                </span>
                <span className="mt-1 text-xs text-gray-400">Net earnings per hour</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Commission Rate</span>
                  <span className="font-bold">15%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Joined Since</span>
                  <span className="font-bold">
                    {chauffeur.createdAt ? new Date(chauffeur.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <Button className="h-11 w-full bg-white font-bold text-black hover:bg-gray-100" variant="outline">
                View Wallet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Phone className="text-primary h-4 w-4" /> Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="divide-y divide-gray-100/50">
                <DataRow label="Contact Name" value={chauffeur.emergencyContactName} />
                <DataRow label="Contact Phone" value={chauffeur.emergencyContactPhone} icon={Phone} />
              </div>
            </CardContent>
          </Card>

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
                  <span className="font-bold text-gray-900">{chauffeur.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase">UPDATED</span>
                  <span>{chauffeur.updatedAt ? new Date(chauffeur.updatedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChauffeurDetails;
