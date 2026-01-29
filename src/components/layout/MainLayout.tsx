import { ReactNode } from 'react';
import { Sidebar, MobileSidebar, MobileHeader, SidebarProvider } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-secondary/30">
        <Sidebar />
        <MobileSidebar />
        <MobileHeader />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="min-h-screen">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
