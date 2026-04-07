import { useState } from 'react';
import { useAIConfigured, useAIOptimizeSubject } from '@/hooks/useAI';
import { AIConfigurePrompt } from './AIConfigurePrompt';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, Loader2, Star, AlertCircle, Lightbulb, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SubjectTestResult {
  rating: number;
  predictedOpenRate: string;
  issues: string[];
  suggestions: { subject: string; reason: string }[];
  bestPractices: string[];
}

interface AISubjectLineTesterProps {
  subject: string;
  context?: string;
  onSelectSubject?: (subject: string) => void;
}

export function AISubjectLineTester({ subject, context, onSelectSubject }: AISubjectLineTesterProps) {
  const { isConfigured } = useAIConfigured();
  const optimizeSubject = useAIOptimizeSubject();
  const [result, setResult] = useState<SubjectTestResult | null>(null);
  const [open, setOpen] = useState(false);

  const handleTest = async () => {
    if (!subject.trim()) { toast.error('Enter a subject line first'); return; }
    try {
      const res = await optimizeSubject.mutateAsync({ subject, context });
      setResult(res as SubjectTestResult);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const ratingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const openRateColor: Record<string, string> = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-red-100 text-red-700',
  };

  if (!isConfigured) return <AIConfigurePrompt compact />;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
          <Sparkles className="h-3 w-3" /> Test Subject
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-1"><Sparkles className="h-4 w-4 text-primary" /> Subject Line Tester</span>
          </div>

          <div className="text-xs bg-muted/50 rounded p-2 break-words">"{subject || 'No subject entered'}"</div>

          {!result ? (
            <Button size="sm" className="w-full" onClick={handleTest} disabled={optimizeSubject.isPending || !subject.trim()}>
              {optimizeSubject.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Star className="h-3 w-3 mr-1" />}
              Analyze Subject Line
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${ratingColor(result.rating)}`}>{result.rating}</span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
                <Badge className={`text-xs ${openRateColor[result.predictedOpenRate] || openRateColor.medium}`}>
                  {result.predictedOpenRate} open rate
                </Badge>
              </div>

              {result.issues.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 text-yellow-500" /> Issues</p>
                  {result.issues.map((issue, i) => (
                    <p key={i} className="text-xs text-muted-foreground ml-4">• {issue}</p>
                  ))}
                </div>
              )}

              {result.suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1 flex items-center gap-1"><Lightbulb className="h-3 w-3 text-primary" /> Suggestions</p>
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="ml-4 mb-1.5 group">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-medium">"{s.subject}"</p>
                        {onSelectSubject && (
                          <button className="opacity-0 group-hover:opacity-100 text-primary" onClick={() => { onSelectSubject(s.subject); setOpen(false); }}>
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{s.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleTest} disabled={optimizeSubject.isPending}>
                {optimizeSubject.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Re-analyze
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
