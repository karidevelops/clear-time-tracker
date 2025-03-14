
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import WeeklyView from "./components/WeeklyView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route 
            path="/weekly" 
            element={
              <Layout>
                <div className="py-6">
                  <WeeklyView />
                </div>
              </Layout>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <Layout>
                <div className="py-6">
                  <h1 className="text-3xl font-bold text-reportronic-800">Reports</h1>
                  <div className="mt-8 text-center text-gray-500">
                    Report functionality coming soon.
                  </div>
                </div>
              </Layout>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
