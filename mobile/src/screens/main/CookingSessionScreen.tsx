import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../services/api';

interface CookingStep {
  id: number;
  stepNumber: number;
  description: string;
  durationMinutes?: number;
  durationSeconds?: number;
  isTimerRequired: boolean;
  instructions: string;
}

interface CookingSession {
  id: number;
  recipeId: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentStepIndex: number;
  startedAt: string;
  pausedAt?: string;
  totalPausedDuration: number;
}

interface Recipe {
  id: number;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
}

export default function CookingSessionScreen({ route, navigation }) {
  const { recipe } = route.params as { recipe: Recipe };
  
  const [cookingSteps, setCookingSteps] = useState<CookingStep[]>([]);
  const [session, setSession] = useState<CookingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(true);
  const [showStepsModal, setShowStepsModal] = useState(false);

  useEffect(() => {
    loadCookingSteps();
  }, [recipe.id]);

  const loadCookingSteps = async () => {
    try {
      setStepsLoading(true);
      const steps = await api.get(`/recipes/${recipe.id}/cooking-steps`);
      setCookingSteps(steps);
    } catch (error) {
      console.error('Error loading cooking steps:', error);
      Alert.alert('Error', 'Failed to load cooking steps');
    } finally {
      setStepsLoading(false);
    }
  };

  const startCookingSession = async () => {
    try {
      setLoading(true);
      const newSession = await api.post(`/cooking-sessions/start/${recipe.id}`);
      setSession(newSession);
      
      Alert.alert(
        'Cooking Started!',
        'You will receive notifications for each cooking step. Make sure notifications are enabled.',
        [{ text: 'Got it!' }]
      );
    } catch (error) {
      console.error('Error starting cooking session:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start cooking session');
    } finally {
      setLoading(false);
    }
  };

  const pauseSession = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const updatedSession = await api.put(`/cooking-sessions/${session.id}/pause`);
      setSession(updatedSession);
      Alert.alert('Session Paused', 'Your cooking session has been paused. Timers are stopped.');
    } catch (error) {
      console.error('Error pausing session:', error);
      Alert.alert('Error', 'Failed to pause session');
    } finally {
      setLoading(false);
    }
  };

  const resumeSession = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const updatedSession = await api.put(`/cooking-sessions/${session.id}/resume`);
      setSession(updatedSession);
      Alert.alert('Session Resumed', 'Your cooking session has been resumed. Timers are active.');
    } catch (error) {
      console.error('Error resuming session:', error);
      Alert.alert('Error', 'Failed to resume session');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const updatedSession = await api.put(`/cooking-sessions/${session.id}/next-step`);
      setSession(updatedSession);
      
      if (updatedSession.status === 'completed') {
        Alert.alert(
          'Cooking Complete!',
          'Congratulations! Your meal is ready to enjoy.',
          [
            { text: 'Done', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Error advancing step:', error);
      Alert.alert('Error', 'Failed to advance to next step');
    } finally {
      setLoading(false);
    }
  };

  const cancelSession = async () => {
    if (!session) return;
    
    Alert.alert(
      'Cancel Cooking Session',
      'Are you sure you want to cancel this cooking session?',
      [
        { text: 'Keep Cooking', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/cooking-sessions/${session.id}`);
              setSession(null);
              navigation.goBack();
            } catch (error) {
              console.error('Error cancelling session:', error);
              Alert.alert('Error', 'Failed to cancel session');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatDuration = (minutes?: number, seconds?: number): string => {
    const parts: string[] = [];
    if (minutes && minutes > 0) parts.push(`${minutes}m`);
    if (seconds && seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || 'No timer';
  };

  const getCurrentStep = (): CookingStep | null => {
    if (!session || !cookingSteps.length) return null;
    return cookingSteps[session.currentStepIndex] || null;
  };

  const getSessionStatusColor = () => {
    if (!session) return '#9E9E9E';
    switch (session.status) {
      case 'active': return '#4CAF50';
      case 'paused': return '#FF9800';
      case 'completed': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getSessionStatusText = () => {
    if (!session) return 'Not Started';
    switch (session.status) {
      case 'active': return 'Cooking Active';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const currentStep = getCurrentStep();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getSessionStatusColor() }]} />
            <Text style={styles.statusText}>{getSessionStatusText()}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowStepsModal(true)} style={styles.stepsButton}>
          <MaterialIcons name="list" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {stepsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading cooking steps...</Text>
          </View>
        ) : (
          <>
            {/* Recipe Info */}
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeDescription}>{recipe.description}</Text>
              <View style={styles.timeInfo}>
                <View style={styles.timeItem}>
                  <MaterialIcons name="schedule" size={16} color="#666" />
                  <Text style={styles.timeText}>Prep: {recipe.prepTime}min</Text>
                </View>
                <View style={styles.timeItem}>
                  <MaterialIcons name="local-fire-department" size={16} color="#666" />
                  <Text style={styles.timeText}>Cook: {recipe.cookTime}min</Text>
                </View>
              </View>
            </View>

            {/* Current Step */}
            {session && currentStep && (
              <View style={styles.currentStepContainer}>
                <Text style={styles.currentStepTitle}>
                  Step {currentStep.stepNumber} of {cookingSteps.length}
                </Text>
                <Text style={styles.stepDescription}>{currentStep.description}</Text>
                <Text style={styles.stepInstructions}>{currentStep.instructions}</Text>
                
                {currentStep.isTimerRequired && (
                  <View style={styles.timerInfo}>
                    <MaterialIcons name="timer" size={20} color="#FF5722" />
                    <Text style={styles.timerText}>
                      Timer: {formatDuration(currentStep.durationMinutes, currentStep.durationSeconds)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Session Controls */}
            <View style={styles.controlsContainer}>
              {!session ? (
                <TouchableOpacity
                  style={[styles.controlButton, styles.startButton]}
                  onPress={startCookingSession}
                  disabled={loading || cookingSteps.length === 0}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="play-arrow" size={24} color="#fff" />
                      <Text style={styles.startButtonText}>Start Cooking</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.sessionControls}>
                  {session.status === 'active' && (
                    <>
                      <TouchableOpacity
                        style={[styles.controlButton, styles.pauseButton]}
                        onPress={pauseSession}
                        disabled={loading}
                      >
                        <MaterialIcons name="pause" size={20} color="#fff" />
                        <Text style={styles.controlButtonText}>Pause</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.controlButton, styles.nextButton]}
                        onPress={nextStep}
                        disabled={loading}
                      >
                        <MaterialIcons name="skip-next" size={20} color="#fff" />
                        <Text style={styles.controlButtonText}>Next Step</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {session.status === 'paused' && (
                    <TouchableOpacity
                      style={[styles.controlButton, styles.resumeButton]}
                      onPress={resumeSession}
                      disabled={loading}
                    >
                      <MaterialIcons name="play-arrow" size={20} color="#fff" />
                      <Text style={styles.controlButtonText}>Resume</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.controlButton, styles.cancelButton]}
                    onPress={cancelSession}
                    disabled={loading}
                  >
                    <MaterialIcons name="stop" size={20} color="#fff" />
                    <Text style={styles.controlButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Steps Overview */}
            {cookingSteps.length > 0 && (
              <View style={styles.stepsOverview}>
                <Text style={styles.overviewTitle}>Cooking Steps Overview</Text>
                {cookingSteps.map((step, index) => (
                  <View 
                    key={step.id} 
                    style={[
                      styles.stepItem,
                      session && index === session.currentStepIndex && styles.activeStepItem,
                      session && index < session.currentStepIndex && styles.completedStepItem
                    ]}
                  >
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{step.description}</Text>
                      {step.isTimerRequired && (
                        <Text style={styles.stepTimer}>
                          {formatDuration(step.durationMinutes, step.durationSeconds)}
                        </Text>
                      )}
                    </View>
                    {session && index < session.currentStepIndex && (
                      <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Steps Modal */}
      <Modal
        visible={showStepsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Cooking Steps</Text>
            <TouchableOpacity onPress={() => setShowStepsModal(false)}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {cookingSteps.map((step) => (
              <View key={step.id} style={styles.modalStepItem}>
                <View style={styles.modalStepHeader}>
                  <Text style={styles.modalStepNumber}>Step {step.stepNumber}</Text>
                  {step.isTimerRequired && (
                    <View style={styles.modalTimerBadge}>
                      <MaterialIcons name="timer" size={14} color="#FF5722" />
                      <Text style={styles.modalTimerText}>
                        {formatDuration(step.durationMinutes, step.durationSeconds)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modalStepTitle}>{step.description}</Text>
                <Text style={styles.modalStepInstructions}>{step.instructions}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  stepsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  recipeInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recipeDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  timeInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  currentStepContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  currentStepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  stepInstructions: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timerText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FF5722',
    fontWeight: '500',
  },
  controlsContainer: {
    marginBottom: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sessionControls: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    flex: 1,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#2196F3',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    flex: 1,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  stepsOverview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeStepItem: {
    backgroundColor: '#E3F2FD',
  },
  completedStepItem: {
    backgroundColor: '#F1F8E9',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  stepTimer: {
    fontSize: 12,
    color: '#FF5722',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalStepItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalStepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  modalTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  modalTimerText: {
    fontSize: 12,
    color: '#FF5722',
    fontWeight: '500',
  },
  modalStepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalStepInstructions: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});