import { useState } from 'react';
import { useAIConfigured, useAICall } from '@/hooks/useAI';
import { AIConfigurePrompt } from './AIConfigurePrompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Clock, Mail, Zap, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface StepOptimization {
  stepNumber: number;
  type: string;
  currentSubject?: string;
  suggestedSubject?: string;
  currentBody?: string;
  suggestedBodyChanges?: string;
  suggestedDelay?: string;
  improvementReason: string;
}

interface SequenceOptimization {
  overallScore: number;
  generalFeedback: string;
  sendTimeRecommendation: string;
  stepOptimizations: StepOptimization[];
}

interface AISequenceOptimizerProps {
  steps: { step_order: number; step_type: string; subject?: string; body_html?: string; delay_amount?: number; delay_unit?: string }[];
  sequenceName: string;
  onApplyOptimization?: (stepNumber: number, changes: Partial<StepOptimization>) => void;
}

export function AISequenceOptimizer({ steps, sequenceName, onApplyOptimization }: AISequenceOptimizerProps) {
  const { isConfigured } = useAIConfigured();
  const aiCall = useAICall();
  const [optimization, setOptimization] = useState<SequenceOptimization | null>(null);
  const [appliedSteps, setAppliedSteps] = useState<Set<number>>(new Set());

  const handleOptimize = async () => {
    const stepsDescription = steps.map(s => {
      if (s.step_type === 'email') return `Step ${s.step_order}: Email - Subject: "${s.subject || 'none'}", Body: "${(s.body_html || '').slice(0, 200)}..."`;
      if (s.step_type === 'delay') return `Step ${s.step_order}: Wait ${s.delay_amount} ${s.delay_unit}`;
      return `Step ${s.step_order}: ${s.step_type}`;
    }).join('\n');

    try {
      const result = await aiCall.mutateAsync({
        systemPrompt: `You are an email sequence optimization expert. Analyze the sequence and provide improvements. Respond with ONLY a JSON object (no markdown): {"overallScore": 1-10, "generalFeedback": "text", "sendTimeRecommendation": "when to send", "stepOptimizations": [{"stepNumber": 1, "type": "email|delay", "currentSubject": "X", "suggestedSubject": "Y", "suggestedBodyChanges": "what to change", "suggestedDelay": "new delay if applicable", "improvementReason": "why"}]}`,
        messages: [{ role: 'user', content: `Sequence: ${sequenceName}\n\n${stepsDescription}` }],
        maxTokens: 1024,
        temperature: 0.5,
      });
      const parsed = JSON.parse(result.content) as SequenceOptimization;
      setOptimization(parsed);
      setAppliedSteps(new Set());
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleApply = (opt: StepOptimization) => {
    onApplyOptimization?.(opt.stepNumber, opt);
    setAppliedSteps(prev => new Set(prev).add(opt.stepNumber));
    toast.success(`Applied optimization for step ${opt.stepNumber}`);
  };

  if (!isConfigured) return <AIConfigurePrompt />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> AI Sequence Optimizer
          </CardTitle>
          <Button size="sm" onClick={handleOptimize} disabled={aiCall.isPending}>
            {aiCall.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {optimization ? 'Re-analyze' : 'Optimize'}
          </Button>
        </div>
      </CardHeader>
      {optimization && (
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Overall Score: <span className="font-bold text-lg">{optimization.overallScore}/10</span></span>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" /> {optimization.sendTimeRecommendation}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{optimization.generalFeedback}</p>

          {optimization.stepOptimizations.map((opt, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {opt.type === 'email' ? <Mail className="h-3 w-3 text-primary" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-xs font-medium">Step {opt.stepNumber}</span>
                </div>
                {appliedSteps.has(opt.stepNumber) ? (
                  <Badge variant="outline" className="text-xs text-green-600"><Check className="h-3 w-3 mr-1" /> Applied</Badge>
                ) : onApplyOptimization ? (
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleApply(opt)}>Apply</Button>
                ) : null}
              </div>
              {opt.suggestedSubject && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Subject:</span> <span className="line-through text-muted-foreground">{opt.currentSubject}</span>
                  <ArrowRight className="inline h-3 w-3 mx-1" />
                  <span className="font-medium">{opt.suggestedSubject}</span>
                </div>
              )}
              {opt.suggestedBodyChanges && <p className="text-xs text-muted-foreground">{opt.suggestedBodyChanges}</p>}
              {opt.suggestedDelay && <p className="text-xs">Suggested delay: <span className="font-medium">{opt.suggestedDelay}</span></p>}
              <p className="text-[10px] text-muted-foreground italic">{opt.improvementReason}</p>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
