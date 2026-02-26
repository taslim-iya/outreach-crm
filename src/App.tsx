import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppModeProvider } from "@/hooks/useAppMode";
import { BrandProvider } from "@/hooks/useBrandSettings";
import { BrandHeadTags } from "@/components/brand/BrandHeadTags";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Investors from "./pages/Investors";
import Deals from "./pages/Deals";
import NotesPage from "./pages/NotesPage";
import Outreach from "./pages/Outreach";
import Documents from "./pages/Documents";
import CalendarPage from "./pages/CalendarPage";
import Analytics from "./pages/Analytics";
import CapTable from "./pages/CapTable";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";
import Inbox from "./pages/Inbox";
import Tasks from "./pages/Tasks";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
// Deal Sourcing pages
import TargetUniverse from "./pages/TargetUniverse";
import DealSourcingDeals from "./pages/DealSourcingDeals";
import DealProfile from "./pages/DealProfile";
import BrokersPage from "./pages/BrokersPage";
import DealSourcingAnalytics from "./pages/DealSourcingAnalytics";
import BrandAssets from "./pages/BrandAssets";
import AdminAnalytics from "./pages/AdminAnalytics";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrandProvider>
        <AppModeProvider>
          <BrandHeadTags />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/inbox" element={<Inbox />} />
                        <Route path="/contacts" element={<Contacts />} />
                        {/* Fundraising */}
                        <Route path="/investors" element={<Investors />} />
                        <Route path="/cap-table" element={<CapTable />} />
                        {/* Deal Sourcing */}
                        <Route path="/targets" element={<TargetUniverse />} />
                        <Route path="/ds-deals" element={<DealSourcingDeals />} />
                        <Route path="/deal/:id" element={<DealProfile />} />
                        <Route path="/brokers" element={<BrokersPage />} />
                        <Route path="/ds-analytics" element={<DealSourcingAnalytics />} />
                        {/* Shared */}
                        <Route path="/deals" element={<Deals />} />
                        <Route path="/notes" element={<NotesPage />} />
                        <Route path="/outreach" element={<Outreach />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/assistant" element={<Assistant />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/brand" element={<BrandAssets />} />
                        <Route path="/admin-analytics" element={<AdminAnalytics />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AppModeProvider>
        </BrandProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
