import { useState, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Image, Palette, Globe, Upload, Trash2, Eye, Monitor, Smartphone,
  Share2, Search, Mail, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import {
  useBrandSettings,
  useUpdateBrandSettings,
  useUploadBrandAsset,
  useRemoveBrandAsset,
  ASSET_CONFIG,
  type BrandSettings,
} from '@/hooks/useBrandSettings';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { toast } from 'sonner';

function AssetUploadCard({ assetKey, config }: { assetKey: string; config: typeof ASSET_CONFIG[keyof typeof ASSET_CONFIG] }) {
  const { settings, getAsset } = useBrandSettings();
  const uploadMutation = useUploadBrandAsset();
  const removeMutation = useRemoveBrandAsset();
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUrl = getAsset(config.key);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > config.maxSize) {
      toast.error(`File too large. Max ${(config.maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    uploadMutation.mutate({ file, assetKey });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors">
      {/* Preview */}
      <div className="w-20 h-20 rounded-lg border border-border bg-muted/50 flex items-center justify-center overflow-hidden flex-shrink-0">
        {currentUrl ? (
          <img src={currentUrl} alt={config.label} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <Image className="w-6 h-6 text-muted-foreground/40" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Recommended: {config.recommended}</p>
        <p className="text-xs text-muted-foreground">Max: {(config.maxSize / 1024 / 1024).toFixed(1)}MB • {config.accept}</p>
        {currentUrl && (
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-600">Uploaded</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <input ref={inputRef} type="file" accept={config.accept} className="hidden" onChange={handleFileSelect} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </Button>
        {currentUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeMutation.mutate(assetKey)}
            disabled={removeMutation.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MetadataSection() {
  const { settings, defaults } = useBrandSettings();
  const updateMutation = useUpdateBrandSettings();

  const [form, setForm] = useState({
    site_title: settings?.site_title || defaults.site_title,
    site_subtitle: settings?.site_subtitle || defaults.site_subtitle,
    meta_description: settings?.meta_description || defaults.meta_description,
    og_title: settings?.og_title || '',
    og_description: settings?.og_description || '',
    twitter_title: settings?.twitter_title || '',
    twitter_description: settings?.twitter_description || '',
  });

  const handleSave = () => {
    updateMutation.mutate(form as any);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Site Title</Label>
          <Input value={form.site_title} onChange={(e) => setForm(f => ({ ...f, site_title: e.target.value }))} className="mt-1.5" />
        </div>
        <div>
          <Label>Site Subtitle</Label>
          <Input value={form.site_subtitle} onChange={(e) => setForm(f => ({ ...f, site_subtitle: e.target.value }))} className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label>Meta Description</Label>
        <Input value={form.meta_description} onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))} className="mt-1.5" placeholder="Brief description for search engines" />
        <p className="text-xs text-muted-foreground mt-1">{form.meta_description.length}/160 characters</p>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" /> Open Graph (Social Sharing)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>OG Title</Label>
            <Input value={form.og_title} onChange={(e) => setForm(f => ({ ...f, og_title: e.target.value }))} className="mt-1.5" placeholder="Defaults to site title" />
          </div>
          <div>
            <Label>OG Description</Label>
            <Input value={form.og_description} onChange={(e) => setForm(f => ({ ...f, og_description: e.target.value }))} className="mt-1.5" placeholder="Defaults to meta description" />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Twitter/X Card
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Twitter Title</Label>
            <Input value={form.twitter_title} onChange={(e) => setForm(f => ({ ...f, twitter_title: e.target.value }))} className="mt-1.5" placeholder="Defaults to OG title" />
          </div>
          <div>
            <Label>Twitter Description</Label>
            <Input value={form.twitter_description} onChange={(e) => setForm(f => ({ ...f, twitter_description: e.target.value }))} className="mt-1.5" placeholder="Defaults to OG description" />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="gradient-primary text-primary-foreground">
        {updateMutation.isPending ? 'Saving...' : 'Save Metadata'}
      </Button>
    </div>
  );
}

function ThemeSection() {
  const { settings, defaults } = useBrandSettings();
  const updateMutation = useUpdateBrandSettings();

  const [colors, setColors] = useState({
    primary_color: settings?.primary_color || defaults.primary_color,
    secondary_color: settings?.secondary_color || defaults.secondary_color,
    background_color: settings?.background_color || defaults.background_color,
    text_color: settings?.text_color || defaults.text_color,
    accent_color: settings?.accent_color || defaults.accent_color,
  });

  const handleSave = () => {
    updateMutation.mutate(colors as any);
  };

  const colorFields = [
    { key: 'primary_color' as const, label: 'Primary Color' },
    { key: 'secondary_color' as const, label: 'Secondary Color' },
    { key: 'background_color' as const, label: 'Background Color' },
    { key: 'text_color' as const, label: 'Text Color' },
    { key: 'accent_color' as const, label: 'Accent Color' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {colorFields.map(({ key, label }) => (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => setColors(c => ({ ...c, [key]: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <Input
                value={colors[key]}
                onChange={(e) => setColors(c => ({ ...c, [key]: e.target.value }))}
                className="text-xs font-mono"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Preview</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 rounded" style={{ backgroundColor: colors.primary_color }} />
          <div className="w-12 h-8 rounded" style={{ backgroundColor: colors.secondary_color }} />
          <div className="w-12 h-8 rounded" style={{ backgroundColor: colors.accent_color }} />
          <div className="w-12 h-8 rounded border" style={{ backgroundColor: colors.background_color }} />
          <div className="w-12 h-8 rounded" style={{ backgroundColor: colors.text_color }} />
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background_color, color: colors.text_color }}>
          <p className="text-sm font-semibold">Sample heading text</p>
          <p className="text-xs mt-1" style={{ opacity: 0.7 }}>This is how body text will look with your theme</p>
          <button className="mt-2 px-3 py-1 text-xs rounded text-white" style={{ backgroundColor: colors.primary_color }}>Primary Button</button>
          <button className="mt-2 ml-2 px-3 py-1 text-xs rounded text-white" style={{ backgroundColor: colors.accent_color }}>Accent Button</button>
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="gradient-primary text-primary-foreground">
        {updateMutation.isPending ? 'Saving...' : 'Save Theme'}
      </Button>
    </div>
  );
}

function PreviewSection() {
  const { settings, getAsset, getSiteTitle, getMetaDescription, getSiteSubtitle } = useBrandSettings();

  const ogImage = getAsset('og_image_url');
  const favicon = getAsset('favicon_url');
  const ogTitle = settings?.og_title || getSiteTitle();
  const ogDesc = settings?.og_description || getMetaDescription();
  const twitterTitle = settings?.twitter_title || ogTitle;
  const twitterDesc = settings?.twitter_description || ogDesc;
  const twitterImage = getAsset('twitter_image_url') || ogImage;

  return (
    <div className="space-y-6">
      {/* Website Header Preview */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" /> Website Header
        </h4>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="h-14 px-6 flex items-center justify-between" style={{ background: 'var(--gradient-sidebar)' }}>
            <BrandLogo
              variant="light"
              titleClassName="text-white text-base"
              subtitleClassName="text-white/60"
              iconClassName="bg-white/10 backdrop-blur-sm border border-white/10"
              showSubtitle
            />
            <div className="flex gap-3">
              {['Dashboard', 'Contacts', 'Settings'].map(t => (
                <span key={t} className="text-xs text-white/60">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Preview */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" /> Mobile View
        </h4>
        <div className="w-[320px] border border-border rounded-2xl overflow-hidden mx-auto">
          <div className="h-12 px-4 flex items-center gap-2 border-b border-border bg-background">
            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
              <BrandLogo variant="mark" showTitle={false} iconClassName="w-6 h-6 rounded" />
            </div>
            <span className="text-sm font-semibold">{getSiteTitle()}</span>
          </div>
          <div className="h-48 bg-muted/30 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">App content area</p>
          </div>
        </div>
      </div>

      {/* Social Share Preview */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" /> Social Share Preview
        </h4>
        <div className="max-w-lg border border-border rounded-lg overflow-hidden bg-card">
          <div className="w-full h-52 bg-muted/50 flex items-center justify-center overflow-hidden">
            {ogImage ? (
              <img src={ogImage} alt="OG Preview" className="w-full h-full object-cover" />
            ) : (
              <p className="text-sm text-muted-foreground">No OG image uploaded</p>
            )}
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground uppercase">{window.location.hostname}</p>
            <p className="text-sm font-semibold mt-0.5">{ogTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ogDesc}</p>
          </div>
        </div>
      </div>

      {/* Search Result Preview */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" /> Search Result Preview
        </h4>
        <div className="max-w-lg space-y-1 bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            {favicon ? (
              <img src={favicon} alt="favicon" className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4 rounded bg-primary/20" />
            )}
            <span className="text-xs text-muted-foreground">{window.location.hostname}</span>
          </div>
          <p className="text-base font-medium text-blue-600">{ogTitle}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{ogDesc}</p>
        </div>
      </div>

      {/* Email Header Preview */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" /> Email Header Preview
        </h4>
        <div className="max-w-lg border border-border rounded-lg overflow-hidden bg-white">
          <div className="h-24 flex items-center justify-center bg-muted/30 border-b border-border">
            {getAsset('email_header_logo_url') ? (
              <img src={getAsset('email_header_logo_url')!} alt="Email Logo" className="h-12 object-contain" />
            ) : (
              <BrandLogo variant="full" showSubtitle={false} />
            )}
          </div>
          <div className="p-4">
            <div className="h-3 w-3/4 bg-muted rounded mb-2" />
            <div className="h-3 w-full bg-muted/50 rounded mb-1" />
            <div className="h-3 w-5/6 bg-muted/50 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrandAssetsPage({ embedded }: { embedded?: boolean }) {
  const { settings, isLoading } = useBrandSettings();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const assetGroups = [
    {
      title: 'Logos',
      keys: ['logo_full', 'logo_mark', 'logo_light', 'logo_dark'] as const,
    },
    {
      title: 'Icons & Favicons',
      keys: ['favicon', 'apple_touch_icon', 'mobile_app_icon'] as const,
    },
    {
      title: 'Social & Preview Images',
      keys: ['og_image', 'twitter_image', 'default_thumbnail'] as const,
    },
    {
      title: 'Email',
      keys: ['email_header_logo'] as const,
    },
  ];

  return (
    <div className={embedded ? '' : 'p-6 max-w-5xl mx-auto'}>
      {!embedded && (
        <PageHeader
          title="Brand Assets"
          description="Manage logos, themes, and metadata across your entire app"
        />
      )}

      <Tabs defaultValue="assets" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Image className="w-4 h-4" /> Assets
          </TabsTrigger>
          <TabsTrigger value="metadata" className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Metadata & SEO
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="w-4 h-4" /> Brand Theme
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" /> Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <div className="space-y-6">
            {assetGroups.map((group) => (
              <Card key={group.title} className="goldman-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.keys.map((key) => (
                    <AssetUploadCard key={key} assetKey={key} config={ASSET_CONFIG[key]} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metadata">
          <Card className="goldman-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                <Globe className="w-4 h-4 text-primary" /> SEO & Social Metadata
              </CardTitle>
              <CardDescription>Control how your app appears in search results and social shares</CardDescription>
            </CardHeader>
            <CardContent>
              <MetadataSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card className="goldman-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                <Palette className="w-4 h-4 text-primary" /> Brand Theme
              </CardTitle>
              <CardDescription>Set your brand colors — these values are stored for reference and previews</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="goldman-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                <Eye className="w-4 h-4 text-primary" /> Brand Previews
              </CardTitle>
              <CardDescription>See how your brand appears across different contexts</CardDescription>
            </CardHeader>
            <CardContent>
              <PreviewSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
