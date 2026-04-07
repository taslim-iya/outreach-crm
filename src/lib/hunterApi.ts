import { supabase } from "@/integrations/supabase/client";

export type EmailResult = {
  email: string | null;
  confidence?: number;
  domain?: string;
  error?: string;
};

export const findEmailForBusiness = async (
  businessName: string,
  city?: string,
  state?: string
): Promise<EmailResult> => {
  const { data, error } = await supabase.functions.invoke("find-email", {
    body: { businessName, city, state },
  });

  if (error) {
    console.error("Hunter.io edge function error:", error);
    return { email: null, error: error.message };
  }

  if (data?.error) {
    return { email: null, error: data.error };
  }

  return {
    email: data?.email ?? null,
    confidence: data?.confidence,
    domain: data?.domain,
  };
};
