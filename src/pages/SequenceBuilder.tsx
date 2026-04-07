import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  useSequence,
  useUpdateSequence,
  useDeleteSequence,
  useActivateSequence,
  usePauseSequence,
  useSequenceSteps,
  useCreateSequenceStep,
  useUpdateSequenceStep,
  useDeleteSequenceStep,
  useReorderSequenceSteps,
  useSequenceEnrollments,
  useEnrollContacts,
  type SequenceStep,
  type StepType,
  type DelayUnit,
  type ConditionType,
  type SequenceStatus,
  type EnrollmentStatus,
} from '@/hooks/useSequences';
import {
  ArrowLeft,
  Mail,
  Clock,
  GitBranch,
  CheckSquare,
  Webhook,
  Plus,
  Pencil,
  Trash2,
  Save,
  Play,
  Pause,
  Loader2,
  Users,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  GripVertical,
} from 'lucide-react';

// ─── Status Badge Colors ───────────────────────────────────────────────────
const statusColors: Record<SequenceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  archived: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const enrollmentStatusColors: Record<EnrollmentStatus, string> = {
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  replied: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  bounced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  unsubscribed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

// ─── Step Type Config ──────────────────────────────────────────────────────
const stepTypeConfig: Record<StepType, { label: string; icon: typeof Mail; color: string }> = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  delay: { label: 'Delay', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  condition: { label: 'Condition', icon: GitBranch, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  task: { label: 'Task', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  webhook: { label: 'Webhook', icon: Webhook, color: 'text-slate-600 bg-slate-50 dark:bg-slate-950 dark:text-slate-400 border-slate-200 dark:border-slate-800' },
};

const conditionLabels: Record<ConditionType, string> = {
  opened: 'Email Opened',
  replied: 'Email Replied',
  clicked: 'Link Clicked',
  not_opened: 'Email Not Opened',
  not_replied: 'Email Not Replied',
};

// ─── Step Summary ──────────────────────────────────────────────────────────
function getStepSummary(step: SequenceStep): string {
  switch (step.step_type) {
    case 'email':
      return step.subject ? `Send: ${step.subject}` : 'Send Email';
    case 'delay':
      return `Wait ${step.delay_amount} ${step.delay_unit}`;
    case 'condition':
      return step.condition_type ? `If ${conditionLabels[step.condition_type]}` : 'Condition';
    case 'task':
      return step.task_title || 'Create Task';
    case 'webhook':
      return 'Send Webhook';
    default:
      return 'Unknown Step';
  }
}

// ─── Step Editor Form ──────────────────────────────────────────────────────
interface StepFormData {
  step_type: StepType;
  subject: string;
  body_html: string;
  delay_amount: number;
  delay_unit: DelayUnit;
  condition_type: ConditionType | '';
  task_title: string;
  task_description: string;
}

const defaultStepForm: StepFormData = {
  step_type: 'email',
  subject: '',
  body_html: '',
  delay_amount: 1,
  delay_unit: 'days',
  condition_type: '',
  task_title: '',
  task_description: '',
};

function stepToForm(step: SequenceStep): StepFormData {
  return {
    step_type: step.step_type,
    subject: step.subject || '',
    body_html: step.body_html || '',
    delay_amount: step.delay_amount || 1,
    delay_unit: step.delay_unit || 'days',
    condition_type: (step.condition_type as ConditionType) || '',
    task_title: step.task_title || '',
    task_description: step.task_description || '',
  };
}

// ─── Add Step Button ───────────────────────────────────────────────────────
function AddStepButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-px h-5 border-l-2 border-dashed border-muted-foreground/30" />
      <button
        onClick={onClick}
        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
      >
        <Plus className="h-4 w-4" />
      </button>
      <div className="w-px h-5 border-l-2 border-dashed border-muted-foreground/30" />
    </div>
  );
}

// ─── Step Card ─────────────────────────────────────────────────────────────
function StepCard({
  step,
  index,
  onEdit,
  onDelete,
}: {
  step: SequenceStep;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const config = stepTypeConfig[step.step_type];
  const Icon = config.icon;

  return (
    <Card className={`border ${config.color} transition-shadow hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 mt-0.5">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-background border text-xs font-semibold">
              {index + 1}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                {config.label}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">
              {getStepSummary(step)}
            </p>
            {step.step_type === 'email' && step.body_html && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {step.body_html.replace(/<[^>]*>/g, '').slice(0, 120)}
              </p>
            )}
            {step.step_type === 'condition' && (
              <div className="flex gap-3 mt-1.5">
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Yes branch</span>
                <span className="text-xs text-red-500 dark:text-red-400">No branch</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Enroll Contacts Dialog ────────────────────────────────────────────────
function EnrollDialog({
  open,
  onOpenChange,
  sequenceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sequenceId: string;
}) {
  const [emailsText, setEmailsText] = useState('');
  const enrollContacts = useEnrollContacts();

  const handleEnroll = async () => {
    const lines = emailsText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }

    const contacts = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return { email: parts[0], name: parts[1] || undefined };
    });

    await enrollContacts.mutateAsync({ sequence_id: sequenceId, contacts });
    setEmailsText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enroll Contacts</DialogTitle>
          <DialogDescription>
            Add contacts to this sequence. Enter one per line: email, name (name is optional).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder={"john@example.com, John Doe\njane@example.com, Jane Smith"}
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Format: email, name (one per line)
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={enrollContacts.isPending}>
            {enrollContacts.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function SequenceBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data hooks
  const { data: sequence, isLoading: seqLoading } = useSequence(id);
  const { data: steps = [], isLoading: stepsLoading } = useSequenceSteps(id);
  const { data: enrollments = [] } = useSequenceEnrollments(id);

  // Mutation hooks
  const updateSequence = useUpdateSequence();
  const deleteSequence = useDeleteSequence();
  const activateSequence = useActivateSequence();
  const pauseSequence = usePauseSequence();
  const createStep = useCreateSequenceStep();
  const updateStep = useUpdateSequenceStep();
  const deleteStep = useDeleteSequenceStep();
  const reorderSteps = useReorderSequenceSteps();

  // Local state
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');

  // Step editor state
  const [stepEditorOpen, setStepEditorOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
  const [insertAtOrder, setInsertAtOrder] = useState<number>(1);
  const [stepForm, setStepForm] = useState<StepFormData>(defaultStepForm);

  // Enroll dialog
  const [enrollOpen, setEnrollOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Sync name from server
  useEffect(() => {
    if (sequence) {
      setNameValue(sequence.name);
      setDescValue(sequence.description || '');
    }
  }, [sequence]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveName = useCallback(() => {
    if (!id || !nameValue.trim()) return;
    updateSequence.mutate({ id, name: nameValue.trim(), description: descValue.trim() || undefined });
    setEditingName(false);
  }, [id, nameValue, descValue, updateSequence]);

  const handleDelete = async () => {
    if (!id) return;
    await deleteSequence.mutateAsync(id);
    navigate('/sequences');
  };

  const handleActivate = () => {
    if (!id) return;
    if (steps.length === 0) {
      toast.error('Add at least one step before activating');
      return;
    }
    activateSequence.mutate(id);
  };

  const handlePause = () => {
    if (!id) return;
    pauseSequence.mutate(id);
  };

  // Step editor
  const openNewStepEditor = (atOrder: number) => {
    setEditingStep(null);
    setInsertAtOrder(atOrder);
    setStepForm(defaultStepForm);
    setStepEditorOpen(true);
  };

  const openEditStepEditor = (step: SequenceStep) => {
    setEditingStep(step);
    setStepForm(stepToForm(step));
    setStepEditorOpen(true);
  };

  const handleSaveStep = async () => {
    if (!id) return;

    if (editingStep) {
      // Update existing step
      await updateStep.mutateAsync({
        id: editingStep.id,
        sequence_id: id,
        step_type: stepForm.step_type,
        subject: stepForm.step_type === 'email' ? stepForm.subject : undefined,
        body_html: stepForm.step_type === 'email' ? stepForm.body_html : undefined,
        delay_amount: stepForm.step_type === 'delay' ? stepForm.delay_amount : undefined,
        delay_unit: stepForm.step_type === 'delay' ? stepForm.delay_unit : undefined,
        condition_type: stepForm.step_type === 'condition' ? (stepForm.condition_type as ConditionType) || undefined : undefined,
        task_title: stepForm.step_type === 'task' ? stepForm.task_title : undefined,
        task_description: stepForm.step_type === 'task' ? stepForm.task_description : undefined,
      });
    } else {
      // Shift steps at or after insertAtOrder
      const stepsToShift = steps.filter((s) => s.step_order >= insertAtOrder);
      if (stepsToShift.length > 0) {
        await reorderSteps.mutateAsync({
          sequenceId: id,
          steps: stepsToShift.map((s) => ({ id: s.id, step_order: s.step_order + 1 })),
        });
      }

      await createStep.mutateAsync({
        sequence_id: id,
        step_order: insertAtOrder,
        step_type: stepForm.step_type,
        subject: stepForm.step_type === 'email' ? stepForm.subject : undefined,
        body_html: stepForm.step_type === 'email' ? stepForm.body_html : undefined,
        delay_amount: stepForm.step_type === 'delay' ? stepForm.delay_amount : undefined,
        delay_unit: stepForm.step_type === 'delay' ? stepForm.delay_unit : undefined,
        condition_type: stepForm.step_type === 'condition' ? (stepForm.condition_type as ConditionType) || undefined : undefined,
        task_title: stepForm.step_type === 'task' ? stepForm.task_title : undefined,
        task_description: stepForm.step_type === 'task' ? stepForm.task_description : undefined,
      });
    }

    setStepEditorOpen(false);
  };

  const handleDeleteStep = async (step: SequenceStep) => {
    if (!id) return;
    await deleteStep.mutateAsync({ id: step.id, sequenceId: id });

    // Re-order remaining steps
    const remaining = steps
      .filter((s) => s.id !== step.id)
      .sort((a, b) => a.step_order - b.step_order)
      .map((s, i) => ({ id: s.id, step_order: i + 1 }));

    if (remaining.length > 0) {
      await reorderSteps.mutateAsync({ sequenceId: id, steps: remaining });
    }
  };

  // ── Enrollment stats ─────────────────────────────────────────────────────
  const enrollmentStats = {
    total: enrollments.length,
    active: enrollments.filter((e) => e.status === 'active').length,
    completed: enrollments.filter((e) => e.status === 'completed').length,
    replied: enrollments.filter((e) => e.status === 'replied').length,
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (seqLoading || stepsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-lg font-semibold mb-2">Sequence not found</h2>
        <Button variant="outline" onClick={() => navigate('/sequences')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sequences
        </Button>
      </div>
    );
  }

  const isActive = sequence.status === 'active';
  const maxOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.step_order)) : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/sequences')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="h-8 text-lg font-semibold w-64"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                />
                <Button size="sm" onClick={handleSaveName}>
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-2 group"
              >
                <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight truncate">
                  {sequence.name}
                </h1>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {sequence.description && !editingName && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{sequence.description}</p>
            )}
          </div>
          <Badge className={`ml-2 shrink-0 ${statusColors[sequence.status]}`}>
            {sequence.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isActive ? (
            <Button variant="outline" onClick={handlePause} disabled={pauseSequence.isPending}>
              {pauseSequence.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pause className="h-4 w-4 mr-2" />}
              Pause
            </Button>
          ) : (
            <Button variant="outline" onClick={handleActivate} disabled={activateSequence.isPending}>
              {activateSequence.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Activate
            </Button>
          )}
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* ── Visual Step Builder ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Steps</h2>
            <span className="text-xs text-muted-foreground">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex flex-col items-center">
            {/* Start node */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 text-sm font-medium text-muted-foreground mb-1">
              <Play className="h-3.5 w-3.5" />
              Sequence Start
            </div>

            {/* Add button before first step */}
            <AddStepButton onClick={() => openNewStepEditor(1)} />

            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center w-full max-w-lg">
                <div className="w-full">
                  <StepCard
                    step={step}
                    index={index}
                    onEdit={() => openEditStepEditor(step)}
                    onDelete={() => handleDeleteStep(step)}
                  />
                </div>
                <AddStepButton onClick={() => openNewStepEditor(step.step_order + 1)} />
              </div>
            ))}

            {/* End node */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sequence End
            </div>
          </div>

          {steps.length === 0 && (
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground mb-3">No steps yet. Add your first step to get started.</p>
              <Button variant="outline" onClick={() => openNewStepEditor(1)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Step
              </Button>
            </div>
          )}
        </div>

        {/* ── Right Sidebar - Enrollments ─────────────────────────────────── */}
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Enrollment Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-semibold text-foreground">{enrollmentStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{enrollmentStats.active}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{enrollmentStats.completed}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">{enrollmentStats.replied}</div>
                  <div className="text-xs text-muted-foreground">Replied</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrolled contacts */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Contacts</h3>
                <Button size="sm" variant="outline" onClick={() => setEnrollOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Add
                </Button>
              </div>

              {enrollments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No contacts enrolled</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {enrollment.name || enrollment.email}
                          </p>
                          {enrollment.name && (
                            <p className="text-xs text-muted-foreground truncate">{enrollment.email}</p>
                          )}
                        </div>
                        <Badge className={`ml-2 shrink-0 text-xs ${enrollmentStatusColors[enrollment.status]}`}>
                          {enrollment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Step Editor Dialog ──────────────────────────────────────────────── */}
      <Dialog open={stepEditorOpen} onOpenChange={setStepEditorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStep ? 'Edit Step' : 'Add Step'}</DialogTitle>
            <DialogDescription>
              Configure the step details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step type selector */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Step Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['email', 'delay', 'condition', 'task'] as StepType[]).map((type) => {
                  const config = stepTypeConfig[type];
                  const Icon = config.icon;
                  const selected = stepForm.step_type === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setStepForm((f) => ({ ...f, step_type: type }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-medium ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Email fields */}
            {stepForm.step_type === 'email' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="step-subject">Subject</Label>
                  <Input
                    id="step-subject"
                    placeholder="Email subject line..."
                    value={stepForm.subject}
                    onChange={(e) => setStepForm((f) => ({ ...f, subject: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="step-body">Body</Label>
                  <Textarea
                    id="step-body"
                    placeholder="Write your email content here... HTML is supported."
                    value={stepForm.body_html}
                    onChange={(e) => setStepForm((f) => ({ ...f, body_html: e.target.value }))}
                    rows={8}
                    className="mt-1.5 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Delay fields */}
            {stepForm.step_type === 'delay' && (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor="delay-amount">Wait for</Label>
                  <Input
                    id="delay-amount"
                    type="number"
                    min={1}
                    value={stepForm.delay_amount}
                    onChange={(e) => setStepForm((f) => ({ ...f, delay_amount: parseInt(e.target.value) || 1 }))}
                    className="mt-1.5"
                  />
                </div>
                <div className="w-32">
                  <Select
                    value={stepForm.delay_unit}
                    onValueChange={(v: DelayUnit) => setStepForm((f) => ({ ...f, delay_unit: v }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Condition fields */}
            {stepForm.step_type === 'condition' && (
              <div>
                <Label>Condition</Label>
                <Select
                  value={stepForm.condition_type || ''}
                  onValueChange={(v) => setStepForm((f) => ({ ...f, condition_type: v as ConditionType }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select condition..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opened">Email Opened</SelectItem>
                    <SelectItem value="replied">Email Replied</SelectItem>
                    <SelectItem value="clicked">Link Clicked</SelectItem>
                    <SelectItem value="not_opened">Email Not Opened</SelectItem>
                    <SelectItem value="not_replied">Email Not Replied</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  The sequence will branch based on whether this condition is met.
                </p>
              </div>
            )}

            {/* Task fields */}
            {stepForm.step_type === 'task' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    placeholder="e.g., Follow up with contact"
                    value={stepForm.task_title}
                    onChange={(e) => setStepForm((f) => ({ ...f, task_title: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="task-desc">Description</Label>
                  <Textarea
                    id="task-desc"
                    placeholder="Optional task description..."
                    value={stepForm.task_description}
                    onChange={(e) => setStepForm((f) => ({ ...f, task_description: e.target.value }))}
                    rows={3}
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStepEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveStep}
              disabled={createStep.isPending || updateStep.isPending}
            >
              {(createStep.isPending || updateStep.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingStep ? 'Save Changes' : 'Add Step'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Enroll Dialog ──────────────────────────────────────────────────── */}
      {id && <EnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} sequenceId={id} />}

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Sequence</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{sequence.name}&quot;? This action cannot be undone. All steps and enrollments will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteSequence.isPending}>
              {deleteSequence.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
