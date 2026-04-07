import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AISettings {
  id: string;
  user_id: string;
  api_key_encrypted: string | null;
  model: string;
  enabled: boolean;
  ai_message_generator: boolean;
  ai_followup_intelligence: boolean;
  ai_auto_responder: boolean;
  ai_lead_qualification: boolean;
  ai_meeting_scheduler: boolean;
  ai_sequence_optimizer: boolean;
  ai_stage_manager: boolean;
  ai_subject_tester: boolean;
  ai_daily_briefing: boolean;
  ai_task_suggestions: boolean;
  auto_response_tone: string;
  auto_response_send_mode: string;
  blackout_start_hour: number;
  blackout_end_hour: number;
  response_language: string;
  working_hours_start: number;
  working_hours_end: number;
  working_days: string[];
  timezone: string;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AICallOptions {
  systemPrompt?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

interface AICallResult {
  content: string;
  usage?: { input_tokens: number; output_tokens: number };
}

// Fetch AI settings
export function useAISettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as AISettings | null;
    },
    enabled: !!user,
  });
}

// Update AI settings
export function useUpdateAISettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<AISettings>) => {
      if (!user) throw new Error('Not authenticated');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('ai_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('ai_settings')
          .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('ai_settings')
          .insert({ ...updates, user_id: user.id } as Record<string, unknown>)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      toast.success('AI settings saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
}

// Check if AI is configured (has API key)
export function useAIConfigured() {
  const { data: settings } = useAISettings();
  return {
    isConfigured: !!settings?.api_key_encrypted && settings?.enabled,
    settings,
  };
}

// Core AI call function with retry logic
async function callClaudeAPI(apiKey: string, model: string, options: AICallOptions): Promise<AICallResult> {
  const { systemPrompt, messages, maxTokens = 1024, temperature = 0.7 } = options;

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  };
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as Record<string, Record<string, string>>)?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const textBlock = data.content?.find((b: Record<string, string>) => b.type === 'text');
      return {
        content: textBlock?.text || '',
        usage: data.usage,
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
      }
    }
  }
  throw lastError || new Error('AI call failed after 3 retries');
}

// Main AI call hook
export function useAICall() {
  const { data: settings } = useAISettings();

  return useMutation({
    mutationFn: async (options: AICallOptions): Promise<AICallResult> => {
      if (!settings?.api_key_encrypted) {
        throw new Error('AI not configured. Please add your Anthropic API key in Settings.');
      }
      if (!settings.enabled) {
        throw new Error('AI features are disabled. Enable them in Settings.');
      }
      return callClaudeAPI(settings.api_key_encrypted, settings.model, options);
    },
  });
}

// Convenience hook for generating email content
export function useAIGenerateEmail() {
  const aiCall = useAICall();

  return useMutation({
    mutationFn: async ({ context, instruction }: { context: string; instruction: string }) => {
      const result = await aiCall.mutateAsync({
        systemPrompt: `You are an expert cold email copywriter. Write concise, personalized emails that get responses. Keep emails under 150 words. Use a professional but friendly tone. Never use generic filler. Every sentence should add value.`,
        messages: [{ role: 'user', content: `Context about the recipient:\n${context}\n\nInstruction: ${instruction}` }],
        maxTokens: 512,
        temperature: 0.7,
      });
      return result.content;
    },
  });
}

// Convenience hook for analyzing sentiment
export function useAIAnalyzeSentiment() {
  const aiCall = useAICall();

  return useMutation({
    mutationFn: async (emailBody: string) => {
      const result = await aiCall.mutateAsync({
        systemPrompt: `Analyze the sentiment and intent of this email reply. Respond with ONLY a JSON object (no markdown): {"sentiment": "positive"|"negative"|"neutral", "intent": "interested"|"not_interested"|"meeting_request"|"question"|"out_of_office"|"unsubscribe"|"other", "confidence": 0.0-1.0, "summary": "one sentence summary", "suggestedAction": "description of next best action"}`,
        messages: [{ role: 'user', content: emailBody }],
        maxTokens: 256,
        temperature: 0.3,
      });
      try {
        return JSON.parse(result.content);
      } catch {
        return { sentiment: 'neutral', intent: 'other', confidence: 0.5, summary: 'Could not analyze', suggestedAction: 'Review manually' };
      }
    },
  });
}

// Convenience hook for scoring/qualifying leads
export function useAIQualifyLead() {
  const aiCall = useAICall();

  return useMutation({
    mutationFn: async (leadContext: string) => {
      const result = await aiCall.mutateAsync({
        systemPrompt: `You are a lead qualification expert. Based on the lead data provided, score and qualify this lead. Respond with ONLY a JSON object (no markdown): {"score": 0-100, "qualification": "hot"|"warm"|"cold"|"disqualified", "reasons": ["reason1", "reason2"], "suggestedAction": "what to do next", "priority": "high"|"medium"|"low"}`,
        messages: [{ role: 'user', content: leadContext }],
        maxTokens: 256,
        temperature: 0.3,
      });
      try {
        return JSON.parse(result.content);
      } catch {
        return { score: 50, qualification: 'warm', reasons: ['Unable to analyze'], suggestedAction: 'Review manually', priority: 'medium' };
      }
    },
  });
}

// Convenience hook for optimizing subject lines
export function useAIOptimizeSubject() {
  const aiCall = useAICall();

  return useMutation({
    mutationFn: async ({ subject, context }: { subject: string; context?: string }) => {
      const result = await aiCall.mutateAsync({
        systemPrompt: `You are an email subject line optimization expert. Analyze and improve subject lines for cold outreach emails. Respond with ONLY a JSON object (no markdown): {"rating": 1-10, "predictedOpenRate": "low"|"medium"|"high", "issues": ["issue1"], "suggestions": [{"subject": "improved subject", "reason": "why this is better"}], "bestPractices": ["tip1"]}`,
        messages: [{ role: 'user', content: `Subject line: "${subject}"${context ? `\nContext: ${context}` : ''}` }],
        maxTokens: 512,
        temperature: 0.5,
      });
      try {
        return JSON.parse(result.content);
      } catch {
        return { rating: 5, predictedOpenRate: 'medium', issues: [], suggestions: [], bestPractices: [] };
      }
    },
  });
}

// Convenience hook for daily briefing
export function useAIBriefing() {
  const aiCall = useAICall();

  return useMutation({
    mutationFn: async (dashboardData: string) => {
      const result = await aiCall.mutateAsync({
        systemPrompt: `You are a CRM assistant providing a daily briefing. Based on the data, provide actionable insights. Respond with ONLY a JSON object (no markdown): {"hotLeads": [{"name": "X", "reason": "why hot"}], "campaignInsights": [{"insight": "text"}], "needsAttention": [{"name": "X", "issue": "what needs attention"}], "bestSendTime": "when to send today", "summary": "2-3 sentence overview"}`,
        messages: [{ role: 'user', content: dashboardData }],
        maxTokens: 1024,
        temperature: 0.5,
      });
      try {
        return JSON.parse(result.content);
      } catch {
        return { hotLeads: [], campaignInsights: [], needsAttention: [], bestSendTime: 'Morning', summary: 'Unable to generate briefing.' };
      }
    },
  });
}

// Convenience hook for task suggestions
export function useAISuggestTasks() {
  const aiCall = useAICall();

  return useMutation({
    mutationFn: async (activityData: string) => {
      const result = await aiCall.mutateAsync({
        systemPrompt: `You are a CRM productivity assistant. Based on CRM activity data, suggest the most impactful tasks. Respond with ONLY a JSON array (no markdown): [{"title": "task title", "description": "why this matters", "priority": "high"|"medium"|"low", "relatedTo": "contact/deal name", "dueIn": "today"|"tomorrow"|"this_week"}]`,
        messages: [{ role: 'user', content: activityData }],
        maxTokens: 512,
        temperature: 0.5,
      });
      try {
        return JSON.parse(result.content);
      } catch {
        return [];
      }
    },
  });
}

// Log an AI action
export function useLogAIAction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ actionType, entityType, entityId, suggestion, status, metadata }: {
      actionType: string;
      entityType?: string;
      entityId?: string;
      suggestion?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('ai_actions')
        .insert({
          user_id: user.id,
          action_type: actionType,
          entity_type: entityType || null,
          entity_id: entityId || null,
          suggestion: suggestion || null,
          status: status || 'pending',
          metadata: metadata || {},
        } as Record<string, unknown>);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-actions'] });
    },
  });
}
