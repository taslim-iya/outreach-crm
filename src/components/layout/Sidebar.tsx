import { useState, createContext, useContext, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Building2,
  Mail,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
  Calendar,
  LogOut,
  StickyNote,
  Menu,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Investors', href: '/investors', icon: TrendingUp },
  { name: 'Deals', href: '/deals', icon: Building2 },
  { name: 'Outreach', href: '/outreach', icon: Mail },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const bottomNav = [
  { name: 'AI Assistant', href: '/assistant', icon: Sparkles },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Context for mobile sidebar state
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const name = user.user_metadata?.full_name || user.email;
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const handleLinkClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--gradient-sidebar)' }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-semibold text-white tracking-tight">DealScope</span>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider font-medium">Search Fund CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-sidebar-primary')} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {bottomNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                item.name === 'AI Assistant' && 'group'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5',
                  isActive && 'text-sidebar-primary',
                  item.name === 'AI Assistant' && 'group-hover:text-sidebar-primary transition-colors'
                )}
              />
              {item.name}
              {item.name === 'AI Assistant' && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary font-medium">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium text-sidebar-accent-foreground">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{getDisplayName()}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Solo Searcher</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            title="Sign out"
          >
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
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="mr-3"
      >
        <Menu className="w-5 h-5" />
      </Button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">DealScope</span>
      </div>
    </header>
  );
}
