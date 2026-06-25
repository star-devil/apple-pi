import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useModelsStore } from '@/store/models';
import { ProviderList } from '@/components/models/provider-list';
import { ProviderDetail } from '@/components/models/provider-detail';
import { AddProviderDialog } from '@/components/models/add-provider-dialog';

export const Route = createFileRoute('/models')({
  component: ModelsPage,
});

function ModelsPage() {
  const load = useModelsStore((s) => s.load);
  const getProviderViews = useModelsStore((s) => s.getProviderViews);
  const selectedProviderId = useModelsStore((s) => s.selectedProviderId);
  const selectProvider = useModelsStore((s) => s.selectProvider);
  const error = useModelsStore((s) => s.error);
  const toastMsg = useModelsStore((s) => s.toast);
  const clearToast = useModelsStore((s) => s.clearToast);
  const clearError = useModelsStore((s) => s.clearError);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (toastMsg) {
      toast.success(toastMsg);
      clearToast();
    }
  }, [toastMsg, clearToast]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const views = getProviderViews();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[280px] shrink-0">
        <ProviderList
          views={views}
          selectedId={selectedProviderId}
          onSelect={selectProvider}
          onAddCustom={() => setShowAddDialog(true)}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <ProviderDetail />
      </div>

      {showAddDialog && <AddProviderDialog onClose={() => setShowAddDialog(false)} />}
    </div>
  );
}
