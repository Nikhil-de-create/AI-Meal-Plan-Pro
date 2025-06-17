import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Heart, Share2, TrendingUp, Users, MapPin, Clock, Star, Plus, BookOpen, Play, ChefHat, Search, UserPlus, UserMinus, Eye, Timer, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { getIngredientIcon, extractIngredientName } from "@/lib/ingredient-icons";
import { useLocation } from "wouter";
import { SimpleSocialShareDialog } from "@/components/ui/simple-social-share-dialog";

interface TrendingMealPlan {
  id: number;
  name: string;
  description: string;
  cuisine: string;
  likesCount: number;
  sharesCount: number;
  tags: string[];
  imageUrl?: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

interface TrendingRecipe {
  id: number;
  name: string;
  description: string;
  cuisine: string;
  difficulty: string;
  prepTime: number;
  cookTime: number;
  likesCount: number;
  tags: string[];
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

interface UserActivity {
  id: number;
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  activityType: string;
  targetType: string;
  targetId: number;
  targetName: string;
  createdAt: string;
}

export default function Discover() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("trending");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareContent, setShareContent] = useState<{ type: string; id: number; name: string } | null>(null);
  const [selectedTrendingPlan, setSelectedTrendingPlan] = useState<TrendingMealPlan | null>(null);
  const [showTrendingPlanDialog, setShowTrendingPlanDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<TrendingRecipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [, setLocation] = useLocation();

  // Trending meal plans query
  const { data: trendingMealPlans = [], isLoading: loadingMealPlans } = useQuery({
    queryKey: ['/api/discover/trending-meal-plans'],
    enabled: selectedTab === "trending",
  });

  // Trending recipes query
  const { data: trendingRecipes = [], isLoading: loadingRecipes } = useQuery({
    queryKey: ['/api/discover/trending-recipes'],
    enabled: selectedTab === "trending",
  });

  // Friend activity query
  const { data: friendActivity = [], isLoading: loadingActivity } = useQuery({
    queryKey: ['/api/discover/friend-activity'],
    enabled: selectedTab === "friends",
  });



  // Location-based trending query
  const { data: nearbyTrending = [], isLoading: loadingNearby } = useQuery({
    queryKey: ['/api/discover/nearby-trending'],
    enabled: selectedTab === "nearby",
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ contentType, contentId }: { contentType: 'recipe' | 'meal-plan', contentId: number }) => {
      return await apiRequest("POST", `/api/likes/${contentType}`, { contentId });
    },
    onSuccess: () => {
      toast({
        title: "Liked!",
        description: "Added to your liked content",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/discover/trending-meal-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/discover/trending-recipes'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like content",
        variant: "destructive",
      });
    },
  });

  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      return await apiRequest("POST", `/api/user/favorites`, { recipeId });
    },
    onSuccess: () => {
      toast({
        title: "Added to Favorites",
        description: "Recipe saved to your favorites",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to favorites",
        variant: "destructive",
      });
    },
  });

  const handleLike = async (contentType: 'recipe' | 'meal-plan', contentId: number) => {
    likeMutation.mutate({ contentType, contentId });
  };

  const handleAddToFavorites = async (recipeId: number) => {
    addFavoriteMutation.mutate(recipeId);
  };

  // Copy meal plan mutation
  const copyMealPlanMutation = useMutation({
    mutationFn: async ({ mealPlanId }: { mealPlanId: number }) => {
      return await apiRequest("POST", "/api/copy-meal-plan", { mealPlanId });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Added to Your Plans",
        description: `Meal plan copied to your account`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mealplans'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add meal plan",
        variant: "destructive",
      });
    },
  });

  const handleAddToMyPlans = async (planId: number, planName: string) => {
    copyMealPlanMutation.mutate({ mealPlanId: planId });
  };

  const handleTryRecipe = async (recipeId: number, recipeName: string) => {
    // Find the recipe details from trending recipes
    const recipe = trendingRecipes.find((r: any) => r.id === recipeId);
    if (recipe) {
      setSelectedRecipe(recipe);
      setShowRecipeModal(true);
    } else {
      // Fallback: add to favorites
      addFavoriteMutation.mutate(recipeId);
      toast({
        title: "Recipe Added",
        description: `"${recipeName}" added to your favorites to try later`,
      });
    }
  };

  const handleStartCooking = async (recipeId: number) => {
    try {
      const response = await apiRequest("POST", `/api/cooking-sessions/start/${recipeId}`);
      setLocation(`/cooking-session/${recipeId}`);
      toast({
        title: "Cooking Session Started",
        description: "Follow along with step-by-step instructions",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start cooking session",
        variant: "destructive",
      });
    }
  };

  const handleShare = (contentType: 'recipe' | 'meal-plan', contentId: number, contentName: string) => {
    setShareContent({ type: contentType, id: contentId, name: contentName });
    setShowShareDialog(true);
  };

  const shareToSocialMedia = (platform: string) => {
    if (!shareContent) return;
    
    const url = `${window.location.origin}/${shareContent.type}s/${shareContent.id}`;
    const text = `Check out this amazing ${shareContent.type}: ${shareContent.name}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
        navigator.clipboard.writeText(`${text} ${url}`);
        alert('Content copied to clipboard! Paste it in your Instagram story or post.');
        setShowShareDialog(false);
        return;
      case 'tiktok':
        // TikTok doesn't support direct URL sharing, copy to clipboard
        navigator.clipboard.writeText(`${text} ${url}`);
        alert('Content copied to clipboard! Share it on TikTok with your cooking video.');
        setShowShareDialog(false);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareDialog(false);
    }
  };

  const MealPlanCard = ({ plan }: { plan: TrendingMealPlan }) => (
    <Card className="hover:shadow-lg transition-shadow relative overflow-hidden">
      <CardHeader className="relative">
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLike('meal-plan', plan.id)}
            className="bg-white/80 backdrop-blur-sm rounded-full shadow-soft hover:bg-white/90 text-neutral-600 hover:text-red-500 transition-all duration-300"
          >
            <Heart className="w-4 h-4" />
          </Button>
          <SimpleSocialShareDialog
            content={{
              title: plan.name,
              description: plan.description,
              url: window.location.href,
              hashtags: ['mealplan', 'cooking', ...(plan.tags || [])]
            }}
            trigger={
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-soft hover:bg-white/90 text-neutral-600 hover:text-blue-500 transition-all duration-300"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            }
          />
        </div>
        <div className="pr-12">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="secondary">{plan.cuisine}</Badge>
          </div>
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <CardDescription className="mt-1">{plan.description}</CardDescription>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-3">
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
              <span>{plan.author.displayName || plan.author.username}</span>
            </div>
            <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {plan.tags?.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTrendingPlan(plan);
              setShowTrendingPlanDialog(true);
            }}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Plan
          </Button>
          <Button 
            size="sm"
            onClick={() => handleAddToMyPlans(plan.id, plan.name)}
            disabled={copyMealPlanMutation.isPending || likeMutation.isPending}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add to My Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const RecipeCard = ({ recipe }: { recipe: TrendingRecipe }) => (
    <Card className="hover:shadow-lg transition-shadow relative overflow-hidden">
      <CardHeader className="relative">
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLike('recipe', recipe.id)}
            className="bg-white/80 backdrop-blur-sm rounded-full shadow-soft hover:bg-white/90 text-neutral-600 hover:text-red-500 transition-all duration-300"
          >
            <Heart className="w-4 h-4" />
          </Button>
          <SimpleSocialShareDialog
            content={{
              title: recipe.name,
              description: recipe.description,
              url: window.location.href,
              hashtags: ['recipe', 'cooking', ...(recipe.tags || [])]
            }}
            trigger={
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-soft hover:bg-white/90 text-neutral-600 hover:text-blue-500 transition-all duration-300"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            }
          />
        </div>
        <div className="pr-12">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="secondary">{recipe.cuisine}</Badge>
          </div>
          <CardTitle className="text-lg">{recipe.name}</CardTitle>
          <CardDescription className="mt-1">{recipe.description}</CardDescription>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-3">
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
              <span>{recipe.author.displayName || recipe.author.username}</span>
            </div>
            <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.tags?.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex gap-1.5 pt-2">
          <Button 
            size="sm" 
            onClick={() => handleStartCooking(recipe.id)} 
            className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-soft flex-1 h-8 px-2 text-xs"
          >
            <ChefHat className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="whitespace-nowrap">Start Cooking</span>
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              setSelectedRecipe(recipe);
              setShowRecipeModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-soft flex-1 h-8 px-2 text-xs"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="whitespace-nowrap">View Recipe</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ActivityItem = ({ activity }: { activity: UserActivity }) => {
    const getActivityText = () => {
      if (activity.activityType === 'created' && activity.targetType === 'meal_plan') {
        return 'created a new meal plan';
      }
      if (activity.activityType === 'created' && activity.targetType === 'recipe') {
        return 'created a new recipe';
      }
      if (activity.activityType === 'liked' && activity.targetType === 'recipe') {
        return 'liked a recipe';
      }
      if (activity.activityType === 'liked' && activity.targetType === 'meal_plan') {
        return 'liked a meal plan';
      }
      if (activity.activityType === 'shared') {
        return `shared a ${activity.targetType.replace('_', ' ')}`;
      }
      return `${activity.activityType} a ${activity.targetType.replace('_', ' ')}`;
    };

    return (
      <div className="flex items-center space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {(activity.user.displayName || activity.user.username).charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-medium text-gray-900">{activity.user.displayName || activity.user.username}</span>
            {" "}
            <span className="text-gray-600">{getActivityText()}</span>
            {" "}
            <span className="font-medium text-gray-900">"{activity.targetName}"</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(activity.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {activity.targetType === 'meal_plan' && (
            <Badge variant="secondary" className="text-xs">
              <ChefHat className="w-3 h-3 mr-1" />
              Meal Plan
            </Badge>
          )}
          {activity.targetType === 'recipe' && (
            <Badge variant="outline" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              Recipe
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">
          Explore trending recipes, meal plans, and see what your friends are cooking
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trending" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Trending</span>
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Friends</span>
          </TabsTrigger>
          <TabsTrigger value="nearby" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Near You</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Upload</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Trending Meal Plans</h2>
            {loadingMealPlans ? (
              <div className="flex space-x-6 overflow-x-auto pb-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse flex-shrink-0 w-80">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex space-x-6 overflow-x-auto pb-4">
                {trendingMealPlans.map((plan: TrendingMealPlan) => (
                  <div key={plan.id} className="flex-shrink-0 w-80">
                    <MealPlanCard plan={plan} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Trending Recipes</h2>
            {loadingRecipes ? (
              <div className="flex space-x-6 overflow-x-auto pb-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse flex-shrink-0 w-80">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex space-x-6 overflow-x-auto pb-4">
                {trendingRecipes.map((recipe: TrendingRecipe) => (
                  <div key={recipe.id} className="flex-shrink-0 w-80">
                    <RecipeCard recipe={recipe} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="friends" className="space-y-6">
          <FriendsSection />
        </TabsContent>

        <TabsContent value="nearby" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Trending Near You</h2>
            {loadingNearby ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : nearbyTrending.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyTrending.map((item: any) => (
                  item.type === 'meal-plan' ? 
                    <MealPlanCard key={item.id} plan={item} /> :
                    <RecipeCard key={item.id} recipe={item} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No local content yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to share recipes and meal plans in your area
                  </p>
                  <Button>Share Your Recipe</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Recipe</CardTitle>
                <CardDescription>
                  Share your favorite recipe with the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setLocation("/recipes")}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Recipe
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload Meal Plan</CardTitle>
                <CardDescription>
                  Share a complete meal plan for others to follow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setLocation("/meal-plans")}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Meal Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Social Media Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Social Media</DialogTitle>
            <DialogDescription>
              Share this {shareContent?.type} with your friends on social media
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => shareToSocialMedia('twitter')} className="flex items-center space-x-2">
              <span>Twitter</span>
            </Button>
            <Button onClick={() => shareToSocialMedia('facebook')} className="flex items-center space-x-2">
              <span>Facebook</span>
            </Button>
            <Button onClick={() => shareToSocialMedia('instagram')} className="flex items-center space-x-2">
              <span>Instagram</span>
            </Button>
            <Button onClick={() => shareToSocialMedia('tiktok')} className="flex items-center space-x-2">
              <span>TikTok</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trending Meal Plan View Dialog */}
      <Dialog open={showTrendingPlanDialog} onOpenChange={setShowTrendingPlanDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ChefHat className="w-5 h-5" />
              <span>{selectedTrendingPlan?.name}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedTrendingPlan?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedTrendingPlan && (
            <div className="space-y-6">
              {/* Plan Information */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Badge variant="secondary">{selectedTrendingPlan.cuisine}</Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>by {selectedTrendingPlan.author.displayName || selectedTrendingPlan.author.username}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedTrendingPlan.createdAt).toLocaleDateString()}</span>
                </div>
                {selectedTrendingPlan.duration && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{selectedTrendingPlan.duration} days</span>
                  </div>
                )}
              </div>

              {/* Meal Plan Details */}
              {selectedTrendingPlan.meals && (
                <div>
                  <h3 className="font-medium mb-3">Meal Plan Details</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(() => {
                      try {
                        const meals = typeof selectedTrendingPlan.meals === 'string' 
                          ? JSON.parse(selectedTrendingPlan.meals) 
                          : selectedTrendingPlan.meals;
                        
                        if (Array.isArray(meals)) {
                          return meals.map((meal: any, index: number) => (
                            <Card key={index} className="border border-neutral-100 dark:border-border">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-lg font-semibold">{meal.name}</CardTitle>
                                    <div className="flex items-center space-x-4 mt-2">
                                      <Badge variant="outline" className="capitalize">
                                        {meal.type}
                                      </Badge>
                                      {(meal.prepTime || meal.cookTime) && (
                                        <div className="flex items-center space-x-1 text-sm text-neutral-500">
                                          <Timer className="w-4 h-4" />
                                          <span>{(meal.prepTime || 0) + (meal.cookTime || 0)} min</span>
                                        </div>
                                      )}
                                      {meal.servings && (
                                        <div className="flex items-center space-x-1 text-sm text-neutral-500">
                                          <Users className="w-4 h-4" />
                                          <span>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</span>
                                        </div>
                                      )}
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
                                
                                {index < meals.length - 1 && (
                                  <Separator className="mt-4" />
                                )}
                              </CardContent>
                            </Card>
                          ));
                        }
                      } catch (error) {
                        return (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            Meal details available after adding to your plans
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedTrendingPlan.tags && selectedTrendingPlan.tags.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrendingPlan.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{selectedTrendingPlan.likesCount} likes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Share2 className="w-4 h-4" />
                  <span>{selectedTrendingPlan.sharesCount} shares</span>
                </div>
              </div>

              {/* Call to Action */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowTrendingPlanDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleAddToMyPlans(selectedTrendingPlan.id, selectedTrendingPlan.name);
                    setShowTrendingPlanDialog(false);
                  }}
                  disabled={copyMealPlanMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add to My Plans
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recipe Detail Modal */}
      <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2 text-2xl">
                  <ChefHat className="w-6 h-6 text-orange-500" />
                  <span>{selectedRecipe.name}</span>
                </DialogTitle>
                <DialogDescription className="text-base">
                  {selectedRecipe.description}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Recipe Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {selectedRecipe.cuisine}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {selectedRecipe.difficulty}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Total: {selectedRecipe.prepTime + selectedRecipe.cookTime} min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span>Serves: {selectedRecipe.servings || 4}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.tags?.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Ingredients */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Ingredients
                    </h3>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients?.map((ingredient: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="text-lg">{getIngredientIcon(extractIngredientName(ingredient))}</span>
                          <span>{ingredient}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Instructions & Actions */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Instructions
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedRecipe.instructions?.map((instruction: string, index: number) => (
                        <div key={index} className="flex text-sm">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{instruction}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4 border-t">
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      size="lg"
                      onClick={() => {
                        handleStartCooking(selectedRecipe.id);
                        setShowRecipeModal(false);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Cooking Session
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          addFavoriteMutation.mutate(selectedRecipe.id);
                          setShowRecipeModal(false);
                        }}
                        disabled={addFavoriteMutation.isPending}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Add to Favorites
                      </Button>

                      <Button 
                        variant="outline"
                        onClick={() => {
                          handleShare('recipe', selectedRecipe.id, selectedRecipe.name);
                          setShowRecipeModal(false);
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Recipe
                      </Button>
                    </div>

                    <Button 
                      variant="secondary"
                      className="w-full"
                      onClick={() => setLocation('/recipes')}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      View All Recipes
                    </Button>
                  </div>
                </div>
              </div>

              {/* Nutrition Info */}
              {selectedRecipe.nutrition && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3">Nutrition Information (per serving)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">{selectedRecipe.nutrition.calories}</div>
                      <div className="text-muted-foreground">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{selectedRecipe.nutrition.protein}g</div>
                      <div className="text-muted-foreground">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{selectedRecipe.nutrition.carbs}g</div>
                      <div className="text-muted-foreground">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-yellow-600">{selectedRecipe.nutrition.fat}g</div>
                      <div className="text-muted-foreground">Fat</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Activity Item Component for Friend Activity
const ActivityItem = ({ activity }: { activity: UserActivity }) => {
  const getActivityText = (activity: UserActivity) => {
    const { activityType, targetType, targetName } = activity;
    
    if (activityType === "created" && targetType === "meal_plan") {
      return `created a new meal plan "${targetName}"`;
    } else if (activityType === "created" && targetType === "recipe") {
      return `created a new recipe "${targetName}"`;
    } else if (activityType === "liked" && targetType === "recipe") {
      return `liked the recipe "${targetName}"`;
    } else if (activityType === "shared" && targetType === "meal_plan") {
      return `shared the meal plan "${targetName}"`;
    }
    
    return `${activityType} ${targetName}`;
  };

  const getBadgeColor = (targetType: string) => {
    switch (targetType) {
      case "meal_plan":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "recipe":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-medium">
        {activity.user.username?.charAt(0).toUpperCase() || activity.user.displayName?.charAt(0).toUpperCase() || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-gray-900">
            {activity.user.displayName || activity.user.username}
          </span>
          <Badge variant="secondary" className={`text-xs ${getBadgeColor(activity.targetType)}`}>
            {activity.targetType === "meal_plan" ? "Meal Plan" : "Recipe"}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {getActivityText(activity)}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(activity.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Heart className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Friends Section Component with Search and Activity
function FriendsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"activity" | "search" | "following">("activity");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Friend Activity Query
  const { data: friendActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ["/api/discover/friend-activity"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // User Search Query
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    enabled: !!searchQuery && searchQuery.length > 2,
    staleTime: 30 * 1000,
  });

  // Following List Query
  const { data: following, isLoading: followingLoading } = useQuery({
    queryKey: ["/api/users/following"],
    staleTime: 5 * 60 * 1000,
  });

  // Follow/Unfollow Mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: 'follow' | 'unfollow' }) => {
      if (action === 'follow') {
        return apiRequest(`/api/users/${userId}/follow`, { method: "POST" });
      } else {
        return apiRequest(`/api/users/${userId}/follow`, { method: "DELETE" });
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/discover/friend-activity"] });
      toast({
        description: action === 'follow' ? "User followed successfully!" : "User unfollowed successfully!",
      });
    },
    onError: () => {
      toast({
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isUserFollowed = (userId: number) => {
    return Array.isArray(following) && following.some((user: any) => user.id === userId);
  };

  return (
    <div className="space-y-6">
      {/* Section Header with Tab Controls */}
      <div className="flex flex-col space-y-4">
        <h2 className="text-xl font-semibold">Friends & Community</h2>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === "activity" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("activity")}
            className="px-4"
          >
            <Users className="w-4 h-4 mr-2" />
            Activity
          </Button>
          <Button
            variant={activeTab === "search" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("search")}
            className="px-4"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button
            variant={activeTab === "following" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("following")}
            className="px-4"
          >
            <Heart className="w-4 h-4 mr-2" />
            Following
          </Button>
        </div>

        {/* Search Input (shown when search tab is active) */}
        {activeTab === "search" && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === "activity" && (
        <div>
          <h3 className="text-lg font-medium mb-4">What Your Friends Are Cooking</h3>
          {loadingActivity ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : Array.isArray(friendActivity) && friendActivity.length > 0 ? (
            <div className="space-y-4">
              {friendActivity.map((activity: UserActivity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No friend activity yet</h3>
                <p className="text-muted-foreground mb-4">
                  Follow other users to see what they're cooking and sharing
                </p>
                <Button onClick={() => setActiveTab("search")}>Search for Friends</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "search" && (
        <div>
          <h3 className="text-lg font-medium mb-4">Find New Friends</h3>
          {searchQuery.length <= 2 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Search for Friends</h3>
                <p className="text-muted-foreground">
                  Enter at least 3 characters to search for users by username or email
                </p>
              </CardContent>
            </Card>
          ) : searchLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((user: any) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white font-medium">
                        {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="font-medium">{user.username || 'Anonymous'}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isUserFollowed(user.id) ? "outline" : "default"}
                      onClick={() => followMutation.mutate({ 
                        userId: user.id, 
                        action: isUserFollowed(user.id) ? 'unfollow' : 'follow' 
                      })}
                      disabled={followMutation.isPending}
                      className={isUserFollowed(user.id) ? "text-red-600 border-red-200 hover:bg-red-50" : ""}
                    >
                      {isUserFollowed(user.id) ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  Try searching with different keywords
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "following" && (
        <div>
          <h3 className="text-lg font-medium mb-4">People You Follow</h3>
          {followingLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : Array.isArray(following) && following.length > 0 ? (
            <div className="space-y-4">
              {following.map((user: any) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
                        {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="font-medium">{user.username || 'Anonymous'}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => followMutation.mutate({ userId: user.id, action: 'unfollow' })}
                      disabled={followMutation.isPending}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Unfollow
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Not following anyone yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start following other users to see their cooking activity
                </p>
                <Button onClick={() => setActiveTab("search")}>Find Friends to Follow</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}