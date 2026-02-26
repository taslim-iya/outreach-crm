import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Mail, MessageCircle } from 'lucide-react';

export default function Support() {
  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Support"
        description="Need help? We're here for you."
      />

      <Card className="mt-6 p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Get in Touch</h2>
        <p className="text-muted-foreground mb-6">
          If you're experiencing any issues or have questions, please reach out to us via email and we'll get back to you as soon as possible.
        </p>
        <a
          href="mailto:taslim@mungerlongview.com"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Mail className="w-4 h-4" />
          taslim@mungerlongview.com
        </a>
      </Card>
    </div>
  );
}
