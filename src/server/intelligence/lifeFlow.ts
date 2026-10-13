import { randomUUID } from "node:crypto";
import { db } from "../db.ts";
import { eventDispatcher } from "./eventDispatcher.ts";
import { NotificationPolicyEngine } from "./notificationPolicy.ts";

export class LifeFlowEngine {
  static review(userId: string) {
    const moments = db
      .getMoments(userId)
      .filter(
        (m) => m.status === "ACTIVE" && Date.parse(m.endTime) > Date.now(),
      )
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
    for (let i = 0; i < moments.length - 1; i++) {
      const first = moments[i],
        next = moments[i + 1];
      const gap = Date.parse(next.startTime) - Date.parse(first.endTime);
      if (
        gap >= 30 * 60000 ||
        (gap >= 0 && first.approximateArea === next.approximateArea)
      )
        continue;
      const id = `buffer_${first.id}_${next.id}`;
      if (db.getInsights(userId).some((insight) => insight.id === id)) continue;
      const insight = {
        id,
        recipientUserId: userId,
        relatedMomentId: first.id,
        insightType: "SCHEDULE_BUFFER" as const,
        title:
          gap < 0 ? "Two plans overlap" : "A little more travel time may help",
        summary: `${first.description} and ${next.description} ${gap < 0 ? "overlap" : "leave less than 30 minutes between different districts"}.`,
        evidence: `Based on your saved start/end times and declared districts. The 30-minute buffer is a planning assumption, not a live route estimate.`,
        confidence: gap < 0 ? 1 : 0.5,
        nextSuggestedAction: "Open Moments to choose which time to adjust.",
        isActionable: true,
        status: "NEW" as const,
        createdAt: new Date().toISOString(),
      };
      db.addInsight(insight);
      eventDispatcher.sendToUser(userId, {
        type: "INSIGHT_GENERATED",
        recipientUserId: userId,
        data: { insight },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
export class ProactiveScheduler {
  static tick() {
    NotificationPolicyEngine.processQueue();
    for (const proposal of db.getProposals()) {
      if (
        !["INVITATION_PENDING", "MUTUAL_CONSENT_PENDING"].includes(
          proposal.currentState,
        ) ||
        Date.parse(proposal.proposedTime || "") > Date.now()
      )
        continue;
      proposal.currentState = "EXPIRED";
      proposal.updatedAt = new Date().toISOString();
      proposal.stateHistory.push({
        state: "EXPIRED",
        timestamp: proposal.updatedAt,
        note: "The proposed time passed without mutual approval.",
      });
      db.updateProposal(proposal);
      for (const id of [proposal.initiatingUserId, proposal.recipientUserId])
        eventDispatcher.sendToUser(id, {
          type: "PROPOSAL_UPDATED",
          recipientUserId: id,
          data: {},
          timestamp: proposal.updatedAt,
        });
    }
  }
}
