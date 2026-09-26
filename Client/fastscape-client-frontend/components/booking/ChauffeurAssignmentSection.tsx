'use client';

import { useState } from 'react';
import { useChauffeurAssignment } from '@/app/axios/hooks/useChauffeurAssignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClockIcon, RefreshCwIcon, UserCheckIcon, CreditCardIcon, UserIcon } from 'lucide-react';

interface ChauffeurAssignmentSectionProps {
  booking: any;
  onBookingUpdate: () => void;
}

export default function ChauffeurAssignmentSection({ booking, onBookingUpdate }: ChauffeurAssignmentSectionProps) {
  const { checkAssignmentStatus, isLoading: assignmentLoading, error: assignmentError } = useChauffeurAssignment();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setActionLoading('check');
    await checkAssignmentStatus(booking.id);
    setActionLoading(null);
    onBookingUpdate(); // Refresh booking data
  };

  if (booking.bookingType !== 'CHAUFFEUR') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Chauffeur Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!booking.chauffeur ? (
          <>
            {booking.paymentStatus === 'PAID' || booking.paymentStatus === 'PARTIALLY_PAID' ? (
              <>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span>Payment completed. Finding available chauffeurs...</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckStatus}
                    disabled={assignmentLoading || actionLoading === 'check'}
                    className="flex items-center gap-2"
                  >
                    <RefreshCwIcon
                      className={`h-4 w-4 ${assignmentLoading || actionLoading === 'check' ? 'animate-spin' : ''}`}
                    />
                    Refresh Status
                  </Button>
                </div>
                {assignmentError && (
                  <div className="rounded bg-red-50 p-2 text-sm text-red-600">Error: {assignmentError}</div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CreditCardIcon className="h-4 w-4" />
                <span>Complete payment to enable chauffeur assignment</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <UserCheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-800">Assignment Complete</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Your chauffeur has been assigned and will contact you before pickup.
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Auto-assigned on:</span>
                    <span className="font-medium">
                      {booking.chauffeur.assignedAt
                        ? new Date(booking.chauffeur.assignedAt).toLocaleString()
                        : 'Payment completion'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-gray-600">Name</span>
                <p className="font-medium">{booking.chauffeur.fullName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Rating</span>
                <p className="font-medium">{booking.chauffeur.rating} / 5.0</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Phone</span>
                <p className="font-medium">{booking.chauffeur.phone}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Experience</span>
                <p className="font-medium">{booking.chauffeur.experienceLevel}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
