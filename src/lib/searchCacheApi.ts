import { supabase } from "@/integrations/supabase/client";
import { Business, SearchMode } from "@/data/mockBusinesses";

function makeSearchKey(city: string, category: string, mode: SearchMode): string {
  return `${city.trim().toLowerCase()}|${category.trim().toLowerCase()}|${mode}`;
}

export async function getCachedSearch(
  city: string,
  category: string,
  mode: SearchMode
): Promise<{ businesses: Business[]; location?: string } | null> {
  const key = makeSearchKey(city, category, mode);
  const { data, error } = await (supabase.from("search_cache") as any)
    .select("results, location_label")
    .eq("search_key", key)
    .maybeSingle();

  if (error || !data) return null;
  return {
    businesses: (data.results as unknown as Business[]) ?? [],
    location: data.location_label ?? undefined,
  };
}

export async function saveSearchCache(
  city: string,
  category: string,
  mode: SearchMode,
  businesses: Business[],
  location?: string,
  source: "search" | "csv_upload" = "search"
) {
  const key = makeSearchKey(city, category, mode);
  await (supabase.from("search_cache") as any).upsert(
    {
      search_key: key,
      city: city.trim(),
      category: category.trim(),
      mode,
      source,
      results: businesses as unknown as Record<string, unknown>[],
      result_count: businesses.length,
      location_label: location ?? null,
    },
    { onConflict: "search_key" }
  );
}

export async function getSearchHistory(): Promise<
  { id: string; city: string; category: string; mode: string; source: string; result_count: number; created_at: string }[]
> {
  const { data } = await (supabase.from("search_cache") as any)
    .select("id, city, category, mode, source, result_count, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as any[]) ?? [];
}

export async function loadCachedById(id: string): Promise<{ businesses: Business[]; location?: string; city: string; category: string; mode: string } | null> {
  const { data, error } = await (supabase.from("search_cache") as any)
    .select("results, location_label, city, category, mode")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    businesses: (data.results as unknown as Business[]) ?? [],
    location: data.location_label ?? undefined,
    city: data.city,
    category: data.category,
    mode: data.mode,
  };
}

/** Get all cached place_ids to exclude from future searches */
export async function getCachedPlaceIds(): Promise<Set<string>> {
  const { data } = await (supabase.from("search_cache") as any)
    .select("results");
  if (!data) return new Set();
  const ids = new Set<string>();
  for (const row of data) {
    const businesses = row.results as unknown as Business[];
    if (Array.isArray(businesses)) {
      for (const b of businesses) {
        if (b.id) ids.add(b.id);
      }
    }
  }
  return ids;
}
