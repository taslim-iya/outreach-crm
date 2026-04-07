import { useState } from "react";
import { Phone, MapPin, Star, Copy, Check, Globe, Calendar, Users, Mail, Loader2, Bookmark, BookmarkCheck, AlertTriangle, ExternalLink, WifiOff, Lightbulb, ChevronDown, ChevronUp, ClipboardCopy } from "lucide-react";
import { Business } from "@/data/mockBusinesses";
import { findEmailForBusiness } from "@/lib/hunterApi";
import { saveLead } from "@/lib/savedLeadsApi";
import { useToast } from "@/components/ui/use-toast";

type BusinessCardProps = {
  business: Business;
  index: number;
  onLeadSaved?: () => void;
};

export const BusinessCard = ({ business, index, onLeadSaved }: BusinessCardProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(business.email ?? null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSearched, setEmailSearched] = useState(!!business.email);
  const [emailConfidence, setEmailConfidence] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleFindEmail = async () => {
    if (emailLoading || emailSearched) return;
    setEmailLoading(true);
    const result = await findEmailForBusiness(business.name, business.city, business.state);
    setEmail(result.email);
    setEmailConfidence(result.confidence ?? null);
    setEmailSearched(true);
    setEmailLoading(false);
  };

  const handleSaveLead = async () => {
    if (saved || saving) return;
    setSaving(true);
    const { error } = await saveLead(business, email);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving lead", description: error, variant: "destructive" });
    } else {
      setSaved(true);
      toast({ title: "Lead saved!", description: business.name });
      onLeadSaved?.();
    }
  };

  const handleCopyPitch = () => {
    const pitch = `Hi ${business.name}, I noticed your business doesn't have a website. I build affordable websites for ${business.category.toLowerCase()} businesses in ${business.city} — reply if you'd like a free mockup!`;
    navigator.clipboard.writeText(pitch);
    setCopied("pitch");
    setTimeout(() => setCopied(null), 1500);
    toast({ title: "Pitch copied to clipboard!" });
  };

  const staggerClass = index < 6 ? `stagger-${Math.min(index + 1, 6)}` : "";

  const categoryColors: Record<string, string> = {
    "Auto Repair": "text-warning",
    Bakery: "text-pink-400",
    Plumber: "text-blue-400",
    "Hair Salon": "text-purple-400",
    "Cleaning Service": "text-green-400",
    Electrician: "text-yellow-400",
    Restaurant: "text-orange-400",
    Florist: "text-pink-300",
    Landscaping: "text-green-500",
    Contractor: "text-amber-500",
    "Pet Grooming": "text-cyan",
    "Dry Cleaning": "text-sky-400",
    Dentist: "text-teal-400",
    Lawyer: "text-indigo-400",
    Accountant: "text-violet-400",
  };

  const catColor = categoryColors[business.category] || "text-muted-foreground";

  const isPoor = business.websiteQuality === "poor";
  const isNone = !business.hasWebsite;

  return (
    <div
      className={`group relative bg-gradient-card border border-border hover:border-cyan/30 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in-up opacity-0 ${staggerClass}`}
      style={{ animationFillMode: "forwards" }}
    >
      {/* Badge: No Website / Poor Site */}
      <div className="absolute top-4 right-4">
        {isNone ? (
          <div className="flex items-center gap-1.5 bg-destructive/15 border border-destructive/30 text-destructive rounded-full px-2.5 py-1 text-xs font-mono font-medium">
            <Globe size={10} />
            No Website
          </div>
        ) : isPoor ? (
          <div className="flex items-center gap-1.5 bg-warning/15 border border-warning/30 text-warning rounded-full px-2.5 py-1 text-xs font-mono font-medium">
            <AlertTriangle size={10} />
            Poor Site
          </div>
        ) : null}
      </div>

      {/* Name + Category */}
      <div className="pr-24 mb-4">
        <h3 className="font-semibold text-foreground text-base leading-tight mb-1.5 group-hover:text-cyan transition-colors">
          {business.name}
        </h3>
        <span className={`text-xs font-mono font-medium ${catColor}`}>
          {business.category}
        </span>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1.5 mb-4">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={11}
              className={
                i < Math.floor(business.rating)
                  ? "text-warning fill-warning"
                  : "text-muted-foreground"
              }
            />
          ))}
        </div>
        <span className="text-xs font-mono text-foreground font-medium">
          {business.rating}
        </span>
        <span className="text-xs text-muted-foreground">
          ({business.reviewCount} reviews)
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2.5 mb-4">
        {/* Address */}
        <div className="flex items-start gap-2.5">
          <MapPin size={13} className="text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-xs text-muted-foreground leading-tight">
            {business.address}, {business.city}, {business.state}
          </span>
        </div>

        {/* Phone */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Phone size={13} className="text-muted-foreground shrink-0" />
            <span className="text-xs font-mono text-foreground">
              {business.phone || "—"}
            </span>
          </div>
          {business.phone && (
            <button
              onClick={() => copyToClipboard(business.phone, "phone")}
              className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-cyan"
              title="Copy phone number"
            >
              {copied === "phone" ? (
                <Check size={12} className="text-success" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Mail size={13} className="text-muted-foreground shrink-0" />
            {emailSearched ? (
              email ? (
                <span className="text-xs font-mono text-foreground truncate">
                  {email}
                  {emailConfidence != null && (
                    <span className="ml-1 text-muted-foreground">({emailConfidence}%)</span>
                  )}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground italic">No email found</span>
              )
            ) : (
              <button
                onClick={handleFindEmail}
                disabled={emailLoading}
                className="text-xs font-medium text-cyan hover:underline disabled:opacity-60 flex items-center gap-1"
              >
                {emailLoading ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Find Email"
                )}
              </button>
            )}
          </div>
          {emailSearched && email && (
            <button
              onClick={() => copyToClipboard(email, "email")}
              className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-cyan shrink-0"
              title="Copy email"
            >
              {copied === "email" ? (
                <Check size={12} className="text-success" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          )}
        </div>

        {/* Poor website details */}
        {isPoor && business.websiteUrl && (
          <div className="flex items-start gap-2.5">
            {business.websiteIssues?.includes('Site down') ? (
              <WifiOff size={13} className="text-destructive shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <a
                href={business.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-muted-foreground hover:text-cyan truncate flex items-center gap-1 transition-colors"
              >
                {business.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 30)}
                {business.websiteUrl.length > 33 && '...'}
                <ExternalLink size={10} />
              </a>
              {business.websiteIssues && business.websiteIssues.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {business.websiteIssues.map((issue) => (
                    <span
                      key={issue}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-warning/10 text-warning border border-warning/20"
                    >
                      {issue}
                    </span>
                  ))}
                  {business.websiteScore !== null && business.websiteScore !== undefined && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-destructive/10 text-destructive border border-destructive/20">
                      Score {business.websiteScore}/100
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis toggle */}
        {(business.websiteAnalysis || business.websiteRecommendations?.length) && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="flex items-center gap-1 text-[11px] font-medium text-cyan hover:underline"
            >
              <Lightbulb size={11} />
              {showAnalysis ? "Hide" : "View"} Analysis
              {showAnalysis ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {showAnalysis && (
              <div className="mt-2 space-y-2 p-2.5 rounded-lg bg-secondary/60 border border-border">
                {business.websiteAnalysis && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{business.websiteAnalysis}</p>
                )}
                {business.websiteRecommendations && business.websiteRecommendations.length > 0 && (
                  <ul className="space-y-1">
                    {business.websiteRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <span className="text-cyan font-mono shrink-0">{i + 1}.</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: year + employees */}
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        {business.yearEstablished && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar size={11} />
            <span className="text-xs font-mono">Est. {business.yearEstablished}</span>
          </div>
        )}
        {business.employees && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users size={11} />
            <span className="text-xs font-mono">{business.employees} emp</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2">
        {/* Copy Info */}
        <button
          onClick={() =>
            copyToClipboard(
              [
                business.name,
                `${business.address}, ${business.city}, ${business.state}`,
                business.phone,
                email,
                business.websiteUrl,
              ]
                .filter(Boolean)
                .join("\n"),
              "all"
            )
          }
          className="flex-1 h-8 rounded-lg border border-cyan/30 text-cyan text-xs font-medium hover:bg-cyan/10 transition-all flex items-center justify-center gap-1.5"
        >
          {copied === "all" ? (
            <>
              <Check size={12} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy Info
            </>
          )}
        </button>

        {/* Copy Pitch */}
        <button
          onClick={handleCopyPitch}
          className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:border-cyan/30 hover:text-cyan hover:bg-cyan/5 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          title="Copy outreach pitch to clipboard"
        >
          {copied === "pitch" ? (
            <>
              <Check size={12} className="text-success" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardCopy size={12} />
              Pitch
            </>
          )}
        </button>

        {/* Save Lead */}
        <button
          onClick={handleSaveLead}
          disabled={saved || saving}
          className={`h-8 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
            saved
              ? "border-success/30 text-success bg-success/10 cursor-default"
              : "border-border text-muted-foreground hover:border-cyan/30 hover:text-cyan hover:bg-cyan/5"
          }`}
          title={saved ? "Lead saved" : "Save this lead"}
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : saved ? (
            <>
              <BookmarkCheck size={12} />
              Saved
            </>
          ) : (
            <>
              <Bookmark size={12} />
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
};
