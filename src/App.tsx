import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, Users, Upload, Globe } from "lucide-react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Outreach from "./pages/Outreach";
import BatchUpload from "./pages/BatchUpload";
import MockBuilder from "./pages/MockBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/", label: "Search", icon: Search, end: true },
  { to: "/outreach", label: "Outreach", icon: Users },
  { to: "/upload", label: "Batch Upload", icon: Upload },
  { to: "/mockup", label: "Mock Website", icon: Globe },
];

function TopNav() {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-1">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-cyan flex items-center justify-center">
            <span className="text-primary-foreground font-mono font-bold text-xs">N</span>
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            no<span className="text-cyan">site</span>
            <span className="text-muted-foreground font-light">.finder</span>
          </span>
        </div>

        {/* Nav links */}
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "text-cyan bg-cyan/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4" />
                {label}
                {/* Active underline indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-cyan rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TopNav />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="/upload" element={<BatchUpload />} />
          <Route path="/mockup" element={<MockBuilder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
