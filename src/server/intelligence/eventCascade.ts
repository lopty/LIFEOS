import { randomUUID } from "node:crypto";
import { db } from "../db.ts";
import { eventDispatcher } from "./eventDispatcher.ts";
import { NotificationPolicyEngine } from "./notificationPolicy.ts";
import { CityEvent, LifeInsight } from "../../types/index.ts";
export function shiftIncludes(hours: string, time: string) {
  const match = hours.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
  if (!match) return false;
  return match[1] > match[2]
    ? time >= match[1] || time < match[2]
    : time >= match[1] && time < match[2];
}
export class EventCascadeEngine {
  static processEventCascade(event: CityEvent) {
    const confirmed = db
      .getAttendance()
      .filter((a) => a.eventId === event.id && a.attending).length;
    event.confirmedAttendance = confirmed;
    const trips = Math.round(confirmed * 0.3);
    event.transportDemandEstimate = {
      peakOutflowTime: event.endTime,
      estimatedTaxisNeeded: trips,
      corridors: [],
      notes: `${confirmed} independently confirmed participants. Assumes 30% need taxis; ride counts are estimates, not bookings or earnings.`,
    };
    db.updateEvent(event);
    const weekday = new Date(`${event.date}T12:00:00+04:00`).toLocaleDateString(
      "en-GB",
      { timeZone: "Asia/Dubai", weekday: "long" },
    );
    const drivers = db
      .getUsers()
      .filter(
        (u) =>
          u.consentSettings.allowTransportInsights &&
          u.scheduleRoutine.workDays.includes(weekday) &&
          (u.primaryArea === event.area ||
            u.frequentedAreas.includes(event.area)) &&
          shiftIncludes(u.scheduleRoutine.workHours, event.endTime),
      );
    // Limit active suggestions so one estimate does not send every driver to a venue.
    const selected = drivers.slice(0, Math.min(3, Math.ceil(trips / 20)));
    for (const prior of db
      .getInsights()
      .filter(
        (i) =>
          i.id.startsWith(`transport_${event.id}_`) &&
          !selected.some((u) => u.id === i.recipientUserId),
      )) {
      prior.status = "DISMISSED";
      prior.isActionable = false;
      prior.evidence = event.transportDemandEstimate.notes;
      db.updateInsight(prior);
      for (const n of db
        .getNotifications(prior.recipientUserId)
        .filter((n) => n.deduplicationKey === prior.id)) {
        n.deliveryStatus = "DISMISSED";
        db.updateNotification(n);
      }
      eventDispatcher.sendToUser(prior.recipientUserId, {
        type: "INSIGHT_GENERATED",
        recipientUserId: prior.recipientUserId,
        data: {},
        timestamp: new Date().toISOString(),
      });
    }
    for (const driver of selected) {
      const id = `transport_${event.id}_${driver.id}`,
        old = db.getInsights(driver.id).find((i) => i.id === id);
      const insight: LifeInsight = {
        id,
        recipientUserId: driver.id,
        insightType: "TRANSPORT_DEMAND",
        title: `Possible pickups in ${event.area}`,
        summary: `Around ${trips} taxi trips may be needed after ${event.endTime}. This overlaps your declared shift.`,
        evidence: event.transportDemandEstimate.notes,
        confidence: 0.5,
        nextSuggestedAction:
          "Review the estimate and permitted pickup areas. No ride demand is guaranteed.",
        isActionable: true,
        status: old?.status || "NEW",
        createdAt: old?.createdAt || new Date().toISOString(),
      };
      if (old) db.updateInsight(insight);
      else db.addInsight(insight);
      for (const n of db
        .getNotifications(driver.id)
        .filter((n) => n.deduplicationKey === id)) {
        n.message = insight.summary;
        db.updateNotification(n);
      }
      if (!old)
        NotificationPolicyEngine.enqueue({
          id: randomUUID(),
          recipientUserId: driver.id,
          priority: "GENTLE",
          title: insight.title,
          message: insight.summary,
          deliveryStatus: "PENDING",
          scheduledAt: new Date().toISOString(),
          deduplicationKey: id,
          category: "CITY_PULSE",
        });
      eventDispatcher.sendToUser(driver.id, {
        type: "INSIGHT_GENERATED",
        recipientUserId: driver.id,
        data: { insight },
        timestamp: new Date().toISOString(),
      });
    }
    eventDispatcher.broadcast({
      type: "EVENT_CASCADE_UPDATED",
      data: { event },
      timestamp: new Date().toISOString(),
    });
  }
  static publish(event: CityEvent) {
    this.processEventCascade(event);
    for (const user of db.getUsers()) {
      if (
        user.id === event.organizerId ||
        !user.allowEventDiscovery ||
        !(
          user.primaryArea === event.area ||
          user.frequentedAreas.includes(event.area)
        )
      )
        continue;
      const relevant = user.interests.some(
        (i) =>
          event.description.toLowerCase().includes(i.toLowerCase()) ||
          event.category.toLowerCase().includes(i.toLowerCase()),
      );
      if (!relevant) continue;
      NotificationPolicyEngine.enqueue({
        id: randomUUID(),
        recipientUserId: user.id,
        priority: "GENTLE",
        title: "Something near you",
        message: `${event.isDemo ? "Sample event: " : ""}${event.title} in ${event.area}. Take a look in Explore if it fits your day.`,
        deliveryStatus: "PENDING",
        scheduledAt: new Date().toISOString(),
        deduplicationKey: `published_${event.id}_${user.id}`,
        category: "CITY_PULSE",
      });
    }
  }
  static incrementAttendance(id: string) {
    const event = db.getEventById(id);
    if (event) this.processEventCascade(event);
  }
}
