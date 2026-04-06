import { useState, useRef, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  File,
  FileSpreadsheet,
  Upload,
  Search,
  Filter,
  FolderOpen,
  MoreVertical,
  Download,
  Trash2,
  Loader2,
  Send,
} from 'lucide-react';
import { useDocuments, Document } from '@/hooks/useDocuments';
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog';
import { SmartComposeModal } from '@/components/email/SmartComposeModal';

const typeIcons: Record<string, React.ElementType> = {
  pitch_deck: FileText,
  nda: File,
  cim: FileText,
  financials: FileSpreadsheet,
  other: File,
};

const typeColors: Record<string, string> = {
  pitch_deck: 'bg-primary/10 text-primary',
  nda: 'bg-warning/10 text-warning',
  cim: 'bg-info/10 text-info',
  financials: 'bg-success/10 text-success',
  other: 'bg-muted text-muted-foreground',
};

const typeLabels: Record<string, string> = {
  pitch_deck: 'Pitch Deck',
  nda: 'NDA',
  cim: 'CIM',
  financials: 'Financials',
  other: 'Other',
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getDocumentTypeFromFile(file: File): string {
  const name = file.name.toLowerCase();
  if (name.includes('pitch') || name.includes('deck')) return 'pitch_deck';
  if (name.includes('nda') || name.includes('confidential')) return 'nda';
  if (name.includes('cim') || name.includes('memorandum')) return 'cim';
  if (name.includes('financial') || name.includes('model') || file.type.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls')) return 'financials';
  return 'other';
}

export default function Documents() {
  const { documents, isLoading, uploadDocument, deleteDocument, downloadDocument } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAttachDocId, setEmailAttachDocId] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        const { toast } = await import('@/hooks/use-toast');
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
          variant: 'destructive',
        });
        continue;
      }
      const documentType = getDocumentTypeFromFile(file);
      await uploadDocument.mutateAsync({ file, documentType });
    }
  }, [uploadDocument]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteClick = (doc: Document) => {
    setSelectedDocument(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDocument) {
      await deleteDocument.mutateAsync(selectedDocument);
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Templates"
        description="Manage your email templates and assets"
        actions={
          <Button 
            size="sm"
            onClick={handleUploadClick}
            disabled={uploadDocument.isPending}
          >
            {uploadDocument.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload
          </Button>
        }
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px] h-9">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pitch_deck">Pitch Deck</SelectItem>
            <SelectItem value="nda">NDA</SelectItem>
            <SelectItem value="cim">CIM</SelectItem>
            <SelectItem value="financials">Financials</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery || filterType !== 'all' ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filter'
              : 'Upload your pitch decks, NDAs, CIMs, and financial models to keep everything organized'}
          </p>
        </div>
      ) : (
        /* Documents Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const Icon = typeIcons[doc.document_type] || File;
            return (
              <Card key={doc.id} className="hover:border-primary/30 transition-all cursor-pointer hover:shadow-glow group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[doc.document_type] || typeColors.other}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => downloadDocument(doc)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEmailAttachDocId(doc.id);
                          setEmailModalOpen(true);
                        }}>
                          <Send className="w-4 h-4 mr-2" />
                          Send via Email
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(doc)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="text-sm font-medium text-foreground truncate mb-1">{doc.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{typeLabels[doc.document_type] || 'Document'}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.size_bytes)}</span>
                    <span>{new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Zone */}
      <div 
        className={`mt-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleUploadClick}
      >
        {uploadDocument.isPending ? (
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        )}
        <p className="text-sm font-medium text-foreground mb-1">
          {uploadDocument.isPending ? 'Uploading...' : 'Drop files here or click to upload'}
        </p>
        <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX up to 50MB</p>
      </div>

      {/* Delete Dialog */}
      <DeleteDocumentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        documentName={selectedDocument?.name || ''}
      />

      {/* Email Compose Modal */}
      <SmartComposeModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        preAttachedDocIds={emailAttachDocId ? [emailAttachDocId] : undefined}
      />
    </div>
  );
}
