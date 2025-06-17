import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, ChefHat, Clock, Users } from "lucide-react";

const preferencesSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  preferredCuisines: z.array(z.string()).optional(),
  cookingTime: z.enum(["quick", "medium", "long"]).optional(),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  servingSize: z.number().min(1).max(8).optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

const dietaryOptions = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Paleo", "Low-Carb", "Low-Fat"
];

const allergyOptions = [
  "Nuts", "Shellfish", "Eggs", "Dairy", "Soy", "Wheat", "Fish", "Sesame"
];

const cuisineOptions = [
  "Italian", "Mexican", "Asian", "Mediterranean", "American", "Indian", "Thai", "French", "Chinese", "Japanese"
];

export default function Preferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["/api/user/preferences"],
    retry: false,
  });

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      dietaryRestrictions: [],
      allergies: [],
      preferredCuisines: [],
      cookingTime: "medium",
      skillLevel: "beginner",
      servingSize: 2,
    },
  });

  // Update form when preferences are loaded
  React.useEffect(() => {
    if (preferences) {
      form.reset({
        dietaryRestrictions: (preferences as any).dietaryRestrictions || [],
        allergies: (preferences as any).allergies || [],
        preferredCuisines: (preferences as any).preferredCuisines || [],
        cookingTime: (preferences as any).cookingTime || "medium",
        skillLevel: (preferences as any).skillLevel || "beginner",
        servingSize: (preferences as any).servingSize || 2,
      });
    }
  }, [preferences, form]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormData) => {
      const method = preferences ? "PUT" : "POST";
      const response = await apiRequest(method, "/api/user/preferences", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PreferencesFormData) => {
    updatePreferencesMutation.mutate(data);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Preferences" 
        description="Customize your meal planning preferences for better AI recommendations."
      />

      <div className="p-8 overflow-y-auto h-full">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-sm border border-neutral-100 dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Dietary Preferences</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-100 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-neutral-100 dark:bg-neutral-100 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Dietary Restrictions */}
                    <FormField
                      control={form.control}
                      name="dietaryRestrictions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dietary Restrictions</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {dietaryOptions.map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`diet-${option}`}
                                  checked={field.value?.includes(option) || false}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, option]);
                                    } else {
                                      field.onChange(current.filter(item => item !== option));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`diet-${option}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Allergies */}
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergies</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {allergyOptions.map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`allergy-${option}`}
                                  checked={field.value?.includes(option) || false}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, option]);
                                    } else {
                                      field.onChange(current.filter(item => item !== option));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`allergy-${option}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Preferred Cuisines */}
                    <FormField
                      control={form.control}
                      name="preferredCuisines"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Cuisines</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {cuisineOptions.map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`cuisine-${option}`}
                                  checked={field.value?.includes(option) || false}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, option]);
                                    } else {
                                      field.onChange(current.filter(item => item !== option));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`cuisine-${option}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Cooking Time */}
                      <FormField
                        control={form.control}
                        name="cookingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cooking Time Preference</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="quick">Quick (&lt; 30 min)</SelectItem>
                                <SelectItem value="medium">Medium (30-60 min)</SelectItem>
                                <SelectItem value="long">Long (&gt; 60 min)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Skill Level */}
                      <FormField
                        control={form.control}
                        name="skillLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cooking Skill Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Serving Size */}
                      <FormField
                        control={form.control}
                        name="servingSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Serving Size</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="8"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={updatePreferencesMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
