import { db } from '../db.ts';
import { NotificationItem, NotificationPriority } from '../../types/index.ts';

export class NotificationPolicyEngine {
  /**
   * Determine whether a notification should be delivered right now or buffered
   */
  public static canDeliver(
    userId: string,
    priority: NotificationPriority,
    deduplicationKey: string
  ): { deliver: boolean; reason?: string } {
    const user = db.getUserById(userId);
    if (!user) return { deliver: false, reason: 'User not found' };

    // 1. Check deduplication
    const existing = db.getNotifications(userId);
    const isDuplicate = existing.some(
      (n) => n.deduplicationKey === deduplicationKey && n.deliveryStatus !== 'DISMISSED'
    );
    if (isDuplicate) {
      return { deliver: false, reason: 'Duplicate notification suppressed' };
    }

    // 2. ACTION_REQUIRED bypasses quiet hours and budgets
    if (priority === 'ACTION_REQUIRED') {
      return { deliver: true };
    }

    // 3. Check quiet hours
    const now = new Date();
    const currentHourMinute = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const { quietHoursStart, quietHoursEnd } = user.scheduleRoutine;

    // Handle overnight quiet hours (e.g., 22:30 to 07:00)
    let isQuiet = false;
    if (quietHoursStart > quietHoursEnd) {
      isQuiet = currentHourMinute >= quietHoursStart || currentHourMinute <= quietHoursEnd;
    } else {
      isQuiet = currentHourMinute >= quietHoursStart && currentHourMinute <= quietHoursEnd;
    }

    if (isQuiet) {
      return { deliver: false, reason: 'Quiet hours active for resident' };
    }

    // 4. Check user notification budget
    if (user.notificationBudget.usedToday >= user.notificationBudget.maxPerDay) {
      return { deliver: false, reason: 'Daily notification budget reached' };
    }

    return { deliver: true };
  }

  public static recordDelivery(userId: string) {
    const user = db.getUserById(userId);
    if (user) {
      user.notificationBudget.usedToday += 1;
      db.updateUser(user);
    }
  }

  public static handleUserFeedback(
    notifId: string,
    userId: string,
    action: 'DISMISS' | 'SNOOZE' | 'NOT_INTERESTED' | 'STOP_TOPIC'
  ) {
    const notifs = db.getNotifications(userId);
    const notif = notifs.find((n) => n.id === notifId);
    if (!notif) return;

    if (action === 'DISMISS') {
      notif.deliveryStatus = 'DISMISSED';
    } else if (action === 'SNOOZE') {
      notif.deliveryStatus = 'SNOOZED';
      notif.scheduledAt = new Date(Date.now() + 3600000).toISOString();
    } else if (action === 'NOT_INTERESTED' || action === 'STOP_TOPIC') {
      notif.deliveryStatus = 'DISMISSED';
      // Adjust user preferences
      const user = db.getUserById(userId);
      if (user && notif.category === 'INTRODUCTION') {
        user.consentSettings.maxWeeklyIntros = Math.max(0, user.consentSettings.maxWeeklyIntros - 1);
        db.updateUser(user);
      }
    }
    db.updateNotification(notif);
  }
}
