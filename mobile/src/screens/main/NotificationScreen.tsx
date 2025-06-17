import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { notificationService, NotificationSettings, NotificationHistory } from '../../services/NotificationService';

interface NotificationScreenProps {
  navigation: any;
}

export default function NotificationScreen({ navigation }: NotificationScreenProps) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [updating, setUpdating] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    loadNotificationData();
  }, []);

  const loadNotificationData = async () => {
    try {
      setLoading(true);
      
      // Load settings and history in parallel
      const [settingsData, historyData] = await Promise.all([
        notificationService.getNotificationSettings(),
        notificationService.getNotificationHistory(20)
      ]);

      setSettings(settingsData);
      setHistory(historyData);
      setPushToken(notificationService.getCurrentPushToken());
    } catch (error) {
      console.error('Error loading notification data:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setUpdating(true);
      const token = await notificationService.registerForPushNotifications();
      
      if (token) {
        setPushToken(token);
        Alert.alert('Success', 'Push notifications enabled! You\'ll receive meal reminders daily.');
        await loadNotificationData(); // Reload settings
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings to receive meal reminders.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      Alert.alert('Error', 'Failed to enable notifications');
    } finally {
      setUpdating(false);
    }
  };

  const handleDisableNotifications = async () => {
    Alert.alert(
      'Disable Notifications',
      'Are you sure you want to disable meal reminders?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              await notificationService.unregisterDevice();
              setPushToken(null);
              Alert.alert('Success', 'Push notifications disabled');
              await loadNotificationData();
            } catch (error) {
              console.error('Error disabling notifications:', error);
              Alert.alert('Error', 'Failed to disable notifications');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const updateMealReminders = async (enabled: boolean) => {
    try {
      setUpdating(true);
      const updatedSettings = await notificationService.updateNotificationSettings({
        mealRemindersEnabled: enabled
      });
      
      if (updatedSettings) {
        setSettings(updatedSettings);
        Alert.alert(
          'Settings Updated',
          enabled ? 'Meal reminders enabled' : 'Meal reminders disabled'
        );
      }
    } catch (error) {
      console.error('Error updating meal reminders:', error);
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.scheduleLocalNotification(
        'Test Notification',
        'This is a test meal reminder from your Meal Planner app!',
        3
      );
      Alert.alert('Test Scheduled', 'You should receive a test notification in 3 seconds');
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      Alert.alert('Error', 'Failed to schedule test notification');
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return '#4CAF50';
      case 'delivered':
        return '#2196F3';
      case 'failed':
        return '#f44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderHistoryItem = ({ item }: { item: NotificationHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.historyBody}>{item.body}</Text>
      <Text style={styles.historyTime}>{formatNotificationTime(item.sentAt)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Notification Setup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          
          {pushToken ? (
            <View style={styles.enabledContainer}>
              <View style={styles.statusRow}>
                <MaterialIcons name="notifications-active" size={24} color="#4CAF50" />
                <Text style={styles.enabledText}>Notifications Enabled</Text>
              </View>
              <TouchableOpacity 
                style={styles.disableButton} 
                onPress={handleDisableNotifications}
                disabled={updating}
              >
                <Text style={styles.disableButtonText}>Disable Notifications</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.disabledContainer}>
              <MaterialIcons name="notifications-off" size={48} color="#9E9E9E" />
              <Text style={styles.disabledText}>
                Enable push notifications to receive daily meal reminders and cooking tips
              </Text>
              <TouchableOpacity 
                style={styles.enableButton} 
                onPress={handleEnableNotifications}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.enableButtonText}>Enable Notifications</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notification Settings */}
        {settings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Meal Reminders</Text>
                <Text style={styles.settingDescription}>
                  Daily reminders about your meal plans at {settings.reminderTime}
                </Text>
              </View>
              <Switch
                value={settings.mealRemindersEnabled}
                onValueChange={updateMealReminders}
                disabled={updating || !pushToken}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        )}

        {/* Test Notification */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.testButton} onPress={testNotification}>
            <MaterialIcons name="notifications" size={20} color="#2196F3" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Notification History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          
          {history.length > 0 ? (
            <FlatList
              data={history}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="notifications-none" size={48} color="#9E9E9E" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                Enable notifications to start receiving meal reminders
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  enabledContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  enabledText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 12,
  },
  disableButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  enableButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  testButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  historyBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});