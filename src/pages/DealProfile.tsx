import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useDeal, useUpdateDeal, DEAL_STAGE_LABELS, DEAL_STAGES } from '@/hooks/useDeals';
import { useDiligenceItems, useCreateDiligenceItem, useUpdateDiligenceItem, useDeleteDiligenceItem, useRequestItems, useCreateRequestItem, useUpdateRequestItem } from '@/hooks/useDiligence';
import { useICMemo, useUpsertICMemo, useDecisionLog, useCreateDecisionLogEntry } from '@/hooks/useICMemo';
import { ArrowLeft, Loader2, Save, Plus, FileText, ClipboardCheck, Brain, Calculator, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

function ReturnsQuickview({ deal }: { deal: any }) {
  const [inputs, setInputs] = useState({
    entry_multiple: deal?.entry_multiple || 6,
    leverage_pct: deal?.leverage_pct || 50,
    interest_rate: deal?.interest_rate || 6,
    exit_multiple: deal?.exit_multiple || 7,
    hold_period: deal?.hold_period || 5,
    ebitda_growth: deal?.ebitda_growth || 5,
    ebitda: deal?.deal_ebitda || 1000000,
  });

  const calc = useMemo(() => {
    const { entry_multiple, leverage_pct, interest_rate, exit_multiple, hold_period, ebitda_growth, ebitda } = inputs;
    if (!ebitda || !entry_multiple) return null;
    const ev = ebitda * entry_multiple;
    const debt = ev * (leverage_pct / 100);
    const equity = ev - debt;
    const futureEbitda = ebitda * Math.pow(1 + ebitda_growth / 100, hold_period);
    const futureEv = futureEbitda * exit_multiple;
    const debtRepaid = debt; // simplified
    const equityValue = futureEv - debtRepaid;
    const moic = equityValue / equity;
    const irr = (Math.pow(moic, 1 / hold_period) - 1) * 100;
    return { moic: moic.toFixed(2), irr: irr.toFixed(1), equity: equity.toLocaleString(), ev: ev.toLocaleString() };
  }, [inputs]);

  const set = (key: string, value: number) => setInputs(prev => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calculator className="w-4 h-4" /> Returns Quickview</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div><Label className="text-xs">EBITDA</Label><Input type="number" value={inputs.ebitda} onChange={e => set('ebitda', +e.target.value)} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Entry Multiple</Label><Input type="number" step="0.5" value={inputs.entry_multiple} onChange={e => set('entry_multiple', +e.target.value)} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Leverage %</Label><Input type="number" value={inputs.leverage_pct} onChange={e => set('leverage_pct', +e.target.value)} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Interest Rate %</Label><Input type="number" step="0.5" value={inputs.interest_rate} onChange={e => set('interest_rate', +e.target.value)} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Exit Multiple</Label><Input type="number" step="0.5" value={inputs.exit_multiple} onChange={e => set('exit_multiple', +e.target.value)} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Hold Period (yrs)</Label><Input type="number" value={inputs.hold_period} onChange={e => set('hold_period', +e.target.value)} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">EBITDA Growth %</Label><Input type="number" step="0.5" value={inputs.ebitda_growth} onChange={e => set('ebitda_growth', +e.target.value)} className="h-8 text-sm" /></div>
        </div>
        {calc && (
          <div className="grid grid-cols-4 gap-3 p-3 bg-muted rounded-lg">
            <div className="text-center"><p className="text-xs text-muted-foreground">IRR</p><p className="text-lg font-semibold text-success">{calc.irr}%</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">MOIC</p><p className="text-lg font-semibold text-primary">{calc.moic}x</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">EV</p><p className="text-sm font-medium">${calc.ev}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Equity</p><p className="text-sm font-medium">${calc.equity}</p></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DealProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deal, isLoading } = useDeal(id);
  const updateDeal = useUpdateDeal();
  const { data: diligenceItems = [] } = useDiligenceItems(id);
  const createDiligenceItem = useCreateDiligenceItem();
  const updateDiligenceItem = useUpdateDiligenceItem();
  const deleteDiligenceItem = useDeleteDiligenceItem();
  const { data: requestItems = [] } = useRequestItems(id);
  const createRequestItem = useCreateRequestItem();
  const updateRequestItem = useUpdateRequestItem();
  const { data: icMemo } = useICMemo(id);
  const upsertICMemo = useUpsertICMemo();
  const { data: decisionLog = [] } = useDecisionLog(id);
  const createDecisionEntry = useCreateDecisionLogEntry();

  const [newDiligence, setNewDiligence] = useState('');
  const [newRequest, setNewRequest] = useState('');
  const [memoForm, setMemoForm] = useState<any>(null);
  const [showDecision, setShowDecision] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ decision: 'hold', rationale: '', next_action: '', lessons_learned: '', reason_codes: '' });

  if (isLoading || !deal) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const initMemo = () => {
    setMemoForm(icMemo || { deal_id: id, thesis: '', business_overview: '', quality_assessment: '', risks: '', key_questions: '', valuation_snapshot: '', recommendation: 'hold' });
  };

  return (
    <div className="p-4 md:p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/deal-sourcing')} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Deals
      </Button>

      <PageHeader
        title={deal.name}
        description={deal.companies?.name ? `Linked to ${deal.companies.name}` : undefined}
        actions={
          <div className="flex gap-2">
            <Select value={deal.stage} onValueChange={(v) => updateDeal.mutate({ id: deal.id, stage: v } as any)}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{DEAL_STAGE_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setShowDecision(true)}>
              <Brain className="w-4 h-4 mr-1" /> Log Decision
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="summary" className="mt-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="diligence">Diligence</TabsTrigger>
          <TabsTrigger value="memo">IC Memo</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Deal Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Source</Label><p className="text-sm capitalize">{deal.source || '—'}</p></div>
                  <div><Label className="text-xs">Probability</Label><p className="text-sm">{deal.probability != null ? `${deal.probability}%` : '—'}</p></div>
                  <div><Label className="text-xs">Expected Close</Label><p className="text-sm">{deal.expected_close_date ? format(new Date(deal.expected_close_date), 'MMM d, yyyy') : '—'}</p></div>
                  <div><Label className="text-xs">Next Step</Label><p className="text-sm">{deal.next_step || '—'}</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Key Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Revenue</Label><p className="text-sm">{deal.deal_revenue ? `$${Number(deal.deal_revenue).toLocaleString()}` : '—'}</p></div>
                  <div><Label className="text-xs">EBITDA</Label><p className="text-sm">{deal.deal_ebitda ? `$${Number(deal.deal_ebitda).toLocaleString()}` : '—'}</p></div>
                  <div><Label className="text-xs">EBITDA Margin</Label><p className="text-sm">{deal.ebitda_margin ? `${deal.ebitda_margin}%` : '—'}</p></div>
                  <div><Label className="text-xs">Recurring Rev %</Label><p className="text-sm">{deal.recurring_rev_pct ? `${deal.recurring_rev_pct}%` : '—'}</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-xs">Valuation Notes</Label><p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.valuation_notes || 'No notes yet'}</p></div>
                <div><Label className="text-xs">Structure Notes</Label><p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.structure_notes || 'No notes yet'}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diligence" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" /> Diligence Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input placeholder="Add checklist item..." value={newDiligence} onChange={(e) => setNewDiligence(e.target.value)} className="h-8" />
                <Button size="sm" onClick={() => {
                  if (!newDiligence) return;
                  createDiligenceItem.mutate({ deal_id: id!, title: newDiligence });
                  setNewDiligence('');
                }}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {diligenceItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No diligence items yet</p>
              ) : (
                <div className="space-y-1">
                  {diligenceItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group">
                      <Checkbox
                        checked={item.status === 'done'}
                        onCheckedChange={(checked) => updateDiligenceItem.mutate({ id: item.id, status: checked ? 'done' : 'pending' })}
                      />
                      <span className={`text-sm flex-1 ${item.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {item.title}
                      </span>
                      {item.category && <Badge variant="outline" className="text-[10px]">{item.category}</Badge>}
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => deleteDiligenceItem.mutate(item.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Request List</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input placeholder="Add request item..." value={newRequest} onChange={(e) => setNewRequest(e.target.value)} className="h-8" />
                <Button size="sm" onClick={() => {
                  if (!newRequest) return;
                  createRequestItem.mutate({ deal_id: id!, item_name: newRequest });
                  setNewRequest('');
                }}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {requestItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No request items yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.item_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.requested_date ? format(new Date(item.requested_date), 'MMM d') : '—'}</TableCell>
                        <TableCell>
                          <Select value={item.status || 'pending'} onValueChange={(v) => updateRequestItem.mutate({ id: item.id, status: v })}>
                            <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="received">Received</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.received_date ? format(new Date(item.received_date), 'MMM d') : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memo" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">IC Memo</CardTitle>
                {!memoForm ? (
                  <Button size="sm" onClick={initMemo}>{icMemo ? 'Edit Memo' : 'Draft Memo'}</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setMemoForm(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => { upsertICMemo.mutate(memoForm); setMemoForm(null); }}>
                      <Save className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {memoForm ? (
                <div className="space-y-4">
                  {['thesis', 'business_overview', 'quality_assessment', 'risks', 'key_questions', 'valuation_snapshot'].map(field => (
                    <div key={field}>
                      <Label className="text-xs capitalize">{field.replace(/_/g, ' ')}</Label>
                      <Textarea rows={3} value={memoForm[field] || ''} onChange={(e) => setMemoForm({...memoForm, [field]: e.target.value})} />
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs">Recommendation</Label>
                    <Select value={memoForm.recommendation || 'hold'} onValueChange={(v) => setMemoForm({...memoForm, recommendation: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="no-go">No-Go</SelectItem>
                        <SelectItem value="hold">Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : icMemo ? (
                <div className="space-y-4">
                  {['thesis', 'business_overview', 'quality_assessment', 'risks', 'key_questions', 'valuation_snapshot'].map(field => (
                    <div key={field}>
                      <Label className="text-xs capitalize text-muted-foreground">{field.replace(/_/g, ' ')}</Label>
                      <p className="text-sm whitespace-pre-wrap mt-1">{(icMemo as any)[field] || '—'}</p>
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs text-muted-foreground">Recommendation</Label>
                    <Badge className="mt-1 capitalize">{icMemo.recommendation}</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">No IC memo drafted yet</p>
                  <Button size="sm" className="mt-3" onClick={initMemo}>Draft IC Memo</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="mt-4">
          <ReturnsQuickview deal={deal} />
        </TabsContent>

        <TabsContent value="decisions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Decision Log</CardTitle>
                <Button size="sm" onClick={() => setShowDecision(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Log Decision
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {decisionLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No decisions logged yet</p>
              ) : (
                <div className="space-y-3">
                  {decisionLog.map(entry => (
                    <div key={entry.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="capitalize">{entry.decision}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(entry.decision_date), 'MMM d, yyyy')}</span>
                      </div>
                      {entry.rationale && <p className="text-sm">{entry.rationale}</p>}
                      {entry.next_action && <p className="text-xs text-muted-foreground mt-1">Next: {entry.next_action}</p>}
                      {entry.lessons_learned && <p className="text-xs text-muted-foreground/70 mt-1 italic">Lesson: {entry.lessons_learned}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Decision Log Modal */}
      <Dialog open={showDecision} onOpenChange={setShowDecision}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Decision</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Decision</Label>
              <Select value={decisionForm.decision} onValueChange={(v) => setDecisionForm({...decisionForm, decision: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="no-go">No-Go</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Rationale</Label><Textarea rows={2} value={decisionForm.rationale} onChange={(e) => setDecisionForm({...decisionForm, rationale: e.target.value})} /></div>
            <div><Label>Next Action</Label><Input value={decisionForm.next_action} onChange={(e) => setDecisionForm({...decisionForm, next_action: e.target.value})} /></div>
            {decisionForm.decision === 'no-go' && (
              <>
                <div><Label>Lessons Learned</Label><Textarea rows={2} value={decisionForm.lessons_learned} onChange={(e) => setDecisionForm({...decisionForm, lessons_learned: e.target.value})} /></div>
                <div><Label>Reason Codes (comma-separated)</Label><Input placeholder="valuation, sector, size" value={decisionForm.reason_codes} onChange={(e) => setDecisionForm({...decisionForm, reason_codes: e.target.value})} /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecision(false)}>Cancel</Button>
            <Button onClick={() => {
              createDecisionEntry.mutate({
                deal_id: id!,
                decision: decisionForm.decision,
                rationale: decisionForm.rationale || null,
                next_action: decisionForm.next_action || null,
                lessons_learned: decisionForm.lessons_learned || null,
                reason_codes: decisionForm.reason_codes ? decisionForm.reason_codes.split(',').map(s => s.trim()) : [],
              });
              setShowDecision(false);
              setDecisionForm({ decision: 'hold', rationale: '', next_action: '', lessons_learned: '', reason_codes: '' });
            }}>Log Decision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
