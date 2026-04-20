import { supabase } from "@/integrations/supabase/client";
import { Business, SearchMode } from "@/data/mockBusinesses";

export type SearchResult = {
  businesses: Business[];
  location?: string;
  total: number;
  error?: string;
};

export const findBusinessesWithoutWebsites = async (
  city: string,
  category: string,
  mode: SearchMode = "no_website"
): Promise<SearchResult> => {
  const { data, error } = await supabase.functions.invoke("find-businesses", {
    body: { city, category, mode },
  });

  if (error) {
    console.error("Edge function error:", error);
    return {
      businesses: [],
      total: 0,
      error: error.message || "Failed to search. Please try again.",
    };
  }

  if (data?.error) {
    return {
      businesses: [],
      total: 0,
      error: data.error,
    };
  }

  return {
    businesses: data?.businesses ?? [],
    location: data?.location,
    total: data?.total ?? 0,
  };
};
