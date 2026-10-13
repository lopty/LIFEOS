import { db } from "../db.ts";
import { eventDispatcher } from "./eventDispatcher.ts";
import { NotificationItem, NotificationPriority } from "../../types/index.ts";
export function dubaiClock(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}
export class NotificationPolicyEngine {
  static canDeliver(
    userId: string,
    priority: NotificationPriority,
    deduplicationKey: string,
  ) {
    const user = db.getUserById(userId);
    if (!user) return { deliver: false };
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dubai",
    }).format(new Date());
    if (user.notificationDate !== date) {
      user.notificationDate = date;
      user.notificationBudget.usedToday = 0;
      db.updateUser(user);
    }
    if (
      db
        .getNotifications(userId)
        .some(
          (n) =>
            n.deduplicationKey === deduplicationKey &&
            n.deliveryStatus === "DELIVERED",
        )
    )
      return { deliver: false };
    const clock = dubaiClock(),
      { quietHoursStart: s, quietHoursEnd: e } = user.scheduleRoutine;
    const quiet =
      s === e
        ? false
        : s > e
          ? clock >= s || clock < e
          : clock >= s && clock < e;
    const resting = db
      .getMoments(userId)
      .some(
        (m) =>
          m.kind === "REST_TIME" &&
          m.status === "ACTIVE" &&
          Date.parse(m.startTime) <= Date.now() &&
          Date.parse(m.endTime) > Date.now(),
      );
    if (
      priority === "SILENT" ||
      quiet ||
      resting ||
      user.notificationBudget.quietHoursActive
    )
      return { deliver: false };
    return {
      deliver:
        user.notificationBudget.usedToday < user.notificationBudget.maxPerDay,
    };
  }
  static recordDelivery(userId: string) {
    const user = db.getUserById(userId);
    if (user) {
      user.notificationBudget.usedToday++;
      db.updateUser(user);
    }
  }
  static enqueue(notification: NotificationItem) {
    const user = db.getUserById(notification.recipientUserId);
    if (!user || user.stoppedTopics?.includes(notification.category)) return;
    if (
      db
        .getNotifications(user.id)
        .some((n) => n.deduplicationKey === notification.deduplicationKey)
    )
      return;
    notification.deliveryStatus = this.canDeliver(
      user.id,
      notification.priority,
      notification.deduplicationKey,
    ).deliver
      ? "DELIVERED"
      : "PENDING";
    if (notification.deliveryStatus === "DELIVERED") {
      notification.deliveredAt = new Date().toISOString();
      this.recordDelivery(user.id);
    }
    db.addNotification(notification);
    eventDispatcher.sendToUser(user.id, {
      type: "NEW_NOTIFICATION",
      recipientUserId: user.id,
      data: { notification },
      timestamp: new Date().toISOString(),
    });
  }
  static processQueue() {
    for (const user of db.getUsers())
      for (const n of db.getNotifications(user.id)) {
        if (
          !["PENDING", "SNOOZED"].includes(n.deliveryStatus) ||
          Date.parse(n.scheduledAt) > Date.now() ||
          user.stoppedTopics?.includes(n.category)
        )
          continue;
        if (this.canDeliver(user.id, n.priority, n.deduplicationKey).deliver) {
          n.deliveryStatus = "DELIVERED";
          n.deliveredAt = new Date().toISOString();
          db.updateNotification(n);
          this.recordDelivery(user.id);
          eventDispatcher.sendToUser(user.id, {
            type: "NEW_NOTIFICATION",
            recipientUserId: user.id,
            data: { notification: n },
            timestamp: new Date().toISOString(),
          });
        }
      }
  }
  static handleUserFeedback(
    id: string,
    userId: string,
    action: "DISMISS" | "SNOOZE" | "NOT_INTERESTED" | "STOP_TOPIC",
  ) {
    const n = db.getNotifications(userId).find((n) => n.id === id);
    if (!n) return false;
    n.deliveryStatus = action === "SNOOZE" ? "SNOOZED" : "DISMISSED";
    if (action === "SNOOZE")
      n.scheduledAt = new Date(Date.now() + 3600000).toISOString();
    if (action === "STOP_TOPIC") {
      const user = db.getUserById(userId)!;
      user.stoppedTopics = [
        ...new Set([...(user.stoppedTopics || []), n.category]),
      ];
      db.updateUser(user);
      for (const topic of db
        .getNotifications(userId)
        .filter((t) => t.category === n.category)) {
        topic.deliveryStatus = "DISMISSED";
        db.updateNotification(topic);
      }
    }
    db.updateNotification(n);
    return true;
  }
}
