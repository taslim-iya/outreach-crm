import { useState } from 'react';
import { useAIConfigured, useAIQualifyLead, useLogAIAction } from '@/hooks/useAI';
import { AIConfigurePrompt } from './AIConfigurePrompt';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Target, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QualificationResult {
  score: number;
  qualification: string;
  reasons: string[];
  suggestedAction: string;
  priority: string;
}

interface AILeadQualificationProps {
  leadName: string;
  leadEmail?: string;
  leadTitle?: string;
  leadCompany?: string;
  leadIndustry?: string;
  leadScore?: number;
  engagementHistory?: string;
  entityId?: string;
  onQualified?: (result: QualificationResult) => void;
}

export function AILeadQualification({ leadName, leadEmail, leadTitle, leadCompany, leadIndustry, leadScore, engagementHistory, entityId, onQualified }: AILeadQualificationProps) {
  const { isConfigured } = useAIConfigured();
  const qualifyLead = useAIQualifyLead();
  const logAction = useLogAIAction();
  const [result, setResult] = useState<QualificationResult | null>(null);

  const handleQualify = async () => {
    const context = [
      `Name: ${leadName}`,
      leadEmail && `Email: ${leadEmail}`,
      leadTitle && `Title: ${leadTitle}`,
      leadCompany && `Company: ${leadCompany}`,
      leadIndustry && `Industry: ${leadIndustry}`,
      leadScore !== undefined && `Current score: ${leadScore}`,
      engagementHistory && `Engagement: ${engagementHistory}`,
    ].filter(Boolean).join('\n');

    try {
      const res = await qualifyLead.mutateAsync(context);
      setResult(res as QualificationResult);
      logAction.mutate({
        actionType: 'lead_qualification',
        entityType: 'lead',
        entityId,
        suggestion: `${res.qualification} (score: ${res.score})`,
        status: 'pending',
        metadata: res as Record<string, unknown>,
      });
      onQualified?.(res as QualificationResult);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const qualColor: Record<string, string> = {
    hot: 'bg-red-100 text-red-700',
    warm: 'bg-orange-100 text-orange-700',
    cold: 'bg-blue-100 text-blue-700',
    disqualified: 'bg-gray-100 text-gray-700',
  };

  if (!isConfigured) return <AIConfigurePrompt compact />;

  return (
    <div>
      {!result ? (
        <Button size="sm" variant="outline" onClick={handleQualify} disabled={qualifyLead.isPending}>
          {qualifyLead.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Target className="h-3 w-3 mr-1" />}
          AI Qualify
        </Button>
      ) : (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${qualColor[result.qualification] || qualColor.cold}`}>{result.qualification}</Badge>
              <span className="text-xs font-semibold">Score: {result.score}/100</span>
            </div>
            <Badge variant="outline" className="text-xs">{result.priority} priority</Badge>
          </div>
          {result.reasons.map((r, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /> {r}
            </p>
          ))}
          <p className="text-xs font-medium pt-1 border-t">Next: {result.suggestedAction}</p>
        </div>
      )}
    </div>
  );
}
