import { useState, useEffect, useRef } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useSendEmail } from '@/hooks/useSendEmail';
import { useDocuments } from '@/hooks/useDocuments';
import { supabase } from '@/integrations/supabase/client';
import {
  Send, Loader2, Sparkles, Users, AlertCircle, CheckCircle2,
  ChevronRight, SkipForward, Paperclip, X, FileText, Upload,
  Clock, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { InvestorDeal, useUpdateInvestorStage } from '@/hooks/useInvestorDeals';

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

  // Attachments
  const [attachedDocIds, setAttachedDocIds] = useState<string[]>([]);
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scheduling
  const [scheduledTime, setScheduledTime] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // Review/send phase
  const [phase, setPhase] = useState<ModalPhase>('compose');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [personalizedSubject, setPersonalizedSubject] = useState('');
  const [personalizedBody, setPersonalizedBody] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);

  const { data: templates } = useEmailTemplates();
  const sendEmail = useSendEmail();
  const { documents } = useDocuments();
  const updateStage = useUpdateInvestorStage();

  // Load contact emails for selected investors — only during compose phase
  useEffect(() => {
    if (!open || investors.length === 0 || phase !== 'compose') return;

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
          name: contact?.name?.trim() || inv.name,
          email: contact?.email || null,
          organization: inv.organization,
        };
      });
      setRecipients(recipientList);
      setLoadingRecipients(false);
    };

    loadRecipients();
  }, [open, investors, phase]);

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
      setAttachedDocIds([]);
      setManualFiles([]);
      setScheduledTime('');
      setShowSchedulePicker(false);
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

  const toggleAttachment = (docId: string) => {
    setAttachedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const attachedDocs = documents.filter(d => attachedDocIds.includes(d.id));

  // Start review phase
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
      if (scheduledTime) {
        toast.info(`Scheduled for ${format(new Date(scheduledTime), 'MMM d, yyyy h:mm a')}`);
      }
      await sendEmail.mutateAsync({
        to: r.email!,
        subject: personalizedSubject,
        body: personalizedBody,
        attachment_doc_ids: attachedDocIds.length > 0 ? attachedDocIds : undefined,
      });
      setSentCount(prev => prev + 1);
      toast.success(`Sent to ${r.name}`);

      // Auto-advance investor stage based on current stage
      const investor = investors.find(i => i.id === r.investorId);
      if (investor) {
        const stageAdvancement: Record<string, string> = {
          not_contacted: 'outreach_sent',
          outreach_sent: 'follow_up',
        };
        const nextStage = stageAdvancement[investor.stage];
        if (nextStage) {
          try {
            await updateStage.mutateAsync({ id: investor.id, stage: nextStage as any });
          } catch {
            // silently fail stage update
          }
        }
      }
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

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1 h-7 text-xs"
                  >
                    <Upload className="w-3 h-3" />
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => {
                      if (e.target.files) {
                        setManualFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>

                {(attachedDocs.length > 0 || manualFiles.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {attachedDocs.map(doc => (
                      <Badge key={doc.id} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
                        <FileText className="w-3 h-3" />
                        <span className="max-w-[120px] truncate">{doc.name}</span>
                        <button onClick={() => toggleAttachment(doc.id)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {manualFiles.map((file, idx) => (
                      <Badge key={`manual-${idx}`} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
                        <Upload className="w-3 h-3" />
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <button onClick={() => setManualFiles(prev => prev.filter((_, i) => i !== idx))} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {documents.length > 0 && (
                  <div className="mt-2 max-h-[100px] overflow-y-auto border rounded-md">
                    {documents
                      .filter(d => !attachedDocIds.includes(d.id))
                      .map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => toggleAttachment(doc.id)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/50 flex items-center gap-2 border-b last:border-b-0"
                        >
                          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{doc.name}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                            {doc.document_type}
                          </Badge>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Schedule picker */}
              {showSchedulePicker && (
                <div className="rounded-lg border p-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Schedule send time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                  {scheduledTime && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(scheduledTime), 'MMM d, yyyy h:mm a')}
                      </Badge>
                      <button onClick={() => { setScheduledTime(''); setShowSchedulePicker(false); }} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSchedulePicker(prev => !prev)}
                className="gap-1 text-xs text-muted-foreground"
              >
                <Clock className="w-3 h-3" />
                {scheduledTime ? 'Scheduled' : 'Schedule'}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button
                  onClick={startReview}
                  disabled={!subject || !body || recipientsWithEmail.length === 0 || loadingRecipients}
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Review & Send One by One
                </Button>
              </div>
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

              {/* Show attached docs in review */}
              {attachedDocs.length > 0 && (
                <div>
                  <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Paperclip className="w-3 h-3" />
                    Attachments ({attachedDocs.length})
                  </Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {attachedDocs.map(doc => (
                      <Badge key={doc.id} variant="secondary" className="flex items-center gap-1 text-xs">
                        <FileText className="w-3 h-3" />
                        <span className="max-w-[120px] truncate">{doc.name}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
            <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
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
