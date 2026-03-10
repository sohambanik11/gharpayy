import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Pipeline from "./pages/Pipeline";
import Visits from "./pages/Visits";
import Conversations from "./pages/Conversations";
import Analytics from "./pages/Analytics";
import Historical from "./pages/Historical";
import SettingsPage from "./pages/SettingsPage";
import LeadCapture from "./pages/LeadCapture";
import Owners from "./pages/Owners";
import Inventory from "./pages/Inventory";
import EffortDashboard from "./pages/EffortDashboard";
import Availability from "./pages/Availability";
import Matching from "./pages/Matching";
import Bookings from "./pages/Bookings";
import ZoneManagement from "./pages/ZoneManagement";
import Explore from "./pages/Explore";
import PropertyDetail from "./pages/PropertyDetail";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import OwnerPortal from "./pages/OwnerPortal";
import OwnerAuth from "./pages/OwnerAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RBACProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-right" expand richColors closeButton />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/property/:propertyId" element={<PropertyDetail />} />
                <Route path="/capture" element={<LeadCapture />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/owner-auth" element={<OwnerAuth />} />
                <Route path="/owner-portal" element={<OwnerPortal />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
                <Route path="/visits" element={<ProtectedRoute><Visits /></ProtectedRoute>} />
                <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/historical" element={<ProtectedRoute><Historical /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/owners" element={<ProtectedRoute><Owners /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/effort" element={<ProtectedRoute><EffortDashboard /></ProtectedRoute>} />
                <Route path="/availability" element={<ProtectedRoute><Availability /></ProtectedRoute>} />
                <Route path="/matching" element={<ProtectedRoute><Matching /></ProtectedRoute>} />
                <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
                <Route path="/zones" element={<ProtectedRoute><ZoneManagement /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RBACProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
