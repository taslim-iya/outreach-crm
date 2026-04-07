import { Button } from '@/components/ui/button';
import { Trash2, Download, Tag, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onTag?: () => void;
  children?: React.ReactNode;
}

export function BulkActionBar({ selectedCount, onClearSelection, onDelete, onExport, onTag, children }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground rounded-lg shadow-lg px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="h-4 w-px bg-primary-foreground/30" />
      {onExport && (
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10" onClick={onExport}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      )}
      {onTag && (
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10" onClick={onTag}>
          <Tag className="h-4 w-4 mr-1" /> Tag
        </Button>
      )}
      {children}
      {onDelete && (
        <Button variant="ghost" size="sm" className="text-destructive-foreground hover:bg-destructive/80" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10" onClick={onClearSelection}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
