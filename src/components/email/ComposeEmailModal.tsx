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
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useSendEmail } from '@/hooks/useSendEmail';
import { useDocuments } from '@/hooks/useDocuments';
import {
  Send, Loader2, Paperclip, X, FileText, Upload, Clock, ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ComposeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  defaultSubject?: string;
}

export function ComposeEmailModal({
  open,
  onOpenChange,
  defaultTo = '',
  defaultSubject = '',
}: ComposeEmailModalProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState('');
  const [attachedDocIds, setAttachedDocIds] = useState<string[]>([]);
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates } = useEmailTemplates();
  const sendEmail = useSendEmail();
  const { documents } = useDocuments();

  useEffect(() => {
    if (open) {
      setTo(defaultTo);
      setSubject(defaultSubject);
      setBody('');
      setAttachedDocIds([]);
      setManualFiles([]);
      setScheduledTime('');
      setShowSchedulePicker(false);
    }
  }, [open, defaultTo, defaultSubject]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const toggleAttachment = (docId: string) => {
    setAttachedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const attachedDocs = documents.filter(d => attachedDocIds.includes(d.id));

  const handleSend = async () => {
    if (!to || !subject || !body) return;

    if (scheduledTime) {
      toast.info('Email scheduled', {
        description: `Will be sent at ${format(new Date(scheduledTime), 'MMM d, yyyy h:mm a')}`,
      });
    }

    await sendEmail.mutateAsync({
      to,
      subject,
      body,
      attachment_doc_ids: attachedDocIds.length > 0 ? attachedDocIds : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 pt-2 pb-2">
          {templates && templates.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Use Template</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message..."
              className="min-h-[200px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

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

        {/* Actions */}
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex items-center">
              <Button
                onClick={handleSend}
                disabled={!to || !subject || !body || sendEmail.isPending}
                className="rounded-r-none"
              >
                {sendEmail.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : scheduledTime ? (
                  <Clock className="w-4 h-4 mr-1" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                {scheduledTime ? 'Schedule' : 'Send'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="rounded-l-none border-l border-primary-foreground/20 px-2"
                    disabled={!to || !subject || !body || sendEmail.isPending}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => { setScheduledTime(''); setShowSchedulePicker(false); }}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Now
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSchedulePicker(true)}>
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule Send
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
