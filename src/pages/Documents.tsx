import { useEffect, useState } from 'react';
import { apiClient } from '@/api';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface PendingDocumentApi {
  id: string;
  userId: string;
  driverLicenseFront?: string;
  driverLicenseBack?: string;
  passportPhoto?: string;
  internationalDrivingPermit?: string;
  selfieWithLicense?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  User?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

interface DocumentRow {
  id: string;
  userId: string;
  type: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  url?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

const columns: ColumnDef<DocumentRow>[] = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">
          {row.original.user?.firstName} {row.original.user?.lastName}
        </p>
        <p className="text-muted-foreground text-xs">{row.original.user?.email}</p>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Document Type',
    cell: ({ row }) => <span className="capitalize">{row.getValue('type')}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant={status === 'PENDING' ? 'secondary' : status === 'VERIFIED' ? 'default' : 'destructive'}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Submitted',
    cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const documentUrl = row.original.url;
      return (
        <PermissionGuard module="documents" action="download">
          <Button
            variant="ghost"
            size="sm"
            disabled={!documentUrl}
            onClick={() => {
              if (documentUrl) window.open(documentUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            <Eye className="mr-2 h-4 w-4" /> Review
          </Button>
        </PermissionGuard>
      );
    },
  },
];

const Documents = () => {
  const [data, setData] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const getAssetUrl = (assetPath?: string): string | undefined => {
    if (!assetPath) return undefined;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://3.111.162.90:5000/api';
    const serverRoot = baseUrl.replace(/\/api$/, '');
    return `${serverRoot}/${assetPath.replace(/\\/g, '/')}`;
  };

  const mapPendingDocument = (doc: PendingDocumentApi): DocumentRow => {
    const user = doc.User || doc.user;
    const previewPath =
      doc.driverLicenseFront ||
      doc.passportPhoto ||
      doc.driverLicenseBack ||
      doc.internationalDrivingPermit ||
      doc.selfieWithLicense;

    return {
      id: doc.id,
      userId: doc.userId,
      type: 'identity_document',
      status: doc.verificationStatus,
      url: getAssetUrl(previewPath),
      user,
      createdAt: doc.createdAt,
    };
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: PendingDocumentApi[] }>('/documents/pending');
        if (res.data.success) {
          setData((res.data.data || []).map(mapPendingDocument));
        }
      } catch (error) {
        console.error('Failed to fetch documents', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  // Silence unused variable warning by conditional rendering (cleaner than just ignoring)
  if (loading) return <div>Loading...</div>;

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col space-y-6 px-3 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Document Verification</h2>
          <p className="text-muted-foreground mt-1">Review and verify user identity documents.</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-1">
          <DataTable columns={columns} data={data} />
        </div>
      </div>
    </div>
  );
};

export default Documents;
