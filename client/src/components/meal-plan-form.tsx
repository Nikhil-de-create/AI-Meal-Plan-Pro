import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mealPlanFormSchema = z.object({
  dietType: z.string().optional(),
  duration: z.string().transform(val => parseInt(val)),
});

type MealPlanFormData = z.infer<typeof mealPlanFormSchema>;

export function MealPlanForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<MealPlanFormData>({
    resolver: zodResolver(mealPlanFormSchema),
    defaultValues: {
      duration: "7",
    },
  });

  const createMealPlanMutation = useMutation({
    mutationFn: async (data: MealPlanFormData) => {
      const response = await apiRequest("POST", "/api/mealplan", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your meal plan has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mealplans"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MealPlanFormData) => {
    createMealPlanMutation.mutate(data);
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-900/20 border border-primary/10">
      <CardContent className="p-0">
        <h4 className="font-semibold text-neutral-900 dark:text-neutral-900 mb-4">Create New Meal Plan</h4>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dietType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Dietary Preferences
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full border-neutral-200 dark:border-border focus:ring-2 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Choose preference..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mediterranean">Mediterranean</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="keto">Ketogenic</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Duration
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full border-neutral-200 dark:border-border focus:ring-2 focus:ring-primary focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="14">2 weeks</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={createMealPlanMutation.isPending}
              className="w-full bg-primary hover:bg-blue-700 text-white py-3 font-medium flex items-center justify-center space-x-2"
            >
              <Wand2 className="w-4 h-4" />
              <span>{createMealPlanMutation.isPending ? "Generating..." : "Generate with AI"}</span>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
