import { useState, useEffect } from "react";
import { HeroSection } from "@/components/HeroSection";
import { BusinessCard } from "@/components/BusinessCard";
import { BusinessTable } from "@/components/BusinessTable";
import { BusinessLookup } from "@/components/BusinessLookup";
import { CsvUpload } from "@/components/CsvUpload";
import { StatsBar } from "@/components/StatsBar";
import { FilterBar, ViewMode } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { SavedLeadsDrawer } from "@/components/SavedLeadsDrawer";
import { Business, SearchMode } from "@/data/mockBusinesses";
import { findBusinessesWithoutWebsites } from "@/lib/placesApi";
import { getCachedSearch, saveSearchCache, getSearchHistory, loadCachedById, getCachedPlaceIds } from "@/lib/searchCacheApi";
import { useToast } from "@/components/ui/use-toast";
import { BookmarkCheck, Search, History, Clock, Upload, FileSpreadsheet, Trash2 } from "lucide-react";

type SortOption = "rating" | "reviews" | "name" | "established";

const sortBusinesses = (businesses: Business[], sort: SortOption): Business[] => {
  const sorted = [...businesses];
  switch (sort) {
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "reviews":
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "established":
      return sorted.sort(
        (a, b) => (a.yearEstablished ?? 9999) - (b.yearEstablished ?? 9999)
      );
    default:
      return sorted;
  }
};

const exportCSV = (businesses: Business[]) => {
  const headers = ["Name", "Category", "Address", "City", "State", "Phone", "Email", "Rating", "Reviews"];
  const rows = businesses.map((b) => [
    b.name,
    b.category,
    b.address,
    b.city,
    b.state,
    b.phone,
    b.email ?? "",
    b.rating,
    b.reviewCount,
  ]);
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "no-website-businesses.csv";
  a.click();
  URL.revokeObjectURL(url);
};

type HistoryEntry = {
  id: string;
  city: string;
  category: string;
  mode: string;
  source: string;
  result_count: number;
  created_at: string;
};

const Index = () => {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sort, setSort] = useState<SortOption>("rating");
  const [view, setView] = useState<ViewMode>("grid");
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    refreshHistory();
  }, []);

  const refreshHistory = async () => {
    const h = await getSearchHistory();
    setHistory(h);
  };

  const handleSearch = async (city: string, category: string, mode: SearchMode = "no_website") => {
    if (!city.trim()) {
      toast({ title: "Enter a city", description: "Please enter a city to search.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setBusinesses([]);

    // Check cache first
    const cached = await getCachedSearch(city, category, mode);
    if (cached && cached.businesses.length > 0) {
      setBusinesses(cached.businesses);
      if (cached.location) setLocationLabel(cached.location);
      setIsLoading(false);
      toast({
        title: `Loaded ${cached.businesses.length} cached leads`,
        description: `Previously searched — showing saved results`,
      });
      return;
    }

    const result = await findBusinessesWithoutWebsites(city, category, mode);

    setIsLoading(false);

    if (result.error) {
      toast({ title: "Search failed", description: result.error, variant: "destructive" });
      return;
    }

    // Filter out already-seen place_ids
    const seenIds = await getCachedPlaceIds();
    const newBusinesses = result.businesses.filter((b) => !seenIds.has(b.id));

    setBusinesses(newBusinesses);
    if (result.location) setLocationLabel(result.location);

    // Save to cache
    if (newBusinesses.length > 0) {
      await saveSearchCache(city, category, mode, newBusinesses, result.location);
      refreshHistory();
    }

    if (newBusinesses.length === 0 && result.businesses.length > 0) {
      toast({
        title: "All duplicates",
        description: `Found ${result.businesses.length} businesses but all were already in previous searches.`,
      });
    } else if (newBusinesses.length === 0) {
      toast({
        title: "No results found",
        description: `No businesses found matching your criteria. Try a different city/category.`,
      });
    } else {
      const skipped = result.businesses.length - newBusinesses.length;
      toast({
        title: `Found ${newBusinesses.length} new leads!`,
        description: skipped > 0
          ? `${skipped} duplicates from previous searches were excluded`
          : `Businesses in ${result.location ?? city}`,
      });
    }
  };

  const handleCsvImport = async (imported: Business[], fileName: string) => {
    setBusinesses(imported);
    setHasSearched(true);
    setLocationLabel(`CSV: ${fileName}`);
    await saveSearchCache(`csv:${fileName}`, "All Categories", "no_website", imported, `CSV: ${fileName}`, "csv_upload");
    refreshHistory();
  };

  const handleLoadHistory = async (entry: HistoryEntry) => {
    const data = await loadCachedById(entry.id);
    if (data) {
      setBusinesses(data.businesses);
      setLocationLabel(data.location ?? `${data.city} · ${data.category}`);
      setHasSearched(true);
      setShowHistory(false);
      toast({ title: `Loaded ${data.businesses.length} leads`, description: `From ${entry.source === "csv_upload" ? "CSV upload" : "search"} on ${new Date(entry.created_at).toLocaleDateString()}` });
    }
  };

  const sorted = sortBusinesses(businesses, sort);

  return (
    <div className="min-h-screen bg-background">
      {/* Saved Leads Drawer */}
      <SavedLeadsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        refreshKey={drawerRefreshKey}
      />

      {/* Toolbar — CSV upload, history, saved leads (nav is handled by App.tsx TopNav) */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-end gap-3">
        <CsvUpload onImport={handleCsvImport} />
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-cyan transition-colors border border-border hover:border-cyan/30 rounded-lg px-3 py-1.5"
        >
          <History size={13} />
          History {history.length > 0 && `(${history.length})`}
        </button>
        <button
          onClick={() => { setDrawerOpen(true); setDrawerRefreshKey((k) => k + 1); }}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-cyan transition-colors border border-border hover:border-cyan/30 rounded-lg px-3 py-1.5"
        >
          <BookmarkCheck size={13} />
          Saved Leads
        </button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Live · Google Places
        </div>
      </div>

      {/* Search History Panel */}
      {showHistory && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-gradient-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock size={14} className="text-cyan" />
                Search & Upload History
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono py-2">No previous searches yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleLoadHistory(entry)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {entry.source === "csv_upload" ? (
                        <FileSpreadsheet size={13} className="text-cyan shrink-0" />
                      ) : (
                        <Search size={13} className="text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {entry.city}{entry.category !== "All Categories" && entry.category ? ` · ${entry.category}` : ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {entry.result_count} leads · {entry.mode} · {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-cyan opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Load →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero + Search */}
        <HeroSection onSearch={handleSearch} isLoading={isLoading} />

        {/* Single Business Lookup */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Search size={14} className="text-cyan" />
            <span>Lookup a specific business or domain</span>
          </div>
          <BusinessLookup />
        </div>

        {/* Results section */}
        {(hasSearched || businesses.length > 0) && (
          <div className="space-y-5">
            {/* Location banner */}
            {locationLabel && !isLoading && (
              <p className="text-xs text-muted-foreground font-mono">
                Results for: <span className="text-cyan">{locationLabel}</span>
              </p>
            )}

            {/* Stats */}
            {!isLoading && businesses.length > 0 && (
              <StatsBar businesses={businesses} onExport={() => exportCSV(businesses)} />
            )}

            {/* Filter bar */}
            {!isLoading && businesses.length > 0 && (
              <FilterBar sort={sort} onSortChange={setSort} total={sorted.length} view={view} onViewChange={setView} />
            )}

            {/* Loading skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-card border border-border rounded-xl p-5 space-y-3"
                  >
                    <div className="skeleton-shimmer h-5 w-3/4 rounded" />
                    <div className="skeleton-shimmer h-3 w-1/4 rounded" />
                    <div className="skeleton-shimmer h-3 w-full rounded" />
                    <div className="skeleton-shimmer h-3 w-2/3 rounded" />
                    <div className="skeleton-shimmer h-8 w-full rounded-lg mt-2" />
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {!isLoading && businesses.length > 0 && (
              view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sorted.map((business, i) => (
                    <BusinessCard
                      key={business.id}
                      business={business}
                      index={i}
                      onLeadSaved={() => setDrawerRefreshKey((k) => k + 1)}
                    />
                  ))}
                </div>
              ) : (
                <BusinessTable businesses={sorted} />
              )
            )}

            {/* Empty state */}
            {!isLoading && businesses.length === 0 && (
              <EmptyState searched={hasSearched} />
            )}
          </div>
        )}

        {/* Initial empty state */}
        {!hasSearched && <EmptyState searched={false} />}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          nositefinder · powered by Google Places API · Lovable Cloud
        </p>
      </footer>
    </div>
  );
};

export default Index;
