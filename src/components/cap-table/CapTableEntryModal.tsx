import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InvestorDeal, useCreateInvestorDeal, useUpdateInvestorDeal } from '@/hooks/useInvestorDeals';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface CapTableEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: InvestorDeal | null;
}

export function CapTableEntryModal({
  open,
  onOpenChange,
  entry,
}: CapTableEntryModalProps) {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<'committed' | 'closed'>('committed');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createDeal = useCreateInvestorDeal();
  const updateDeal = useUpdateInvestorDeal();
  const isEditing = !!entry;
  const isLoading = createDeal.isPending || updateDeal.isPending;

  useEffect(() => {
    if (entry) {
      setName(entry.name);
      setOrganization(entry.organization || '');
      setAmount(entry.commitment_amount?.toString() || '');
      setStage(entry.stage as 'committed' | 'closed');
      setNotes(entry.notes || '');
    } else {
      resetForm();
    }
  }, [entry, open]);

  const resetForm = () => {
    setName('');
    setOrganization('');
    setAmount('');
    setStage('committed');
    setNotes('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    
    try {
      if (isEditing && entry) {
        await updateDeal.mutateAsync({
          id: entry.id,
          name: name.trim(),
          organization: organization.trim() || null,
          commitment_amount: numericAmount,
          stage,
          notes: notes.trim() || null,
        });
        toast.success('Cap table entry updated');
      } else {
        await createDeal.mutateAsync({
          name: name.trim(),
          organization: organization.trim() || null,
          commitment_amount: numericAmount,
          stage,
          notes: notes.trim() || null,
        });
        toast.success('Cap table entry added');
      }
      handleClose();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update entry' : 'Failed to add entry');
    }
  };

  const formatInputValue = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Cap Table Entry' : 'Add Cap Table Entry'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the investor commitment details.'
              : 'Add a new investor directly to your cap table.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entry-name">Investor Name *</Label>
              <Input
                id="entry-name"
                type="text"
                placeholder="Enter investor name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-org">Organization</Label>
              <Input
                id="entry-org"
                type="text"
                placeholder="Enter organization (optional)"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-amount">Commitment Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="entry-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(formatInputValue(e.target.value))}
                  className="pl-9"
                />
              </div>
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-stage">Stage</Label>
              <Select value={stage} onValueChange={(val) => setStage(val as 'committed' | 'closed')}>
                <SelectTrigger id="entry-stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="committed">Committed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-notes">Notes</Label>
              <Textarea
                id="entry-notes"
                placeholder="Add notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
