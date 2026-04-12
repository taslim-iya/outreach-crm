import { useState, useEffect, useCallback } from "react";
import { getSavedLeads, updateLeadStatus, updateLeadNotes, deleteSavedLead, SavedLead, OutreachStatus } from "@/lib/savedLeadsApi";
import { findEmailForBusiness } from "@/lib/hunterApi";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Trash2, ExternalLink, Phone, MapPin, Star, MessageSquare, Search, ChevronDown, MailPlus } from "lucide-react";

const STATUS_ORDER: OutreachStatus[] = ["new", "contacted", "in_progress", "closed"];

const STATUS_CONFIG: Record<OutreachStatus, { label: string; color: string; bg: string; textColor: string }> = {
  new:         { label: "Not Contacted", color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-500/20", textColor: "text-gray-400" },
  contacted:   { label: "Contacted",     color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20", textColor: "text-yellow-500" },
  in_progress: { label: "Interested",    color: "text-blue-500",   bg: "bg-blue-500/10 border-blue-500/20", textColor: "text-blue-500" },
  closed:      { label: "Won",           color: "text-green-500",  bg: "bg-green-500/10 border-green-500/20", textColor: "text-green-500" },
};

export default function Outreach() {
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OutreachStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [findingEmail, setFindingEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const loadLeads = useCallback(async () => {
    const res = await getSavedLeads();
    setLeads(res || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleCycleStatus = async (lead: SavedLead) => {
    const currentIdx = STATUS_ORDER.indexOf(lead.status);
    const nextIdx = (currentIdx + 1) % STATUS_ORDER.length;
    const nextStatus = STATUS_ORDER[nextIdx];
    await updateLeadStatus(lead.id, nextStatus);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: nextStatus } : l));
    toast({ title: `${lead.name}: ${STATUS_CONFIG[nextStatus].label}` });
  };

  const handleStatusChange = async (id: string, status: OutreachStatus) => {
    await updateLeadStatus(id, status);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    toast({ title: `Status updated to ${STATUS_CONFIG[status].label}` });
  };

  const handleSaveNotes = async (id: string) => {
    await updateLeadNotes(id, notesText);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notes: notesText } : l));
    setEditingNotes(null);
    toast({ title: "Notes saved" });
  };

  const handleDelete = async (id: string) => {
    await deleteSavedLead(id);
    setLeads(prev => prev.filter(l => l.id !== id));
    toast({ title: "Lead removed" });
  };

  const handleFindEmail = async (lead: SavedLead) => {
    setFindingEmail(lead.id);
    const result = await findEmailForBusiness(lead.name, lead.city, lead.state);
    if (result.email) {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, email: result.email } : l));
      toast({ title: `Email found: ${result.email}` });
    } else {
      toast({ title: "No email found", description: result.error || "Try a different approach", variant: "destructive" });
    }
    setFindingEmail(null);
  };

  const filtered = leads
    .filter(l => filter === "all" || l.status === filter)
    .filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase()) || l.category.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Outreach Pipeline</h1>
          <p className="text-muted-foreground mt-1">{leads.length} saved leads</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          {(["all", ...STATUS_ORDER] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                filter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
              {s !== "all" && ` (${leads.filter(l => l.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Lead List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No leads found</p>
          <p className="text-sm mt-1">Save businesses from search results to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const cfg = STATUS_CONFIG[lead.status];
            return (
              <div key={lead.id} className={`bg-card border rounded-xl p-5 ${cfg.bg}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
                      {/* Clickable status badge — click to cycle to next stage */}
                      <button
                        onClick={() => handleCycleStatus(lead)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all hover:opacity-80 active:scale-95 cursor-pointer ${cfg.bg} ${cfg.textColor}`}
                        title={`Click to advance to next stage`}
                      >
                        {cfg.label}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{lead.city}, {lead.state}</span>
                      <span>{lead.category}</span>
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" />{lead.rating} ({lead.review_count})</span>
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{lead.phone}</span>}
                      {lead.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-green-500" />{lead.email}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!lead.email && (
                      <button
                        onClick={() => handleFindEmail(lead)}
                        disabled={findingEmail === lead.id}
                        className="p-2 text-muted-foreground hover:text-foreground transition rounded-lg hover:bg-muted"
                        title="Find email"
                      >
                        {findingEmail === lead.id ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <MailPlus className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Dropdown status selector for precise control */}
                    <select
                      value={lead.status}
                      onChange={e => handleStatusChange(lead.id, e.target.value as OutreachStatus)}
                      className="text-xs bg-card border border-border rounded-lg px-2 py-1.5 text-foreground"
                    >
                      {STATUS_ORDER.map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => { setEditingNotes(editingNotes === lead.id ? null : lead.id); setNotesText(lead.notes || ""); }}
                      className="p-2 text-muted-foreground hover:text-foreground transition rounded-lg hover:bg-muted"
                      title="Notes"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button onClick={() => handleDelete(lead.id)} className="p-2 text-muted-foreground hover:text-red-500 transition rounded-lg hover:bg-muted" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes editor */}
                {editingNotes === lead.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <textarea
                      value={notesText}
                      onChange={e => setNotesText(e.target.value)}
                      placeholder="Add notes about this lead..."
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingNotes(null)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                      <button onClick={() => handleSaveNotes(lead.id)} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save Notes</button>
                    </div>
                  </div>
                )}

                {/* Existing notes display */}
                {lead.notes && editingNotes !== lead.id && (
                  <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground italic">{lead.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
