import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AllFeedback from "./pages/AllFeedback";
import SubmitFeedback from "./pages/SubmitFeedback";
import MyFeedback from "./pages/MyFeedback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-neutral-light">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/all-feedback" component={AllFeedback} />
            <Route path="/submit-feedback" component={SubmitFeedback} />
            <Route path="/my-feedback" component={MyFeedback} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
