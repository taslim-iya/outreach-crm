import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { InvestorDeal, useDeleteInvestorDeal } from '@/hooks/useInvestorDeals';
import { toast } from 'sonner';

interface DeleteInvestorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: InvestorDeal | null;
}

export function DeleteInvestorDialog({ open, onOpenChange, investor }: DeleteInvestorDialogProps) {
  const deleteInvestor = useDeleteInvestorDeal();

  const handleDelete = async () => {
    if (!investor) return;

    try {
      await deleteInvestor.mutateAsync(investor.id);
      toast.success('Investor deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete investor');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{investor?.name}</strong> from your pipeline? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteInvestor.isPending}
          >
            {deleteInvestor.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
