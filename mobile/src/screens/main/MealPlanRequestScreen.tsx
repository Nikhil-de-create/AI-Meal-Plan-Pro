import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

interface MealPlanFormData {
  dietType: string;
  duration: number;
  allergies: string[];
  dietaryRestrictions: string[];
  mealGoals: string;
  servingSize: number;
  cookingTime: 'quick' | 'medium' | 'long';
  preferredCuisines: string[];
}

interface GeneratedMeal {
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface GeneratedMealPlan {
  name: string;
  description: string;
  meals: GeneratedMeal[];
}

const DIET_TYPES = [
  { id: 'balanced', label: 'Balanced', description: 'Well-rounded nutrition' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'Plant-based with dairy/eggs' },
  { id: 'vegan', label: 'Vegan', description: 'Completely plant-based' },
  { id: 'keto', label: 'Keto', description: 'Low-carb, high-fat' },
  { id: 'paleo', label: 'Paleo', description: 'Whole foods, no processed' },
  { id: 'mediterranean', label: 'Mediterranean', description: 'Heart-healthy Mediterranean' },
];

const MEAL_GOALS = [
  { id: 'maintain', label: 'Maintain Weight', description: 'Keep current weight' },
  { id: 'lose', label: 'Weight Loss', description: 'Lose weight gradually' },
  { id: 'gain', label: 'Weight Gain', description: 'Gain weight healthily' },
  { id: 'muscle', label: 'Muscle Building', description: 'Build lean muscle' },
  { id: 'energy', label: 'Energy Boost', description: 'Increase daily energy' },
];

const COOKING_TIME_OPTIONS = [
  { id: 'quick', label: 'Quick (15-30 min)', description: 'Fast and simple meals' },
  { id: 'medium', label: 'Medium (30-60 min)', description: 'Moderate cooking time' },
  { id: 'long', label: 'Long (60+ min)', description: 'Complex, elaborate meals' },
];

const COMMON_ALLERGIES = [
  'Nuts', 'Dairy', 'Eggs', 'Shellfish', 'Fish', 'Soy', 'Gluten', 'Sesame'
];

const CUISINES = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'American', 'French', 'Thai'
];

const MealPlanRequestScreen: React.FC = () => {
  const [formData, setFormData] = useState<MealPlanFormData>({
    dietType: 'balanced',
    duration: 7,
    allergies: [],
    dietaryRestrictions: [],
    mealGoals: 'maintain',
    servingSize: 2,
    cookingTime: 'medium',
    preferredCuisines: [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [generatedMealPlan, setGeneratedMealPlan] = useState<GeneratedMealPlan | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<GeneratedMeal | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'results' | 'detail'>('form');

  // Load user preferences on component mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const response = await apiService.auth.getPreferences();
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          allergies: response.data.allergies || prev.allergies,
          dietaryRestrictions: response.data.dietaryRestrictions || prev.dietaryRestrictions,
          servingSize: response.data.servingSize || prev.servingSize,
          cookingTime: response.data.cookingTime || prev.cookingTime,
          preferredCuisines: response.data.preferredCuisines || prev.preferredCuisines,
        }));
      }
    } catch (error) {
      console.log('No saved preferences found, using defaults');
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  const handleSelectOption = (field: keyof MealPlanFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleArray = (field: 'allergies' | 'dietaryRestrictions' | 'preferredCuisines', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const validateForm = (): boolean => {
    if (formData.duration < 1 || formData.duration > 30) {
      Alert.alert('Validation Error', 'Duration must be between 1 and 30 days');
      return false;
    }
    if (formData.servingSize < 1 || formData.servingSize > 10) {
      Alert.alert('Validation Error', 'Serving size must be between 1 and 10 people');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const requestData = {
        dietType: formData.dietType,
        duration: formData.duration,
        preferences: {
          dietaryRestrictions: formData.dietaryRestrictions,
          allergies: formData.allergies,
          preferredCuisines: formData.preferredCuisines,
          cookingTime: formData.cookingTime,
          servingSize: formData.servingSize,
          mealGoals: formData.mealGoals,
        },
      };

      const response = await apiService.mealPlans.create(requestData);
      if (response.data && response.data.meals) {
        setGeneratedMealPlan(response.data);
        setCurrentStep('results');
      } else {
        throw new Error('Invalid meal plan data received');
      }
    } catch (error: any) {
      console.error('Error generating meal plan:', error);
      Alert.alert(
        'Generation Failed',
        error.response?.data?.message || 'Failed to generate meal plan. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: handleSubmit },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealPress = (meal: GeneratedMeal) => {
    setSelectedMeal(meal);
    setCurrentStep('detail');
  };

  const renderFormStep = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      {/* Diet Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diet Type</Text>
        <View style={styles.optionsGrid}>
          {DIET_TYPES.map((diet) => (
            <TouchableOpacity
              key={diet.id}
              style={[
                styles.optionCard,
                formData.dietType === diet.id && styles.selectedOptionCard
              ]}
              onPress={() => handleSelectOption('dietType', diet.id)}
            >
              <Text style={[
                styles.optionTitle,
                formData.dietType === diet.id && styles.selectedOptionText
              ]}>
                {diet.label}
              </Text>
              <Text style={[
                styles.optionDescription,
                formData.dietType === diet.id && styles.selectedOptionDescription
              ]}>
                {diet.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Plan Duration</Text>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => handleSelectOption('duration', Math.max(1, formData.duration - 1))}
          >
            <Ionicons name="remove" size={20} color="#2563eb" />
          </TouchableOpacity>
          <View style={styles.durationDisplay}>
            <Text style={styles.durationNumber}>{formData.duration}</Text>
            <Text style={styles.durationLabel}>days</Text>
          </View>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => handleSelectOption('duration', Math.min(30, formData.duration + 1))}
          >
            <Ionicons name="add" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Meal Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Goals</Text>
        <View style={styles.optionsList}>
          {MEAL_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.listOption,
                formData.mealGoals === goal.id && styles.selectedListOption
              ]}
              onPress={() => handleSelectOption('mealGoals', goal.id)}
            >
              <View style={styles.listOptionContent}>
                <Text style={[
                  styles.listOptionTitle,
                  formData.mealGoals === goal.id && styles.selectedListOptionText
                ]}>
                  {goal.label}
                </Text>
                <Text style={[
                  styles.listOptionDescription,
                  formData.mealGoals === goal.id && styles.selectedListOptionDescription
                ]}>
                  {goal.description}
                </Text>
              </View>
              {formData.mealGoals === goal.id && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cooking Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cooking Time Preference</Text>
        <View style={styles.optionsList}>
          {COOKING_TIME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.listOption,
                formData.cookingTime === option.id && styles.selectedListOption
              ]}
              onPress={() => handleSelectOption('cookingTime', option.id)}
            >
              <View style={styles.listOptionContent}>
                <Text style={[
                  styles.listOptionTitle,
                  formData.cookingTime === option.id && styles.selectedListOptionText
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.listOptionDescription,
                  formData.cookingTime === option.id && styles.selectedListOptionDescription
                ]}>
                  {option.description}
                </Text>
              </View>
              {formData.cookingTime === option.id && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Serving Size */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Serving Size</Text>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => handleSelectOption('servingSize', Math.max(1, formData.servingSize - 1))}
          >
            <Ionicons name="remove" size={20} color="#2563eb" />
          </TouchableOpacity>
          <View style={styles.durationDisplay}>
            <Text style={styles.durationNumber}>{formData.servingSize}</Text>
            <Text style={styles.durationLabel}>people</Text>
          </View>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => handleSelectOption('servingSize', Math.min(10, formData.servingSize + 1))}
          >
            <Ionicons name="add" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Allergies */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergies & Restrictions</Text>
        <Text style={styles.sectionSubtitle}>Select any allergies you have</Text>
        <View style={styles.tagsContainer}>
          {COMMON_ALLERGIES.map((allergy) => (
            <TouchableOpacity
              key={allergy}
              style={[
                styles.tag,
                formData.allergies.includes(allergy) && styles.selectedTag
              ]}
              onPress={() => handleToggleArray('allergies', allergy)}
            >
              <Text style={[
                styles.tagText,
                formData.allergies.includes(allergy) && styles.selectedTagText
              ]}>
                {allergy}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preferred Cuisines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Cuisines</Text>
        <Text style={styles.sectionSubtitle}>Choose cuisines you enjoy (optional)</Text>
        <View style={styles.tagsContainer}>
          {CUISINES.map((cuisine) => (
            <TouchableOpacity
              key={cuisine}
              style={[
                styles.tag,
                formData.preferredCuisines.includes(cuisine) && styles.selectedTag
              ]}
              onPress={() => handleToggleArray('preferredCuisines', cuisine)}
            >
              <Text style={[
                styles.tagText,
                formData.preferredCuisines.includes(cuisine) && styles.selectedTagText
              ]}>
                {cuisine}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Generate Meal Plan</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderResultsStep = () => {
    if (!generatedMealPlan) return null;

    return (
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>{generatedMealPlan.name}</Text>
          <Text style={styles.resultsDescription}>{generatedMealPlan.description}</Text>
          <View style={styles.resultsMeta}>
            <Text style={styles.resultsMetaText}>
              {generatedMealPlan.meals.length} meals • {formData.duration} days
            </Text>
          </View>
        </View>

        <View style={styles.mealsContainer}>
          {generatedMealPlan.meals.map((meal, index) => (
            <TouchableOpacity
              key={index}
              style={styles.mealCard}
              onPress={() => handleMealPress(meal)}
            >
              <View style={styles.mealHeader}>
                <View style={[styles.mealTypeIcon, { backgroundColor: getMealTypeColor(meal.type) }]}>
                  <Ionicons name={getMealTypeIcon(meal.type)} size={16} color="white" />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealType}>{meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
              
              <Text style={styles.mealDescription} numberOfLines={2}>
                {meal.description}
              </Text>
              
              <View style={styles.mealDetails}>
                <View style={styles.mealDetailItem}>
                  <Ionicons name="time-outline" size={14} color="#64748b" />
                  <Text style={styles.mealDetailText}>
                    {meal.prepTime + meal.cookTime} min
                  </Text>
                </View>
                <View style={styles.mealDetailItem}>
                  <Ionicons name="people-outline" size={14} color="#64748b" />
                  <Text style={styles.mealDetailText}>
                    {meal.servings} servings
                  </Text>
                </View>
                <View style={styles.mealDetailItem}>
                  <Ionicons name="flash-outline" size={14} color="#64748b" />
                  <Text style={styles.mealDetailText}>
                    {meal.nutrition?.calories || 0} cal
                  </Text>
                </View>
              </View>

              <View style={styles.ingredientsPreview}>
                <Text style={styles.ingredientsTitle}>Ingredients:</Text>
                <Text style={styles.ingredientsText} numberOfLines={2}>
                  {meal.ingredients.slice(0, 4).map(ingredient => 
                    ingredient.replace(/^\d+\s*(cups?|tbsp|tsp|oz|slices?|medium|large|small|cloves?)\s*/i, '').trim()
                  ).join(', ')}
                  {meal.ingredients.length > 4 && ` +${meal.ingredients.length - 4} more`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.newPlanButton}
          onPress={() => setCurrentStep('form')}
        >
          <Ionicons name="add" size={20} color="#2563eb" />
          <Text style={styles.newPlanButtonText}>Generate New Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderDetailStep = () => {
    if (!selectedMeal) return null;

    return (
      <ScrollView style={styles.detailContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{selectedMeal.name}</Text>
          <Text style={styles.detailType}>
            {selectedMeal.type.charAt(0).toUpperCase() + selectedMeal.type.slice(1)}
          </Text>
          <Text style={styles.detailDescription}>{selectedMeal.description}</Text>
        </View>

        <View style={styles.detailMeta}>
          <View style={styles.detailMetaItem}>
            <Ionicons name="time-outline" size={20} color="#2563eb" />
            <View>
              <Text style={styles.detailMetaLabel}>Total Time</Text>
              <Text style={styles.detailMetaValue}>
                {selectedMeal.prepTime + selectedMeal.cookTime} minutes
              </Text>
            </View>
          </View>
          <View style={styles.detailMetaItem}>
            <Ionicons name="people-outline" size={20} color="#2563eb" />
            <View>
              <Text style={styles.detailMetaLabel}>Servings</Text>
              <Text style={styles.detailMetaValue}>{selectedMeal.servings} people</Text>
            </View>
          </View>
        </View>

        {selectedMeal.nutrition && (
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>Nutrition Per Serving</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedMeal.nutrition.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedMeal.nutrition.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedMeal.nutrition.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedMeal.nutrition.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {selectedMeal.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" />
              <Text style={styles.ingredientText}>{ingredient}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {(() => {
            // Handle both string and array format instructions (for mock vs real API compatibility)
            const instructions = Array.isArray(selectedMeal.instructions) 
              ? selectedMeal.instructions 
              : typeof selectedMeal.instructions === 'string'
              ? selectedMeal.instructions.split(/\d+\.\s*/).filter(step => step.trim())
              : ['No instructions available'];
            
            return instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction.trim()}</Text>
              </View>
            ));
          })()}
        </View>
      </ScrollView>
    );
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'sunny-outline';
      case 'lunch': return 'partly-sunny-outline';
      case 'dinner': return 'moon-outline';
      case 'snack': return 'cafe-outline';
      default: return 'restaurant-outline';
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return '#f59e0b';
      case 'lunch': return '#10b981';
      case 'dinner': return '#3b82f6';
      case 'snack': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        {currentStep !== 'form' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (currentStep === 'detail') {
                setCurrentStep('results');
              } else {
                setCurrentStep('form');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>
        )}
        
        <Text style={styles.headerTitle}>
          {currentStep === 'form' && 'Create Meal Plan'}
          {currentStep === 'results' && 'Your Meal Plan'}
          {currentStep === 'detail' && 'Recipe Details'}
        </Text>
        
        {currentStep === 'form' && (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* Content */}
      {currentStep === 'form' && renderFormStep()}
      {currentStep === 'results' && renderResultsStep()}
      {currentStep === 'detail' && renderDetailStep()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  selectedOptionCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#2563eb',
  },
  optionDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  selectedOptionDescription: {
    color: '#1d4ed8',
  },
  optionsList: {
    gap: 8,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedListOption: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  listOptionContent: {
    flex: 1,
  },
  listOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  selectedListOptionText: {
    color: '#2563eb',
  },
  listOptionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedListOptionDescription: {
    color: '#1d4ed8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    gap: 20,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  durationDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  durationNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  durationLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedTag: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  selectedTagText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  resultsDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 12,
  },
  resultsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsMetaText: {
    fontSize: 14,
    color: '#64748b',
  },
  mealsContainer: {
    gap: 16,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  mealType: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  mealDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  mealDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  mealDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealDetailText: {
    fontSize: 12,
    color: '#64748b',
  },
  ingredientsPreview: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  ingredientsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  ingredientsText: {
    fontSize: 12,
    color: '#64748b',
  },
  newPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 40,
    gap: 8,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  newPlanButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  detailContainer: {
    flex: 1,
    padding: 20,
  },
  detailHeader: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  detailType: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  detailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailMetaLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailMetaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  nutritionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  ingredientText: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  instructionText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
    flex: 1,
  },
});

export default MealPlanRequestScreen;