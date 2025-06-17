import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/main/HomeScreen';
import RecipesScreen from '../screens/main/RecipesScreen';
import GroceryListScreen from '../screens/main/GroceryListScreen';
import PantryScreen from '../screens/main/PantryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import MealPlanRequestScreen from '../screens/main/MealPlanRequestScreen';

export type MainTabParamList = {
  Home: undefined;
  MealPlan: undefined;
  Recipes: undefined;
  GroceryList: undefined;
  Pantry: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MealPlan') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Recipes') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'GroceryList') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Pantry') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="MealPlan" 
        component={MealPlanRequestScreen}
        options={{ tabBarLabel: 'Meal Plan' }}
      />
      <Tab.Screen 
        name="Recipes" 
        component={RecipesScreen}
        options={{ tabBarLabel: 'Recipes' }}
      />
      <Tab.Screen 
        name="GroceryList" 
        component={GroceryListScreen}
        options={{ tabBarLabel: 'Grocery List' }}
      />
      <Tab.Screen 
        name="Pantry" 
        component={PantryScreen}
        options={{ tabBarLabel: 'Pantry' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};