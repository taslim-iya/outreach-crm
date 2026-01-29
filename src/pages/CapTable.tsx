import { useMemo, useState } from 'react';
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
import { Download, Search, TrendingUp, Users, DollarSign, PiggyBank, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { CapTableEntryModal } from '@/components/cap-table/CapTableEntryModal';
import { toast } from 'sonner';

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

const FUNDRAISING_GOAL = 1000000; // $1M default goal

export default function CapTable() {
  const { data: investors, isLoading } = useInvestorDeals();
  const deleteDeal = useDeleteInvestorDeal();
  const [searchQuery, setSearchQuery] = useState('');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InvestorDeal | null>(null);
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
    const progressPercent = Math.min((totalRaised / FUNDRAISING_GOAL) * 100, 100);

    return { totalRaised, investorCount, averageInvestment, progressPercent };
  }, [committedInvestors]);

  // Prepare chart data
  const pieChartData = useMemo(() => {
    return filteredInvestors.map((inv) => ({
      name: inv.name,
      value: inv.commitment_amount || 0,
    }));
  }, [filteredInvestors]);

  const barChartData = useMemo(() => {
    return filteredInvestors
      .slice(0, 10) // Top 10 for bar chart
      .map((inv) => ({
        name: inv.name.length > 12 ? inv.name.slice(0, 12) + '...' : inv.name,
        amount: inv.commitment_amount || 0,
      }));
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

  const handleExport = () => {
    const csvContent = [
      ['Investor', 'Organization', 'Commitment', 'Stage', 'Date'].join(','),
      ...filteredInvestors.map((inv) =>
        [
          inv.name,
          inv.organization || '',
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
        title="Cap Table"
        description="Track your fundraising progress"
        actions={
          <div className="flex gap-2">
            <Button onClick={handleAddEntry} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
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
            <span className="text-sm text-muted-foreground">
              {formatCurrency(metrics.totalRaised)} of {formatCurrency(FUNDRAISING_GOAL)}
            </span>
          </div>
          <Progress value={metrics.progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.progressPercent.toFixed(1)}% of goal reached
          </p>
        </CardContent>
      </Card>

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
                  <TableHead>Organization</TableHead>
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
                      <TableCell className="font-medium">{investor.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {investor.organization || '—'}
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
