import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Send, Mail, Calendar, TrendingUp, FileText, Lightbulb, History } from 'lucide-react';

// Keep useful suggestion templates
const suggestions = [
  { icon: Mail, text: 'Draft a follow-up email to interested investors' },
  { icon: Calendar, text: 'Suggest next best meetings to schedule' },
  { icon: TrendingUp, text: 'Analyze my pipeline performance' },
  { icon: FileText, text: 'Summarize recent meeting notes' },
];

export default function Assistant() {
  const [query, setQuery] = useState('');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="AI Assistant"
        description="Your intelligent search fund co-pilot"
      />

      {/* Main Input */}
      <Card className="mb-6 border-primary/20 shadow-glow">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold">How can I help you today?</h3>
              <p className="text-sm text-muted-foreground">Ask me anything about your deals, investors, or outreach</p>
            </div>
          </div>
          
          <div className="relative">
            <Input
              placeholder="Draft an email, analyze a deal, suggest next steps..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-12 h-12 bg-background border-border text-base"
            />
            <Button
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 gradient-gold text-primary-foreground hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - These are useful templates, not dummy data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-glow transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <suggestion.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-foreground">{suggestion.text}</span>
          </button>
        ))}
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              What I Can Do
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email Drafting</p>
                <p className="text-xs text-muted-foreground">Generate personalized outreach based on contact profiles</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Deal Scoring</p>
                <p className="text-xs text-muted-foreground">Score and rank deals based on your preferences</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Follow-up Suggestions</p>
                <p className="text-xs text-muted-foreground">Recommend optimal timing and content for follow-ups</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Meeting Summaries</p>
                <p className="text-xs text-muted-foreground">Auto-generate summaries and action items from notes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Recent AI Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No actions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your AI-assisted actions will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
