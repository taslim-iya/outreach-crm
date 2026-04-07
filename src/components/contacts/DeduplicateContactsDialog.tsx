import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Contact } from '@/hooks/useContacts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Merge, Users, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface DuplicateGroup {
  key: string;
  contacts: Contact[];
  winner: Contact; // the one we keep
  duplicates: Contact[]; // the ones we merge+delete
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contacts: Contact[];
}

function normalise(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function mergeContacts(base: Contact, others: Contact[]): Partial<Contact> {
  const fields = ['email', 'phone', 'organization', 'role', 'geography', 'source', 'notes', 'warmth', 'influence', 'likelihood'] as const;
  const updates: Partial<Contact> = {};

  for (const field of fields) {
    if (!base[field]) {
      for (const other of others) {
        if (other[field]) {
          (updates as Record<string, unknown>)[field] = other[field];
          break;
        }
      }
    }
  }

  // Merge tags
  const allTags = [...new Set([...(base.tags || []), ...others.flatMap(o => o.tags || [])])];
  if (allTags.length > (base.tags || []).length) {
    updates.tags = allTags;
  }

  return updates;
}

export function DeduplicateContactsDialog({ open, onOpenChange, contacts }: Props) {
  const [merging, setMerging] = useState(false);
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const groups = useMemo<DuplicateGroup[]>(() => {
    const map = new Map<string, Contact[]>();

    for (const c of contacts) {
      // Key = normalised name + normalised org (empty string if no org)
      const key = `${normalise(c.name)}|||${normalise(c.organization || '')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }

    const result: DuplicateGroup[] = [];
    for (const [key, group] of map.entries()) {
      if (group.length < 2) continue;
      // Sort: keep oldest (most likely the original), most complete first as tiebreak
      const sorted = [...group].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        if (dateA !== dateB) return dateA - dateB; // oldest first
        // Tiebreak: more filled fields wins
        const scoreA = Object.values(a).filter(Boolean).length;
        const scoreB = Object.values(b).filter(Boolean).length;
        return scoreB - scoreA;
      });
      result.push({
        key,
        contacts: sorted,
        winner: sorted[0],
        duplicates: sorted.slice(1),
      });
    }
    return result;
  }, [contacts]);

  const totalDuplicates = groups.reduce((s, g) => s + g.duplicates.length, 0);

  const handleMergeAll = async () => {
    setMerging(true);
    let merged = 0;
    try {
      for (const group of groups) {
        const updates = mergeContacts(group.winner, group.duplicates);

        // Apply merged fields to winner if any
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', group.winner.id);
          if (error) throw error;
        }

        // Delete duplicates
        for (const dup of group.duplicates) {
          const { error } = await supabase.from('contacts').delete().eq('id', dup.id);
          if (error) throw error;
          merged++;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(`Merged ${merged} duplicate contact${merged !== 1 ? 's' : ''} across ${groups.length} group${groups.length !== 1 ? 's' : ''}`);
      setDone(true);
    } catch (e: unknown) {
      toast.error('Failed to merge some contacts: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setMerging(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5 text-primary" />
            Deduplicate Contacts
          </DialogTitle>
          <DialogDescription>
            Contacts matched by identical name + organisation. The oldest record is kept; unique fields from duplicates are merged in.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <p className="font-semibold text-lg">All done!</p>
            <p className="text-sm text-muted-foreground">Your contacts are now clean.</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Users className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-semibold">No duplicates found</p>
            <p className="text-sm text-muted-foreground">All contacts have unique name + organisation combinations.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Badge variant="secondary">{groups.length} duplicate group{groups.length !== 1 ? 's' : ''}</Badge>
              <Badge variant="outline">{totalDuplicates} record{totalDuplicates !== 1 ? 's' : ''} will be removed</Badge>
            </div>

            <ScrollArea className="max-h-[380px] pr-2">
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.key} className="border border-border rounded-lg p-3 bg-card">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-medium text-sm">{group.winner.name}</span>
                        {group.winner.organization && (
                          <span className="text-muted-foreground text-sm"> · {group.winner.organization}</span>
                        )}
                      </div>
                      <Badge className="text-[10px] shrink-0" variant="default">Keep</Badge>
                    </div>
                    <div className="space-y-1">
                      {group.duplicates.map((dup) => (
                        <div key={dup.id} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1">
                          <span>{dup.name}{dup.email ? ` · ${dup.email}` : ''}{dup.phone ? ` · ${dup.phone}` : ''}</span>
                          <Badge variant="destructive" className="text-[9px] px-1.5">Remove</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {done ? 'Close' : 'Cancel'}
          </Button>
          {!done && groups.length > 0 && (
            <Button onClick={handleMergeAll} disabled={merging}>
              {merging ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Merging…</>
              ) : (
                <><Merge className="w-4 h-4 mr-1" /> Merge {totalDuplicates} duplicate{totalDuplicates !== 1 ? 's' : ''}</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
