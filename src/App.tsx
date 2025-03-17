
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import WeeklyView from "./components/WeeklyView";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ClientsProjects from "./pages/ClientsProjects";
import { LanguageProvider } from "./context/LanguageContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clients-projects" element={<ClientsProjects />} />
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
                    <Reports />
                  </div>
                </Layout>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <Layout>
                  <div className="py-6">
                    <Settings />
                  </div>
                </Layout>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
