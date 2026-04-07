import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Settings } from 'lucide-react';

export function AIConfigurePrompt({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        onClick={() => navigate('/settings')}
        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
      >
        <Sparkles className="h-3 w-3" /> Configure AI
      </button>
    );
  }

  return (
    <div className="border border-dashed rounded-lg p-4 text-center">
      <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm font-medium mb-1">AI Features Available</p>
      <p className="text-xs text-muted-foreground mb-3">Add your Anthropic API key to unlock AI-powered features</p>
      <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
        <Settings className="h-4 w-4 mr-1" /> Configure AI
      </Button>
    </div>
  );
}
