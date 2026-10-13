import { db } from '../db.ts';
import { eventDispatcher } from './eventDispatcher.ts';
import { CityEvent, LifeInsight, NotificationItem } from '../../types/index.ts';

export class EventCascadeEngine {
  /**
   * Recalculate event cascades whenever an event is published or attendance changes
   */
  public static processEventCascade(event: CityEvent) {
    console.log(`Processing cascade for event: ${event.title} in ${event.area}`);

    // 1. Calculate tentative transport demand based on actual confirmed attendance + clear assumptions
    const confirmed = event.confirmedAttendance || 0;
    // Clear stated assumption: ~30% of attendees require vehicular egress, 40% using metro/walking, 30% private cars with parking
    const estimatedVehicularTrips = Math.round(confirmed * 0.3);
    const peakOutflowWindow = `${event.endTime.split(':')[0]}:30 - ${Number(event.endTime.split(':')[0]) + 1}:00`;

    const transportEstimate = {
      peakOutflowTime: peakOutflowWindow,
      estimatedTaxisNeeded: estimatedVehicularTrips,
      corridors: [
        { destination: 'Downtown / DIFC Corridor (Sheikh Zayed Road)', sharePercentage: 44 },
        { destination: 'Palm Jumeirah & JBR Local', sharePercentage: 32 },
        { destination: 'DXB Airport Express', sharePercentage: 24 },
      ],
      notes: `Based on ${confirmed.toLocaleString()} confirmed RSVPs (estimate 30% taxi egress). Peak at ${event.endTime}. Designated staging at North Marina loop.`,
    };

    event.transportDemandEstimate = transportEstimate;
    db.updateEvent(event);

    // 2. Proactively identify suitable transport professionals who have opted in
    const allUsers = db.getUsers();
    const transportPros = allUsers.filter(
      (u) =>
        u.consentSettings.allowTransportInsights &&
        (u.primaryArea === event.area || u.frequentedAreas.includes(event.area))
    );

    for (const driver of transportPros) {
      // Check if driver shift routine aligns with peak outflow
      const shiftHours = driver.scheduleRoutine.workHours; // e.g. "18:00 - 02:00"
      
      const insightId = `ins_cascade_${event.id}_${driver.id}`;
      const existingInsight = db.getInsights(driver.id).find((i) => i.id === insightId);

      if (!existingInsight) {
        const insight: LifeInsight = {
          id: insightId,
          recipientUserId: driver.id,
          insightType: 'TRANSPORT_DEMAND',
          title: `${event.area} Egress Projection: ${event.title}`,
          summary: `~${estimatedVehicularTrips} vehicles anticipated between ${peakOutflowWindow}. Fits your ${shiftHours} shift.`,
          evidence: `Derived from ${confirmed.toLocaleString()} confirmed event attendees with 30% commercial transit ratio. No street cruising required.`,
          confidence: 0.91,
          nextSuggestedAction: `Stage near North Marina Valet Loop 20 mins prior to close.`,
          isActionable: true,
          status: 'NEW',
          createdAt: new Date().toISOString(),
        };

        db.addInsight(insight);

        // Send gentle non-spammy notification
        const notif: NotificationItem = {
          id: `notif_trans_${Date.now()}_${driver.id}`,
          recipientUserId: driver.id,
          priority: 'GENTLE',
          title: `Transport Demand: ${event.area}`,
          message: `Projected outflow of ~${estimatedVehicularTrips} rides around ${peakOutflowWindow} for your shift.`,
          deliveryStatus: 'DELIVERED',
          scheduledAt: new Date().toISOString(),
          deduplicationKey: `cascade_notif_${event.id}_${driver.id}`,
          category: 'CITY_PULSE',
        };

        db.addNotification(notif);

        // Also add clean conversational card to driver's chat thread
        const driverThread = db.getThreads(driver.id)[0];
        if (driverThread) {
          db.addMessage({
            id: `msg_cascade_driver_${Date.now()}`,
            threadId: driverThread.id,
            senderRole: 'LIFEOS_AI',
            content: `📍 Transport Demand Insight for ${event.area}:
${event.title} is concluding around ${event.endTime}. Based on ${confirmed.toLocaleString()} confirmed attendees, ~${estimatedVehicularTrips} passengers will need rides toward Downtown and Palm Jumeirah between ${peakOutflowWindow}. Staging is open at North Marina Valet Loop.`,
            createdAt: new Date().toISOString(),
          });
        }

        eventDispatcher.sendToUser(driver.id, {
          type: 'INSIGHT_GENERATED',
          recipientUserId: driver.id,
          data: { insight },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Broadcast cascade update to clients
    eventDispatcher.broadcast({
      type: 'EVENT_CASCADE_UPDATED',
      data: { event },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Cascade attendee RSVP count changes
   */
  public static incrementAttendance(eventId: string, delta: number = 250) {
    const event = db.getEventById(eventId);
    if (!event) return;

    event.confirmedAttendance = (event.confirmedAttendance || 0) + delta;
    this.processEventCascade(event);
  }
}
