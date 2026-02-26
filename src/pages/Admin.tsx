import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, ImageIcon, Shield } from 'lucide-react';

// Lazy-load admin sub-pages
import AdminAnalytics from './AdminAnalytics';
import BrandAssets from './BrandAssets';

export default function Admin() {
  const [tab, setTab] = useState('analytics');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Admin Panel"
        description="Platform analytics, brand assets, and administration"
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="brand" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Brand Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AdminAnalytics embedded />
        </TabsContent>

        <TabsContent value="brand">
          <BrandAssets embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
