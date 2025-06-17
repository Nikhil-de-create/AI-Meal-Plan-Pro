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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface MealPlan {
  id: number;
  name: string;
  description: string;
  duration: number;
  dietType: string;
  meals: any[];
  createdAt: string;
  isActive: boolean;
}

interface UserStats {
  activePlans: number;
  favoriteRecipes: number;
  groceryLists: number;
}

const HomeScreen: React.FC = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mealPlansResponse, statsResponse] = await Promise.all([
        apiService.mealPlans.getAll(),
        apiService.auth.getStats(),
      ]);

      setMealPlans(mealPlansResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleGenerateMealPlan = () => {
    // Navigate to meal plan generation form
    Alert.alert(
      'Generate Meal Plan',
      'Would you like to create a new AI-generated meal plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Quick Generate', onPress: () => generateQuickMealPlan() },
        { text: 'Custom Plan', onPress: () => navigateToMealPlanForm() },
      ]
    );
  };

  const navigateToMealPlanForm = () => {
    // Navigate to the detailed meal plan request screen
    // In a real React Native app with navigation, this would be:
    // navigation.navigate('MealPlan');
    Alert.alert('Navigation', 'Navigate to Meal Plan tab to create a custom meal plan');
  };

  const generateQuickMealPlan = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.mealPlans.create({
        duration: 7,
        dietType: 'balanced',
      });
      
      Alert.alert('Success', 'New meal plan generated!');
      await loadData();
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const recentMealPlans = mealPlans.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Welcome back, {user?.firstName || user?.username}!
          </Text>
          <Text style={styles.subGreeting}>
            Ready to plan your meals?
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={handleGenerateMealPlan}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar" size={24} color="#2563eb" />
            </View>
            <Text style={styles.statNumber}>
              {stats?.activePlans || 0}
            </Text>
            <Text style={styles.statLabel}>Active Plans</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="heart" size={24} color="#16a34a" />
            </View>
            <Text style={styles.statNumber}>
              {stats?.favoriteRecipes || 0}
            </Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="list" size={24} color="#ea580c" />
            </View>
            <Text style={styles.statNumber}>
              {stats?.groceryLists || 0}
            </Text>
            <Text style={styles.statLabel}>Lists</Text>
          </View>
        </View>

        {/* Recent Meal Plans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Meal Plans</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading meal plans...</Text>
            </View>
          ) : recentMealPlans.length > 0 ? (
            recentMealPlans.map((plan) => (
              <TouchableOpacity key={plan.id} style={styles.mealPlanCard}>
                <View style={styles.mealPlanHeader}>
                  <View style={styles.mealPlanIcon}>
                    <Ionicons name="restaurant" size={20} color="#2563eb" />
                  </View>
                  <View style={styles.mealPlanInfo}>
                    <Text style={styles.mealPlanName}>{plan.name}</Text>
                    <Text style={styles.mealPlanDetails}>
                      {plan.duration} days • {plan.dietType}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: plan.isActive ? '#dcfce7' : '#f1f5f9' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: plan.isActive ? '#16a34a' : '#64748b' }
                    ]}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                {plan.description && (
                  <Text style={styles.mealPlanDescription}>
                    {plan.description}
                  </Text>
                )}
                
                <Text style={styles.mealPlanMeals}>
                  {plan.meals?.length || 0} meals planned
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No meal plans yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first AI-generated meal plan to get started
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleGenerateMealPlan}
              >
                <Text style={styles.createButtonText}>Generate Meal Plan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Ionicons name="search" size={24} color="#2563eb" />
              </View>
              <Text style={styles.actionTitle}>Browse Recipes</Text>
              <Text style={styles.actionDescription}>
                Discover new dishes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Ionicons name="list" size={24} color="#ea580c" />
              </View>
              <Text style={styles.actionTitle}>Grocery Lists</Text>
              <Text style={styles.actionDescription}>
                Auto-generate lists
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  generateButton: {
    backgroundColor: '#2563eb',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
  },
  mealPlanCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealPlanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealPlanInfo: {
    flex: 1,
  },
  mealPlanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  mealPlanDetails: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealPlanDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  mealPlanMeals: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default HomeScreen;