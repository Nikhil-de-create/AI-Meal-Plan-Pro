import { notificationService } from './notification';
import { storage } from '../storage';
import { CookingSession, CookingStep } from '@shared/schema';

interface ActiveTimer {
  sessionId: number;
  stepIndex: number;
  timeoutId: NodeJS.Timeout;
  startTime: Date;
  durationMs: number;
}

/**
 * Cooking Session Manager
 * Handles real-time cooking step notifications and session management
 */
class CookingSessionManager {
  private activeTimers: Map<number, ActiveTimer> = new Map();
  private pausedSessions: Map<number, { pausedAt: Date; remainingMs: number }> = new Map();

  /**
   * Start a cooking session and schedule notifications for each step
   */
  async startCookingSession(userId: number, recipeId: number): Promise<CookingSession> {
    try {
      // Get recipe cooking steps
      const cookingSteps = await storage.getCookingStepsByRecipe(recipeId);
      if (!cookingSteps || cookingSteps.length === 0) {
        throw new Error('No cooking steps found for this recipe');
      }

      // Create cooking session
      const session = await storage.createCookingSession({
        userId,
        recipeId,
        status: 'active',
        currentStepIndex: 0,
        startedAt: new Date(),
        totalPausedDuration: 0
      });

      // Send immediate notification for first step
      await this.sendStepNotification(userId, cookingSteps[0], 0, 'start');

      // Schedule timer for first step if it has duration
      if (cookingSteps[0].isTimerRequired && (cookingSteps[0].durationMinutes || cookingSteps[0].durationSeconds)) {
        this.scheduleStepTimer(session.id, 0, cookingSteps[0], userId, cookingSteps);
      }

      console.log(`🍳 Cooking session started for user ${userId}, recipe ${recipeId}`);
      return session;
    } catch (error) {
      console.error('Error starting cooking session:', error);
      throw error;
    }
  }

  /**
   * Pause active cooking session
   */
  async pauseCookingSession(sessionId: number): Promise<CookingSession | null> {
    try {
      const activeTimer = this.activeTimers.get(sessionId);
      if (activeTimer) {
        // Calculate remaining time
        const elapsed = Date.now() - activeTimer.startTime.getTime();
        const remaining = Math.max(0, activeTimer.durationMs - elapsed);
        
        // Store paused state
        this.pausedSessions.set(sessionId, {
          pausedAt: new Date(),
          remainingMs: remaining
        });
        
        // Clear active timer
        clearTimeout(activeTimer.timeoutId);
        this.activeTimers.delete(sessionId);
      }

      // Update session status
      const session = await storage.updateCookingSession(sessionId, {
        status: 'paused',
        pausedAt: new Date()
      });

      console.log(`⏸️ Cooking session ${sessionId} paused`);
      return session;
    } catch (error) {
      console.error('Error pausing cooking session:', error);
      throw error;
    }
  }

  /**
   * Resume paused cooking session
   */
  async resumeCookingSession(sessionId: number): Promise<CookingSession | null> {
    try {
      const session = await storage.getCookingSession(sessionId);
      if (!session || session.status !== 'paused') {
        throw new Error('Session not found or not paused');
      }

      const pausedState = this.pausedSessions.get(sessionId);
      const cookingSteps = await storage.getCookingStepsByRecipe(session.recipeId);
      
      if (pausedState && cookingSteps) {
        const currentStep = cookingSteps[session.currentStepIndex];
        if (currentStep && currentStep.isTimerRequired && pausedState.remainingMs > 0) {
          // Resume timer with remaining time
          this.scheduleStepTimer(
            sessionId, 
            session.currentStepIndex, 
            currentStep, 
            session.userId, 
            cookingSteps,
            pausedState.remainingMs
          );
        }
        
        // Calculate total paused duration
        const pausedDuration = Date.now() - pausedState.pausedAt.getTime();
        const totalPausedDuration = session.totalPausedDuration + Math.floor(pausedDuration / 1000);

        this.pausedSessions.delete(sessionId);
        
        // Update session status
        const updatedSession = await storage.updateCookingSession(sessionId, {
          status: 'active',
          pausedAt: null,
          totalPausedDuration
        });

        console.log(`▶️ Cooking session ${sessionId} resumed`);
        return updatedSession;
      }

      return session;
    } catch (error) {
      console.error('Error resuming cooking session:', error);
      throw error;
    }
  }

  /**
   * Cancel cooking session
   */
  async cancelCookingSession(sessionId: number): Promise<CookingSession | null> {
    try {
      // Clear any active timers
      const activeTimer = this.activeTimers.get(sessionId);
      if (activeTimer) {
        clearTimeout(activeTimer.timeoutId);
        this.activeTimers.delete(sessionId);
      }

      // Remove paused state
      this.pausedSessions.delete(sessionId);

      // Update session status
      const session = await storage.updateCookingSession(sessionId, {
        status: 'cancelled',
        completedAt: new Date()
      });

      console.log(`❌ Cooking session ${sessionId} cancelled`);
      return session;
    } catch (error) {
      console.error('Error cancelling cooking session:', error);
      throw error;
    }
  }

  /**
   * Move to next cooking step
   */
  async nextStep(sessionId: number): Promise<CookingSession | null> {
    try {
      const session = await storage.getCookingSession(sessionId);
      if (!session || session.status !== 'active') {
        throw new Error('Session not found or not active');
      }

      const cookingSteps = await storage.getCookingStepsByRecipe(session.recipeId);
      if (!cookingSteps) {
        throw new Error('Cooking steps not found');
      }

      const nextStepIndex = session.currentStepIndex + 1;

      // Check if cooking is complete
      if (nextStepIndex >= cookingSteps.length) {
        return await storage.updateCookingSession(sessionId, {
          status: 'completed',
          completedAt: new Date()
        });
      }

      // Update to next step
      const updatedSession = await storage.updateCookingSession(sessionId, {
        currentStepIndex: nextStepIndex
      });

      // Send notification for next step
      const nextStep = cookingSteps[nextStepIndex];
      await this.sendStepNotification(session.userId, nextStep, nextStepIndex, 'start');

      // Schedule timer for next step if needed
      if (nextStep.isTimerRequired && (nextStep.durationMinutes || nextStep.durationSeconds)) {
        this.scheduleStepTimer(sessionId, nextStepIndex, nextStep, session.userId, cookingSteps);
      }

      console.log(`⏭️ Cooking session ${sessionId} moved to step ${nextStepIndex + 1}`);
      return updatedSession;
    } catch (error) {
      console.error('Error moving to next step:', error);
      throw error;
    }
  }

  /**
   * Schedule notification timer for cooking step
   */
  private scheduleStepTimer(
    sessionId: number, 
    stepIndex: number, 
    step: CookingStep, 
    userId: number, 
    allSteps: CookingStep[],
    customDurationMs?: number
  ) {
    // Calculate duration in milliseconds
    const durationMs = customDurationMs || 
      ((step.durationMinutes || 0) * 60 * 1000) + 
      ((step.durationSeconds || 0) * 1000);

    if (durationMs <= 0) return;

    const timeoutId = setTimeout(async () => {
      try {
        // Send completion notification for current step
        await this.sendStepNotification(userId, step, stepIndex, 'complete');

        // Check if there's a next step
        const nextStepIndex = stepIndex + 1;
        if (nextStepIndex < allSteps.length) {
          // Auto-advance to next step
          await this.nextStep(sessionId);
        } else {
          // Complete the cooking session
          await storage.updateCookingSession(sessionId, {
            status: 'completed',
            completedAt: new Date()
          });
          
          // Send completion notification
          await this.sendCookingCompleteNotification(userId);
        }

        // Remove from active timers
        this.activeTimers.delete(sessionId);
      } catch (error) {
        console.error('Error in step timer:', error);
      }
    }, durationMs);

    // Store active timer
    this.activeTimers.set(sessionId, {
      sessionId,
      stepIndex,
      timeoutId,
      startTime: new Date(),
      durationMs
    });
  }

  /**
   * Send cooking step notification
   */
  private async sendStepNotification(
    userId: number, 
    step: CookingStep, 
    stepIndex: number, 
    type: 'start' | 'complete'
  ) {
    const stepNumber = stepIndex + 1;
    const durationText = this.formatDuration(step.durationMinutes || 0, step.durationSeconds || 0);
    
    let title: string;
    let body: string;

    if (type === 'start') {
      title = `🍳 Step ${stepNumber}: ${step.description}`;
      body = step.isTimerRequired && durationText 
        ? `${step.instructions}\n⏰ Timer: ${durationText}`
        : step.instructions;
    } else {
      title = `✅ Step ${stepNumber} Complete!`;
      body = step.isTimerRequired 
        ? `${step.description} timer finished. Ready for next step!`
        : `${step.description} completed.`;
    }

    await notificationService.sendCookingStepNotification(userId, {
      title,
      body,
      stepIndex,
      type,
      sessionData: {
        stepDescription: step.description,
        instructions: step.instructions,
        isTimerRequired: step.isTimerRequired,
        duration: durationText
      }
    });
  }

  /**
   * Send cooking completion notification
   */
  private async sendCookingCompleteNotification(userId: number) {
    await notificationService.sendCookingStepNotification(userId, {
      title: '🎉 Cooking Complete!',
      body: 'Congratulations! Your meal is ready to enjoy.',
      stepIndex: -1,
      type: 'complete',
      sessionData: {
        stepDescription: 'Cooking Complete',
        instructions: 'Your delicious meal is ready!',
        isTimerRequired: false,
        duration: ''
      }
    });
  }

  /**
   * Format cooking duration for display
   */
  private formatDuration(minutes: number, seconds: number): string {
    const parts: string[] = [];
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
  }

  /**
   * Get active cooking sessions for cleanup on server restart
   */
  async getActiveSessions(): Promise<CookingSession[]> {
    return await storage.getActiveCookingSessions();
  }

  /**
   * Clean up on server shutdown
   */
  cleanup() {
    // Clear all active timers
    for (const timer of this.activeTimers.values()) {
      clearTimeout(timer.timeoutId);
    }
    this.activeTimers.clear();
    this.pausedSessions.clear();
    console.log('🧹 Cooking session manager cleaned up');
  }
}

export const cookingSessionManager = new CookingSessionManager();