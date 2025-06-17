import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

interface UserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  preferredCuisines: string[];
  cookingTime: 'quick' | 'medium' | 'long';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  servingSize: number;
}

const dietaryOptions = [
  'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free', 
  'Dairy-Free', 'Low-Carb', 'Low-Fat', 'Pescatarian', 'Halal'
];

const allergyOptions = [
  'Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 
  'Gluten', 'Fish', 'Sesame', 'Peanuts', 'Tree Nuts'
];

const cuisineOptions = [
  'Italian', 'Mexican', 'Asian', 'Mediterranean', 'American',
  'Indian', 'Thai', 'French', 'Chinese', 'Japanese'
];

const cookingTimeOptions = [
  { value: 'quick', label: 'Quick (< 30 min)', icon: 'flash-outline' },
  { value: 'medium', label: 'Medium (30-60 min)', icon: 'time-outline' },
  { value: 'long', label: 'Long (> 60 min)', icon: 'hourglass-outline' }
];

const skillLevelOptions = [
  { value: 'beginner', label: 'Beginner', icon: 'star-outline' },
  { value: 'intermediate', label: 'Intermediate', icon: 'star-half-outline' },
  { value: 'advanced', label: 'Advanced', icon: 'star' }
];

const PreferencesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    allergies: [],
    preferredCuisines: [],
    cookingTime: 'medium',
    skillLevel: 'beginner',
    servingSize: 2,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await apiService.auth.getPreferences();
      if (response.data) {
        setPreferences({
          dietaryRestrictions: response.data.dietaryRestrictions || [],
          allergies: response.data.allergies || [],
          preferredCuisines: response.data.preferredCuisines || [],
          cookingTime: response.data.cookingTime || 'medium',
          skillLevel: response.data.skillLevel || 'beginner',
          servingSize: response.data.servingSize || 2,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // Try to update first, then create if it fails
      try {
        await apiService.auth.updatePreferences(preferences);
      } catch (updateError) {
        // If update fails (preferences don't exist), create new ones
        await apiService.auth.createPreferences(preferences);
      }
      
      Alert.alert('Success', 'Your preferences have been saved successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (category: keyof UserPreferences, item: string) => {
    setPreferences(prev => {
      const currentList = prev[category] as string[];
      const isSelected = currentList.includes(item);
      
      return {
        ...prev,
        [category]: isSelected
          ? currentList.filter(i => i !== item)
          : [...currentList, item]
      };
    });
  };

  const updateSingleValue = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderMultiSelectSection = (
    title: string,
    options: string[],
    category: keyof UserPreferences,
    icon: string
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={20} color="#2563eb" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.optionsGrid}>
        {options.map((option) => {
          const isSelected = (preferences[category] as string[]).includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected
              ]}
              onPress={() => toggleSelection(category, option)}
            >
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected
              ]}>
                {option}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkmark} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSingleSelectSection = (
    title: string,
    options: Array<{ value: string; label: string; icon: string }>,
    currentValue: string,
    onSelect: (value: string) => void,
    icon: string
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={20} color="#2563eb" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.singleSelectContainer}>
        {options.map((option) => {
          const isSelected = currentValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.singleSelectButton,
                isSelected && styles.singleSelectButtonSelected
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Ionicons 
                name={option.icon as any} 
                size={20} 
                color={isSelected ? '#fff' : '#64748b'} 
              />
              <Text style={[
                styles.singleSelectText,
                isSelected && styles.singleSelectTextSelected
              ]}>
                {option.label}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderServingSizeSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="people-outline" size={20} color="#2563eb" />
        <Text style={styles.sectionTitle}>Serving Size</Text>
      </View>
      <View style={styles.servingSizeContainer}>
        {[1, 2, 3, 4, 5, 6].map((size) => {
          const isSelected = preferences.servingSize === size;
          return (
            <TouchableOpacity
              key={size}
              style={[
                styles.servingSizeButton,
                isSelected && styles.servingSizeButtonSelected
              ]}
              onPress={() => updateSingleValue('servingSize', size)}
            >
              <Text style={[
                styles.servingSizeText,
                isSelected && styles.servingSizeTextSelected
              ]}>
                {size}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.servingSizeLabel}>Number of people</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dietary Preferences</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={savePreferences}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderMultiSelectSection(
          'Dietary Restrictions',
          dietaryOptions,
          'dietaryRestrictions',
          'restaurant-outline'
        )}

        {renderMultiSelectSection(
          'Allergies & Food Sensitivities',
          allergyOptions,
          'allergies',
          'warning-outline'
        )}

        {renderMultiSelectSection(
          'Preferred Cuisines',
          cuisineOptions,
          'preferredCuisines',
          'earth-outline'
        )}

        {renderSingleSelectSection(
          'Cooking Time Preference',
          cookingTimeOptions,
          preferences.cookingTime,
          (value) => updateSingleValue('cookingTime', value),
          'time-outline'
        )}

        {renderSingleSelectSection(
          'Cooking Skill Level',
          skillLevelOptions,
          preferences.skillLevel,
          (value) => updateSingleValue('skillLevel', value),
          'trophy-outline'
        )}

        {renderServingSizeSection()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  optionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
  checkmark: {
    marginLeft: 6,
  },
  singleSelectContainer: {
    gap: 12,
  },
  singleSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  singleSelectButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  singleSelectText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  singleSelectTextSelected: {
    color: '#fff',
  },
  servingSizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  servingSizeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingSizeButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  servingSizeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  servingSizeTextSelected: {
    color: '#fff',
  },
  servingSizeLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default PreferencesScreen;