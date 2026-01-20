import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { TemporarySeasonProvider } from "@/contexts/TemporarySeasonContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { BackgroundSettingsProvider } from "@/contexts/BackgroundSettingsContext";
import { ArtBackground } from "@/components/layout/ArtBackground";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Wardrobe from "./pages/Wardrobe";
import Chromatic from "./pages/Chromatic";
import Canvas from "./pages/Canvas";
import Voyager from "./pages/Voyager";
import VirtualTryOn from "./pages/VirtualTryOn";
import Recommendations from "./pages/Recommendations";
import Subscription from "./pages/Subscription";
import Admin from "./pages/Admin";
import Events from "./pages/Events";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays "fresh"
      gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
      refetchOnWindowFocus: false, // Avoid refetch on window focus
      retry: 1, // Only 1 retry on failure
    },
  },
});

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <SubscriptionProvider>
            <TemporarySeasonProvider>
              <AccessibilityProvider>
                <BackgroundSettingsProvider>
                  <TooltipProvider>
                    {children}
                  </TooltipProvider>
                </BackgroundSettingsProvider>
              </AccessibilityProvider>
            </TemporarySeasonProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <ArtBackground />
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/wardrobe" element={<Wardrobe />} />
        <Route path="/chromatic" element={<Chromatic />} />
        <Route path="/canvas" element={<Canvas />} />
        <Route path="/voyager" element={<Voyager />} />
        <Route path="/provador" element={<VirtualTryOn />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/events" element={<Events />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <AppProviders>
    <AppRoutes />
  </AppProviders>
);

export default App;
