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
import { Company, CompanyInsert, useCreateCompany, useUpdateCompany, DealStage } from '@/hooks/useCompanies';
import { useContacts } from '@/hooks/useContacts';
import { toast } from 'sonner';

const companySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(200, 'Name must be less than 200 characters'),
  industry: z.string().trim().max(100).optional(),
  geography: z.string().trim().max(100).optional(),
  website: z.string().trim().url('Invalid URL').optional().or(z.literal('')),
  revenue: z.number().positive().optional().nullable(),
  ebitda: z.number().optional().nullable(),
  estimated_valuation: z.number().positive().optional().nullable(),
  attractiveness_score: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().trim().max(5000).optional(),
});

const stages: { value: DealStage; label: string }[] = [
  { value: 'identified', label: 'Identified' },
  { value: 'researching', label: 'Researching' },
  { value: 'outreach_sent', label: 'Outreach Sent' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'nda_sent', label: 'NDA Sent' },
  { value: 'nda_signed', label: 'NDA Signed' },
  { value: 'in_discussion', label: 'In Discussion' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'loi', label: 'LOI' },
  { value: 'passed', label: 'Passed' },
  { value: 'closed', label: 'Closed' },
];

interface CompanyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
}

export function CompanyFormModal({ open, onOpenChange, company }: CompanyFormModalProps) {
  const isEditing = !!company;
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const { data: contacts } = useContacts();

  // Filter to only owner type contacts
  const ownerContacts = contacts?.filter(c => c.contact_type === 'owner') || [];

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    geography: '',
    website: '',
    revenue: '',
    ebitda: '',
    estimated_valuation: '',
    attractiveness_score: '',
    stage: 'identified' as DealStage,
    contact_id: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        geography: company.geography || '',
        website: company.website || '',
        revenue: company.revenue?.toString() || '',
        ebitda: company.ebitda?.toString() || '',
        estimated_valuation: company.estimated_valuation?.toString() || '',
        attractiveness_score: company.attractiveness_score?.toString() || '',
        stage: company.stage,
        contact_id: company.contact_id || '',
        notes: company.notes || '',
      });
    } else {
      setFormData({
        name: '',
        industry: '',
        geography: '',
        website: '',
        revenue: '',
        ebitda: '',
        estimated_valuation: '',
        attractiveness_score: '',
        stage: 'identified',
        contact_id: '',
        notes: '',
      });
    }
    setErrors({});
  }, [company, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const dataToValidate = {
      name: formData.name,
      industry: formData.industry || undefined,
      geography: formData.geography || undefined,
      website: formData.website || undefined,
      revenue: formData.revenue ? parseFloat(formData.revenue) : null,
      ebitda: formData.ebitda ? parseFloat(formData.ebitda) : null,
      estimated_valuation: formData.estimated_valuation ? parseFloat(formData.estimated_valuation) : null,
      attractiveness_score: formData.attractiveness_score ? parseInt(formData.attractiveness_score) : null,
      notes: formData.notes || undefined,
    };

    const validation = companySchema.safeParse(dataToValidate);
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

    const companyData: Omit<CompanyInsert, 'user_id'> = {
      name: formData.name.trim(),
      industry: formData.industry.trim() || null,
      geography: formData.geography.trim() || null,
      website: formData.website.trim() || null,
      revenue: formData.revenue ? parseFloat(formData.revenue) : null,
      ebitda: formData.ebitda ? parseFloat(formData.ebitda) : null,
      estimated_valuation: formData.estimated_valuation ? parseFloat(formData.estimated_valuation) : null,
      attractiveness_score: formData.attractiveness_score ? parseInt(formData.attractiveness_score) : null,
      stage: formData.stage,
      contact_id: formData.contact_id || null,
      notes: formData.notes.trim() || null,
    };

    try {
      if (isEditing && company) {
        await updateCompany.mutateAsync({ id: company.id, ...companyData });
        toast.success('Company updated successfully');
      } else {
        await createCompany.mutateAsync(companyData);
        toast.success('Company added to deal pipeline');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update company' : 'Failed to create company');
    }
  };

  const isLoading = createCompany.isPending || updateCompany.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the company information below.'
              : 'Fill in the details to add a new company to the deal pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Industry Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Acme Corp"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                placeholder="Technology, Healthcare, etc."
              />
            </div>
          </div>

          {/* Geography & Website Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="geography">Geography</Label>
              <Input
                id="geography"
                value={formData.geography}
                onChange={(e) => setFormData((prev) => ({ ...prev, geography: e.target.value }))}
                placeholder="San Francisco, CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                placeholder="https://example.com"
                className={errors.website ? 'border-destructive' : ''}
              />
              {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
            </div>
          </div>

          {/* Financial Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue ($)</Label>
              <Input
                id="revenue"
                type="number"
                value={formData.revenue}
                onChange={(e) => setFormData((prev) => ({ ...prev, revenue: e.target.value }))}
                placeholder="1000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ebitda">EBITDA ($)</Label>
              <Input
                id="ebitda"
                type="number"
                value={formData.ebitda}
                onChange={(e) => setFormData((prev) => ({ ...prev, ebitda: e.target.value }))}
                placeholder="200000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_valuation">Est. Valuation ($)</Label>
              <Input
                id="estimated_valuation"
                type="number"
                value={formData.estimated_valuation}
                onChange={(e) => setFormData((prev) => ({ ...prev, estimated_valuation: e.target.value }))}
                placeholder="5000000"
              />
            </div>
          </div>

          {/* Stage, Score, Contact Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value: DealStage) =>
                  setFormData((prev) => ({ ...prev, stage: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attractiveness_score">Score (0-100)</Label>
              <Input
                id="attractiveness_score"
                type="number"
                min="0"
                max="100"
                value={formData.attractiveness_score}
                onChange={(e) => setFormData((prev) => ({ ...prev, attractiveness_score: e.target.value }))}
                placeholder="75"
              />
            </div>
            <div className="space-y-2">
              <Label>Linked Contact</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, contact_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {ownerContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this company..."
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
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Update Company'
              ) : (
                'Add Company'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
