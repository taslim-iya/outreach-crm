import { useState, useEffect } from "react";
import { Search, MapPin, ChevronDown, Zap, Globe, AlertTriangle, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES, MOCK_CITIES, SearchMode } from "@/data/mockBusinesses";

const STORAGE_KEY = "nositefinder_last_search";

type SearchPanelProps = {
  onSearch: (city: string, category: string, mode: SearchMode) => void;
  isLoading: boolean;
};

const MODES: { value: SearchMode; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "no_website",
    label: "No Website",
    desc: "Zero online presence",
    icon: <Globe size={13} />,
  },
  {
    value: "poor_website",
    label: "Poor Website",
    desc: "Slow, broken or no HTTPS",
    icon: <AlertTriangle size={13} />,
  },
  {
    value: "both",
    label: "Both",
    desc: "All opportunities",
    icon: <LayoutGrid size={13} />,
  },
];

function loadLastSearch(): { city: string; category: string; mode: SearchMode } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        city: parsed.city ?? "",
        category: parsed.category ?? "All Categories",
        mode: parsed.mode ?? "no_website",
      };
    }
  } catch {
    // ignore
  }
  return { city: "", category: "All Categories", mode: "no_website" };
}

function saveLastSearch(city: string, category: string, mode: SearchMode) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ city, category, mode }));
  } catch {
    // ignore
  }
}

export const SearchPanel = ({ onSearch, isLoading }: SearchPanelProps) => {
  const lastSearch = loadLastSearch();
  const [city, setCity] = useState(lastSearch.city);
  const [category, setCategory] = useState(lastSearch.category);
  const [mode, setMode] = useState<SearchMode>(lastSearch.mode);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Persist search params whenever they change
  useEffect(() => {
    saveLastSearch(city, category, mode);
  }, [city, category, mode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(city, category, mode);
  };

  // Show matching suggestions from MOCK_CITIES, but don't restrict input
  const filteredCities = city.trim()
    ? MOCK_CITIES.filter((c) =>
        c.toLowerCase().includes(city.toLowerCase())
      )
    : [];

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-3 w-full">
      {/* Mode toggle */}
      <div className="flex items-center justify-center gap-1.5 p-1 bg-secondary/80 border border-border rounded-xl">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === m.value
                ? "bg-card border border-cyan/30 text-cyan shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Search row */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        {/* City input — accepts any text, suggestions are hints only */}
        <div className="relative flex-1">
          <MapPin
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan"
            size={16}
          />
          <input
            type="text"
            placeholder="Enter city (e.g. Austin, TX or Manchester, UK)"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setShowCitySuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
            onFocus={() => city.trim() && setShowCitySuggestions(true)}
            className="w-full h-12 pl-10 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all font-mono text-sm"
          />
          {showCitySuggestions && filteredCities.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-card overflow-hidden">
              {filteredCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={() => {
                    setCity(c);
                    setShowCitySuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary text-foreground transition-colors font-mono flex items-center gap-2"
                >
                  <MapPin size={12} className="text-cyan" />
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category select */}
        <div className="relative w-full md:w-56">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-12 pl-4 pr-10 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all appearance-none text-sm cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-card">
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            size={16}
          />
        </div>

        {/* Search button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 px-8 bg-cyan text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all shadow-glow disabled:opacity-50 flex items-center gap-2 min-w-[140px]"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Zap size={16} />
              Find Leads
            </>
          )}
        </Button>
      </div>

      {/* Mode hint */}
      <p className="text-xs text-muted-foreground text-center font-mono">
        {MODES.find((m) => m.value === mode)?.desc}
        {mode === "poor_website" && " — checks PageSpeed & availability (takes a bit longer)"}
        {mode === "both" && " — includes no-website + scores existing sites"}
      </p>
    </form>
  );
};
