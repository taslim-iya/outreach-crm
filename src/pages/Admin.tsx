import { PageHeader } from '@/components/ui/PageHeader';
import AdminAnalytics from './AdminAnalytics';
import { InvestorReplyTracker } from '@/components/admin/InvestorReplyTracker';

export default function Admin() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Admin Panel"
        description="Platform analytics and administration"
      />
      <div className="mt-4 space-y-6">
        <InvestorReplyTracker />
        <AdminAnalytics embedded />
      </div>
    </div>
  );
}
