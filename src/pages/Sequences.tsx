import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useSequences,
  useCreateSequence,
  SequenceStatus,
} from '@/hooks/useSequences';
import {
  Plus,
  Search,
  Loader2,
  Mail,
  Users,
  CheckCircle2,
  MessageSquare,
  ListOrdered,
} from 'lucide-react';

const statusColors: Record<SequenceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  archived: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export default function Sequences() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const createSequence = useCreateSequence();

  const { data: sequences = [], isLoading } = useSequences(
    searchQuery || undefined,
    statusFilter !== 'all' ? (statusFilter as SequenceStatus) : undefined
  );

  const handleCreateSequence = async () => {
    const sequence = await createSequence.mutateAsync({ name: 'Untitled Sequence' });
    navigate(`/sequences/${sequence.id}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Sequences"
        description="Build multi-step automated email sequences"
        actions={
          <Button onClick={handleCreateSequence} disabled={createSequence.isPending}>
            {createSequence.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            New Sequence
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sequences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sequence Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sequences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No sequences yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first automated email sequence</p>
          <Button onClick={handleCreateSequence} disabled={createSequence.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            New Sequence
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((seq) => {
            const completionRate = seq.total_enrolled > 0
              ? Math.round((seq.total_completed / seq.total_enrolled) * 100)
              : 0;
            const replyRate = seq.total_enrolled > 0
              ? Math.round((seq.total_replied / seq.total_enrolled) * 100)
              : 0;

            return (
              <Card
                key={seq.id}
                className="cursor-pointer hover:shadow-md transition-shadow border"
                onClick={() => navigate(`/sequences/${seq.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{seq.name}</h3>
                      {seq.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{seq.description}</p>
                      )}
                    </div>
                    <Badge className={`ml-2 shrink-0 ${statusColors[seq.status]}`}>
                      {seq.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{seq.total_enrolled} enrolled</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{completionRate}% completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{replyRate}% replied</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ListOrdered className="h-3.5 w-3.5" />
                      <span>{seq.trigger_type}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                    Updated {new Date(seq.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
