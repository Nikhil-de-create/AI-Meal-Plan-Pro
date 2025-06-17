import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Utensils, LayoutDashboard, Calendar, BookOpen, ShoppingCart, Package, Settings, LogOut, Shield, Compass } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Discover", href: "/discover", icon: Compass },
  { name: "Meal Plans", href: "/meal-plans", icon: Calendar },
  { name: "Recipes", href: "/recipes", icon: BookOpen },
  { name: "Grocery Lists", href: "/grocery-lists", icon: ShoppingCart },
  { name: "Pantry", href: "/pantry", icon: Package },
  { name: "Profile & Settings", href: "/preferences", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white dark:bg-card shadow-lg border-r border-neutral-100 dark:border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100 dark:border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Utensils className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-900 font-inter">AI Meal Assistant</h1>
            <p className="text-xs text-neutral-500">AI-Powered Planning</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                      isActive
                        ? "text-primary bg-blue-50 dark:bg-primary/10"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-50"
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
          
          {/* Admin Link - Only visible to super_admin */}
          {user?.role === 'super_admin' && (
            <li>
              <Link href="/admin">
                <a
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                    location === "/admin"
                      ? "text-primary bg-blue-50 dark:bg-primary/10"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-50"
                  )}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Admin Dashboard
                </a>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-neutral-100 dark:border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.[0] || user?.username?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-900">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
            </p>
            <p className="text-xs text-neutral-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-600"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
