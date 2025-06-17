import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { Clock, Users, Search, Heart, BookOpen, ChefHat, X, Share2, Plus, Compass } from "lucide-react";
import { SimpleSocialShareDialog } from "@/components/ui/simple-social-share-dialog";
import { useToast } from "@/hooks/use-toast";
import { getIngredientIcon, extractIngredientName } from "@/lib/ingredient-icons";

export default function Recipes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteRecipes, setFavoriteRecipes] = useState<number[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["/api/recipes", { search: searchQuery || undefined }],
  });

  const { data: favorites, error: favoritesError } = useQuery({
    queryKey: ["/api/user/favorites"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Update favorites when data loads
  useEffect(() => {
    try {
      if (favorites && Array.isArray(favorites)) {
        // Extract recipe IDs from favorites - they come as full recipe objects
        setFavoriteRecipes(favorites.map((recipe: any) => recipe.id || recipe.recipeId));
      } else {
        setFavoriteRecipes([]);
      }
    } catch (error) {
      console.error('Error processing favorites:', error);
      setFavoriteRecipes([]);
    }
  }, [favorites, favoritesError]);

  const toggleFavorite = async (recipeId: number) => {
    const isFavorited = favoriteRecipes.includes(recipeId);
    
    try {
      if (isFavorited) {
        const response = await fetch(`/api/user/favorites/${recipeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Delete favorite error response:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            throw new Error(`Failed to remove favorite: ${response.status} ${response.statusText}`);
          }
          throw new Error(errorData.message || 'Failed to remove favorite');
        }
        
        setFavoriteRecipes(prev => prev.filter(id => id !== recipeId));
        // Invalidate favorites cache to refresh the tab
        queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
        toast({
          title: "Removed from favorites",
          description: "Recipe removed from your favorites."
        });
      } else {
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ recipeId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add favorite');
        }
        
        setFavoriteRecipes(prev => [...prev, recipeId]);
        // Invalidate favorites cache to refresh the tab
        queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
        toast({
          title: "Added to favorites",
          description: "Recipe added to your favorites."
        });
      }
    } catch (error) {
      console.error('Favorites error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update favorites. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderRecipeGrid = (recipeList: any[], query: string) => {
    if (!recipeList || !Array.isArray(recipeList)) {
      return null;
    }
    
    const filteredRecipes = recipeList.filter((recipe: any) => {
      if (!recipe || !recipe.name) return false;
      const name = recipe.name.toLowerCase();
      const desc = recipe.description?.toLowerCase() || '';
      const tags = recipe.tags || [];
      const searchTerm = query.toLowerCase();
      
      return name.includes(searchTerm) || 
             desc.includes(searchTerm) || 
             tags.some((tag: string) => tag?.toLowerCase().includes(searchTerm));
    });

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-gradient-card shadow-soft border-0 overflow-hidden animate-scale-in" style={{animationDelay: `${i * 100}ms`}}>
              <CardHeader className="relative">
                <div className="absolute top-3 right-3">
                  <div className="w-9 h-9 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full shimmer"></div>
                </div>
                <div className="pr-12 space-y-3">
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg shimmer"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4 shimmer"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="h-8 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full w-24 shimmer"></div>
                    <div className="h-8 bg-gradient-to-r from-green-100 to-green-200 rounded-full w-28 shimmer"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-7 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full w-20 shimmer"></div>
                    <div className="h-7 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full w-16 shimmer"></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg w-16 shimmer"></div>
                    <div className="h-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg w-20 shimmer"></div>
                    <div className="h-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg w-12 shimmer"></div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <div className="h-10 bg-gradient-to-r from-orange-200 to-orange-300 rounded-lg flex-1 shimmer"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-12 shimmer"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-12 shimmer"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!filteredRecipes || filteredRecipes.length === 0) {
      return (
        <div className="text-center py-12 animate-fade-in-up">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No recipes found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or explore different recipes.</p>
          <Button onClick={() => setSearchQuery("")} className="bg-gradient-button hover:bg-gradient-button-hover">
            <Plus className="w-4 h-4 mr-2" />
            Clear Search
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe: any, index: number) => (
          <Card 
            key={recipe.id} 
            className="bg-gradient-card shadow-soft hover-lift hover-scale animate-fade-in-up border-0 overflow-hidden relative"
            style={{animationDelay: `${index * 100}ms`}}
          >
            <CardHeader className="relative">
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(recipe.id)}
                  className="bg-white/80 backdrop-blur-sm rounded-full shadow-soft hover:bg-white/90 text-neutral-600 hover:text-red-500 transition-all duration-300"
                >
                  <Heart className={`w-4 h-4 transition-all duration-300 ${favoriteRecipes.includes(recipe.id) ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
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
                <CardTitle className="text-lg font-semibold text-gradient leading-tight">
                  {recipe.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {recipe.description}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                    <Clock className="w-4 h-4 mr-1.5" />
                    {(recipe.prepTime || 0) + (recipe.cookTime || 0)}m
                  </div>
                  <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                    <Users className="w-4 h-4 mr-1.5" />
                    {recipe.servings} servings
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    {recipe.difficulty}
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                    {recipe.cuisine}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recipe.tags?.slice(0, 3).map((tag: string, tagIndex: number) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs bg-blue-50/50 text-blue-600 border-blue-200">
                      {tag}
                    </Badge>
                  ))}
                  {recipe.tags?.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                      +{recipe.tags.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex gap-1.5 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => setLocation(`/cooking-session/${recipe.id}`)} 
                    className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-soft flex-1 h-8 px-2 text-xs"
                  >
                    <ChefHat className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    <span className="whitespace-nowrap">Start Cooking</span>
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-soft flex-1 h-8 px-2 text-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                        <span className="whitespace-nowrap">View Recipe</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gradient">{recipe.name}</DialogTitle>
                      </DialogHeader>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <span className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-sm mr-2">
                              🥗
                            </span>
                            Ingredients
                          </h3>
                          <div className="space-y-2">
                            {recipe.ingredients?.map((ingredient: string, idx: number) => {
                              const ingredientName = extractIngredientName(ingredient);
                              const icon = getIngredientIcon(ingredientName);
                              return (
                                <div key={idx} className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                                  <span className="text-lg">{icon}</span>
                                  <span className="text-sm text-gray-700">{ingredient}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <span className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm mr-2">
                              📋
                            </span>
                            Instructions
                          </h3>
                          <div className="space-y-3">
                            {recipe.instructions?.map((instruction: string, idx: number) => (
                              <div key={idx} className="flex space-x-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                  {idx + 1}
                                </span>
                                <p className="text-sm text-gray-700 flex-1">{instruction}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-500">Prep Time</p>
                          <p className="font-semibold">{recipe.prep_time}m</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cook Time</p>
                          <p className="font-semibold">{recipe.cook_time}m</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Servings</p>
                          <p className="font-semibold">{recipe.servings}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Difficulty</p>
                          <p className="font-semibold">{recipe.difficulty}</p>
                        </div>
                      </div>
                      {recipe.nutrition && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <h3 className="font-semibold text-lg mb-3">Nutrition Facts</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">Calories</p>
                                <p className="font-semibold text-lg">{recipe.nutrition.calories}</p>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">Protein</p>
                                <p className="font-semibold text-lg">{recipe.nutrition.protein}g</p>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">Carbs</p>
                                <p className="font-semibold text-lg">{recipe.nutrition.carbs}g</p>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">Fat</p>
                                <p className="font-semibold text-lg">{recipe.nutrition.fat}g</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Recipes" 
        description="Discover and explore delicious recipes for your meal planning."
      />

      <div className="p-8 overflow-y-auto h-full">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            {/* Tabs */}
            <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-white/80 backdrop-blur-sm">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <ChefHat className="w-4 h-4" />
                All Recipes
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                My Favorites
              </TabsTrigger>
            </TabsList>

            {/* Enhanced Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 w-5 h-5" />
              <Input
                placeholder="Search delicious recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-base bg-white/80 backdrop-blur-sm border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl shadow-soft transition-all duration-300"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            {renderRecipeGrid(recipes || [], searchQuery)}
          </TabsContent>

          <TabsContent value="favorites" className="mt-0">
            {favoritesError ? (
              <div className="text-center py-12 animate-fade-in-up">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                  <Heart className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Unable to load favorites</h3>
                <p className="text-gray-500 mb-6">Please try refreshing the page or logging in again.</p>
              </div>
            ) : (
              renderRecipeGrid(favorites || [], searchQuery)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}