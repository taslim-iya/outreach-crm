import { useState, createContext, useContext, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useAppMode } from '@/hooks/useAppMode';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Mail,
  Inbox,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
  Calendar,
  LogOut,
  StickyNote,
  Menu,
  PieChart,
  CheckSquare,
  Shield,
  Building2,
  Search,
  Handshake,
  MessageCircle,
} from 'lucide-react';
import { useUnreadEmailCount } from '@/hooks/useEmails';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const fundraisingNav: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Investors', href: '/investors', icon: TrendingUp },
  { name: 'Cap Table', href: '/cap-table', icon: PieChart },
  { name: 'Outreach', href: '/outreach', icon: Mail },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const dealSourcingNav: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Deal Pipeline', href: '/deal-sourcing', icon: TrendingUp },
  { name: 'Target Universe', href: '/target-universe', icon: Search },
  { name: 'Brokers', href: '/brokers', icon: Handshake },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Outreach', href: '/outreach', icon: Mail },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Analytics', href: '/deal-sourcing-analytics', icon: BarChart3 },
];

const bottomNav = [
  { name: 'AI Assistant', href: '/assistant', icon: Sparkles },
  { name: 'Support', href: '/support', icon: MessageCircle },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const adminNav = [
  { name: 'Admin Panel', href: '/admin', icon: Shield },
];

const SidebarContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

function ModeToggle() {
  const { mode, setMode } = useAppMode();
  return (
    <div className="flex rounded-lg bg-sidebar-accent/30 p-0.5">
      <button
        onClick={() => setMode('fundraising')}
        className={cn(
          'flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-all duration-200',
          mode === 'fundraising'
            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
        )}
      >
        Fundraising
      </button>
      <button
        onClick={() => setMode('deal-sourcing')}
        className={cn(
          'flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-all duration-200',
          mode === 'deal-sourcing'
            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
        )}
      >
        Deal Sourcing
      </button>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: unreadCount } = useUnreadEmailCount();
  const { isDemoMode, exitDemoMode } = useDemoMode();
  const { mode } = useAppMode();

  const handleSignOut = async () => {
    if (isDemoMode) {
      exitDemoMode();
      navigate('/auth');
      return;
    }
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (isDemoMode) return 'G';
    if (!user?.email) return 'U';
    const name = user.user_metadata?.full_name || user.email;
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDisplayName = () => {
    if (isDemoMode) return 'Guest';
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--gradient-sidebar)' }}>
      {/* Brand logo in sidebar header */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <BrandLogo
          variant="light"
          titleClassName="text-base text-white"
          iconClassName="bg-white/10 backdrop-blur-sm border border-white/10"
        />
      </div>
      {/* Mode toggle */}
      <div className="px-3 pt-4 pb-2">
        <ModeToggle />
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {(mode === 'deal-sourcing' ? dealSourcingNav : fundraisingNav).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => onNavigate?.()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-sidebar-primary')} />
              {item.name}
              {item.name === 'Inbox' && unreadCount ? (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground font-medium min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : isActive ? (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {bottomNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => onNavigate?.()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                item.name === 'AI Assistant' && 'group'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-sidebar-primary', item.name === 'AI Assistant' && 'group-hover:text-sidebar-primary transition-colors')} />
              {item.name}
              {item.name === 'AI Assistant' && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary font-medium">NEW</span>
              )}
            </Link>
          );
        })}

        {/* Admin section */}
        <div className="pt-2 mt-2 border-t border-sidebar-border/50">
          <p className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-sidebar-foreground/40">Admin</p>
          {adminNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => onNavigate?.()}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'text-sidebar-primary')} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium text-sidebar-accent-foreground">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{getDisplayName()}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{isDemoMode ? 'Demo Mode' : user?.email}</p>
          </div>
          <button onClick={handleSignOut} className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar hidden lg:flex flex-col">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const { open, setOpen } = useSidebar();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="p-0 w-64 border-r-0">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export function MobileHeader() {
  const { setOpen } = useSidebar();
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border flex items-center px-4">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="mr-3">
        <Menu className="w-5 h-5" />
      </Button>
      <BrandLogo
        variant="mark"
        showTitle
        iconClassName="w-7 h-7 rounded-lg gradient-primary text-primary-foreground"
        titleClassName="font-semibold text-foreground"
      />
    </header>
  );
}
