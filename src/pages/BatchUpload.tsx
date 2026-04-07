import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Clipboard, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";
import { Business } from "@/data/mockBusinesses";
import { saveLead, isLeadSaved } from "@/lib/savedLeadsApi";
import { useToast } from "@/components/ui/use-toast";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

interface CompanyRow {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
}

const emptyRow = (): CompanyRow => ({
  id: crypto.randomUUID(),
  name: "", category: "", city: "", state: "", phone: "", email: "", website: "",
});

export default function BatchUpload() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CompanyRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [tab, setTab] = useState<"manual" | "csv" | "paste">("manual");

  const updateRow = (id: string, field: keyof CompanyRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const handleCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { toast({ title: "Empty CSV", variant: "destructive" }); return; }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const aliases: Record<string, string[]> = {
      name: ["name", "businessname", "business", "company", "companyname"],
      category: ["category", "type", "industry"],
      city: ["city", "town"],
      state: ["state", "st", "region"],
      phone: ["phone", "phonenumber", "tel"],
      email: ["email", "emailaddress"],
      website: ["website", "url", "site"],
    };

    const colMap: Record<string, number> = {};
    for (const [field, names] of Object.entries(aliases)) {
      const idx = headers.findIndex(h => names.includes(h));
      if (idx !== -1) colMap[field] = idx;
    }

    const parsed: CompanyRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const name = cols[colMap.name ?? -1] || "";
      if (!name) continue;
      parsed.push({
        id: crypto.randomUUID(),
        name,
        category: cols[colMap.category ?? -1] || "",
        city: cols[colMap.city ?? -1] || "",
        state: cols[colMap.state ?? -1] || "",
        phone: cols[colMap.phone ?? -1] || "",
        email: cols[colMap.email ?? -1] || "",
        website: cols[colMap.website ?? -1] || "",
      });
    }

    setRows(parsed);
    toast({ title: `Imported ${parsed.length} companies from CSV` });
  };

  const handlePaste = () => {
    const lines = pasteText.split(/\n/).filter(l => l.trim());
    const parsed: CompanyRow[] = lines.map(line => {
      const parts = line.split(/[,\t]/).map(s => s.trim());
      return {
        id: crypto.randomUUID(),
        name: parts[0] || "",
        category: parts[1] || "",
        city: parts[2] || "",
        state: parts[3] || "",
        phone: parts[4] || "",
        email: parts[5] || "",
        website: parts[6] || "",
      };
    });
    setRows(parsed);
    setPasteText("");
    toast({ title: `Parsed ${parsed.length} companies` });
  };

  const handleSaveAll = async () => {
    const valid = rows.filter(r => r.name.trim());
    if (!valid.length) { toast({ title: "No companies to save", variant: "destructive" }); return; }

    setSaving(true);
    setSaved(0);
    setSkipped(0);
    let newCount = 0;
    let skipCount = 0;

    for (const row of valid) {
      const biz: Business = {
        id: row.id,
        name: row.name,
        category: row.category || "Unknown",
        address: "",
        city: row.city || "Unknown",
        state: row.state || "",
        phone: row.phone || "",
        email: row.email || undefined,
        rating: 0,
        reviewCount: 0,
        hasWebsite: !!row.website,
        websiteUrl: row.website || undefined,
      };

      // Check if this lead already exists before saving
      const alreadyExists = await isLeadSaved(biz.id);
      if (alreadyExists) {
        skipCount++;
        setSkipped(skipCount);
        continue;
      }

      const res = await saveLead(biz, row.email || undefined);
      if (!res.error) {
        newCount++;
      } else {
        skipCount++;
      }
      setSaved(newCount);
      setSkipped(skipCount);
    }

    setSaving(false);

    if (skipCount > 0 && newCount > 0) {
      toast({
        title: `Saved ${newCount} new leads`,
        description: `${skipCount} duplicate${skipCount !== 1 ? "s" : ""} skipped (already in pipeline)`,
      });
    } else if (skipCount > 0 && newCount === 0) {
      toast({
        title: "All duplicates",
        description: `All ${skipCount} companies were already in your pipeline`,
        variant: "destructive",
      });
    } else {
      toast({ title: `Saved ${newCount} leads to pipeline` });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Batch Upload</h1>
          <p className="text-muted-foreground mt-1">Import companies in bulk — CSV, paste, or manual entry</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving ({saved} new{skipped > 0 ? `, ${skipped} skipped` : ""})...
            </>
          ) : (
            <><Save className="w-4 h-4" /> Save All to Pipeline</>
          )}
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 mb-6 w-fit">
        {(["manual", "csv", "paste"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "manual" ? "Manual Entry" : t === "csv" ? "CSV Upload" : "Paste List"}
          </button>
        ))}
      </div>

      {tab === "csv" && (
        <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center mb-6">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">Drop a CSV file or click to upload</p>
          <p className="text-sm text-muted-foreground mb-4">Columns: Name, Category, City, State, Phone, Email, Website</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleCSV(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
            <Upload className="w-4 h-4 inline mr-2" />Choose File
          </button>
        </div>
      )}

      {tab === "paste" && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-3">Paste company data — one per line. Use commas or tabs to separate: Name, Category, City, State, Phone, Email, Website</p>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder={"Acme Corp, Restaurant, London, UK, +44123456, acme@mail.com, acme.com\nBob's Plumbing, Plumber, Manchester, UK, +44789012"}
            className="w-full bg-background border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={6}
          />
          <button onClick={handlePaste} disabled={!pasteText.trim()} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
            <Clipboard className="w-4 h-4 inline mr-2" />Parse Companies
          </button>
        </div>
      )}

      {/* Spreadsheet-style table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-3 py-3 text-muted-foreground font-medium w-8">#</th>
                <th className="text-left px-3 py-3 text-muted-foreground font-medium">Name *</th>
                <th className="text-left px-3 py-3 text-muted-foreground font-medium">Category</th>
                <th className="text-left px-3 py-3 text-muted-foreground font-medium">City</th>
                <th className="text-left px-3 py-3 text-muted-foreground font-medium">State</th>
                <th className="text-left px-3 py-3 text-muted-foreground font-medium">Phone</th>
                <th className="text-left px-3 py-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left px-3 py-3 text-muted-foreground font-medium">Website</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-3 py-1 text-muted-foreground">{i + 1}</td>
                  {(["name", "category", "city", "state", "phone", "email", "website"] as const).map(field => (
                    <td key={field} className="px-1 py-1">
                      <input
                        value={row[field]}
                        onChange={e => updateRow(row.id, field, e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1.5 text-foreground text-sm focus:outline-none"
                        placeholder={field === "name" ? "Company name" : ""}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    <button onClick={() => removeRow(row.id)} className="p-1 text-muted-foreground hover:text-red-500 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-border">
          <button onClick={addRow} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <Plus className="w-4 h-4" /> Add row
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">{rows.filter(r => r.name.trim()).length} companies ready to save</p>
    </div>
  );
}
