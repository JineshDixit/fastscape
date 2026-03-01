import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { financeService, type FinancialRecord } from '@/api/services/financeService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Car, Calendar, User, Mail, Phone, DollarSign, Receipt, Download } from 'lucide-react';
import { PaymentStatus } from '@/api/services/bookingService';
import { FileText } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

const FinanceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [financial, setFinancial] = useState<FinancialRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { canPerformAction } = usePermissions();

  useEffect(() => {
    const fetchFinancial = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await financeService.getFinancialById(id);
        setFinancial(data);
      } catch (error) {
        console.error('Failed to fetch financial details:', error);
        toast.error('Failed to load financial details.');
        navigate('/financials');
      } finally {
        setLoading(false);
      }
    };
    fetchFinancial();
  }, [id, navigate]);

  const formatCurrency = (amount: string | number, currency: string = 'AED') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numAmount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';

    switch (status) {
      case PaymentStatus.PAID:
        variant = 'default';
        break;
      case PaymentStatus.PARTIALLY_PAID:
        variant = 'secondary';
        break;
      case PaymentStatus.UNPAID:
      case PaymentStatus.OVERDUE:
        variant = 'destructive';
        break;
      case PaymentStatus.REFUNDED:
        variant = 'outline';
        break;
    }

    return (
      <Badge variant={variant} className="rounded-md px-3 py-1 text-xs font-semibold tracking-wide uppercase">
        {status}
      </Badge>
    );
  };

  const handleDownloadPDF = async () => {
    if (!financial) return;
    try {
      toast.loading('Generating invoice PDF...');

      const blob = await financeService.downloadInvoice(financial.bookingId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${financial.bookingId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Invoice downloaded successfully');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  if (!financial) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Financial record not found</p>
          <Button onClick={() => navigate('/financials')} className="mt-4">
            Back to Financials
          </Button>
        </div>
      </div>
    );
  }

  const booking = financial.Booking;
  const user = booking?.User;
  const vehicle = booking?.Vehicle;
  const payments = financial.Payments || [];

  return (
    <div className="container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
            <p className="text-sm text-gray-500">Invoice ID: {financial.bookingId.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {booking && getStatusBadge(booking.paymentStatus)}
          {canPerformAction('financials', 'generateInvoice') && (
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Information */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-gray-500" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-500">Full Name</p>
                  <p className="font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Email</p>
                  <p className="flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {user?.email}
                  </p>
                </div>
                {user?.phone && (
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Phone</p>
                    <p className="flex items-center gap-2 font-medium">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {user.phone}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-gray-500" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-500">Make & Model</p>
                  <p className="font-medium">
                    {vehicle?.make} {vehicle?.model}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Year</p>
                  <p className="font-medium">{vehicle?.year}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Body Type</p>
                  <p className="font-medium capitalize">{vehicle?.bodyType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Period */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-gray-500" />
                Rental Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-500">Start Date</p>
                  <p className="font-medium">{booking?.startDatetime && formatDate(booking.startDatetime)}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">End Date</p>
                  <p className="font-medium">{booking?.endDatetime && formatDate(booking.endDatetime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-gray-500" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{payment.paymentType}</p>
                        <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(payment.amount, financial.currency)}</p>
                        <Badge
                          variant={payment.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                          className="mt-1 text-[10px]"
                        >
                          {payment.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financial Breakdown */}
        <div className="space-y-6">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-gray-500" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base Amount</span>
                  <span className="font-medium">{formatCurrency(financial.baseAmount, financial.currency)}</span>
                </div>

                {parseFloat(financial.chauffeurAmount) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Chauffeur ({financial.chauffeurHours}h)</span>
                    <span className="font-medium">{formatCurrency(financial.chauffeurAmount, financial.currency)}</span>
                  </div>
                )}

                {parseFloat(financial.taxAmount) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tax</span>
                    <span className="font-medium">{formatCurrency(financial.taxAmount, financial.currency)}</span>
                  </div>
                )}

                {parseFloat(financial.platformChargeAmount) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Platform Charge ({financial.platformChargeRate}%)</span>
                    <span className="font-medium">
                      {formatCurrency(financial.platformChargeAmount, financial.currency)}
                    </span>
                  </div>
                )}

                {parseFloat(financial.delayChargeAmount) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Delay Charge</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(financial.delayChargeAmount, financial.currency)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="text-lg font-bold">{formatCurrency(financial.totalAmount, financial.currency)}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deposit ({financial.depositPercentage}%)</span>
                  <span className="font-medium">{formatCurrency(financial.depositAmount, financial.currency)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Balance</span>
                  <span className="font-medium">{formatCurrency(financial.balanceAmount, financial.currency)}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-600">Paid Amount</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(financial.paidAmount, financial.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-600">Remaining Amount</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(financial.remainingAmount, financial.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          {financial.refundPolicy && (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  Refund Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{financial.refundPolicy}</p>
                {financial.refundableUntil && (
                  <p className="mt-2 text-xs text-gray-500">
                    Refundable until: {formatDate(financial.refundableUntil)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceDetails;
