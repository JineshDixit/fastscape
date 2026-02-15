import { useEffect, useState } from 'react';
import { apiClient } from '@/api';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

// Define types locally for now or move to service
interface Document {
  id: string;
  userId: string;
  type: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  url: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

const columns: ColumnDef<Document>[] = [
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
    cell: () => (
      <Button variant="ghost" size="sm">
        <Eye className="mr-2 h-4 w-4" /> Review
      </Button>
    ),
  },
];

const Documents = () => {
  const [data, setData] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: Document[] }>('/documents/pending');
        if (res.data.success) {
          setData(res.data.data);
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
    <div className="mx-auto flex h-full w-full max-w-400 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Document Verification</h2>
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
