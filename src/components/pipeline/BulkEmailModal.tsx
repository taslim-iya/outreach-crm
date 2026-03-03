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
import { Send, Loader2, Sparkles, Users, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
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

type SendStatus = 'idle' | 'sending' | 'done';

export function BulkEmailModal({ open, onOpenChange, investors }: BulkEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [recipients, setRecipients] = useState<RecipientInfo[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

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
      setSendStatus('idle');
      setProgress(0);
      setSentCount(0);
      setFailedCount(0);
    }
  }, [open]);

  const recipientsWithEmail = recipients.filter(r => r.email);
  const recipientsWithoutEmail = recipients.filter(r => !r.email);

  const stripHtml = (text: string) =>
    text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(stripHtml(template.body));
    }
  };

  const personalizeText = (text: string, recipient: RecipientInfo) => {
    const firstName = recipient.name.split(' ')[0] || '';
    return text
      .replace(/\{\{name\}\}/gi, recipient.name)
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{organization\}\}/gi, recipient.organization || '')
      .replace(/\{\{email\}\}/gi, recipient.email || '');
  };

  const handleSendAll = async () => {
    if (!subject || !body || recipientsWithEmail.length === 0) return;

    setSendStatus('sending');
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipientsWithEmail.length; i++) {
      const r = recipientsWithEmail[i];
      try {
        await sendEmail.mutateAsync({
          to: r.email!,
          subject: personalizeText(subject, r),
          body: personalizeText(body, r),
        });
        sent++;
      } catch {
        failed++;
      }
      setSentCount(sent);
      setFailedCount(failed);
      setProgress(Math.round(((i + 1) / recipientsWithEmail.length) * 100));
    }

    setSendStatus('done');
    if (sent > 0) {
      toast.success(`Sent ${sent} email${sent > 1 ? 's' : ''} successfully`);
    }
    if (failed > 0) {
      toast.error(`Failed to send ${failed} email${failed > 1 ? 's' : ''}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Bulk Email
            <Badge variant="secondary" className="ml-2">
              {recipientsWithEmail.length} recipient{recipientsWithEmail.length !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {sendStatus === 'idle' && (
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
                      {recipientsWithoutEmail.length} investor{recipientsWithoutEmail.length > 1 ? 's' : ''} skipped (no email):
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

            <div>
              <Label htmlFor="bulk-subject">Subject</Label>
              <Input
                id="bulk-subject"
                placeholder="Email subject (use {{name}}, {{first_name}} for personalization)"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="bulk-body">Message</Label>
              <Textarea
                id="bulk-body"
                placeholder="Write your message... Use {{name}}, {{first_name}}, {{organization}} for personalization"
                className="min-h-[180px]"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Placeholders: <code className="bg-muted px-1 rounded">{'{{name}}'}</code> <code className="bg-muted px-1 rounded">{'{{first_name}}'}</code> <code className="bg-muted px-1 rounded">{'{{organization}}'}</code>
            </p>
          </div>
        )}

        {sendStatus === 'sending' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-base font-medium text-foreground mb-3">Sending emails...</p>
            <div className="w-64">
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {sentCount + failedCount} / {recipientsWithEmail.length}
            </p>
          </div>
        )}

        {sendStatus === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-12 h-12 text-success mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">Emails Sent</p>
            <p className="text-sm text-muted-foreground">
              {sentCount} sent successfully{failedCount > 0 ? `, ${failedCount} failed` : ''}
            </p>
            <Button className="mt-6" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        )}

        {sendStatus === 'idle' && (
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={handleSendAll}
              disabled={!subject || !body || recipientsWithEmail.length === 0 || loadingRecipients}
            >
              <Send className="w-4 h-4 mr-2" />
              Send to {recipientsWithEmail.length} Investor{recipientsWithEmail.length !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}