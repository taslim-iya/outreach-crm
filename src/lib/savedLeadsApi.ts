import { supabase } from "@/integrations/supabase/client";
import { Business } from "@/data/mockBusinesses";

export type OutreachStatus = "new" | "contacted" | "in_progress" | "closed";

export type SavedLead = {
  id: string;
  place_id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string | null;
  rating: number;
  review_count: number;
  status: OutreachStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const saveLead = async (business: Business, email?: string | null): Promise<{ error?: string }> => {
  const { error } = await supabase.from("saved_leads").upsert(
    {
      place_id: business.id,
      name: business.name,
      category: business.category,
      address: business.address,
      city: business.city,
      state: business.state,
      phone: business.phone,
      email: email ?? business.email ?? null,
      rating: business.rating,
      review_count: business.reviewCount,
      status: "new",
    },
    { onConflict: "place_id", ignoreDuplicates: true }
  );

  if (error) {
    console.error("saveLead error:", error);
    return { error: error.message };
  }
  return {};
};

export const getSavedLeads = async (): Promise<SavedLead[]> => {
  const { data, error } = await supabase
    .from("saved_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSavedLeads error:", error);
    return [];
  }
  return (data ?? []) as SavedLead[];
};

export const updateLeadStatus = async (id: string, status: OutreachStatus): Promise<void> => {
  await supabase.from("saved_leads").update({ status }).eq("id", id);
};

export const updateLeadNotes = async (id: string, notes: string): Promise<void> => {
  await supabase.from("saved_leads").update({ notes }).eq("id", id);
};

export const deleteSavedLead = async (id: string): Promise<void> => {
  await supabase.from("saved_leads").delete().eq("id", id);
};

export const isLeadSaved = async (placeId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("saved_leads")
    .select("id")
    .eq("place_id", placeId)
    .maybeSingle();
  return !!data;
};
