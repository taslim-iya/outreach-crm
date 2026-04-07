import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { BrandProvider } from "@/hooks/useBrandSettings";
import { DemoModeProvider } from "@/hooks/useDemoMode";
import { AppModeProvider } from "@/hooks/useAppMode";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { BrandHeadTags } from "@/components/brand/BrandHeadTags";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Investors from "./pages/Investors";
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
import Deals from "./pages/Deals";
import DealProfile from "./pages/DealProfile";
import DealSourcingDeals from "./pages/DealSourcingDeals";
import DealSourcingAnalytics from "./pages/DealSourcingAnalytics";
import BrokersPage from "./pages/BrokersPage";
import TargetUniverse from "./pages/TargetUniverse";
import Support from "./pages/Support";
import Notifications from "./pages/Notifications";

import Sequences from "./pages/Sequences";
import SequenceBuilder from "./pages/SequenceBuilder";
import CampaignDetail from "./pages/CampaignDetail";
import EmailWarmup from "./pages/EmailWarmup";
import LeadFinder from "./pages/LeadFinder";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminAnalytics from "./pages/AdminAnalytics";
import Admin from "./pages/Admin";
import AdminWelcomeEmail from "./pages/AdminWelcomeEmail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrandProvider>
          <DemoModeProvider>
          <AppModeProvider>
            <BrandHeadTags />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ErrorBoundary>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/inbox" element={<Inbox />} />
                          <Route path="/contacts" element={<Contacts />} />
                          <Route path="/investors" element={<Investors />} />
                          <Route path="/cap-table" element={<CapTable />} />
                          <Route path="/outreach" element={<Outreach />} />
                          <Route path="/documents" element={<Documents />} />
                          <Route path="/calendar" element={<CalendarPage />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/tasks" element={<Tasks />} />
                          <Route path="/deals" element={<Deals />} />
                          <Route path="/deals/:id" element={<DealProfile />} />
                          <Route path="/deal-sourcing" element={<DealSourcingDeals />} />
                          <Route path="/deal-sourcing-analytics" element={<DealSourcingAnalytics />} />
                          <Route path="/brokers" element={<BrokersPage />} />
                          <Route path="/target-universe" element={<TargetUniverse />} />

                          <Route path="/sequences" element={<Sequences />} />
                          <Route path="/sequences/:id" element={<SequenceBuilder />} />
                          <Route path="/campaigns/:id" element={<CampaignDetail />} />
                          <Route path="/email-warmup" element={<EmailWarmup />} />
                          <Route path="/leads" element={<LeadFinder />} />
                          <Route path="/notes" element={<NotesPage />} />
                          <Route path="/support" element={<Support />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/assistant" element={<Assistant />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/admin-analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                          <Route path="/admin/welcome-email" element={<AdminRoute><AdminWelcomeEmail /></AdminRoute>} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                        </ErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AppModeProvider>
          </DemoModeProvider>
        </BrandProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
