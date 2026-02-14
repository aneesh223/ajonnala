import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AudioAnalysisProvider } from "@/contexts/AudioAnalysisContext";
import { AudioErrorBoundary } from "@/components/AudioErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AudioErrorBoundary>
      <AudioAnalysisProvider
        fftSize={2048}
        smoothingTimeConstant={0.8}
        beatThreshold={1.3}
        beatDebounceMs={100}
        pulsationIntensity={1.0}
        selectionPercentage={0.10}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AudioAnalysisProvider>
    </AudioErrorBoundary>
  </QueryClientProvider>
);

export default App;
