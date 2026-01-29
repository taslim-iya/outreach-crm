import { useMemo, useState, useEffect } from 'react';
import { useInvestorDeals, useDeleteInvestorDeal, InvestorDeal } from '@/hooks/useInvestorDeals';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download, Search, TrendingUp, Users, DollarSign, PiggyBank, Plus, MoreHorizontal, Pencil, Trash2, Settings2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { CapTableEntryModal } from '@/components/cap-table/CapTableEntryModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(142, 76%, 36%)',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
];

const DEFAULT_FUNDRAISING_GOAL = 1000000; // $1M default goal

export default function CapTable() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: investors, isLoading } = useInvestorDeals();
  const deleteDeal = useDeleteInvestorDeal();
  const [searchQuery, setSearchQuery] = useState('');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InvestorDeal | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  // Fetch profile (fundraising goal and company name)
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('fundraising_goal, company_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const fundraisingGoal = profile?.fundraising_goal ?? DEFAULT_FUNDRAISING_GOAL;
  const companyName = profile?.company_name;

  // Update fundraising goal mutation
  const updateGoal = useMutation({
    mutationFn: async (newGoal: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Check if profile exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('profiles')
          .update({ fundraising_goal: newGoal })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, fundraising_goal: newGoal });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Fundraising goal updated');
      setGoalModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to update goal');
    },
  });

  const handleOpenGoalModal = () => {
    setGoalInput(String(fundraisingGoal));
    setGoalModalOpen(true);
  };

  const handleSaveGoal = () => {
    const parsedGoal = parseFloat(goalInput.replace(/[^0-9.]/g, ''));
    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      toast.error('Please enter a valid goal amount');
      return;
    }
    updateGoal.mutate(parsedGoal);
  };

  // Filter for committed/closed investors only
  const committedInvestors = useMemo(() => {
    if (!investors) return [];
    return investors.filter(
      (inv) =>
        (inv.stage === 'committed' || inv.stage === 'closed') &&
        inv.commitment_amount &&
        inv.commitment_amount > 0
    );
  }, [investors]);

  // Apply search filter
  const filteredInvestors = useMemo(() => {
    if (!searchQuery.trim()) return committedInvestors;
    const query = searchQuery.toLowerCase();
    return committedInvestors.filter(
      (inv) =>
        inv.name.toLowerCase().includes(query) ||
        inv.organization?.toLowerCase().includes(query)
    );
  }, [committedInvestors, searchQuery]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRaised = committedInvestors.reduce(
      (sum, inv) => sum + (inv.commitment_amount || 0),
      0
    );
    const investorCount = committedInvestors.length;
    const averageInvestment = investorCount > 0 ? totalRaised / investorCount : 0;
    const progressPercent = Math.min((totalRaised / fundraisingGoal) * 100, 100);

    return { totalRaised, investorCount, averageInvestment, progressPercent };
  }, [committedInvestors, fundraisingGoal]);

  // Prepare chart data
  // Helper to get display name (prefer organization over personal name)
  const getDisplayName = (inv: InvestorDeal) => inv.organization || inv.name;

  const pieChartData = useMemo(() => {
    return filteredInvestors.map((inv) => ({
      name: getDisplayName(inv),
      value: inv.commitment_amount || 0,
    }));
  }, [filteredInvestors]);

  const barChartData = useMemo(() => {
    return filteredInvestors
      .slice(0, 10) // Top 10 for bar chart
      .map((inv) => {
        const displayName = getDisplayName(inv);
        return {
          name: displayName.length > 12 ? displayName.slice(0, 12) + '...' : displayName,
          amount: inv.commitment_amount || 0,
        };
      });
  }, [filteredInvestors]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const handleExportCSV = () => {
    const headerRows = [];
    if (companyName) {
      headerRows.push([companyName]);
      headerRows.push(['Cap Table']);
      headerRows.push([`Generated: ${format(new Date(), 'MMMM d, yyyy')}`]);
      headerRows.push([]);
    }
    
    const csvContent = [
      ...headerRows.map(row => row.join(',')),
      ['Investor', 'Contact', 'Commitment', 'Stage', 'Date'].join(','),
      ...filteredInvestors.map((inv) =>
        [
          getDisplayName(inv),
          inv.organization ? inv.name : '',
          inv.commitment_amount || 0,
          inv.stage,
          format(new Date(inv.updated_at), 'yyyy-MM-dd'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cap-table-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Company name (if set)
    if (companyName) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, pageWidth / 2, 15, { align: 'center' });
    }
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Cap Table', pageWidth / 2, companyName ? 28 : 20, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, companyName ? 36 : 28, { align: 'center' });
    
    // Summary metrics
    const summaryStartY = companyName ? 50 : 42;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Fundraising Summary', 14, summaryStartY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryY = summaryStartY + 8;
    doc.text(`Total Raised: ${formatCurrency(metrics.totalRaised)}`, 14, summaryY);
    doc.text(`Fundraising Goal: ${formatCurrency(fundraisingGoal)}`, 14, summaryY + 6);
    doc.text(`Progress: ${metrics.progressPercent.toFixed(1)}%`, 14, summaryY + 12);
    doc.text(`Number of Investors: ${metrics.investorCount}`, 100, summaryY);
    doc.text(`Average Investment: ${formatCurrency(metrics.averageInvestment)}`, 100, summaryY + 6);
    
    // Table
    const tableData = filteredInvestors.map((inv) => {
      const percentage = metrics.totalRaised > 0
        ? ((inv.commitment_amount || 0) / metrics.totalRaised) * 100
        : 0;
      return [
        getDisplayName(inv),
        inv.organization ? inv.name : '—',
        formatCurrency(inv.commitment_amount || 0),
        `${percentage.toFixed(1)}%`,
        inv.stage === 'closed' ? 'Closed' : 'Committed',
        format(new Date(inv.updated_at), 'MMM d, yyyy'),
      ];
    });

    autoTable(doc, {
      head: [['Investor', 'Contact', 'Commitment', '% of Total', 'Stage', 'Date']],
      body: tableData,
      startY: companyName ? 80 : 72,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save(`cap-table-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exported successfully');
  };

  const handleEdit = (entry: InvestorDeal) => {
    setEditingEntry(entry);
    setEntryModalOpen(true);
  };

  const handleDelete = async (entry: InvestorDeal) => {
    try {
      await deleteDeal.mutateAsync(entry.id);
      toast.success('Entry deleted');
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setEntryModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setEntryModalOpen(open);
    if (!open) {
      setEditingEntry(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader
          title="Cap Table"
          description="Track your fundraising progress"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (committedInvestors.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader
          title="Cap Table"
          description="Track your fundraising progress"
          actions={
            <Button onClick={handleAddEntry} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          }
        />
        <Card className="goldman-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <PiggyBank className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Committed Investors Yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Add entries directly or move investors to "Committed" or "Closed" stages
              from the Investors page.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleAddEntry}>
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
              <Button variant="outline" asChild>
                <Link to="/investors">Go to Investors</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <CapTableEntryModal
          open={entryModalOpen}
          onOpenChange={handleModalClose}
          entry={editingEntry}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title={companyName ? `${companyName} Cap Table` : 'Cap Table'}
        description="Track your fundraising progress"
        actions={
          <div className="flex gap-2">
            <Button onClick={handleAddEntry} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(metrics.totalRaised)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investors</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.investorCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Investment</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(metrics.averageInvestment)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="goldman-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Fundraising Progress
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {formatCurrency(metrics.totalRaised)} of {formatCurrency(fundraisingGoal)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleOpenGoalModal}
                title="Edit fundraising goal"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <Progress value={metrics.progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.progressPercent.toFixed(1)}% of goal reached
          </p>
        </CardContent>
      </Card>

      {/* Goal Edit Modal */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Fundraising Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Target Amount ($)</Label>
              <Input
                id="goal"
                type="text"
                placeholder="1,000,000"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter your total fundraising target
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoal} disabled={updateGoal.isPending}>
              {updateGoal.isPending ? 'Saving...' : 'Save Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base">Capital Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name.slice(0, 10)}${name.length > 10 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base">Commitment Amounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical">
                  <XAxis
                    type="number"
                    tickFormatter={(value) => formatCurrency(value)}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investor Table */}
      <Card className="goldman-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Investor Breakdown</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search investors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Commitment</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestors.map((investor) => {
                  const percentage =
                    metrics.totalRaised > 0
                      ? ((investor.commitment_amount || 0) / metrics.totalRaised) * 100
                      : 0;

                  return (
                    <TableRow key={investor.id}>
                      <TableCell className="font-medium">{getDisplayName(investor)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {investor.organization ? investor.name : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(investor.commitment_amount || 0)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={investor.stage === 'closed' ? 'default' : 'secondary'}
                        >
                          {investor.stage === 'closed' ? 'Closed' : 'Committed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(investor.updated_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(investor)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(investor)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CapTableEntryModal
        open={entryModalOpen}
        onOpenChange={handleModalClose}
        entry={editingEntry}
      />
    </div>
  );
}
