import { useState } from 'react';
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
import { InvestorDeal, InvestorStage } from '@/hooks/useInvestorDeals';
import { DollarSign } from 'lucide-react';

interface CommitmentAmountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: InvestorDeal | null;
  targetStage: 'committed' | 'closed';
  onConfirm: (amount: number) => void;
  isLoading?: boolean;
}

export function CommitmentAmountModal({
  open,
  onOpenChange,
  investor,
  targetStage,
  onConfirm,
  isLoading = false,
}: CommitmentAmountModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    setError('');
    onConfirm(numericAmount);
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onOpenChange(false);
  };

  const formatInputValue = (value: string) => {
    // Remove non-numeric characters except decimal
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Handle multiple decimals
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const stageLabel = targetStage === 'committed' ? 'Committed' : 'Closed';

  if (!investor) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Commitment Amount</DialogTitle>
          <DialogDescription>
            Moving <span className="font-medium text-foreground">{investor.name}</span>
            {investor.organization && (
              <span className="text-muted-foreground"> from {investor.organization}</span>
            )}{' '}
            to <span className="font-medium text-foreground">{stageLabel}</span> stage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commitment-amount">Commitment Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="commitment-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(formatInputValue(e.target.value))}
                  className="pl-9"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !amount}>
              {isLoading ? 'Saving...' : `Move to ${stageLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
