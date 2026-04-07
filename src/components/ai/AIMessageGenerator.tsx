import { useState } from 'react';
import { useAIConfigured, useAIGenerateEmail } from '@/hooks/useAI';
import { AIConfigurePrompt } from './AIConfigurePrompt';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AIMessageGeneratorProps {
  onInsert: (text: string) => void;
  contactName?: string;
  contactCompany?: string;
  contactTitle?: string;
  contactStage?: string;
  additionalContext?: string;
}

export function AIMessageGenerator({ onInsert, contactName, contactCompany, contactTitle, contactStage, additionalContext }: AIMessageGeneratorProps) {
  const { isConfigured } = useAIConfigured();
  const generateEmail = useAIGenerateEmail();
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [tone, setTone] = useState('professional');
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  const contextParts: string[] = [];
  if (contactName) contextParts.push(`Name: ${contactName}`);
  if (contactCompany) contextParts.push(`Company: ${contactCompany}`);
  if (contactTitle) contextParts.push(`Title: ${contactTitle}`);
  if (contactStage) contextParts.push(`Stage: ${contactStage}`);
  if (additionalContext) contextParts.push(additionalContext);
  const context = contextParts.join('\n') || 'No specific contact context available';

  const quickPrompts = [
    'Write an initial cold outreach email',
    'Write a follow-up email after no reply',
    'Write a meeting request email',
    'Write a thank you after meeting',
    'Write a check-in email',
    'Write a break-up / last attempt email',
  ];

  const handleGenerate = async (prompt?: string) => {
    const finalInstruction = prompt || instruction;
    if (!finalInstruction.trim()) { toast.error('Enter an instruction or pick a quick prompt'); return; }

    try {
      const result = await generateEmail.mutateAsync({
        context,
        instruction: `${finalInstruction}. Tone: ${tone}.`,
      });
      setGeneratedText(result);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleInsert = () => {
    onInsert(generatedText);
    setOpen(false);
    setGeneratedText('');
    setInstruction('');
    toast.success('AI text inserted');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI Write</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {!isConfigured ? (
          <div className="p-4"><AIConfigurePrompt /></div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">AI Message Generator</span>
            </div>

            {contactName && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                Writing for: <span className="font-medium text-foreground">{contactName}</span>
                {contactCompany && <span> at {contactCompany}</span>}
                {contactStage && <span> ({contactStage})</span>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Quick prompts</Label>
              <div className="flex flex-wrap gap-1">
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    className="text-xs px-2 py-1 rounded-full border hover:bg-muted transition-colors"
                    onClick={() => handleGenerate(prompt)}
                    disabled={generateEmail.isPending}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Or describe what you want</Label>
              <Textarea
                placeholder="E.g., Write a personalized email asking about their expansion plans..."
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                className="text-sm h-16 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8" onClick={() => handleGenerate()} disabled={generateEmail.isPending || !instruction.trim()}>
                {generateEmail.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Generate
              </Button>
            </div>

            {generatedText && (
              <div className="space-y-2 border-t pt-3">
                <div className="bg-muted/50 rounded-lg p-3 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {generatedText}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleGenerate(instruction || 'Rewrite this differently')}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleCopy}>
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size="sm" className="h-7 text-xs ml-auto" onClick={handleInsert}>
                    Insert into email
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
