import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Building2, Users, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

type EntityType = 'companies' | 'contacts' | 'deals' | 'auto';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  onImport: (records: any[], detectedType?: string) => Promise<void>;
}

type Step = 'upload' | 'parsing' | 'preview' | 'importing' | 'done';

interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'select';
  options?: string[];
}

const ENTITY_COLUMNS: Record<string, ColumnDef[]> = {
  companies: [
    { key: 'name', label: 'Name' },
    { key: 'industry', label: 'Industry' },
    { key: 'geography', label: 'Geography' },
    { key: 'website', label: 'Website' },
    { key: 'description', label: 'Description' },
    { key: 'sic_code', label: 'SIC Code' },
    { key: 'naics_code', label: 'NAICS Code' },
    { key: 'ownership_type', label: 'Ownership', type: 'select', options: ['private', 'family-owned', 'pe-backed', 'public', 'founder-led', 'estate', 'unknown'] },
    { key: 'revenue_band', label: 'Revenue Band', type: 'select', options: ['<$1M', '$1-5M', '$5-10M', '$10-25M', '$25-50M', '$50-100M', '$100M+'] },
    { key: 'ebitda_band', label: 'EBITDA Band', type: 'select', options: ['<$500K', '$500K-1M', '$1-3M', '$3-5M', '$5-10M', '$10M+'] },
    { key: 'employee_count', label: 'Employees' },
    { key: 'company_status', label: 'Status', type: 'select', options: ['prospect', 'researching', 'contacted', 'engaged', 'passed', 'archived'] },
    { key: 'company_source', label: 'Source' },
  ],
  contacts: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'organization', label: 'Organization' },
    { key: 'role', label: 'Role' },
    { key: 'geography', label: 'Geography' },
    { key: 'source', label: 'Source' },
    { key: 'contact_type', label: 'Type', type: 'select', options: ['investor', 'owner', 'intermediary', 'advisor', 'river_guide'] },
    { key: 'notes', label: 'Notes' },
  ],
  deals: [
    { key: 'name', label: 'Name' },
    { key: 'source', label: 'Source', type: 'select', options: ['proprietary', 'brokered', 'inbound'] },
    { key: 'stage', label: 'Stage', type: 'select', options: ['screening', 'contacted', 'teaser', 'cim', 'ioi', 'loi', 'dd', 'financing', 'signing', 'closed_won', 'lost'] },
    { key: 'notes', label: 'Notes' },
  ],
};

const ENTITY_META: Record<string, { label: string; icon: typeof Building2 }> = {
  companies: { label: 'Companies', icon: Building2 },
  contacts: { label: 'Contacts', icon: Users },
  deals: { label: 'Deals', icon: Briefcase },
};

export function ImportModal({ open, onOpenChange, entityType, onImport }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [records, setRecords] = useState<any[]>([]);
  const [detectedType, setDetectedType] = useState<string>(entityType === 'auto' ? 'companies' : entityType);
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setRecords([]);
    setDetectedType(entityType === 'auto' ? 'companies' : entityType);
    setSelectedRecords(new Set());
    setError(null);
    setProgress(0);
  }, [entityType]);

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const parseFile = async (file: File) => {
    setStep('parsing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity_type', entityType === 'auto' ? 'auto' : entityType);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-import`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || `Upload failed (${resp.status})`);
      }

      const data = await resp.json();
      if (!data.records || data.records.length === 0) {
        throw new Error('No records found in file. Check the file format and try again.');
      }

      const type = data.entity_type || entityType;
      setDetectedType(type === 'auto' ? 'companies' : type);
      setRecords(data.records);
      setSelectedRecords(new Set(data.records.map((_: any, i: number) => i)));
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
      setStep('upload');
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    parseFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleImportConfirm = async () => {
    const toImport = records.filter((_, i) => selectedRecords.has(i));
    if (toImport.length === 0) return;

    setStep('importing');
    setProgress(0);

    try {
      const chunkSize = 10;
      for (let i = 0; i < toImport.length; i += chunkSize) {
        const chunk = toImport.slice(i, i + chunkSize);
        await onImport(chunk, detectedType);
        setProgress(Math.round(((i + chunk.length) / toImport.length) * 100));
      }
      setStep('done');
      toast.success(`Successfully imported ${toImport.length} ${ENTITY_META[detectedType]?.label.toLowerCase() || 'records'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
      setStep('preview');
    }
  };

  const toggleRecord = (index: number) => {
    const next = new Set(selectedRecords);
    next.has(index) ? next.delete(index) : next.add(index);
    setSelectedRecords(next);
  };

  const toggleAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map((_, i) => i)));
    }
  };

  const updateCell = (rowIndex: number, colKey: string, value: string) => {
    setRecords(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [colKey]: value || null };
      return updated;
    });
  };

  const addRow = () => {
    const columns = ENTITY_COLUMNS[detectedType] || ENTITY_COLUMNS.companies;
    const emptyRow: Record<string, any> = {};
    columns.forEach(col => { emptyRow[col.key] = null; });
    emptyRow.name = 'New Record';
    const newIndex = records.length;
    setRecords(prev => [...prev, emptyRow]);
    setSelectedRecords(prev => new Set([...prev, newIndex]));
  };

  const deleteRow = (index: number) => {
    setRecords(prev => prev.filter((_, i) => i !== index));
    setSelectedRecords(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const meta = ENTITY_META[detectedType] || ENTITY_META.companies;
  const columns = ENTITY_COLUMNS[detectedType] || ENTITY_COLUMNS.companies;
  const DetectedIcon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import {entityType === 'auto' ? 'Data' : meta.label}
          </DialogTitle>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="w-full max-w-lg">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-base font-medium text-foreground mb-2">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mb-4">CSV, Excel (.xlsx), or PDF files supported</p>
                <div className="flex justify-center gap-2">
                  <Badge variant="secondary">CSV</Badge>
                  <Badge variant="secondary">XLSX</Badge>
                  <Badge variant="secondary">PDF</Badge>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls,.pdf,.txt"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                AI will automatically detect the data type and map columns. You can edit everything before importing.
              </p>
            </div>
          </div>
        )}

        {/* Parsing Step */}
        {step === 'parsing' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-base font-medium text-foreground">AI is reading your file...</p>
            <p className="text-sm text-muted-foreground mt-1">Detecting data type and mapping fields automatically</p>
          </div>
        )}

        {/* Preview Step - Editable Spreadsheet */}
        {step === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0 px-6 pt-3">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1.5 px-2.5 py-1">
                  <DetectedIcon className="w-3.5 h-3.5" />
                  {meta.label}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{records.length}</span> records · 
                  <span className="font-medium text-foreground"> {selectedRecords.size}</span> selected
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={addRow}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedRecords.size === records.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
            {error && (
              <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden">
              <ScrollArea className="h-full">
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10 sticky left-0 bg-muted/50 z-10">
                          <input
                            type="checkbox"
                            checked={selectedRecords.size === records.length && records.length > 0}
                            onChange={toggleAll}
                            className="rounded"
                          />
                        </TableHead>
                        <TableHead className="w-8 text-center">#</TableHead>
                        {columns.map(col => (
                          <TableHead key={col.key} className="min-w-[140px] text-xs font-semibold uppercase tracking-wider">
                            {col.label}
                          </TableHead>
                        ))}
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record, i) => (
                        <TableRow key={i} className={`${selectedRecords.has(i) ? '' : 'opacity-40'} hover:bg-muted/30`}>
                          <TableCell className="sticky left-0 bg-card z-10">
                            <input
                              type="checkbox"
                              checked={selectedRecords.has(i)}
                              onChange={() => toggleRecord(i)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground text-center">{i + 1}</TableCell>
                          {columns.map(col => (
                            <TableCell key={col.key} className="p-1">
                              {col.type === 'select' ? (
                                <Select
                                  value={record[col.key] || ''}
                                  onValueChange={(val) => updateCell(i, col.key, val)}
                                >
                                  <SelectTrigger className="h-8 text-xs border-transparent hover:border-border focus:border-primary bg-transparent">
                                    <span className={record[col.key] ? '' : 'text-muted-foreground'}>
                                      {record[col.key] || '—'}
                                    </span>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {col.options?.map(opt => (
                                      <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={record[col.key] ?? ''}
                                  onChange={(e) => updateCell(i, col.key, e.target.value)}
                                  className="h-8 text-xs border-transparent hover:border-border focus:border-primary bg-transparent"
                                  placeholder="—"
                                />
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => deleteRow(i)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
            <p className="text-xs text-muted-foreground mt-2 shrink-0">
              Click any cell to edit · Add or remove rows before importing
            </p>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-base font-medium text-foreground mb-3">Importing records...</p>
            <div className="w-64">
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
          </div>
        )}

        {/* Done Step */}
        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
            <p className="text-base font-medium text-foreground">Import complete!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedRecords.size} {meta.label.toLowerCase()} imported successfully
            </p>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleImportConfirm} disabled={selectedRecords.size === 0}>
                Import {selectedRecords.size} {meta.label}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={() => handleClose(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
