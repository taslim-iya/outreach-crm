import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, MobileSidebar, MobileHeader, SidebarProvider } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isDemoMode, exitDemoMode } = useDemoMode();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-secondary/30">
        <Sidebar />
        <MobileSidebar />
        <MobileHeader />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="hidden lg:flex h-14 items-center justify-end px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
            <NotificationBell />
          </div>
          {isDemoMode && (
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Demo Mode</span>
                <span className="text-muted-foreground">— Viewing sample data (read-only)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exitDemoMode();
                  navigate('/auth');
                }}
              >
                Sign Up to Get Started
              </Button>
            </div>
          )}
          <div className="min-h-screen">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
