import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import NotFound from "@/pages/not-found";

// Using dynamic imports for JSX files
import FormDashboard from "./pages/FormDashboard";
import FormBuilder from "./pages/FormBuilder";
import FormResponses from "./pages/FormResponses";
import PublicForm from "./pages/PublicForm";
import FormSubmissionSuccess from "./pages/FormSubmissionSuccess";

function Router() {
  // Get the current location to determine if we're on a public route
  const [location] = useLocation();
  const isPublicRoute = location.startsWith('/public/') || location === '/forms/success';

  // Public routes don't show the admin UI (header and sidebar)
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <main className="p-4 lg:p-6">
          <Switch>
            <Route path="/public/forms/:hash" component={PublicForm} />
            <Route path="/forms/success" component={FormSubmissionSuccess} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    );
  }

  // Admin UI with header and sidebar
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-neutral-light">
          <Switch>
            <Route path="/" component={FormDashboard} />
            <Route path="/dashboard" component={FormDashboard} />
            <Route path="/forms/new" component={FormBuilder} />
            <Route path="/forms/:id/edit" component={FormBuilder} />
            <Route path="/forms/:id/responses" component={FormResponses} />
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
