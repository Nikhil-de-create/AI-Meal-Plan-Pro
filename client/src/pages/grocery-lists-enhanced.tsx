import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Trash2, Calendar, Check, Plus, Package, Truck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PantryItem } from "@/../../shared/schema";

export default function GroceryLists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderingListId, setOrderingListId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { data: groceryLists, isLoading } = useQuery({
    queryKey: ["/api/grocery-lists"],
  });

  const { data: mealPlans } = useQuery({
    queryKey: ["/api/mealplans"],
  });

  const { data: pantryItems = [] } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry"],
  });

  const deleteGroceryListMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/grocery-lists/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grocery list deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete grocery list.",
        variant: "destructive",
      });
    },
  });

  const generateGroceryListMutation = useMutation({
    mutationFn: async (mealPlanId: number) => {
      const response = await apiRequest("POST", `/api/grocery-lists/generate/${mealPlanId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grocery list generated successfully from your meal plan.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate grocery list.",
        variant: "destructive",
      });
    },
  });

  const orderGroceriesMutation = useMutation({
    mutationFn: async (orderData: { items: string[]; listId: number }) => {
      const response = await apiRequest("POST", "/api/grocery-orders", {
        groceryListId: orderData.listId,
        items: orderData.items,
        totalAmount: orderData.items.length * 3.50, // Mock pricing
        status: 'pending'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed Successfully!",
        description: "Your groceries will be delivered within 2-3 hours.",
      });
      setOrderingListId(null);
      setSelectedItems([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place grocery order.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this grocery list?")) {
      deleteGroceryListMutation.mutate(id);
    }
  };

  const handleGenerateGroceryList = (mealPlanId: number) => {
    generateGroceryListMutation.mutate(mealPlanId);
  };

  const getItemsInPantry = (groceryItems: string[]) => {
    const pantryItemNames = pantryItems.map(item => item.itemName.toLowerCase());
    return groceryItems.filter(item => 
      pantryItemNames.some(pantryItem => 
        item.toLowerCase().includes(pantryItem) || pantryItem.includes(item.toLowerCase())
      )
    );
  };

  const getItemsToOrder = (groceryItems: string[]) => {
    const pantryItemNames = pantryItems.map(item => item.itemName.toLowerCase());
    return groceryItems.filter(item => 
      !pantryItemNames.some(pantryItem => 
        item.toLowerCase().includes(pantryItem) || pantryItem.includes(item.toLowerCase())
      )
    );
  };

  const handleOrderGroceries = (listId: number, items: string[]) => {
    const itemsToOrder = getItemsToOrder(items);
    if (itemsToOrder.length === 0) {
      toast({
        title: "Nothing to Order",
        description: "You already have all these items in your pantry!",
      });
      return;
    }
    setOrderingListId(listId);
    setSelectedItems(itemsToOrder);
  };

  const confirmOrder = () => {
    if (orderingListId && selectedItems.length > 0) {
      orderGroceriesMutation.mutate({ 
        items: selectedItems, 
        listId: orderingListId 
      });
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header 
        title="Grocery Lists" 
        description="Manage your shopping lists generated from meal plans."
      />

      <div className="p-8 overflow-y-auto h-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-neutral-100 dark:bg-neutral-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-neutral-100 dark:bg-neutral-100 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="h-4 bg-neutral-100 dark:bg-neutral-100 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groceryLists && Array.isArray(groceryLists) && groceryLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groceryLists.map((list: any) => {
              const itemsInPantry = list.items ? getItemsInPantry(list.items) : [];
              const itemsToOrder = list.items ? getItemsToOrder(list.items) : [];
              
              return (
                <Card key={list.id} className="shadow-sm border border-neutral-100 dark:border-border hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-900 flex items-center space-x-2">
                          <ShoppingCart className="w-5 h-5" />
                          <span>{list.name}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-neutral-500 mt-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Created {new Date(list.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            list.completed 
                              ? 'bg-secondary/10 text-secondary' 
                              : 'bg-neutral-100 dark:bg-neutral-100 text-neutral-500'
                          }`}>
                            {list.completed ? 'Completed' : 'Active'}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(list.id)}
                        disabled={deleteGroceryListMutation.isPending}
                        className="text-destructive hover:text-destructive ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Items already in pantry */}
                      {itemsInPantry.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Package className="w-4 h-4 text-green-600" />
                            <h4 className="text-sm font-medium text-green-600">Already in Pantry</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {itemsInPantry.length} items
                            </Badge>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {itemsInPantry.map((item: string, index: number) => (
                              <div key={`pantry-${index}`} className="flex items-center space-x-2 p-2 rounded bg-green-50">
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-700">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Items to order */}
                      {itemsToOrder.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                            <h4 className="text-sm font-medium text-blue-600">Need to Order</h4>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {itemsToOrder.length} items
                            </Badge>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {itemsToOrder.map((item: string, index: number) => (
                              <div key={`order-${index}`} className="flex items-center space-x-2 p-2 rounded hover:bg-neutral-50">
                                <Checkbox id={`item-${list.id}-${index}`} />
                                <label 
                                  htmlFor={`item-${list.id}-${index}`}
                                  className="text-sm text-neutral-700 flex-1 cursor-pointer"
                                >
                                  {item}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* All items already in pantry */}
                      {itemsInPantry.length > 0 && itemsToOrder.length === 0 && (
                        <div className="text-center py-4">
                          <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-sm text-green-600 font-medium">All items are in your pantry!</p>
                        </div>
                      )}
                      
                      {/* No items */}
                      {(!list.items || list.items.length === 0) && (
                        <p className="text-neutral-500 text-sm text-center py-4">No items in this list</p>
                      )}
                      
                      {/* Order button */}
                      {itemsToOrder.length > 0 && (
                        <div className="pt-2 border-t">
                          <Button 
                            onClick={() => handleOrderGroceries(list.id, list.items || [])}
                            className="w-full"
                            disabled={orderGroceriesMutation.isPending}
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Order {itemsToOrder.length} Items (${(itemsToOrder.length * 3.50).toFixed(2)})
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-900 mb-2">No grocery lists yet</h3>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
              Generate grocery lists automatically from your existing meal plans.
            </p>
            {mealPlans && Array.isArray(mealPlans) && mealPlans.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600 mb-4">Select a meal plan to generate grocery list:</p>
                <div className="grid gap-2 max-w-md mx-auto">
                  {mealPlans.map((plan: any) => (
                    <Button
                      key={plan.id}
                      variant="outline"
                      onClick={() => handleGenerateGroceryList(plan.id)}
                      disabled={generateGroceryListMutation.isPending}
                      className="justify-start"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate from "{plan.name}"
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm">Create some meal plans first to generate grocery lists.</p>
            )}
          </div>
        )}

        {/* Order Confirmation Dialog */}
        <Dialog open={orderingListId !== null} onOpenChange={() => setOrderingListId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Grocery Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>You're about to order {selectedItems.length} items:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-neutral-50 rounded">
                    <ShoppingCart className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-medium">Total: ${(selectedItems.length * 3.50).toFixed(2)}</span>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setOrderingListId(null)}>
                    Cancel
                  </Button>
                  <Button onClick={confirmOrder} disabled={orderGroceriesMutation.isPending}>
                    <Truck className="w-4 h-4 mr-2" />
                    Confirm Order
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}