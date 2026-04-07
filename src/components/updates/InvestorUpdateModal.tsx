import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGenerateUpdate, useSaveUpdate } from '@/hooks/useInvestorUpdates';
import { useSendEmail } from '@/hooks/useSendEmail';
import { useDocuments } from '@/hooks/useDocuments';
import { useInvestorDeals } from '@/hooks/useInvestorDeals';
import { Loader2, Sparkles, Send, Save, RefreshCw, Paperclip, FileText, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface InvestorUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvestorUpdateModal({ open, onOpenChange }: InvestorUpdateModalProps) {
  const [title, setTitle] = useState('Monthly Account Update');
  const [content, setContent] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [step, setStep] = useState<'generate' | 'edit'>('generate');
  const [isSending, setIsSending] = useState(false);
  const [attachedDocIds, setAttachedDocIds] = useState<string[]>([]);
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUpdate = useGenerateUpdate();
  const saveUpdate = useSaveUpdate();
  const sendEmail = useSendEmail();
  const { data: investors } = useInvestorDeals();
  const { documents, uploadDocument } = useDocuments();

  const committedInvestors = investors?.filter(i => ['committed', 'closed'].includes(i.stage)) || [];

  const handleGenerate = async () => {
    const result = await generateUpdate.mutateAsync(customNotes);
    setContent(result.content);
    setStep('edit');
  };

  const handleRegenerate = async () => {
    const result = await generateUpdate.mutateAsync(customNotes);
    setContent(result.content);
  };

  const handleSaveDraft = () => {
    saveUpdate.mutate({ title, content, status: 'draft' });
  };

  const toggleAttachment = (docId: string) => {
    setAttachedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const attachedDocs = documents.filter((d) => attachedDocIds.includes(d.id));

  const resolveAttachmentDocIds = async () => {
    if (manualFiles.length === 0) return attachedDocIds;

    const uploadedDocs = await Promise.all(
      manualFiles.map((file) =>
        uploadDocument.mutateAsync({
          file,
          documentType: 'other',
        })
      )
    );

    const mergedIds = [...new Set([...attachedDocIds, ...uploadedDocs.map((doc) => doc.id)])];
    setAttachedDocIds(mergedIds);
    setManualFiles([]);

    return mergedIds;
  };

  const handleSendToAll = async () => {
    if (committedInvestors.length === 0) {
      toast.error('No committed investors to send to');
      return;
    }

    setIsSending(true);
    try {
      const attachmentDocIds = await resolveAttachmentDocIds();

      // Send to each committed investor's contact
      let sentCount = 0;
      for (const investor of committedInvestors) {
        // Look up contact email if available
        if (investor.contact_id) {
          const { data: contact } = await (await import('@/integrations/supabase/client')).supabase
            .from('contacts')
            .select('email, name')
            .eq('id', investor.contact_id)
            .maybeSingle();

          if (contact?.email) {
            try {
              await sendEmail.mutateAsync({
                to: contact.email,
                subject: title,
                body: content,
                attachment_doc_ids: attachmentDocIds.length > 0 ? attachmentDocIds : undefined,
              });
              sentCount++;
            } catch {
              console.error(`Failed to send to ${contact.email}`);
            }
          }
        }
      }

      // Save as sent
      saveUpdate.mutate({ title, content, status: 'sent' });
      toast.success(`Update sent to ${sentCount} investor(s)`);
      onOpenChange(false);
      resetState();
    } catch {
      toast.error('Failed to send updates');
    } finally {
      setIsSending(false);
    }
  };

  const resetState = () => {
    setStep('generate');
    setContent('');
    setCustomNotes('');
    setTitle('Monthly Account Update');
    setAttachedDocIds([]);
    setManualFiles([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {step === 'generate' ? 'Generate Account Update' : 'Edit & Send Update'}
          </DialogTitle>
        </DialogHeader>

        {step === 'generate' ? (
          <div className="space-y-4">
            <div>
              <Label>Update Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
                placeholder="Monthly Account Update - February 2026"
              />
            </div>
            <div>
              <Label>Additional Notes (optional)</Label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="mt-1.5"
                rows={4}
                placeholder="Add any specific highlights, milestones, or information you'd like included in the update..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                AI will pull real data from your fundraising metrics and combine with your notes.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Will be sent to:</p>
              <p className="text-muted-foreground">
                {committedInvestors.length > 0
                  ? `${committedInvestors.length} committed investor(s)`
                  : 'No committed investors yet. You can still generate and save as draft.'}
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateUpdate.isPending}
              className="w-full gradient-primary text-primary-foreground"
            >
              {generateUpdate.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Update with AI
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Update Content</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={generateUpdate.isPending}
                >
                  {generateUpdate.isPending ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1.5 min-h-[300px] font-mono text-sm"
                placeholder="Your update content..."
              />
            </div>
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
                  onChange={(e) => {
                    if (e.target.files) {
                      setManualFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                    e.target.value = '';
                  }}
                />
              </div>

              {(attachedDocs.length > 0 || manualFiles.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {attachedDocs.map((doc) => (
                    <Badge key={doc.id} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
                      <FileText className="w-3 h-3" />
                      <span className="max-w-[120px] truncate">{doc.name}</span>
                      <button
                        onClick={() => toggleAttachment(doc.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {manualFiles.map((file, idx) => (
                    <Badge key={`manual-${idx}`} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
                      <Upload className="w-3 h-3" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        onClick={() => setManualFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {documents.length > 0 && (
                <div className="mt-2 max-h-[100px] overflow-y-auto border rounded-md">
                  {documents
                    .filter((d) => !attachedDocIds.includes(d.id))
                    .map((doc) => (
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

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft} disabled={saveUpdate.isPending} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleSendToAll}
                disabled={isSending || committedInvestors.length === 0 || uploadDocument.isPending}
                className="flex-1 gradient-primary text-primary-foreground"
              >
                {isSending || uploadDocument.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send to {committedInvestors.length} Investor(s)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
