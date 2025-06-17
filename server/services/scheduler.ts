import * as cron from 'node-cron';
import { notificationService } from './notification';

export class NotificationScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Start all scheduled notification jobs
   */
  start(): void {
    this.scheduleDefaultMealReminders();
    console.log('Notification scheduler started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped scheduled job: ${name}`);
    });
    this.jobs.clear();
    console.log('Notification scheduler stopped');
  }

  /**
   * Schedule default meal reminders
   * Runs every day at 9 AM to send meal reminders
   */
  private scheduleDefaultMealReminders(): void {
    const jobName = 'daily-meal-reminders';
    
    // Schedule for 9 AM every day (0 9 * * *)
    const task = cron.schedule('0 9 * * *', async () => {
      try {
        console.log('Starting scheduled meal reminders...');
        await notificationService.sendMealReminders();
        console.log('Scheduled meal reminders completed');
      } catch (error) {
        console.error('Error in scheduled meal reminders:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.jobs.set(jobName, task);
    console.log(`Scheduled daily meal reminders at 9 AM UTC`);
  }

  /**
   * Schedule meal reminders for a specific time
   * @param hour - Hour in 24-hour format (0-23)
   * @param minute - Minute (0-59)
   * @param timezone - Timezone identifier (default: UTC)
   */
  scheduleCustomMealReminders(hour: number, minute: number, timezone: string = 'UTC'): void {
    const jobName = `custom-meal-reminders-${hour}-${minute}`;
    
    // Stop existing custom job if it exists
    if (this.jobs.has(jobName)) {
      this.jobs.get(jobName)?.stop();
      this.jobs.delete(jobName);
    }

    // Create cron expression: minute hour * * *
    const cronExpression = `${minute} ${hour} * * *`;
    
    const task = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Starting custom meal reminders at ${hour}:${minute} ${timezone}...`);
        await notificationService.sendMealReminders();
        console.log(`Custom meal reminders completed at ${hour}:${minute} ${timezone}`);
      } catch (error) {
        console.error('Error in custom meal reminders:', error);
      }
    }, {
      scheduled: true,
      timezone
    });

    this.jobs.set(jobName, task);
    console.log(`Scheduled custom meal reminders at ${hour}:${minute} ${timezone}`);
  }

  /**
   * Schedule weekly meal plan generation reminders
   * Runs every Sunday at 8 PM to remind users to plan their week
   */
  scheduleWeeklyPlanningReminders(): void {
    const jobName = 'weekly-planning-reminders';
    
    // Schedule for 8 PM every Sunday (0 20 * * 0)
    const task = cron.schedule('0 20 * * 0', async () => {
      try {
        console.log('Starting weekly meal planning reminders...');
        // This could be extended to send different types of notifications
        // For now, we'll use the same meal reminder service
        await notificationService.sendMealReminders();
        console.log('Weekly meal planning reminders completed');
      } catch (error) {
        console.error('Error in weekly planning reminders:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.jobs.set(jobName, task);
    console.log('Scheduled weekly meal planning reminders for Sunday 8 PM UTC');
  }

  /**
   * Get information about all active scheduled jobs
   */
  getActiveJobs(): Array<{ name: string; isRunning: boolean }> {
    return Array.from(this.jobs.entries()).map(([name, task]) => ({
      name,
      isRunning: task.getStatus() === 'scheduled'
    }));
  }

  /**
   * Manually trigger meal reminders (for testing)
   */
  async triggerMealReminders(): Promise<void> {
    try {
      console.log('Manually triggering meal reminders...');
      await notificationService.sendMealReminders();
      console.log('Manual meal reminders completed');
    } catch (error) {
      console.error('Error in manual meal reminders:', error);
      throw error;
    }
  }
}

export const notificationScheduler = new NotificationScheduler();