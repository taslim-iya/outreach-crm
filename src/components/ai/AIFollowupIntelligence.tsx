import { useState } from 'react';
import { useAIConfigured, useAIAnalyzeSentiment, useLogAIAction } from '@/hooks/useAI';
import { AIConfigurePrompt } from './AIConfigurePrompt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, ThumbsUp, ThumbsDown, Minus, ArrowRight, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisResult {
  sentiment: string;
  intent: string;
  confidence: number;
  summary: string;
  suggestedAction: string;
}

interface AIFollowupIntelligenceProps {
  emailBody: string;
  emailSubject?: string;
  contactId?: string;
  contactName?: string;
  onActionTaken?: (action: string) => void;
}

export function AIFollowupIntelligence({ emailBody, emailSubject, contactId, contactName, onActionTaken }: AIFollowupIntelligenceProps) {
  const { isConfigured } = useAIConfigured();
  const analyzeSentiment = useAIAnalyzeSentiment();
  const logAction = useLogAIAction();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    try {
      const result = await analyzeSentiment.mutateAsync(emailBody);
      setAnalysis(result as AnalysisResult);
      logAction.mutate({
        actionType: 'sentiment_analysis',
        entityType: 'contact',
        entityId: contactId,
        suggestion: result.suggestedAction,
        status: 'pending',
        metadata: { sentiment: result.sentiment, intent: result.intent },
      });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const sentimentIcon = {
    positive: <ThumbsUp className="h-4 w-4 text-green-500" />,
    negative: <ThumbsDown className="h-4 w-4 text-red-500" />,
    neutral: <Minus className="h-4 w-4 text-yellow-500" />,
  };

  const sentimentColor = {
    positive: 'bg-green-100 text-green-700',
    negative: 'bg-red-100 text-red-700',
    neutral: 'bg-yellow-100 text-yellow-700',
  };

  if (!isConfigured) return <AIConfigurePrompt compact />;

  return (
    <div className="space-y-2">
      {!analysis ? (
        <Button size="sm" variant="outline" className="w-full" onClick={handleAnalyze} disabled={analyzeSentiment.isPending}>
          {analyzeSentiment.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />}
          Analyze Reply
        </Button>
      ) : (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {sentimentIcon[analysis.sentiment as keyof typeof sentimentIcon] || sentimentIcon.neutral}
              <Badge className={`text-xs ${sentimentColor[analysis.sentiment as keyof typeof sentimentColor] || sentimentColor.neutral}`}>
                {analysis.sentiment}
              </Badge>
              <Badge variant="outline" className="text-xs">{analysis.intent}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{Math.round(analysis.confidence * 100)}% confident</span>
          </div>
          <p className="text-xs text-muted-foreground">{analysis.summary}</p>
          <div className="flex items-center gap-1 pt-1 border-t">
            <ArrowRight className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">Suggested: {analysis.suggestedAction}</span>
          </div>
          {onActionTaken && (
            <Button size="sm" variant="outline" className="h-6 text-xs w-full" onClick={() => onActionTaken(analysis.suggestedAction)}>
              Apply Suggestion
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
