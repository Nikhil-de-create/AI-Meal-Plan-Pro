import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { MealPlanForm } from "@/components/meal-plan-form";
import { Calendar, Heart, ShoppingBasket, Plus, BookOpen, ShoppingCart, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { getIngredientIcon, extractIngredientName } from "@/lib/ingredient-icons";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: mealPlans, isLoading: mealPlansLoading } = useQuery({
    queryKey: ["/api/mealplans"],
  });

  const recentMealPlans = mealPlans?.slice(0, 3) || [];

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Dashboard" 
        description="Welcome back! Here's your meal planning overview."
      />

      <div className="p-8 overflow-y-auto h-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm border border-neutral-100 dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 text-sm font-medium">Active Meal Plans</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-900 mt-1">
                    {statsLoading ? "..." : stats?.activePlans || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-primary w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-neutral-100 dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 text-sm font-medium">Favorite Recipes</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-900 mt-1">
                    {statsLoading ? "..." : stats?.favoriteRecipes || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Heart className="text-secondary w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-neutral-100 dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 text-sm font-medium">Grocery Lists</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-900 mt-1">
                    {statsLoading ? "..." : stats?.groceryLists || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <ShoppingBasket className="text-accent w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Meal Plans */}
          <Card className="shadow-sm border border-neutral-100 dark:border-border">
            <div className="p-6 border-b border-neutral-100 dark:border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-900 font-inter">Recent Meal Plans</h3>
                <Link href="/meal-plans">
                  <a className="text-primary text-sm font-medium hover:text-blue-700">View All</a>
                </Link>
              </div>
            </div>
            
            <CardContent className="p-6">
              {mealPlansLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-100 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-100 dark:bg-neutral-100 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-neutral-100 dark:bg-neutral-100 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMealPlans.length > 0 ? (
                <div className="space-y-4">
                  {recentMealPlans.map((plan: any) => (
                    <div key={plan.id} className="flex items-center justify-between p-4 border border-neutral-100 dark:border-border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
                          <Calendar className="text-white w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-900">{plan.name}</h4>
                          <p className="text-sm text-neutral-500">
                            {plan.duration} days • {new Date(plan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Link href="/meal-plans">
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">No meal plans yet</p>
                  <p className="text-sm text-neutral-400">Create your first meal plan to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border border-neutral-100 dark:border-border">
            <div className="p-6 border-b border-neutral-100 dark:border-border">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-900 font-inter">Quick Actions</h3>
            </div>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                <MealPlanForm />

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/recipes">
                    <Button
                      variant="outline"
                      className="w-full p-4 h-auto bg-secondary/5 border-secondary/10 hover:bg-secondary/10 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="text-secondary w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-medium text-neutral-900 dark:text-neutral-900">Browse Recipes</h5>
                          <p className="text-sm text-neutral-500">Discover new dishes</p>
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/grocery-lists">
                    <Button
                      variant="outline"
                      className="w-full p-4 h-auto bg-accent/5 border-accent/10 hover:bg-accent/10 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="text-accent w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-medium text-neutral-900 dark:text-neutral-900">Grocery List</h5>
                          <p className="text-sm text-neutral-500">Auto-generate lists</p>
                        </div>
                      </div>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
