import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { PRESET_PROVIDER_MAP } from '@/lib/presets';
import type { ApiSpec, CustomModelDef } from '@/lib/types';

const API_OPTIONS: { value: ApiSpec; label: string; defaultBaseUrl: string }[] = [
  { value: 'openai-completions', label: 'OpenAI 兼容', defaultBaseUrl: 'https://api.openai.com/v1' },
  { value: 'anthropic-messages', label: 'Anthropic', defaultBaseUrl: 'https://api.anthropic.com' },
  { value: 'openai-completions', label: 'Ollama', defaultBaseUrl: 'http://localhost:11434/v1' },
];

interface AddProviderDialogProps {
  onClose: () => void;
}

export function AddProviderDialog({ onClose }: AddProviderDialogProps) {
  const addCustomProvider = useModelsStore((s) => s.addCustomProvider);
  const loading = useModelsStore((s) => s.loading);

  const [name, setName] = useState('');
  const [apiLabel, setApiLabel] = useState(API_OPTIONS[0].label);
  const [apiSpec, setApiSpec] = useState<ApiSpec>(API_OPTIONS[0].value);
  const [baseUrl, setBaseUrl] = useState(API_OPTIONS[0].defaultBaseUrl);
  const [apiKey, setApiKey] = useState('');
  const [modelIds, setModelIds] = useState('');

  const handleApiChange = (label: string) => {
    setApiLabel(label);
    const opt = API_OPTIONS.find((o) => o.label === label);
    if (opt) {
      setApiSpec(opt.value);
      setBaseUrl(opt.defaultBaseUrl);
    }
  };

  const handleSubmit = async () => {
    const id = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id) return;
    if (PRESET_PROVIDER_MAP[id]) {
      alert('该供应商 ID 与预置供应商冲突,请换一个名称。');
      return;
    }

    const models: CustomModelDef[] = modelIds
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((mid) => ({ id: mid, name: mid, reasoning: false, input: ['text'] as const }));

    if (apiSpec === 'openai-completions' && apiLabel === 'Ollama' && models.length === 0) {
      alert('Ollama 供应商需要至少指定一个模型 ID。');
      return;
    }

    await addCustomProvider(id, name.trim(), apiSpec, baseUrl, apiKey, models);
    onClose();
  };

  const isOllama = apiLabel === 'Ollama';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加自定义供应商
          </DialogTitle>
          <DialogDescription>
            配置一个 OpenAI/Anthropic/Ollama 兼容的自定义端点。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-body-sm">供应商名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如 MyOpenAI、CompanyProxy"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm">API 规范</Label>
            <Select value={apiLabel} onValueChange={handleApiChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {API_OPTIONS.map((opt) => (
                  <SelectItem key={opt.label} value={opt.label}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm">Base URL</Label>
            <Input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm">
              API Key{isOllama && <span className="text-muted-foreground">(可选)</span>}
            </Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isOllama ? 'Ollama 通常无需密钥' : 'sk-...'}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm">模型 ID</Label>
            <Input
              value={modelIds}
              onChange={(e) => setModelIds(e.target.value)}
              placeholder="逗号或换行分隔,如 gpt-4o, gpt-4o-mini"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              非预置供应商需手动指定模型 ID 列表。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !baseUrl.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
