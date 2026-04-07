import { useState } from 'react';
import { useAIConfigured, useAICall, useLogAIAction } from '@/hooks/useAI';
import { AIConfigurePrompt } from './AIConfigurePrompt';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, ArrowRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface StageRecommendation {
  currentStage: string;
  recommendedStage: string;
  confidence: number;
  reason: string;
  signals: string[];
}

interface AICRMStageManagerProps {
  contactName: string;
  currentStage: string;
  emailOpens?: number;
  emailReplies?: number;
  lastActivity?: string;
  daysSinceContact?: number;
  entityId?: string;
  onStageChange?: (newStage: string) => void;
}

export function AICRMStageManager({ contactName, currentStage, emailOpens, emailReplies, lastActivity, daysSinceContact, entityId, onStageChange }: AICRMStageManagerProps) {
  const { isConfigured } = useAIConfigured();
  const aiCall = useAICall();
  const logAction = useLogAIAction();
  const [recommendation, setRecommendation] = useState<StageRecommendation | null>(null);

  const handleAnalyze = async () => {
    const context = `Contact: ${contactName}
Current stage: ${currentStage}
Email opens: ${emailOpens || 0}
Email replies: ${emailReplies || 0}
Last activity: ${lastActivity || 'unknown'}
Days since last contact: ${daysSinceContact || 'unknown'}

Rules:
- Opened email 3+ times = Hot Lead
- Replied positively = Meeting Scheduled or Interested
- No reply in 14+ days = Nurture
- Replied negatively = Passed
- No activity in 30+ days = Cold`;

    try {
      const result = await aiCall.mutateAsync({
        systemPrompt: 'You are a CRM stage management AI. Analyze contact activity and recommend the appropriate pipeline stage. Respond with ONLY a JSON object (no markdown): {"currentStage": "X", "recommendedStage": "Y", "confidence": 0.0-1.0, "reason": "why", "signals": ["signal1"]}',
        messages: [{ role: 'user', content: context }],
        maxTokens: 256,
        temperature: 0.3,
      });
      const parsed = JSON.parse(result.content);
      setRecommendation(parsed);
      if (parsed.recommendedStage !== currentStage) {
        logAction.mutate({
          actionType: 'stage_recommendation',
          entityType: 'contact',
          entityId,
          suggestion: `Move from ${currentStage} to ${parsed.recommendedStage}`,
          status: 'pending',
          metadata: parsed,
        });
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleAccept = () => {
    if (recommendation && onStageChange) {
      onStageChange(recommendation.recommendedStage);
      toast.success(`Moved to ${recommendation.recommendedStage}`);
      setRecommendation(null);
    }
  };

  if (!isConfigured) return null;

  if (!recommendation) {
    return (
      <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={handleAnalyze} disabled={aiCall.isPending}>
        {aiCall.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
        AI Stage Check
      </Button>
    );
  }

  if (recommendation.recommendedStage === currentStage) {
    return (
      <span className="text-xs text-green-600 flex items-center gap-1">
        <Check className="h-3 w-3" /> Stage is correct
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
      <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs">
          Move to <Badge variant="outline" className="text-xs">{recommendation.recommendedStage}</Badge>
          <span className="text-muted-foreground ml-1">({Math.round(recommendation.confidence * 100)}%)</span>
        </p>
        <p className="text-[10px] text-muted-foreground">{recommendation.reason}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAccept}><Check className="h-3 w-3 text-green-600" /></Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRecommendation(null)}><X className="h-3 w-3 text-red-500" /></Button>
      </div>
    </div>
  );
}
