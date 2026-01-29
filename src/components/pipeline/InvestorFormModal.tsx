import { useState, useEffect } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  InvestorDeal,
  InvestorDealInsert,
  InvestorStage,
  useCreateInvestorDeal,
  useUpdateInvestorDeal,
} from '@/hooks/useInvestorDeals';
import { useContacts, Contact } from '@/hooks/useContacts';
import { toast } from 'sonner';

const investorSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  organization: z.string().trim().max(200).optional(),
  commitment_amount: z.number().min(0).optional().nullable(),
});

interface InvestorFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor?: InvestorDeal | null;
  defaultStage?: InvestorStage;
}

const stageLabels: Record<InvestorStage, string> = {
  not_contacted: 'Not Contacted',
  outreach_sent: 'Outreach Sent',
  follow_up: 'Follow-up',
  meeting_scheduled: 'Meeting Scheduled',
  interested: 'Interested',
  passed: 'Passed',
  committed: 'Committed',
  closed: 'Closed',
};

export function InvestorFormModal({ open, onOpenChange, investor, defaultStage = 'not_contacted' }: InvestorFormModalProps) {
  const isEditing = !!investor;
  const createInvestor = useCreateInvestorDeal();
  const updateInvestor = useUpdateInvestorDeal();
  const { data: contacts = [] } = useContacts();

  // Filter to only investor contacts
  const investorContacts = contacts.filter((c) => c.contact_type === 'investor');

  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    stage: defaultStage as InvestorStage,
    commitment_amount: '',
    notes: '',
    contact_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (investor) {
      setFormData({
        name: investor.name || '',
        organization: investor.organization || '',
        stage: investor.stage,
        commitment_amount: investor.commitment_amount?.toString() || '',
        notes: investor.notes || '',
        contact_id: investor.contact_id || '',
      });
    } else {
      setFormData({
        name: '',
        organization: '',
        stage: defaultStage,
        commitment_amount: '',
        notes: '',
        contact_id: '',
      });
    }
    setErrors({});
  }, [investor, open, defaultStage]);

  const handleContactChange = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setFormData((prev) => ({
        ...prev,
        contact_id: contactId,
        name: contact.name,
        organization: contact.organization || '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, contact_id: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const commitmentAmount = formData.commitment_amount ? parseFloat(formData.commitment_amount) : null;

    const validation = investorSchema.safeParse({
      name: formData.name,
      organization: formData.organization,
      commitment_amount: commitmentAmount,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const investorData: Omit<InvestorDealInsert, 'user_id'> = {
      name: formData.name.trim(),
      organization: formData.organization.trim() || null,
      stage: formData.stage,
      commitment_amount: commitmentAmount,
      notes: formData.notes.trim() || null,
      contact_id: formData.contact_id || null,
    };

    try {
      if (isEditing && investor) {
        await updateInvestor.mutateAsync({ id: investor.id, ...investorData });
        toast.success('Investor updated successfully');
      } else {
        await createInvestor.mutateAsync(investorData);
        toast.success('Investor added successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update investor' : 'Failed to add investor');
    }
  };

  const isLoading = createInvestor.isPending || updateInvestor.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Investor' : 'Add New Investor'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the investor information below.'
              : 'Add a new investor to your pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link to Contact */}
          {investorContacts.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Contact (Optional)</Label>
              <Select
                value={formData.contact_id}
                onValueChange={handleContactChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact to link..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {investorContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.organization ? `- ${contact.organization}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Investor name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              value={formData.organization}
              onChange={(e) => setFormData((prev) => ({ ...prev, organization: e.target.value }))}
              placeholder="Venture fund, family office, etc."
            />
          </div>

          {/* Stage */}
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select
              value={formData.stage}
              onValueChange={(value: InvestorStage) =>
                setFormData((prev) => ({ ...prev, stage: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stageLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commitment Amount */}
          <div className="space-y-2">
            <Label htmlFor="commitment_amount">Commitment Amount ($)</Label>
            <Input
              id="commitment_amount"
              type="number"
              min="0"
              step="1000"
              value={formData.commitment_amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, commitment_amount: e.target.value }))}
              placeholder="0"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any notes about this investor..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : isEditing ? (
                'Update Investor'
              ) : (
                'Add Investor'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
