import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useCreateFollowUpSequence } from '@/hooks/useFollowUpSequences';
import { Clock, Repeat, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FollowUpSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorDealId?: string;
  investorName?: string;
  contactId?: string;
}

const DEFAULT_INTERVALS = [
  { label: '3 days', value: 3 },
  { label: '5 days', value: 5 },
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
];

export function FollowUpSetupModal({
  open,
  onOpenChange,
  investorDealId,
  investorName,
  contactId,
}: FollowUpSetupModalProps) {
  const [intervalDays, setIntervalDays] = useState(3);
  const [maxFollowUps, setMaxFollowUps] = useState(3);
  const [templateId, setTemplateId] = useState<string>('');
  const [customInterval, setCustomInterval] = useState('');

  const { data: templates = [] } = useEmailTemplates();
  const createSequence = useCreateFollowUpSequence();

  const handleCreate = async () => {
    try {
      await createSequence.mutateAsync({
        investor_deal_id: investorDealId,
        contact_id: contactId,
        template_id: templateId || undefined,
        interval_days: customInterval ? parseInt(customInterval) : intervalDays,
        max_follow_ups: maxFollowUps,
      });
      toast.success(`Follow-up sequence created for ${investorName || 'investor'}`, {
        description: `${maxFollowUps} follow-ups every ${customInterval || intervalDays} days`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create sequence');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Set Up Follow-Up Sequence
          </DialogTitle>
        </DialogHeader>

        {investorName && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{investorName}</Badge>
          </div>
        )}

        <div className="space-y-4">
          {/* Interval */}
          <div>
            <Label>Follow-up Interval</Label>
            <div className="flex gap-2 mt-1.5">
              {DEFAULT_INTERVALS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={intervalDays === opt.value && !customInterval ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setIntervalDays(opt.value); setCustomInterval(''); }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                placeholder="Custom days"
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
                className="w-32"
                min={1}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>

          {/* Max follow-ups */}
          <div>
            <Label>Number of Follow-ups</Label>
            <div className="flex gap-2 mt-1.5">
              {[1, 2, 3, 5].map((n) => (
                <Button
                  key={n}
                  variant={maxFollowUps === n ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMaxFollowUps(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div>
            <Label className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Follow-up Template
            </Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="AI will draft follow-ups (or pick a template)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai_draft">AI Auto-Draft</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              AI will personalize each follow-up based on the investor context and previous messages.
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Sequence Preview</p>
            <div className="space-y-1.5">
              {Array.from({ length: maxFollowUps }, (_, i) => {
                const days = (customInterval ? parseInt(customInterval) : intervalDays) * (i + 1);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">Follow-up #{i + 1}</span>
                    <span className="text-muted-foreground">— Day {days}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createSequence.isPending}>
            {createSequence.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Start Sequence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
