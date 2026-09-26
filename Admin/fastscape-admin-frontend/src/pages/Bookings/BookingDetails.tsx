import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Booking, BookingStatus, PaymentStatus, bookingService } from '@/api/services/bookingService';
import { paymentService } from '@/api/services/paymentService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  Car,
  MapPin,
  CreditCard,
  FileText,
  Calendar,
  Hash,
  Ban,
  RefreshCcw,
  Mail,
  Phone,
  Users,
  Info,
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
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/usePermissions';

const BookingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [statusToUpdate, setStatusToUpdate] = useState<BookingStatus | ''>('');
  const { canUpdate } = usePermissions();

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await bookingService.getBookingById(id);
        setBooking(data);
      } catch (error) {
        console.error('Failed to fetch booking details:', error);
        toast.error('Failed to load booking details.');
        navigate('/bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, navigate]);

  const handleStatusUpdate = async () => {
    if (!booking || !statusToUpdate) return;
    try {
      setProcessing(true);
      await bookingService.updateBookingStatus(booking.id, statusToUpdate);
      setBooking({ ...booking, bookingStatus: statusToUpdate });
      toast.success(`Booking status updated to ${statusToUpdate}`);
      setStatusToUpdate('');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update booking status.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!booking || !cancelReason) return;
    try {
      setProcessing(true);
      await bookingService.cancelBooking(booking.id, cancelReason);
      setBooking({ ...booking, bookingStatus: BookingStatus.CANCELLED });
      toast.success('Booking cancelled successfully');
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Failed to cancel booking.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!booking || !refundAmount || !refundReason) return;
    try {
      setProcessing(true);
      await paymentService.processRefund(booking.id, {
        refundAmount: parseFloat(refundAmount),
        reason: refundReason,
      });
      const updatedBooking = await bookingService.getBookingById(booking.id);
      setBooking(updatedBooking);
      toast.success('Refund processed successfully');
      setRefundAmount('');
      setRefundReason('');
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast.error('Failed to process refund.');
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
  if (!booking) return null;

  const Financial = booking.BookingFinancial;
  const totalAmount = parseFloat(Financial?.totalAmount || '0');
  const currency = Financial?.currency || 'AED';

  const getStatusVariant = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
      case BookingStatus.COMPLETED:
        return 'default';
      case BookingStatus.PENDING:
        return 'secondary';
      case BookingStatus.CANCELLED:
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
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Booking Details</h1>
              <Badge variant={getStatusVariant(booking.bookingStatus)} className="h-6">
                {booking.bookingStatus}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-sm leading-none">ID: {booking.id}</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
          {canUpdate('bookings') && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-9 w-full gap-2 sm:w-auto">
                  <RefreshCcw className="h-4 w-4" /> Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Booking Status</DialogTitle>
                  <DialogDescription>Change the current progress of this booking.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>New Status</Label>
                    <Select value={statusToUpdate} onValueChange={(val) => setStatusToUpdate(val as BookingStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={BookingStatus.PENDING}>Pending</SelectItem>
                        <SelectItem value={BookingStatus.CONFIRMED}>Confirmed</SelectItem>
                        <SelectItem value={BookingStatus.PICKED_UP}>Picked Up</SelectItem>
                        <SelectItem value={BookingStatus.DROPPED_OFF}>Dropped Off</SelectItem>
                        <SelectItem value={BookingStatus.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={BookingStatus.CANCELLED}>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleStatusUpdate} disabled={!statusToUpdate || processing} className="w-full">
                    Confirm Change
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canUpdate('bookings') &&
            booking.bookingStatus !== BookingStatus.CANCELLED &&
            booking.bookingStatus !== BookingStatus.COMPLETED && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="h-9 w-full gap-2 sm:w-auto">
                    <Ban className="h-4 w-4" /> Cancel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Booking</DialogTitle>
                    <DialogDescription>This will mark the booking as cancelled. Are you sure?</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Cancellation Reason</Label>
                      <Textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Enter reason..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={!cancelReason || processing}
                      className="w-full"
                    >
                      Confirm Cancellation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Core Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Journey Section */}
          <Card>
            <CardHeader className="border-b [.border-b]:pb-2.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <MapPin className="text-primary h-4 w-4" /> Journey Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <DataRow label="Pickup Location" value={booking.pickupLocation} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DataRow
                    label="Pickup Date"
                    value={new Date(booking.startDatetime).toLocaleDateString()}
                    icon={Calendar}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <DataRow label="Dropoff Location" value={booking.dropoffLocation} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DataRow
                    label="Dropoff Date"
                    value={new Date(booking.endDatetime).toLocaleDateString()}
                    icon={Calendar}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User & Chauffeur */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="border-b [.border-b]:pb-2.5">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Users className="text-primary h-4 w-4" /> Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DataRow label="Name" value={`${booking.User?.firstName} ${booking.User?.lastName}`} />
                <DataRow label="Email" value={booking.User?.email} icon={Mail} />
                <DataRow label="Phone" value={booking.User?.phone} icon={Phone} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b [.border-b]:pb-2.5">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Hash className="text-primary h-4 w-4" /> Chauffeur Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {booking.Chauffeur ? (
                  <div className="space-y-1">
                    <DataRow label="Chauffeur Name" value={booking.Chauffeur.fullName} />
                    <DataRow label="Contact" value={booking.Chauffeur.phone} icon={Phone} />
                  </div>
                ) : (
                  <div className="bg-muted/20 text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-4">
                    <Info className="mb-1 h-4 w-4 opacity-50" />
                    <span className="text-xs font-medium italic">No chauffeur assigned</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          {(booking.notes || booking.chauffeurInstructions) && (
            <Card>
              <CardHeader className="border-b [.border-b]:pb-2.5">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <FileText className="text-primary h-4 w-4" /> Notes & Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {booking.notes && (
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      Booking Notes
                    </span>
                    <p className="border-primary/20 bg-muted/10 rounded-r border-l-4 py-1 pl-3 text-sm">
                      {booking.notes}
                    </p>
                  </div>
                )}
                {booking.chauffeurInstructions && (
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      Chauffeur Instructions
                    </span>
                    <p className="bg-muted/10 rounded-r border-l-4 border-amber-500/20 py-1 pl-3 text-sm">
                      {booking.chauffeurInstructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Secondary Info */}
        <div className="space-y-6">
          {/* Vehicle Info */}
          <Card>
            <CardHeader className="border-b [.border-b]:pb-2.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Car className="text-primary h-4 w-4" /> Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DataRow label="Model" value={`${booking.Vehicle?.make} ${booking.Vehicle?.model}`} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DataRow label="Year" value={booking.Vehicle?.year?.toString()} />
                <DataRow label="Type" value={booking.Vehicle?.bodyType} />
              </div>
            </CardContent>
          </Card>

          {/* Financial Info */}
          <Card>
            <CardHeader className="border-b [.border-b]:pb-2.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <CreditCard className="text-primary h-4 w-4" /> Financials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Amount</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
                      parseFloat(Financial?.baseAmount || '0'),
                    )}
                  </span>
                </div>
                {parseFloat(Financial?.chauffeurAmount || '0') > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chauffeur Fee</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
                        parseFloat(Financial?.chauffeurAmount || '0'),
                      )}
                    </span>
                  </div>
                )}
                {parseFloat(Financial?.taxAmount || '0') > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxes</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
                        parseFloat(Financial?.taxAmount || '0'),
                      )}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                      Total Amount
                    </span>
                    <span className="text-primary text-xl font-bold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalAmount)}
                    </span>
                  </div>
                  <Badge
                    variant={booking.paymentStatus === PaymentStatus.PAID ? 'default' : 'outline'}
                    className="text-[9px] uppercase"
                  >
                    {booking.paymentStatus}
                  </Badge>
                </div>
              </div>

              {canUpdate('bookings') && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-xs"
                      disabled={
                        booking.paymentStatus === PaymentStatus.REFUNDED || booking.paymentStatus === PaymentStatus.UNPAID
                      }
                    >
                      Process Refund
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Initiate Refund</DialogTitle>
                      <DialogDescription>Process a refund for this booking.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Refund Amount ({currency})</Label>
                        <Input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Reason</Label>
                        <Textarea
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          placeholder="Internal notes..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleRefund}
                        disabled={!refundAmount || !refundReason || processing}
                        className="w-full"
                      >
                        Refund Amount
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
