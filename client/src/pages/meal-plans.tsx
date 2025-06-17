import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { MealPlanForm } from "@/components/meal-plan-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Users, Trash2, Eye, Wand2, ChefHat, Timer, Shuffle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getIngredientIcon, extractIngredientName } from "@/lib/ingredient-icons";

export default function MealPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [mealPlanKey, setMealPlanKey] = useState(0);
  const [showCuisineDialog, setShowCuisineDialog] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("");
  const [mealToShuffle, setMealToShuffle] = useState<any>(null);

  const { data: mealPlans, isLoading } = useQuery({
    queryKey: ["/api/mealplans"],
  });

  const deleteMealPlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/mealplans/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal plan deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mealplans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal plan.",
        variant: "destructive",
      });
    },
  });

  const shuffleMealMutation = useMutation({
    mutationFn: async ({ mealPlanId, mealIndex, currentMeal, preferredCuisine }: { mealPlanId: number, mealIndex: number, currentMeal: any, preferredCuisine?: string }) => {
      const response = await apiRequest("POST", `/api/mealplans/${mealPlanId}/shuffle-meal`, {
        mealIndex,
        currentMeal,
        preferredCuisine
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const alternativeMealName = data?.alternativeMeal?.name || "a new meal";
      
      toast({
        title: "Success", 
        description: `Meal replaced with "${alternativeMealName}"`,
      });
      
      // Immediately update the selected meal plan with the new meal
      if (selectedMealPlan && data?.alternativeMeal && typeof data?.mealIndex === 'number') {
        const updatedMeals = [...(selectedMealPlan.meals || [])];
        if (data.mealIndex >= 0 && data.mealIndex < updatedMeals.length) {
          updatedMeals[data.mealIndex] = data.alternativeMeal;
          
          const updatedMealPlan = {
            ...selectedMealPlan,
            meals: updatedMeals
          };
          
          setSelectedMealPlan(updatedMealPlan);
          
          // Force React to re-render by updating the key
          setMealPlanKey(prev => prev + 1);
        }
      }
      
      // Invalidate and refetch queries to refresh the main list
      queryClient.invalidateQueries({ queryKey: ["/api/mealplans"] });
      queryClient.refetchQueries({ queryKey: ["/api/mealplans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to shuffle meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this meal plan?")) {
      deleteMealPlanMutation.mutate(id);
    }
  };

  const handleViewMealPlan = (plan: any) => {
    setSelectedMealPlan(plan);
    setShowDetailDialog(true);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Meal Plans" 
        description="Manage your AI-generated meal plans and create new ones."
        showGenerateButton
        onGenerateClick={() => setShowCreateDialog(true)}
      />

      <div className="p-8 overflow-y-auto h-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-neutral-100 dark:bg-neutral-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-neutral-100 dark:bg-neutral-100 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-100 rounded"></div>
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-100 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : mealPlans && mealPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mealPlans.map((plan: any) => (
              <Card key={plan.id} className="shadow-sm border border-neutral-100 dark:border-border hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-900">
                        {plan.name}
                      </CardTitle>
                      {plan.description && (
                        <p className="text-sm text-neutral-500 mt-1">{plan.description}</p>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.isActive 
                        ? 'bg-secondary/10 text-secondary' 
                        : 'bg-neutral-100 dark:bg-neutral-100 text-neutral-500'
                    }`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4 text-sm text-neutral-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{plan.duration} days</span>
                      </div>
                      {plan.dietType && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span className="capitalize">{plan.dietType}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-neutral-500">
                      <Clock className="w-4 h-4" />
                      <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {plan.meals ? `${plan.meals.length} meals planned` : 'No meals'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewMealPlan(plan)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(plan.id)}
                        disabled={deleteMealPlanMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-900 mb-2">No meal plans yet</h3>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
              Get started by creating your first AI-generated meal plan tailored to your preferences.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-blue-700">
              <Wand2 className="w-4 h-4 mr-2" />
              Create Your First Meal Plan
            </Button>
          </div>
        )}

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <div />
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate New Meal Plan</DialogTitle>
            </DialogHeader>
            <MealPlanForm />
          </DialogContent>
        </Dialog>

        {/* Meal Plan Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <ChefHat className="w-5 h-5" />
                <span>{selectedMealPlan?.name}</span>
              </DialogTitle>
              {selectedMealPlan?.description && (
                <p className="text-sm text-neutral-500 mt-1">{selectedMealPlan.description}</p>
              )}
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh] pr-4" key={mealPlanKey}>
              {selectedMealPlan?.meals && selectedMealPlan.meals.length > 0 ? (
                <div className="space-y-4">
                  {selectedMealPlan.meals.map((meal: any, index: number) => (
                    <Card key={`${mealPlanKey}-${index}-${meal.name}`} className="border border-neutral-100 dark:border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg font-semibold">{meal.name}</CardTitle>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant="outline" className="capitalize">
                                {meal.type}
                              </Badge>
                              <div className="flex items-center space-x-1 text-sm text-neutral-500">
                                <Timer className="w-4 h-4" />
                                <span>{meal.prepTime + meal.cookTime} min</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-neutral-500">
                                <Users className="w-4 h-4" />
                                <span>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-primary">
                              {meal.nutrition?.calories || 0} cal
                            </div>
                            <div className="text-xs text-neutral-500">
                              P: {meal.nutrition?.protein || 0}g | C: {meal.nutrition?.carbs || 0}g | F: {meal.nutrition?.fat || 0}g
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMealToShuffle({
                                mealPlanId: selectedMealPlan.id,
                                mealIndex: index,
                                currentMeal: meal
                              });
                              setShowCuisineDialog(true);
                            }}
                            disabled={shuffleMealMutation.isPending}
                            className="flex items-center space-x-1"
                          >
                            <Shuffle className="w-4 h-4" />
                            <span>Shuffle</span>
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {meal.description && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {meal.description}
                          </p>
                        )}
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2">Ingredients</h4>
                            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                              {meal.ingredients?.map((ingredient: string, i: number) => {
                                const ingredientName = extractIngredientName(ingredient);
                                const icon = getIngredientIcon(ingredientName);
                                return (
                                  <li key={i} className="flex items-center space-x-3">
                                    <span className="text-lg flex-shrink-0">{icon}</span>
                                    <span className="leading-relaxed">{ingredient}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm mb-2">Instructions</h4>
                            <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                              {meal.instructions?.map((instruction: string, i: number) => (
                                <li key={i} className="flex items-start space-x-2">
                                  <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span className="leading-relaxed">{instruction}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                        
                        {index < selectedMealPlan.meals.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No meals found in this plan.</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Cuisine Selection Dialog */}
        <Dialog open={showCuisineDialog} onOpenChange={setShowCuisineDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shuffle className="w-5 h-5" />
                <span>Choose Cuisine Style</span>
              </DialogTitle>
              <p className="text-sm text-neutral-500 mt-1">
                Select a cuisine style for your replacement meal
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine Preference</Label>
                <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                  <SelectTrigger id="cuisine">
                    <SelectValue placeholder="Choose a cuisine style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Cuisine</SelectItem>
                    <SelectItem value="american">American</SelectItem>
                    <SelectItem value="italian">Italian</SelectItem>
                    <SelectItem value="mexican">Mexican</SelectItem>
                    <SelectItem value="asian">Asian</SelectItem>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="chinese">Chinese</SelectItem>
                    <SelectItem value="thai">Thai</SelectItem>
                    <SelectItem value="greek">Greek</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCuisineDialog(false);
                    setSelectedCuisine("");
                    setMealToShuffle(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (mealToShuffle) {
                      shuffleMealMutation.mutate({
                        ...mealToShuffle,
                        preferredCuisine: selectedCuisine === "any" ? undefined : selectedCuisine
                      });
                      setShowCuisineDialog(false);
                      setSelectedCuisine("");
                      setMealToShuffle(null);
                    }
                  }}
                  disabled={shuffleMealMutation.isPending}
                  className="bg-primary hover:bg-blue-700"
                >
                  {shuffleMealMutation.isPending ? "Shuffling..." : "Shuffle Meal"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
