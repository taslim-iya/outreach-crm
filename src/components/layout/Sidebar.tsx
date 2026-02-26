import { useState, createContext, useContext, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useAppMode, AppMode } from '@/hooks/useAppMode';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Building2,
  Mail,
  Inbox,
  FileText,
  BarChart3,
  Settings,
  ImageIcon,
  Sparkles,
  Calendar,
  LogOut,
  StickyNote,
  Menu,
  PieChart,
  CheckSquare,
  Target,
  Handshake,
  Briefcase,
  Shield,
} from 'lucide-react';
import { useUnreadEmailCount } from '@/hooks/useEmails';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  modes?: AppMode[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Contacts', href: '/contacts', icon: Users },
  // Fundraising
  { name: 'Investors', href: '/investors', icon: TrendingUp, modes: ['fundraising'] },
  { name: 'Cap Table', href: '/cap-table', icon: PieChart, modes: ['fundraising'] },
  // Deal Sourcing
  { name: 'Targets', href: '/targets', icon: Target, modes: ['deal-sourcing'] },
  { name: 'Deals', href: '/ds-deals', icon: Briefcase, modes: ['deal-sourcing'] },
  { name: 'Brokers', href: '/brokers', icon: Handshake, modes: ['deal-sourcing'] },
  // Shared
  { name: 'Outreach', href: '/outreach', icon: Mail },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, modes: ['fundraising'] },
  { name: 'Analytics', href: '/ds-analytics', icon: BarChart3, modes: ['deal-sourcing'] },
];

const bottomNav = [
  { name: 'AI Assistant', href: '/assistant', icon: Sparkles },
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
    <div className="px-3 py-3">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-sidebar-accent/40 border border-sidebar-border/50">
        <button
          onClick={() => setMode('fundraising')}
          className={cn(
            'flex-1 text-[11px] font-medium py-1.5 px-2 rounded-md transition-all duration-200 text-center',
            mode === 'fundraising'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
          )}
        >
          Fundraising
        </button>
        <button
          onClick={() => setMode('deal-sourcing')}
          className={cn(
            'flex-1 text-[11px] font-medium py-1.5 px-2 rounded-md transition-all duration-200 text-center',
            mode === 'deal-sourcing'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
          )}
        >
          Deal Sourcing
        </button>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { mode } = useAppMode();
  const { data: unreadCount } = useUnreadEmailCount();

  const filteredNav = navigation.filter(
    (item) => !item.modes || item.modes.includes(mode)
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const name = user.user_metadata?.full_name || user.email;
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--gradient-sidebar)' }}>
      {/* Brand logo in sidebar header */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <BrandLogo
          variant="light"
          showSubtitle
          titleClassName="text-base text-white"
          subtitleClassName="text-sidebar-foreground/60"
          iconClassName="bg-white/10 backdrop-blur-sm border border-white/10"
        />
      </div>

      <ModeToggle />

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
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
            <p className="text-xs text-sidebar-foreground/60 truncate">Solo Searcher</p>
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
      {/* Brand logo in mobile header */}
      <BrandLogo
        variant="mark"
        showTitle
        iconClassName="w-7 h-7 rounded-lg gradient-primary text-primary-foreground"
        titleClassName="font-semibold text-foreground"
      />
    </header>
  );
}
