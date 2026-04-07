import { useState } from 'react';
import { useAIConfigured, useAISuggestTasks } from '@/hooks/useAI';
import { AIConfigurePrompt } from './AIConfigurePrompt';
import { useContacts } from '@/hooks/useContacts';
import { useTasks, useCreateTask } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SuggestedTask {
  title: string;
  description: string;
  priority: string;
  relatedTo: string;
  dueIn: string;
}

export function AITaskSuggestions() {
  const { isConfigured } = useAIConfigured();
  const suggestTasks = useAISuggestTasks();
  const { data: contacts } = useContacts();
  const { data: tasks } = useTasks();
  const createTask = useCreateTask();
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [createdIndexes, setCreatedIndexes] = useState<Set<number>>(new Set());

  const handleSuggest = async () => {
    const activityData = `
Recent contacts: ${(contacts || []).slice(0, 15).map(c => `${c.name} (type: ${c.contact_type}, warmth: ${c.warmth}, last contacted: ${c.last_contacted || 'never'})`).join('\n')}

Current tasks: ${(tasks || []).slice(0, 10).map(t => `${t.title} (${t.completed ? 'done' : 'pending'}, priority: ${t.priority})`).join('\n')}

Completed tasks: ${(tasks || []).filter(t => t.completed).length}
Pending tasks: ${(tasks || []).filter(t => !t.completed).length}
    `.trim();

    try {
      const result = await suggestTasks.mutateAsync(activityData);
      setSuggestions(result as SuggestedTask[]);
      setCreatedIndexes(new Set());
    } catch {
      // Error handled by hook
    }
  };

  const handleCreateTask = (task: SuggestedTask, index: number) => {
    createTask.mutate({
      title: task.title,
      priority: task.priority as 'high' | 'medium' | 'low',
    }, {
      onSuccess: () => {
        setCreatedIndexes(prev => new Set(prev).add(index));
        toast.success(`Task created: ${task.title}`);
      },
    });
  };

  const priorityColor: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Task Suggestions
          </CardTitle>
          {isConfigured && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleSuggest} disabled={suggestTasks.isPending}>
              {suggestTasks.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
              Suggest Tasks
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isConfigured ? (
          <AIConfigurePrompt compact />
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Click "Suggest Tasks" to get AI-powered task recommendations</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((task, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{task.title}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 ${priorityColor[task.priority] || ''}`}>{task.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.relatedTo && <>Related: {task.relatedTo} &middot; </>}Due: {task.dueIn}
                  </p>
                </div>
                {createdIndexes.has(i) ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => handleCreateTask(task, i)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
