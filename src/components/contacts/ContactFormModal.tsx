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
import { Loader2, X } from 'lucide-react';
import { Contact, ContactInsert, useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type ContactType = Database['public']['Enums']['contact_type'];
type WarmthLevel = Database['public']['Enums']['warmth_level'];
type InfluenceLevel = Database['public']['Enums']['influence_level'];
type LikelihoodLevel = Database['public']['Enums']['likelihood_level'];

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional(),
  organization: z.string().trim().max(200).optional(),
  role: z.string().trim().max(100).optional(),
  geography: z.string().trim().max(100).optional(),
  source: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
});

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
}

export function ContactFormModal({ open, onOpenChange, contact }: ContactFormModalProps) {
  const isEditing = !!contact;
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    contact_type: 'investor' as ContactType,
    geography: '',
    source: '',
    notes: '',
    warmth: 'cold' as WarmthLevel,
    influence: 'medium' as InfluenceLevel,
    likelihood: 'medium' as LikelihoodLevel,
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        organization: contact.organization || '',
        role: contact.role || '',
        contact_type: contact.contact_type,
        geography: contact.geography || '',
        source: contact.source || '',
        notes: contact.notes || '',
        warmth: contact.warmth || 'cold',
        influence: contact.influence || 'medium',
        likelihood: contact.likelihood || 'medium',
        tags: contact.tags || [],
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        organization: '',
        role: '',
        contact_type: 'investor',
        geography: '',
        source: '',
        notes: '',
        warmth: 'cold',
        influence: 'medium',
        likelihood: 'medium',
        tags: [],
      });
    }
    setErrors({});
    setTagInput('');
  }, [contact, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = contactSchema.safeParse(formData);
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

    const contactData: Omit<ContactInsert, 'user_id'> = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      organization: formData.organization.trim() || null,
      role: formData.role.trim() || null,
      contact_type: formData.contact_type,
      geography: formData.geography.trim() || null,
      source: formData.source.trim() || null,
      notes: formData.notes.trim() || null,
      warmth: formData.warmth,
      influence: formData.influence,
      likelihood: formData.likelihood,
      tags: formData.tags.length > 0 ? formData.tags : null,
    };

    try {
      if (isEditing && contact) {
        await updateContact.mutateAsync({ id: contact.id, ...contactData });
        toast.success('Contact updated successfully');
      } else {
        await createContact.mutateAsync(contactData);
        toast.success('Contact created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update contact' : 'Failed to create contact');
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const isLoading = createContact.isPending || updateContact.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the contact information below.'
              : 'Fill in the details to add a new contact.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Email Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="John Smith"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </div>

          {/* Phone & Organization Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData((prev) => ({ ...prev, organization: e.target.value }))}
                placeholder="Acme Ventures"
              />
            </div>
          </div>

          {/* Role & Contact Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Managing Partner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_type">Contact Type</Label>
              <Select
                value={formData.contact_type}
                onValueChange={(value: ContactType) =>
                  setFormData((prev) => ({ ...prev, contact_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="owner">Company Owner</SelectItem>
                  <SelectItem value="intermediary">Intermediary</SelectItem>
                  <SelectItem value="advisor">Advisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Geography & Source Row */}
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
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
                placeholder="LinkedIn, Referral, etc."
              />
            </div>
          </div>

          {/* Warmth, Influence, Likelihood Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Warmth</Label>
              <Select
                value={formData.warmth}
                onValueChange={(value: WarmthLevel) =>
                  setFormData((prev) => ({ ...prev, warmth: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Influence</Label>
              <Select
                value={formData.influence}
                onValueChange={(value: InfluenceLevel) =>
                  setFormData((prev) => ({ ...prev, influence: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Likelihood</Label>
              <Select
                value={formData.likelihood}
                onValueChange={(value: LikelihoodLevel) =>
                  setFormData((prev) => ({ ...prev, likelihood: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this contact..."
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
                'Update Contact'
              ) : (
                'Create Contact'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
