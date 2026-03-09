import { PageHeader } from '@/components/ui/PageHeader';
import AdminAnalytics from './AdminAnalytics';

export default function Admin() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Admin Panel"
        description="Platform analytics and administration"
      />
      <div className="mt-4">
        <AdminAnalytics embedded />
      </div>
    </div>
  );
}
