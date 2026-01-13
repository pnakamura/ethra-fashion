import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
