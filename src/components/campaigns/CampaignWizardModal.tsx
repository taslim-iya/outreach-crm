import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Users,
  Calendar,
  CheckCircle2,
  Settings,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { useCreateCampaign, useAddCampaignRecipients, useCreateCampaignStep } from '@/hooks/useCampaigns';
import { useContacts, Contact } from '@/hooks/useContacts';
import { toast } from 'sonner';

interface CampaignWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i < 12 ? 'AM' : 'PM'}`,
}));

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const PERSONALIZATION_TAGS = [
  { tag: '{{firstName}}', label: 'First Name' },
  { tag: '{{lastName}}', label: 'Last Name' },
  { tag: '{{company}}', label: 'Company' },
  { tag: '{{title}}', label: 'Title' },
];

const STEP_LABELS = ['Setup', 'Compose', 'Recipients', 'Schedule', 'Review'];
const STEP_ICONS = [Settings, Mail, Users, Calendar, CheckCircle2];

export function CampaignWizardModal({ open, onOpenChange }: CampaignWizardModalProps) {
  const [step, setStep] = useState(0);

  // Step 1: Setup
  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');

  // Step 2: Compose
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [showVariantB, setShowVariantB] = useState(false);
  const [subjectB, setSubjectB] = useState('');
  const [bodyHtmlB, setBodyHtmlB] = useState('');

  // Step 3: Recipients
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [pasteEmails, setPasteEmails] = useState('');

  // Step 4: Schedule
  const [sendDays, setSendDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [sendStartHour, setSendStartHour] = useState(9);
  const [sendEndHour, setSendEndHour] = useState(17);
  const [timezone, setTimezone] = useState('America/New_York');
  const [dailyLimit, setDailyLimit] = useState(50);

  const { data: contacts = [] } = useContacts({ search: contactSearch });
  const createCampaign = useCreateCampaign();
  const addRecipients = useAddCampaignRecipients();
  const createStep = useCreateCampaignStep();

  useEffect(() => {
    if (!open) {
      setStep(0);
      setName('');
      setFromName('');
      setFromEmail('');
      setSubject('');
      setBodyHtml('');
      setShowVariantB(false);
      setSubjectB('');
      setBodyHtmlB('');
      setContactSearch('');
      setSelectedContacts([]);
      setPasteEmails('');
      setSendDays(['mon', 'tue', 'wed', 'thu', 'fri']);
      setSendStartHour(9);
      setSendEndHour(17);
      setTimezone('America/New_York');
      setDailyLimit(50);
    }
  }, [open]);

  const toggleDay = (day: string) => {
    setSendDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleContact = (contact: Contact) => {
    setSelectedContacts((prev) => {
      const exists = prev.find((c) => c.id === contact.id);
      if (exists) return prev.filter((c) => c.id !== contact.id);
      return [...prev, contact];
    });
  };

  const insertTag = (tag: string, target: 'subject' | 'body' | 'subjectB' | 'bodyB') => {
    if (target === 'subject') setSubject((prev) => prev + tag);
    else if (target === 'body') setBodyHtml((prev) => prev + tag);
    else if (target === 'subjectB') setSubjectB((prev) => prev + tag);
    else if (target === 'bodyB') setBodyHtmlB((prev) => prev + tag);
  };

  const parsePastedEmails = (): Array<{ email: string; name?: string }> => {
    if (!pasteEmails.trim()) return [];
    return pasteEmails
      .split(/[\n,;]+/)
      .map((line) => line.trim())
      .filter((line) => line.includes('@'))
      .map((line) => {
        const match = line.match(/^(.+?)\s*<(.+?)>$/);
        if (match) return { name: match[1].trim(), email: match[2].trim() };
        return { email: line.trim() };
      });
  };

  const allRecipients = [
    ...selectedContacts.map((c) => ({
      email: c.email || '',
      name: c.name || undefined,
      contact_id: c.id,
    })),
    ...parsePastedEmails(),
  ].filter((r) => r.email);

  const canProceed = () => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return subject.trim().length > 0 && bodyHtml.trim().length > 0;
      case 2:
        return allRecipients.length > 0;
      case 3:
        return sendDays.length > 0 && sendStartHour < sendEndHour;
      default:
        return true;
    }
  };

  const handleSave = async (launch: boolean) => {
    try {
      const campaign = await createCampaign.mutateAsync({
        name,
        from_name: fromName || undefined,
        from_email: fromEmail || undefined,
        subject,
        body_html: bodyHtml,
        body_text: bodyHtml.replace(/<[^>]*>/g, ''),
        send_days: sendDays,
        send_start_hour: sendStartHour,
        send_end_hour: sendEndHour,
        timezone,
        daily_limit: dailyLimit,
      });

      // Create variant A step
      await createStep.mutateAsync({
        campaign_id: campaign.id,
        step_number: 1,
        step_type: 'email',
        subject,
        body_html: bodyHtml,
        body_text: bodyHtml.replace(/<[^>]*>/g, ''),
        variant_key: 'A',
      });

      // Create variant B step if enabled
      if (showVariantB && subjectB.trim() && bodyHtmlB.trim()) {
        await createStep.mutateAsync({
          campaign_id: campaign.id,
          step_number: 1,
          step_type: 'email',
          subject: subjectB,
          body_html: bodyHtmlB,
          body_text: bodyHtmlB.replace(/<[^>]*>/g, ''),
          variant_key: 'B',
        });
      }

      // Add recipients
      if (allRecipients.length > 0) {
        const half = Math.ceil(allRecipients.length / 2);
        const recipientsWithVariant = allRecipients.map((r, i) => ({
          ...r,
          variant_key: showVariantB && i >= half ? 'B' : 'A',
        }));
        await addRecipients.mutateAsync({
          campaign_id: campaign.id,
          recipients: recipientsWithVariant,
        });
      }

      if (launch) {
        // Activate is handled separately; for now just create as draft
        toast.success('Campaign created and ready to launch!');
      } else {
        toast.success('Campaign saved as draft');
      }

      onOpenChange(false);
    } catch {
      // Errors are handled by the mutation hooks
    }
  };

  const isSubmitting = createCampaign.isPending || addRecipients.isPending || createStep.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between px-2 py-3 border-b">
          {STEP_LABELS.map((label, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <button
                key={label}
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  i === step
                    ? 'text-primary'
                    : i < step
                    ? 'text-muted-foreground cursor-pointer hover:text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === step
                      ? 'bg-primary text-primary-foreground'
                      : i < step
                      ? 'bg-muted text-foreground'
                      : 'bg-muted/50 text-muted-foreground/50'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[55vh] pr-2">
          <div className="py-4 space-y-4">
            {/* Step 0: Setup */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name *</Label>
                  <Input
                    id="campaign-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Q2 Investor Outreach"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="e.g., john@company.com"
                  />
                </div>
              </>
            )}

            {/* Step 1: Compose */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Personalization Tags</Label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PERSONALIZATION_TAGS.map(({ tag, label }) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => insertTag(tag, 'body')}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject-a">Subject Line (Variant A) *</Label>
                  <Input
                    id="subject-a"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Quick question about {{company}}"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body-a">Email Body (Variant A) *</Label>
                  <Textarea
                    id="body-a"
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder="Write your email content here... Use {{firstName}} etc. for personalization."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVariantB(!showVariantB)}
                  >
                    {showVariantB ? (
                      <>
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        Remove Variant B
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add A/B Test Variant
                      </>
                    )}
                  </Button>
                </div>

                {showVariantB && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="subject-b">Subject Line (Variant B)</Label>
                      <Input
                        id="subject-b"
                        value={subjectB}
                        onChange={(e) => setSubjectB(e.target.value)}
                        placeholder="Alternative subject line..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body-b">Email Body (Variant B)</Label>
                      <Textarea
                        id="body-b"
                        value={bodyHtmlB}
                        onChange={(e) => setBodyHtmlB(e.target.value)}
                        placeholder="Alternative email body..."
                        className="min-h-[120px]"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 2: Recipients */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Add from Contacts</Label>
                  <Input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search contacts by name..."
                  />
                </div>

                {selectedContacts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedContacts.map((c) => (
                      <Badge key={c.id} variant="secondary" className="gap-1">
                        {c.name || c.email}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => toggleContact(c)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="border rounded-lg max-h-[180px] overflow-y-auto">
                  {contacts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No contacts found
                    </div>
                  ) : (
                    contacts.slice(0, 50).map((contact) => {
                      const selected = selectedContacts.some((c) => c.id === contact.id);
                      return (
                        <button
                          key={contact.id}
                          onClick={() => toggleContact(contact)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors border-b last:border-b-0 ${
                            selected ? 'bg-accent/50' : ''
                          }`}
                        >
                          <Checkbox checked={selected} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contact.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.email}
                              {contact.organization ? ` - ${contact.organization}` : ''}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label>Or paste emails (one per line, or comma-separated)</Label>
                  <Textarea
                    value={pasteEmails}
                    onChange={(e) => setPasteEmails(e.target.value)}
                    placeholder={"john@example.com\nJane Doe <jane@example.com>\nmark@company.com"}
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  Total recipients: <span className="font-semibold text-foreground">{allRecipients.length}</span>
                </div>
              </>
            )}

            {/* Step 3: Schedule */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Send Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => toggleDay(key)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                          sendDays.includes(key)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:bg-accent'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Hour</Label>
                    <Select
                      value={sendStartHour.toString()}
                      onValueChange={(v) => setSendStartHour(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h.value} value={h.value}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Hour</Label>
                    <Select
                      value={sendEndHour.toString()}
                      onValueChange={(v) => setSendEndHour(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h.value} value={h.value}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily-limit">Daily Send Limit</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    min={1}
                    max={500}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(parseInt(e.target.value) || 50)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of emails sent per day
                  </p>
                </div>
              </>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Campaign Name</p>
                    <p className="font-medium">{name}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">From</p>
                    <p className="font-medium">
                      {fromName ? `${fromName} <${fromEmail}>` : fromEmail || 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Subject Line</p>
                  <p className="font-medium">{subject}</p>
                  {showVariantB && subjectB && (
                    <p className="text-sm mt-1">
                      <Badge variant="outline" className="mr-1.5">B</Badge>
                      {subjectB}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Email Preview</p>
                  <p className="text-sm whitespace-pre-wrap line-clamp-4">{bodyHtml}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg border text-center">
                    <p className="text-2xl font-bold">{allRecipients.length}</p>
                    <p className="text-xs text-muted-foreground">Recipients</p>
                  </div>
                  <div className="p-3 rounded-lg border text-center">
                    <p className="text-2xl font-bold">{sendDays.length}</p>
                    <p className="text-xs text-muted-foreground">Send Days / Week</p>
                  </div>
                  <div className="p-3 rounded-lg border text-center">
                    <p className="text-2xl font-bold">{dailyLimit}</p>
                    <p className="text-xs text-muted-foreground">Daily Limit</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Schedule</p>
                  <p className="text-sm">
                    {sendDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')} |{' '}
                    {HOURS.find((h) => h.value === sendStartHour.toString())?.label} -{' '}
                    {HOURS.find((h) => h.value === sendEndHour.toString())?.label} |{' '}
                    {timezone.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row justify-between sm:justify-between border-t pt-4">
          <div>
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={isSubmitting}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isSubmitting}
                  className="gradient-gold text-primary-foreground hover:opacity-90"
                >
                  Launch Campaign
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
