import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface BrandSettings {
  id: string;
  user_id: string;
  site_title: string;
  site_subtitle: string;
  meta_description: string;
  og_title: string | null;
  og_description: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  logo_full_url: string | null;
  logo_mark_url: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  apple_touch_icon_url: string | null;
  og_image_url: string | null;
  twitter_image_url: string | null;
  default_thumbnail_url: string | null;
  email_header_logo_url: string | null;
  mobile_app_icon_url: string | null;
  asset_version: number;
  created_at: string;
  updated_at: string;
}

const DEFAULTS: Omit<BrandSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  site_title: 'Acquire CRM',
  site_subtitle: 'Search Fund Platform',
  meta_description: 'The modern CRM for search fund professionals.',
  og_title: null,
  og_description: null,
  twitter_title: null,
  twitter_description: null,
  primary_color: '#1e3a5f',
  secondary_color: '#f5f5f7',
  background_color: '#fcfcfd',
  text_color: '#1a2332',
  accent_color: '#d4a853',
  logo_full_url: null,
  logo_mark_url: null,
  logo_light_url: null,
  logo_dark_url: null,
  favicon_url: null,
  apple_touch_icon_url: null,
  og_image_url: null,
  twitter_image_url: null,
  default_thumbnail_url: null,
  email_header_logo_url: null,
  mobile_app_icon_url: null,
  asset_version: 1,
};

// Asset upload config with validation rules
export const ASSET_CONFIG = {
  logo_full: { label: 'Full Logo', key: 'logo_full_url' as const, maxSize: 2 * 1024 * 1024, accept: '.png,.jpg,.jpeg,.svg,.webp', recommended: '400×100px' },
  logo_mark: { label: 'Logo Mark / Icon', key: 'logo_mark_url' as const, maxSize: 1 * 1024 * 1024, accept: '.png,.jpg,.jpeg,.svg,.webp', recommended: '128×128px' },
  logo_light: { label: 'Logo (Light Version)', key: 'logo_light_url' as const, maxSize: 2 * 1024 * 1024, accept: '.png,.svg,.webp', recommended: '400×100px' },
  logo_dark: { label: 'Logo (Dark Version)', key: 'logo_dark_url' as const, maxSize: 2 * 1024 * 1024, accept: '.png,.svg,.webp', recommended: '400×100px' },
  favicon: { label: 'Favicon', key: 'favicon_url' as const, maxSize: 512 * 1024, accept: '.png,.ico,.svg', recommended: '32×32px' },
  apple_touch_icon: { label: 'Apple Touch Icon', key: 'apple_touch_icon_url' as const, maxSize: 512 * 1024, accept: '.png', recommended: '180×180px' },
  og_image: { label: 'Social Share Image (OG)', key: 'og_image_url' as const, maxSize: 5 * 1024 * 1024, accept: '.png,.jpg,.jpeg,.webp', recommended: '1200×630px' },
  twitter_image: { label: 'Twitter/X Card Image', key: 'twitter_image_url' as const, maxSize: 5 * 1024 * 1024, accept: '.png,.jpg,.jpeg,.webp', recommended: '1200×628px' },
  default_thumbnail: { label: 'Default Thumbnail', key: 'default_thumbnail_url' as const, maxSize: 2 * 1024 * 1024, accept: '.png,.jpg,.jpeg,.webp', recommended: '300×300px' },
  email_header_logo: { label: 'Email Header Logo', key: 'email_header_logo_url' as const, maxSize: 1 * 1024 * 1024, accept: '.png,.jpg,.jpeg', recommended: '600×120px' },
  mobile_app_icon: { label: 'Mobile App Icon', key: 'mobile_app_icon_url' as const, maxSize: 1 * 1024 * 1024, accept: '.png', recommended: '512×512px' },
} as const;

interface BrandContextType {
  settings: BrandSettings | null;
  isLoading: boolean;
  defaults: typeof DEFAULTS;
  /** Get an asset URL with fallback */
  getAsset: (key: keyof typeof DEFAULTS) => string | null;
  /** Get site title with fallback */
  getSiteTitle: () => string;
  getSiteSubtitle: () => string;
  getMetaDescription: () => string;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['brand_settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('brand_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BrandSettings | null;
    },
    enabled: !!user?.id,
  });

  const getAsset = useCallback((key: keyof typeof DEFAULTS): string | null => {
    if (!settings) return null;
    const val = (settings as any)[key];
    if (!val) return null;
    // Append cache buster
    const sep = val.includes('?') ? '&' : '?';
    return `${val}${sep}v=${settings.asset_version || 1}`;
  }, [settings]);

  const getSiteTitle = useCallback(() => settings?.site_title || DEFAULTS.site_title, [settings]);
  const getSiteSubtitle = useCallback(() => settings?.site_subtitle || DEFAULTS.site_subtitle, [settings]);
  const getMetaDescription = useCallback(() => settings?.meta_description || DEFAULTS.meta_description, [settings]);

  return (
    <BrandContext.Provider value={{ settings, isLoading, defaults: DEFAULTS, getAsset, getSiteTitle, getSiteSubtitle, getMetaDescription }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrandSettings() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrandSettings must be used within BrandProvider');
  return ctx;
}

// Mutation hooks for the admin page
export function useUpdateBrandSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<BrandSettings>) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if row exists
      const { data: existing } = await supabase
        .from('brand_settings' as any)
        .select('id, asset_version')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('brand_settings' as any)
          .update({ ...updates, asset_version: ((existing as any).asset_version || 1) + 1 } as any)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brand_settings' as any)
          .insert({ ...updates, user_id: user.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand_settings'] });
      toast.success('Brand settings updated');
    },
    onError: () => toast.error('Failed to update brand settings'),
  });
}

export function useUploadBrandAsset() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, assetKey }: { file: File; assetKey: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${assetKey}.${ext}`;

      // Upload to brand-assets bucket
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Update brand_settings
      const urlField = ASSET_CONFIG[assetKey as keyof typeof ASSET_CONFIG]?.key;
      if (!urlField) throw new Error('Invalid asset key');

      const { data: existing } = await supabase
        .from('brand_settings' as any)
        .select('id, asset_version')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('brand_settings' as any)
          .update({ [urlField]: publicUrl, asset_version: ((existing as any).asset_version || 1) + 1 } as any)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brand_settings' as any)
          .insert({ user_id: user.id, [urlField]: publicUrl } as any);
        if (error) throw error;
      }

      return publicUrl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand_settings'] });
      toast.success('Asset uploaded');
    },
    onError: (e) => toast.error(`Upload failed: ${e.message}`),
  });
}

export function useRemoveBrandAsset() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (assetKey: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const urlField = ASSET_CONFIG[assetKey as keyof typeof ASSET_CONFIG]?.key;
      if (!urlField) throw new Error('Invalid asset key');

      const { error } = await supabase
        .from('brand_settings' as any)
        .update({ [urlField]: null } as any)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand_settings'] });
      toast.success('Asset removed');
    },
    onError: () => toast.error('Failed to remove asset'),
  });
}
