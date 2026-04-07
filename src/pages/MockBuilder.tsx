import { useState, useRef, useEffect } from "react";
import { Sparkles, Download, Copy, Users, Wand2, Loader2, Eye, RefreshCw, Palette } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getSavedLeads, SavedLead } from "@/lib/savedLeadsApi";
import { buildWebsitePrompt } from "@/lib/websitePrompt";

interface MockConfig {
  businessName: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  style: "modern" | "elegant" | "bold" | "minimal" | "agency" | "warm";
  accentColor: string;
}

const ACCENT_COLORS = [
  { name: "Blue", value: "#2563EB" },
  { name: "Emerald", value: "#059669" },
  { name: "Orange", value: "#EA580C" },
  { name: "Purple", value: "#7C3AED" },
  { name: "Rose", value: "#E11D48" },
  { name: "Teal", value: "#0D9488" },
  { name: "Slate", value: "#334155" },
  { name: "Indigo", value: "#4F46E5" },
];

const STYLES: { key: MockConfig["style"]; label: string; desc: string }[] = [
  { key: "modern", label: "Modern", desc: "Clean SaaS look" },
  { key: "elegant", label: "Elegant", desc: "Luxury/premium feel" },
  { key: "bold", label: "Bold", desc: "High contrast, impactful" },
  { key: "minimal", label: "Minimal", desc: "Lots of white space" },
  { key: "agency", label: "Agency", desc: "Creative/digital agency" },
  { key: "warm", label: "Warm", desc: "Friendly, approachable" },
];

// Business type presets: auto-fill category + recommended accent color
const BUSINESS_PRESETS: { label: string; category: string; color: string }[] = [
  { label: "Plumber",      category: "Plumber",          color: "#2563EB" },
  { label: "Electrician",  category: "Electrician",      color: "#EA580C" },
  { label: "Restaurant",   category: "Restaurant",       color: "#E11D48" },
  { label: "Hair Salon",   category: "Hair Salon",       color: "#7C3AED" },
  { label: "Dentist",      category: "Dentist",          color: "#0D9488" },
  { label: "Landscaper",   category: "Landscaping",      color: "#059669" },
  { label: "Carpenter",    category: "Contractor",       color: "#334155" },
  { label: "Bakery",       category: "Bakery",           color: "#EA580C" },
  { label: "Gym",          category: "Gym",              color: "#4F46E5" },
  { label: "Auto Repair",  category: "Auto Repair",      color: "#334155" },
];

const CATEGORIES = [
  "Restaurant", "Plumber", "Electrician", "Hair Salon", "Dentist", "Lawyer",
  "Accountant", "Auto Repair", "Pet Grooming", "Bakery", "Florist", "Dry Cleaning",
  "Gym", "Spa", "Photographer", "Landscaping", "Roofing", "HVAC",
  "Real Estate Agent", "Cleaning Service", "Tattoo Studio", "Barber",
];

const defaultConfig: MockConfig = {
  businessName: "",
  category: "Restaurant",
  phone: "",
  email: "",
  address: "",
  style: "modern",
  accentColor: "#2563EB",
};

export default function MockBuilder() {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [config, setConfig] = useState<MockConfig>(defaultConfig);
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [generatedHTML, setGeneratedHTML] = useState<string>("");
  const [aiKey, setAiKey] = useState(() => localStorage.getItem("vs-openai-key") || "");

  useEffect(() => {
    getSavedLeads().then(data => setLeads(data || []));
  }, []);

  useEffect(() => {
    if (generatedHTML && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generatedHTML);
        doc.close();
      }
    }
  }, [generatedHTML]);

  const update = (field: keyof MockConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const applyPreset = (preset: typeof BUSINESS_PRESETS[number]) => {
    setConfig(prev => ({
      ...prev,
      category: preset.category,
      accentColor: preset.color,
    }));
    toast({ title: `Applied ${preset.label} preset` });
  };

  const loadFromLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    setSelectedLead(leadId);
    setConfig(prev => ({
      ...prev,
      businessName: lead.name,
      category: lead.category || prev.category,
      phone: lead.phone || "",
      email: lead.email || "",
      address: `${lead.address || ""}, ${lead.city}${lead.state ? ", " + lead.state : ""}`.replace(/^, /, ""),
    }));
    toast({ title: `Loaded ${lead.name}` });
  };

  const saveApiKey = (key: string) => {
    setAiKey(key);
    localStorage.setItem("vs-openai-key", key);
  };

  const generate = async () => {
    if (!config.businessName.trim()) {
      toast({ title: "Enter a business name", variant: "destructive" });
      return;
    }
    if (!aiKey) {
      toast({ title: "Add your OpenAI API key first", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setGeneratedHTML("");

    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openai",
          apiKey: aiKey,
          model: "gpt-4o",
          maxTokens: 16000,
          messages: [{ role: "user", content: buildWebsitePrompt(config) }],
        }),
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error?.message || data.error);

      let html = data.content || "";
      html = html.replace(/^```html?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

      if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
        throw new Error("AI didn't return valid HTML. Try again.");
      }

      setGeneratedHTML(html);
      toast({ title: "Website generated!" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const downloadHTML = () => {
    if (!generatedHTML) return;
    const blob = new Blob([generatedHTML], { type: "text/html" });
    const link = document.createElement("a");
    link.download = `${config.businessName.replace(/\s+/g, "-").toLowerCase()}-website.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast({ title: "HTML downloaded!" });
  };

  const copyHTML = () => {
    if (!generatedHTML) return;
    navigator.clipboard.writeText(generatedHTML);
    toast({ title: "HTML copied to clipboard!" });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Website Generator</h1>
            <p className="text-muted-foreground mt-1">Generate professional websites with GPT-4o for your outreach</p>
          </div>
          {generatedHTML && (
            <div className="flex gap-2">
              <button onClick={copyHTML} className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted transition">
                <Copy className="w-4 h-4" /> Copy HTML
              </button>
              <button onClick={downloadHTML} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition">
                <Download className="w-4 h-4" /> Download HTML
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Business Type Presets */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> Quick Presets
              </h2>
              <div className="grid grid-cols-2 gap-1.5">
                {BUSINESS_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                      config.category === preset.category
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Load from saved leads */}
            {leads.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm"><Users className="w-4 h-4" /> Load from Leads</h2>
                <select value={selectedLead} onChange={e => loadFromLead(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  <option value="">Select a business...</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.city}</option>)}
                </select>
              </div>
            )}

            {/* Business details */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold text-foreground text-sm">Business Details</h2>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Business Name *</label>
                <input value={config.businessName} onChange={e => update("businessName", e.target.value)} placeholder="e.g. Marco's Italian Kitchen" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select value={config.category} onChange={e => update("category", e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                  <input value={config.phone} onChange={e => update("phone", e.target.value)} placeholder="+44 20 1234" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                  <input value={config.email} onChange={e => update("email", e.target.value)} placeholder="info@..." className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Address</label>
                <input value={config.address} onChange={e => update("address", e.target.value)} placeholder="123 High Street, London" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            {/* Style */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm"><Palette className="w-4 h-4" /> Style</h2>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map(c => (
                    <button key={c.value} onClick={() => update("accentColor", c.value)} className={`w-7 h-7 rounded-full border-2 transition ${config.accentColor === c.value ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c.value }} title={c.name} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Layout</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLES.map(s => (
                    <button key={s.key} onClick={() => update("style", s.key)} className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${config.style === s.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`} title={s.desc}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI key */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm"><Wand2 className="w-4 h-4" /> AI</h2>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">OpenAI API Key</label>
                <input value={aiKey} onChange={e => saveApiKey(e.target.value)} type="password" placeholder="sk-..." className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <p className="text-xs text-muted-foreground mt-1">Uses GPT-4o for high-quality output</p>
              </div>
            </div>

            {/* Generate button */}
            <button onClick={generate} disabled={generating || !config.businessName} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition font-medium disabled:opacity-50">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating (~15s)...</> : <><Sparkles className="w-4 h-4" /> Generate with AI</>}
            </button>

            {generatedHTML && (
              <button onClick={generate} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm hover:bg-muted transition text-muted-foreground">
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
            )}
          </div>

          {/* Preview area */}
          <div className="lg:col-span-3">
            {!generatedHTML && !generating ? (
              <div className="bg-card border border-border rounded-xl flex items-center justify-center min-h-[700px]">
                <div className="text-center text-muted-foreground px-6">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium text-lg">AI Website Generator</p>
                  <p className="text-sm mt-2 max-w-md">Pick a business preset, enter the name, and click "Generate with AI". GPT-4o will create a complete, professional website in about 15 seconds.</p>
                  <p className="text-xs mt-4 opacity-60">You can download the HTML file or copy it for outreach.</p>
                </div>
              </div>
            ) : generating ? (
              <div className="bg-card border border-border rounded-xl flex items-center justify-center min-h-[700px]">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary" />
                  <p className="font-medium text-foreground">GPT-4o is building the website...</p>
                  <p className="text-sm text-muted-foreground mt-1">This takes about 10-15 seconds</p>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-[#E5E5E5] px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FDBB2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#27CA40]" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 text-center">
                    www.{config.businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.co.uk
                  </div>
                </div>
                <iframe
                  ref={iframeRef}
                  title="Website Preview"
                  className="w-full border-0"
                  style={{ height: "800px" }}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
