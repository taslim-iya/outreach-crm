import { useState, useEffect } from "react";
import { getSavedLeads, SavedLead } from "@/lib/savedLeadsApi";
import { getSearchHistory } from "@/lib/searchCacheApi";
import { BarChart3, Users, Mail, TrendingUp, Search, Globe, ArrowUpRight, Clock, MapPin, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { exportLeadsToCsv } from "@/lib/exportLeadsApi";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Dashboard() {
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [leadsRes, history] = await Promise.all([
          getSavedLeads(),
          getSearchHistory(),
        ]);
        setLeads(leadsRes || []);
        setSearchCount(history?.length || 0);
      } catch {
        // graceful fallback
      }
      setLoading(false);
    }
    load();
  }, []);

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    inProgress: leads.filter(l => l.status === "in_progress").length,
    closed: leads.filter(l => l.status === "closed").length,
    withEmail: leads.filter(l => l.email).length,
  };

  const conversionRate = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;

  const topCategories = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const topCities = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.city] = (acc[l.city] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Recent activity: last 5 leads sorted by created_at
  const recentActivity = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Lead generation overview</p>
        </div>
        <div className="flex items-center gap-3">
          {leads.length > 0 && (
            <button
              onClick={() => exportLeadsToCsv(leads)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition text-sm"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
            <Search className="w-4 h-4" /> New Search
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Leads", value: stats.total, icon: Users, color: "text-blue-500" },
          { label: "Emails Found", value: stats.withEmail, icon: Mail, color: "text-green-500" },
          { label: "Searches Run", value: searchCount, icon: Search, color: "text-purple-500" },
          { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-orange-500" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Pipeline + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pipeline */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Outreach Pipeline</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "New", count: stats.new, color: "bg-blue-500" },
              { label: "Contacted", count: stats.contacted, color: "bg-yellow-500" },
              { label: "In Progress", count: stats.inProgress, color: "bg-purple-500" },
              { label: "Closed", count: stats.closed, color: "bg-green-500" },
            ].map(stage => (
              <div key={stage.label} className="text-center">
                <div className={`h-2 rounded-full ${stage.color} mb-2`} style={{ width: `${stats.total ? Math.max(10, (stage.count / stats.total) * 100) : 10}%`, margin: '0 auto' }} />
                <div className="text-xl font-bold text-foreground">{stage.count}</div>
                <div className="text-xs text-muted-foreground">{stage.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">Save leads from search results to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map(lead => (
                <div key={lead.id} className="flex items-start gap-3 group">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-tight">
                      New lead saved: <span className="font-medium">{lead.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {lead.city}{lead.state ? `, ${lead.state}` : ""}
                      <span className="mx-1">·</span>
                      {timeAgo(lead.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Categories + Top Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Categories</h2>
          {topCategories.length === 0 ? (
            <p className="text-muted-foreground text-sm">No leads yet</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{cat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / (topCategories[0]?.[1] || 1)) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Cities</h2>
          {topCities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No leads yet</p>
          ) : (
            <div className="space-y-3">
              {topCities.map(([city, count]) => (
                <div key={city} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{city}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(count / (topCities[0]?.[1] || 1)) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
