import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useModelsStore } from '@/store/models';
import { cn } from '@/lib/utils';

interface TestModelDialogProps {
  providerId: string;
  onClose: () => void;
}

export function TestModelDialog({ providerId, onClose }: TestModelDialogProps) {
  const getProviderView = useModelsStore((s) => s.getProviderView);
  const getModelsForProvider = useModelsStore((s) => s.getModelsForProvider);
  const testConnection = useModelsStore((s) => s.testConnection);
  const testing = useModelsStore((s) => s.testing);
  const testResult = useModelsStore((s) => s.testResult);

  const view = getProviderView(providerId);
  const models = getModelsForProvider(providerId);
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  const handleTest = async () => {
    if (!selectedModel) return;
    const targetModel = models.find((m) => m.id === selectedModel);
    const providerKey = targetModel?.provider ?? providerId;
    await testConnection(providerKey, selectedModel);
  };

  if (!view) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            测试连通性 — {view.name}
          </DialogTitle>
          <DialogDescription>
            选择一个模型发送测试消息,验证 API Key 和 Base URL 是否可用。将消耗少量 token。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {models.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              该供应商暂无可用模型。请先保存配置并刷新模型列表。
            </p>
          ) : (
            <div className="space-y-2">
              <Label className="text-body-sm">选择模型</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="选择一个模型" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} <span className="text-muted-foreground">({m.id})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {testResult && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-body-sm',
                testResult.success
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-destructive/40 bg-destructive/10 text-destructive'
              )}
            >
              {testResult.success ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{testResult.message}</p>
                {testResult.latency && (
                  <p className="text-xs opacity-80">耗时 {(testResult.latency / 1000).toFixed(1)}s</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          <Button onClick={handleTest} disabled={testing || !selectedModel || models.length === 0}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            {testing ? '测试中…' : '开始测试'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
