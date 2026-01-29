import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  File,
  FileSpreadsheet,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const documents = [
  { id: '1', name: 'Investor Pitch Deck v3.pdf', type: 'pitch_deck', size: '4.2 MB', uploadedAt: '2024-01-20', linkedTo: 'Fundraising' },
  { id: '2', name: 'NDA - Precision Mfg.pdf', type: 'nda', size: '156 KB', uploadedAt: '2024-01-22', linkedTo: 'Precision Manufacturing Co' },
  { id: '3', name: 'HomeHealth CIM.pdf', type: 'cim', size: '8.1 MB', uploadedAt: '2024-01-18', linkedTo: 'HomeHealth Services LLC' },
  { id: '4', name: 'Financial Model Template.xlsx', type: 'financials', size: '2.3 MB', uploadedAt: '2024-01-15', linkedTo: 'General' },
  { id: '5', name: 'Investment Memo.docx', type: 'other', size: '890 KB', uploadedAt: '2024-01-10', linkedTo: 'Fundraising' },
];

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

export default function Documents() {
  return (
    <div className="p-6">
      <PageHeader
        title="Documents"
        description="Manage all your deal documents"
        actions={
          <Button className="gradient-gold text-primary-foreground hover:opacity-90">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        }
      />

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9 bg-card border-border"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const Icon = typeIcons[doc.type] || File;
          return (
            <Card key={doc.id} className="hover:border-primary/30 transition-all cursor-pointer hover:shadow-glow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[doc.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="text-sm font-medium text-foreground truncate mb-1">{doc.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{doc.linkedTo}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{doc.size}</span>
                  <span>{new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Zone */}
      <div className="mt-6 border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX up to 50MB</p>
      </div>
    </div>
  );
}
