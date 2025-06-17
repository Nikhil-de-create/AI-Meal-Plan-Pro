import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabs } from './MainTabs';
import PreferencesScreen from '../screens/main/PreferencesScreen';
import NotificationScreen from '../screens/main/NotificationScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  Preferences: undefined;
  Notifications: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export const MainStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
    </Stack.Navigator>
  );
};