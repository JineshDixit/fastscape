import { useEffect, useState } from 'react';
import { type Chauffeur, chauffeurService } from '@/api/services/chauffeurService';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ChauffeurForm } from './ChauffeurForm';

const ChauffeurList = () => {
  const [data, setData] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    fetchChauffeurs();
  }, []);

  const fetchChauffeurs = async () => {
    try {
      setLoading(true);
      const response = await chauffeurService.getAllChauffeurs();
      if (response && response.chauffeurs) {
        setData(response.chauffeurs);
      } else {
        setData(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Failed to fetch chauffeurs:', error);
      toast.error('Failed to load chauffeurs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Chauffeurs</h2>
          <p className="text-muted-foreground mt-1">Manage your chauffeur fleet.</p>
        </div>
        <div>
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Chauffeur
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-1">
          <DataTable columns={columns} data={data} searchKey="fullName" searchPlaceholder="Filter by name..." />
        </div>
      </div>

      {/* Dialog for Create will go here */}
      <ChauffeurForm open={openCreate} onOpenChange={setOpenCreate} onSuccess={fetchChauffeurs} />
    </div>
  );
};

export default ChauffeurList;
