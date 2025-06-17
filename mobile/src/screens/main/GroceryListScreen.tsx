import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  isChecked: boolean;
  mealPlanSource?: string;
  quantity?: string;
}

interface GroceryCategory {
  name: string;
  icon: string;
  items: GroceryItem[];
}

interface MealPlan {
  id: number;
  name: string;
  description: string;
  duration: number;
  meals: any[];
}

interface GeneratedMeal {
  name: string;
  ingredients: string[];
}

// Category mapping for ingredients with smart categorization
const INGREDIENT_CATEGORIES = {
  vegetables: {
    name: 'Vegetables & Fruits',
    icon: 'leaf-outline',
    color: '#16a34a',
    keywords: ['lettuce', 'tomato', 'cucumber', 'onion', 'garlic', 'carrot', 'spinach', 'broccoli', 'pepper', 'apple', 'banana', 'avocado', 'lemon', 'lime', 'herb', 'cilantro', 'parsley', 'basil', 'potato', 'celery', 'mushroom', 'cabbage', 'zucchini', 'asparagus', 'kale']
  },
  proteins: {
    name: 'Proteins & Meat',
    icon: 'fish-outline',
    color: '#dc2626',
    keywords: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'eggs', 'tofu', 'beans', 'lentils', 'chickpeas', 'turkey', 'bacon', 'ham']
  },
  dairy: {
    name: 'Dairy & Eggs',
    icon: 'water-outline',
    color: '#2563eb',
    keywords: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'sour cream', 'cottage cheese', 'mozzarella', 'cheddar', 'parmesan', 'eggs']
  },
  grains: {
    name: 'Grains & Bread',
    icon: 'nutrition-outline',
    color: '#d97706',
    keywords: ['bread', 'rice', 'pasta', 'quinoa', 'oats', 'flour', 'cereal', 'tortilla', 'bagel', 'crackers', 'noodles']
  },
  pantry: {
    name: 'Pantry & Spices',
    icon: 'library-outline',
    color: '#7c3aed',
    keywords: ['salt', 'pepper', 'oil', 'olive oil', 'vinegar', 'sauce', 'spice', 'cumin', 'paprika', 'oregano', 'thyme', 'garlic powder', 'onion powder', 'vanilla', 'sugar', 'honey']
  },
  canned: {
    name: 'Canned & Packaged',
    icon: 'archive-outline',
    color: '#059669',
    keywords: ['canned', 'jar', 'bottle', 'package', 'broth', 'stock', 'coconut milk', 'tomato sauce', 'paste', 'dressing', 'condiment']
  },
  frozen: {
    name: 'Frozen Foods',
    icon: 'snow-outline',
    color: '#0891b2',
    keywords: ['frozen', 'ice', 'peas', 'corn', 'berries', 'vegetables']
  },
  beverages: {
    name: 'Beverages',
    icon: 'cafe-outline',
    color: '#ea580c',
    keywords: ['water', 'juice', 'coffee', 'tea', 'soda', 'milk', 'wine', 'beer', 'drink']
  }
};

const GroceryListScreen: React.FC = () => {
  const [groceryCategories, setGroceryCategories] = useState<GroceryCategory[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [checkedItems, setCheckedItems] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updateItemCounts();
  }, [groceryCategories]);

  // Helper function to categorize ingredients intelligently
  const categorizeIngredient = (ingredient: string): string => {
    const cleanIngredient = ingredient.toLowerCase().trim();
    
    for (const [categoryKey, category] of Object.entries(INGREDIENT_CATEGORIES)) {
      const isMatch = category.keywords.some(keyword => 
        cleanIngredient.includes(keyword) || keyword.includes(cleanIngredient)
      );
      
      if (isMatch) {
        return categoryKey;
      }
    }
    
    return 'pantry'; // Default category for unmatched items
  };

  // Aggregate ingredients from all user meal plans
  const aggregateIngredientsFromMealPlans = (mealPlans: MealPlan[]): GroceryItem[] => {
    const ingredientMap = new Map<string, GroceryItem>();
    
    mealPlans.forEach(mealPlan => {
      if (mealPlan.meals && Array.isArray(mealPlan.meals)) {
        mealPlan.meals.forEach((meal: GeneratedMeal) => {
          if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach(ingredient => {
              const cleanIngredient = ingredient.trim();
              const ingredientKey = cleanIngredient.toLowerCase();
              
              if (!ingredientMap.has(ingredientKey)) {
                const category = categorizeIngredient(cleanIngredient);
                ingredientMap.set(ingredientKey, {
                  id: `${mealPlan.id}-${ingredientKey}`,
                  name: cleanIngredient,
                  category,
                  isChecked: false,
                  mealPlanSource: mealPlan.name,
                });
              }
            });
          }
        });
      }
    });
    
    return Array.from(ingredientMap.values());
  };

  // Organize ingredients into logical categories
  const organizeIntoCategories = (ingredients: GroceryItem[]): GroceryCategory[] => {
    const categoryMap = new Map<string, GroceryItem[]>();
    
    // Initialize all categories
    Object.keys(INGREDIENT_CATEGORIES).forEach(categoryKey => {
      categoryMap.set(categoryKey, []);
    });
    
    // Group ingredients by category
    ingredients.forEach(ingredient => {
      const categoryItems = categoryMap.get(ingredient.category) || [];
      categoryItems.push(ingredient);
      categoryMap.set(ingredient.category, categoryItems);
    });
    
    // Convert to category objects and filter out empty categories
    return Object.entries(INGREDIENT_CATEGORIES)
      .map(([categoryKey, categoryInfo]) => ({
        name: categoryInfo.name,
        icon: categoryInfo.icon,
        items: categoryMap.get(categoryKey) || [],
      }))
      .filter(category => category.items.length > 0)
      .sort((a, b) => b.items.length - a.items.length); // Sort by item count
  };

  const updateItemCounts = () => {
    const total = groceryCategories.reduce((sum, category) => sum + category.items.length, 0);
    const checked = groceryCategories.reduce((sum, category) => 
      sum + category.items.filter(item => item.isChecked).length, 0
    );
    
    setTotalItems(total);
    setCheckedItems(checked);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user's meal plans securely from backend
      const response = await apiService.mealPlans.getAll();
      const userMealPlans = response.data || [];
      
      setMealPlans(userMealPlans);
      
      // Aggregate ingredients from all meal plans
      const aggregatedIngredients = aggregateIngredientsFromMealPlans(userMealPlans);
      
      // Organize ingredients into logical categories
      const organizedCategories = organizeIntoCategories(aggregatedIngredients);
      
      setGroceryCategories(organizedCategories);
      
    } catch (error) {
      console.error('Error loading grocery data:', error);
      Alert.alert('Error', 'Failed to load grocery list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleItemChecked = (categoryIndex: number, itemIndex: number) => {
    const updatedCategories = [...groceryCategories];
    const item = updatedCategories[categoryIndex].items[itemIndex];
    item.isChecked = !item.isChecked;
    
    setGroceryCategories(updatedCategories);
  };

  const handleOrderGroceries = () => {
    if (totalItems === 0) {
      Alert.alert('Empty List', 'Your grocery list is empty. Add some meal plans first!');
      return;
    }
    
    setIsOrderModalVisible(true);
  };

  const confirmOrder = () => {
    setIsOrderModalVisible(false);
    
    // Mock order confirmation with better UX feedback
    Alert.alert(
      'Order Placed Successfully!',
      `Your grocery order with ${totalItems} items has been placed. You'll receive a confirmation email shortly.\n\nEstimated delivery: 2-3 business days`,
      [
        { 
          text: 'Track Order', 
          onPress: () => Alert.alert('Order Tracking', 'Order #GO-2025-001\nStatus: Processing\nDelivery partner will be assigned soon.'),
          style: 'default' 
        },
        { text: 'OK', style: 'default' }
      ]
    );
    
    // Clear checked items after successful order
    const updatedCategories = groceryCategories.map(category => ({
      ...category,
      items: category.items.map(item => ({
        ...item,
        isChecked: false
      }))
    }));
    setGroceryCategories(updatedCategories);
  };

  // Render individual grocery item with check functionality
  const renderGroceryItem = (item: GroceryItem, categoryIndex: number, itemIndex: number) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.groceryItem, item.isChecked && styles.checkedItem]}
      onPress={() => toggleItemChecked(categoryIndex, itemIndex)}
    >
      <View style={styles.itemContent}>
        <Ionicons
          name={item.isChecked ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.isChecked ? '#16a34a' : '#6b7280'}
          style={styles.checkIcon}
        />
        <Text style={[
          styles.itemText,
          item.isChecked && styles.checkedText
        ]}>
          {item.name}
        </Text>
      </View>
      {item.mealPlanSource && (
        <Text style={styles.sourceText}>from {item.mealPlanSource}</Text>
      )}
    </TouchableOpacity>
  );

  // Render category section with items
  const renderCategory = (category: GroceryCategory, categoryIndex: number) => {
    const categoryConfig = Object.values(INGREDIENT_CATEGORIES).find(
      config => config.name === category.name
    );
    
    return (
      <View key={category.name} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleRow}>
            <Ionicons 
              name={category.icon as any} 
              size={24} 
              color={categoryConfig?.color || '#6b7280'} 
            />
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <View style={[styles.itemCount, { backgroundColor: categoryConfig?.color || '#6b7280' }]}>
              <Text style={styles.itemCountText}>{category.items.length}</Text>
            </View>
          </View>
        </View>
        <View style={styles.categoryItems}>
          {category.items.map((item, itemIndex) =>
            renderGroceryItem(item, categoryIndex, itemIndex)
          )}
        </View>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading your grocery list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (groceryCategories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.title}>Grocery List</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Groceries Yet</Text>
          <Text style={styles.emptyMessage}>
            Create some meal plans to automatically generate your grocery list!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header with progress tracking */}
      <View style={styles.header}>
        <Text style={styles.title}>Grocery List</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {checkedItems} of {totalItems} items
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Categorized grocery list */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {groceryCategories.map((category, categoryIndex) =>
          renderCategory(category, categoryIndex)
        )}
        
        {/* Bottom spacing for floating button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Order Groceries Button */}
      <TouchableOpacity
        style={[
          styles.orderButton,
          totalItems === 0 && styles.orderButtonDisabled
        ]}
        onPress={handleOrderGroceries}
        disabled={totalItems === 0}
      >
        <Ionicons name="bag-outline" size={24} color="white" />
        <Text style={styles.orderButtonText}>
          Order Groceries ({totalItems} items)
        </Text>
      </TouchableOpacity>

      {/* Order Confirmation Modal */}
      <Modal
        visible={isOrderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="bag-check-outline" size={48} color="#2563eb" />
              <Text style={styles.modalTitle}>Order Groceries</Text>
              <Text style={styles.modalMessage}>
                Ready to order {totalItems} items from your grocery list?
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsOrderModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmOrder}
              >
                <Text style={styles.modalConfirmText}>Place Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginTop: 24,
    marginBottom: 8,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  itemCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  categoryItems: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  groceryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  checkedItem: {
    backgroundColor: '#f0f9f0',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkIcon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  checkedText: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  sourceText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 100,
  },
  orderButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  orderButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default GroceryListScreen;