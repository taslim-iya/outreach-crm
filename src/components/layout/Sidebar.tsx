import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useAppMode } from '@/hooks/useAppMode';
import { useUserRole } from '@/hooks/useUserRole';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
  GripVertical,
  Flame,
  Target,
  GitBranch,
  UserCheck,
} from 'lucide-react';
import { useUnreadEmailCount } from '@/hooks/useEmails';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const DEFAULT_FUNDRAISING_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/outreach', icon: Mail },
  { name: 'Sequences', href: '/sequences', icon: GitBranch },
  { name: 'Lead Finder', href: '/leads', icon: Search },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Investors', href: '/investors', icon: TrendingUp },
  { name: 'Cap Table', href: '/cap-table', icon: PieChart },
  { name: 'Email Warmup', href: '/email-warmup', icon: Flame },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const DEFAULT_DEAL_SOURCING_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/outreach', icon: Mail },
  { name: 'Sequences', href: '/sequences', icon: GitBranch },
  { name: 'Lead Finder', href: '/leads', icon: Search },
  { name: 'Deals', href: '/deal-sourcing', icon: TrendingUp },
  { name: 'Target Universe', href: '/target-universe', icon: Target },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Brokers', href: '/brokers', icon: Handshake },
  { name: 'Email Warmup', href: '/email-warmup', icon: Flame },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Analytics', href: '/deal-sourcing-analytics', icon: BarChart3 },
];

const DEFAULT_BOTTOM_NAV: NavItem[] = [
  { name: 'AI Assistant', href: '/assistant', icon: Sparkles },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Support', href: '/support', icon: MessageCircle },
];

const adminNav = [
  { name: 'Admin Panel', href: '/admin', icon: Shield },
];

// Icon lookup for rehydrating from localStorage
const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, Users, TrendingUp, Mail, Inbox, FileText, BarChart3,
  Settings, Sparkles, Calendar, StickyNote, PieChart, CheckSquare,
  Shield, Building2, Search, Handshake, MessageCircle, Flame, Target,
  GitBranch, UserCheck,
};

function getIconForName(name: string, defaults: NavItem[]): typeof LayoutDashboard {
  return defaults.find(i => i.name === name)?.icon || LayoutDashboard;
}

function usePersistedNav(key: string, defaults: NavItem[]): [NavItem[], (items: NavItem[]) => void] {
  const [items, setItems] = useState<NavItem[]>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as { name: string; href: string }[];
        // Rehydrate icons and handle added/removed items
        const rehydrated = parsed
          .map(p => {
            const match = defaults.find(d => d.href === p.href);
            return match ? { ...match } : null;
          })
          .filter(Boolean) as NavItem[];
        // Add any new default items not in saved order
        defaults.forEach(d => {
          if (!rehydrated.find(r => r.href === d.href)) {
            rehydrated.push(d);
          }
        });
        return rehydrated;
      }
    } catch { /* ignore */ }
    return defaults;
  });

  const setAndPersist = useCallback((newItems: NavItem[]) => {
    setItems(newItems);
    localStorage.setItem(key, JSON.stringify(newItems.map(i => ({ name: i.name, href: i.href }))));
  }, [key]);

  return [items, setAndPersist];
}

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
        onClick={() => setMode('campaigns')}
        className={cn(
          'flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-all duration-200',
          mode === 'campaigns'
            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
        )}
      >
        Campaigns
      </button>
      <button
        onClick={() => setMode('sequences')}
        className={cn(
          'flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-all duration-200',
          mode === 'sequences'
            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
        )}
      >
        Sequences
      </button>
    </div>
  );
}

function NavItemLink({ item, isActive, onNavigate, showBadge, badgeCount }: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
  showBadge?: boolean;
  badgeCount?: number;
}) {
  return (
    <Link
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
      {item.name === 'Inbox' && showBadge && badgeCount ? (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground font-medium min-w-[18px] text-center">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : item.name === 'AI Assistant' ? (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary font-medium">NEW</span>
      ) : isActive ? (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
      ) : null}
    </Link>
  );
}

function SidebarContentInner({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: unreadCount } = useUnreadEmailCount();
  const { isDemoMode, exitDemoMode } = useDemoMode();
  const { mode } = useAppMode();
  const { isAdmin } = useUserRole();

  const [fundraisingNav, setFundraisingNav] = usePersistedNav('sidebar-campaigns-order', DEFAULT_FUNDRAISING_NAV);
  const [dealSourcingNav, setDealSourcingNav] = usePersistedNav('sidebar-dealsourcing-order', DEFAULT_DEAL_SOURCING_NAV);
  const [bottomNavItems, setBottomNavItems] = usePersistedNav('sidebar-bottom-order', DEFAULT_BOTTOM_NAV);

  const mainNav = mode === 'sequences' ? dealSourcingNav : fundraisingNav;
  const setMainNav = mode === 'sequences' ? setDealSourcingNav : setFundraisingNav;

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index && source.droppableId === destination.droppableId) return;
    const droppableId = source.droppableId;

    if (droppableId === 'main-nav') {
      const reordered = [...mainNav];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setMainNav(reordered);
    } else if (droppableId === 'bottom-nav') {
      const reordered = [...bottomNavItems];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setBottomNavItems(reordered);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--gradient-sidebar)' }}>
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <BrandLogo
          variant="light"
          titleClassName="text-base text-white"
          iconClassName="bg-white/10 backdrop-blur-sm border border-white/10"
        />
      </div>
      <div className="px-3 pt-4 pb-2">
        <ModeToggle />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="main-nav">
          {(provided) => (
            <nav
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 px-3 py-2 space-y-1 overflow-y-auto"
            >
              {mainNav.map((item, index) => (
                <Draggable key={item.href} draggableId={`main-${item.href}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn('group/drag relative', snapshot.isDragging && 'z-50')}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-0.5 opacity-0 group-hover/drag:opacity-60 transition-opacity cursor-grab"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-sidebar-foreground/40" />
                      </div>
                      <NavItemLink
                        item={item}
                        isActive={location.pathname === item.href}
                        onNavigate={onNavigate}
                        showBadge={!!unreadCount}
                        badgeCount={unreadCount}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </nav>
          )}
        </Droppable>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          <Droppable droppableId="bottom-nav">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                {bottomNavItems.map((item, index) => (
                  <Draggable key={item.href} draggableId={`bottom-${item.href}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn('group/drag relative', snapshot.isDragging && 'z-50')}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-0.5 opacity-0 group-hover/drag:opacity-60 transition-opacity cursor-grab"
                        >
                          <GripVertical className="w-3.5 h-3.5 text-sidebar-foreground/40" />
                        </div>
                        <NavItemLink
                          item={item}
                          isActive={location.pathname === item.href}
                          onNavigate={onNavigate}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Admin section - only visible to admins */}
          {isAdmin && (
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
          )}
        </div>
      </DragDropContext>

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
      <SidebarContentInner />
    </aside>
  );
}

export function MobileSidebar() {
  const { open, setOpen } = useSidebar();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="p-0 w-64 border-r-0">
        <SidebarContentInner onNavigate={() => setOpen(false)} />
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
