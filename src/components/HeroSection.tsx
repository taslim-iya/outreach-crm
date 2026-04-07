import { useState, useEffect } from "react";
import { Globe, Search, Zap, Loader2 } from "lucide-react";
import { SearchPanel } from "./SearchPanel";
import { SearchMode } from "@/data/mockBusinesses";
import { supabase } from "@/integrations/supabase/client";

type HeroSectionProps = {
  onSearch: (city: string, category: string, mode: SearchMode) => void;
  isLoading: boolean;
};

type HeroStats = {
  totalBusinesses: number;
  citiesCovered: number;
  loading: boolean;
};

function useHeroStats(): HeroStats {
  const [stats, setStats] = useState<HeroStats>({
    totalBusinesses: 0,
    citiesCovered: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch all cached results to count distinct place_ids and cities
        const { data } = await (supabase.from("search_cache") as any)
          .select("results, city");

        if (!data || data.length === 0) {
          setStats({ totalBusinesses: 0, citiesCovered: 0, loading: false });
          return;
        }

        // Count distinct place_ids across all cached search results
        const placeIds = new Set<string>();
        const cities = new Set<string>();

        for (const row of data) {
          if (row.city) cities.add(row.city.trim().toLowerCase());
          const businesses = row.results as unknown as { id?: string }[];
          if (Array.isArray(businesses)) {
            for (const b of businesses) {
              if (b.id) placeIds.add(b.id);
            }
          }
        }

        setStats({
          totalBusinesses: placeIds.size,
          citiesCovered: cities.size,
          loading: false,
        });
      } catch {
        setStats({ totalBusinesses: 0, citiesCovered: 0, loading: false });
      }
    }

    fetchStats();
  }, []);

  return stats;
}

function formatCount(n: number): string {
  if (n === 0) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  return `${n}+`;
}

export const HeroSection = ({ onSearch, isLoading }: HeroSectionProps) => {
  const stats = useHeroStats();

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-hero">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 px-6 py-12 md:py-16 max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan/30 bg-cyan/10 text-cyan text-xs font-mono mb-6">
          <Zap size={12} />
          Lead Intelligence Tool
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight tracking-tight">
          Find businesses{" "}
          <span className="text-cyan relative">
            missing online
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-cyan rounded-full opacity-60" />
          </span>
        </h1>

        <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          Discover local businesses with no website — or a broken, slow one. Your next web design clients are waiting.
        </p>

        {/* Stats row — real data from Supabase */}
        <div className="flex justify-center gap-8 mb-8">
          {stats.loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs font-mono">Loading stats...</span>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-cyan text-sm font-mono font-semibold mb-0.5">
                  <Globe size={14} />
                  {formatCount(stats.totalBusinesses)}
                </div>
                <div className="text-xs text-muted-foreground">Businesses tracked</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-cyan text-sm font-mono font-semibold mb-0.5">
                  <Search size={14} />
                  {stats.citiesCovered > 0 ? `${stats.citiesCovered} cities` : "Any city"}
                </div>
                <div className="text-xs text-muted-foreground">Coverage</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-cyan text-sm font-mono font-semibold mb-0.5">
                  <Zap size={14} />
                  Instant
                </div>
                <div className="text-xs text-muted-foreground">Results</div>
              </div>
            </>
          )}
        </div>

        {/* Search form */}
        <SearchPanel onSearch={onSearch} isLoading={isLoading} />
      </div>
    </div>
  );
};
