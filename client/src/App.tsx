import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { isAuthenticated } from "@/lib/auth";
import Dashboard from "@/pages/dashboard";
import MealPlans from "@/pages/meal-plans";
import Recipes from "@/pages/recipes";
import CookingSession from "@/pages/cooking-session";
import GroceryLists from "@/pages/grocery-lists";
import Pantry from "@/pages/pantry";
import Preferences from "@/pages/preferences";
import AdminDashboard from "@/pages/admin";
import Discover from "@/pages/discover";
import FindFriends from "@/pages/find-friends";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated: authState, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!authState) {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-background">
      <Sidebar />
      {children}
    </div>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated: authState, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!authState) {
    return <Redirect to="/auth" />;
  }
  
  if (user?.role !== 'super_admin') {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-background">
      <Sidebar />
      {children}
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  if (isAuthenticated()) {
    return <Redirect to="/" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <PublicRoute>
          <Auth />
        </PublicRoute>
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/meal-plans">
        <ProtectedRoute>
          <MealPlans />
        </ProtectedRoute>
      </Route>
      
      <Route path="/recipes">
        <ProtectedRoute>
          <Recipes />
        </ProtectedRoute>
      </Route>
      
      <Route path="/cooking-session/:recipeId">
        <ProtectedRoute>
          <CookingSession />
        </ProtectedRoute>
      </Route>
      
      <Route path="/grocery-lists">
        <ProtectedRoute>
          <GroceryLists />
        </ProtectedRoute>
      </Route>
      
      <Route path="/pantry">
        <ProtectedRoute>
          <Pantry />
        </ProtectedRoute>
      </Route>
      
      <Route path="/preferences">
        <ProtectedRoute>
          <Preferences />
        </ProtectedRoute>
      </Route>
      
      <Route path="/discover">
        <ProtectedRoute>
          <Discover />
        </ProtectedRoute>
      </Route>
      
      <Route path="/find-friends">
        <ProtectedRoute>
          <FindFriends />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
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
