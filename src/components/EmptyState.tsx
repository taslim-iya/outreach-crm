import { Search, MapPin, Lightbulb, PlayCircle } from "lucide-react";
import { Business, DEMO_BUSINESSES } from "@/data/mockBusinesses";

type EmptyStateProps = {
  searched: boolean;
  searchCity?: string;
  onLoadDemo?: (businesses: Business[]) => void;
};

export const EmptyState = ({ searched, searchCity, onLoadDemo }: EmptyStateProps) => {
  if (!searched) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
          <Search size={28} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Start your search
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs mb-6">
          Enter a city and select a business category above to find leads without websites.
        </p>
        {onLoadDemo && (
          <button
            onClick={() => onLoadDemo(DEMO_BUSINESSES)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan/30 text-cyan text-sm font-medium hover:bg-cyan/10 transition-all"
          >
            <PlayCircle size={16} />
            Try Demo Data
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
        <MapPin size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No businesses found without websites{searchCity ? ` in ${searchCity}` : ""}
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        That's actually good news for that area! Try adjusting your search:
      </p>

      {/* Suggestions */}
      <div className="flex flex-col gap-2 mb-6 text-left max-w-xs w-full">
        {[
          "Try a different category",
          "Try nearby cities or smaller towns",
          "Broaden your search with \"Both\" mode",
        ].map((suggestion, i) => (
          <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Lightbulb size={14} className="text-cyan shrink-0 mt-0.5" />
            <span>{suggestion}</span>
          </div>
        ))}
      </div>

      {/* Try Demo Data */}
      {onLoadDemo && (
        <button
          onClick={() => onLoadDemo(DEMO_BUSINESSES)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan/30 text-cyan text-sm font-medium hover:bg-cyan/10 transition-all"
        >
          <PlayCircle size={16} />
          Try Demo Data
        </button>
      )}
    </div>
  );
};
