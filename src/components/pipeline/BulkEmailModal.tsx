import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useSendEmail } from '@/hooks/useSendEmail';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, Sparkles, Users, AlertCircle, CheckCircle2, ChevronRight, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { InvestorDeal } from '@/hooks/useInvestorDeals';

interface BulkEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investors: InvestorDeal[];
}

interface RecipientInfo {
  investorId: string;
  name: string;
  email: string | null;
  organization: string | null;
}

type ModalPhase = 'compose' | 'review' | 'done';

export function BulkEmailModal({ open, onOpenChange, investors }: BulkEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [recipients, setRecipients] = useState<RecipientInfo[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Review/send phase
  const [phase, setPhase] = useState<ModalPhase>('compose');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [personalizedSubject, setPersonalizedSubject] = useState('');
  const [personalizedBody, setPersonalizedBody] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const { data: templates } = useEmailTemplates();
  const sendEmail = useSendEmail();

  // Load contact emails for selected investors
  useEffect(() => {
    if (!open || investors.length === 0) return;

    const loadRecipients = async () => {
      setLoadingRecipients(true);
      const contactIds = investors.filter(i => i.contact_id).map(i => i.contact_id!);

      let contactEmails: Record<string, { email: string | null; name: string }> = {};
      if (contactIds.length > 0) {
        const { data } = await supabase
          .from('contacts')
          .select('id, email, name')
          .in('id', contactIds);
        if (data) {
          data.forEach(c => { contactEmails[c.id] = { email: c.email, name: c.name }; });
        }
      }

      const recipientList: RecipientInfo[] = investors.map(inv => {
        const contact = inv.contact_id ? contactEmails[inv.contact_id] : null;
        return {
          investorId: inv.id,
          name: inv.name,
          email: contact?.email || null,
          organization: inv.organization,
        };
      });
      setRecipients(recipientList);
      setLoadingRecipients(false);
    };

    loadRecipients();
  }, [open, investors]);

  useEffect(() => {
    if (open) {
      setSubject('');
      setBody('');
      setSelectedTemplateId('');
      setCustomInstructions('');
      setIsGenerating(false);
      setPhase('compose');
      setCurrentIndex(0);
      setSentCount(0);
      setSkippedCount(0);
      setIsSending(false);
    }
  }, [open]);

  const recipientsWithEmail = recipients.filter(r => r.email);
  const recipientsWithoutEmail = recipients.filter(r => !r.email);

  const stripHtml = (text: string) =>
    text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();

  const personalizeText = (text: string, recipient: RecipientInfo) => {
    const firstName = recipient.name.split(' ')[0] || '';
    return text
      .replace(/\{\{name\}\}/gi, recipient.name)
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{organization\}\}/gi, recipient.organization || '')
      .replace(/\{\{email\}\}/gi, recipient.email || '');
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(stripHtml(template.body));
    }
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-email', {
        body: {
          templateId: selectedTemplateId || undefined,
          customInstructions: `${customInstructions || ''}\n\nIMPORTANT: Use the placeholder {{first_name}} for the recipient's first name in the greeting and body. Do NOT use a generic name. The email will be personalized per recipient.`.trim(),
          bulkContext: true,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSubject(data.subject || subject);
      // Ensure AI output uses {{first_name}} placeholder
      let generatedBody = stripHtml(data.body || body);
      setBody(generatedBody);
      toast.success('Email generated — click "Review & Send" to personalize for each recipient');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate email', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Start review phase — personalize for first recipient
  const startReview = () => {
    if (recipientsWithEmail.length === 0) return;
    setCurrentIndex(0);
    setSentCount(0);
    setSkippedCount(0);
    const r = recipientsWithEmail[0];
    setPersonalizedSubject(personalizeText(subject, r));
    setPersonalizedBody(personalizeText(body, r));
    setPhase('review');
  };

  // Load next recipient's personalized email
  const loadRecipient = (index: number) => {
    if (index >= recipientsWithEmail.length) {
      setPhase('done');
      return;
    }
    setCurrentIndex(index);
    const r = recipientsWithEmail[index];
    setPersonalizedSubject(personalizeText(subject, r));
    setPersonalizedBody(personalizeText(body, r));
  };

  const handleSendCurrent = async () => {
    const r = recipientsWithEmail[currentIndex];
    setIsSending(true);
    try {
      await sendEmail.mutateAsync({
        to: r.email!,
        subject: personalizedSubject,
        body: personalizedBody,
      });
      setSentCount(prev => prev + 1);
      toast.success(`Sent to ${r.name}`);
    } catch {
      toast.error(`Failed to send to ${r.name}`);
    } finally {
      setIsSending(false);
      loadRecipient(currentIndex + 1);
    }
  };

  const handleSkipCurrent = () => {
    setSkippedCount(prev => prev + 1);
    loadRecipient(currentIndex + 1);
  };

  const currentRecipient = recipientsWithEmail[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {phase === 'compose' && 'Bulk Email'}
            {phase === 'review' && `Review & Send (${currentIndex + 1}/${recipientsWithEmail.length})`}
            {phase === 'done' && 'All Done'}
            {phase === 'compose' && (
              <Badge variant="secondary" className="ml-2">
                {recipientsWithEmail.length} recipient{recipientsWithEmail.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* COMPOSE PHASE */}
        {phase === 'compose' && (
          <>
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
              {/* Recipients summary */}
              <div className="rounded-lg border p-3 space-y-2">
                <Label className="text-xs text-muted-foreground">Recipients</Label>
                {loadingRecipients ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading contacts...
                  </div>
                ) : (
                  <>
                    <ScrollArea className="max-h-[120px]">
                      <div className="flex flex-wrap gap-1.5">
                        {recipientsWithEmail.map(r => (
                          <Badge key={r.investorId} variant="secondary" className="text-xs">
                            {r.name} ({r.email})
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                    {recipientsWithoutEmail.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 mt-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {recipientsWithoutEmail.length} skipped (no email):
                        {' '}{recipientsWithoutEmail.map(r => r.name).join(', ')}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Template */}
              {templates && templates.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Use Template (optional)</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* AI Generation */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Email Generation
                </p>
                <div>
                  <Label className="text-xs text-muted-foreground">Custom Instructions (optional)</Label>
                  <Input
                    placeholder="e.g., Focus on our Q4 traction, mention fund size..."
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                  className="w-full"
                  variant="outline"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">{'{{first_name}}'}</code> for personalization. AI will include it automatically.
                </p>
              </div>

              <div>
                <Label htmlFor="bulk-subject">Subject</Label>
                <Input
                  id="bulk-subject"
                  placeholder="Email subject (use {{first_name}} for personalization)"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bulk-body">Message</Label>
                <Textarea
                  id="bulk-body"
                  placeholder="Write your message... Use {{first_name}}, {{name}}, {{organization}} for personalization"
                  className="min-h-[180px]"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Placeholders: <code className="bg-muted px-1 rounded">{'{{first_name}}'}</code> <code className="bg-muted px-1 rounded">{'{{name}}'}</code> <code className="bg-muted px-1 rounded">{'{{organization}}'}</code>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={startReview}
                disabled={!subject || !body || recipientsWithEmail.length === 0 || loadingRecipients}
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Review & Send One by One
              </Button>
            </div>
          </>
        )}

        {/* REVIEW PHASE — one recipient at a time */}
        {phase === 'review' && currentRecipient && (
          <>
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm font-medium">
                  To: <span className="text-primary">{currentRecipient.name}</span>
                  <span className="text-muted-foreground ml-2 font-normal">({currentRecipient.email})</span>
                </p>
                {currentRecipient.organization && (
                  <p className="text-xs text-muted-foreground mt-0.5">{currentRecipient.organization}</p>
                )}
              </div>

              <div>
                <Label htmlFor="review-subject">Subject</Label>
                <Input
                  id="review-subject"
                  value={personalizedSubject}
                  onChange={e => setPersonalizedSubject(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="review-body">Message</Label>
                <Textarea
                  id="review-body"
                  className="min-h-[200px]"
                  value={personalizedBody}
                  onChange={e => setPersonalizedBody(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                {sentCount} sent · {skippedCount} skipped · {recipientsWithEmail.length - currentIndex - 1} remaining
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkipCurrent} disabled={isSending}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </Button>
                <Button onClick={handleSendCurrent} disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* DONE PHASE */}
        {phase === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">All Done</p>
            <p className="text-sm text-muted-foreground">
              {sentCount} sent{skippedCount > 0 ? `, ${skippedCount} skipped` : ''}
            </p>
            <Button className="mt-6" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
