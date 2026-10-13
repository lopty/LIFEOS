import { randomUUID } from "node:crypto";
import { db } from "../db.ts";
import { eventDispatcher } from "./eventDispatcher.ts";
import { NotificationPolicyEngine } from "./notificationPolicy.ts";
import { ConnectionProposal, UserProfile } from "../../types/index.ts";

const terminal = ["DECLINED", "CANCELLED", "COMPLETED", "EXPIRED", "FAILED"];
export class InteractionStateMachine {
  private static stillEligible(p: ConnectionProposal) {
    const start = Date.parse(p.proposedTime || "");
    if (!Number.isFinite(start) || start < Date.now()) return false;
    const moments = [
      db.getMomentById(p.relatedMomentId),
      p.recipientMomentId ? db.getMomentById(p.recipientMomentId) : undefined,
    ];
    if (
      moments.some(
        (m) =>
          !m ||
          m.status !== "ACTIVE" ||
          m.sharingPermissions === "PRIVATE" ||
          Date.parse(m.startTime) > start ||
          Date.parse(m.endTime) < start + 15 * 60000,
      )
    )
      return false;
    const professional =
      /founder|business|professional|collaborat|network|investor|startup/i.test(
        moments[0]!.goals.join(" "),
      );
    for (const uid of [p.initiatingUserId, p.recipientUserId]) {
      const u = db.getUserById(uid);
      if (
        !u ||
        (professional
          ? !u.consentSettings.allowProfessionalIntros
          : !u.consentSettings.allowSocialIntros)
      )
        return false;
      if (
        db
          .getMoments(uid)
          .some(
            (m) =>
              m.status === "ACTIVE" &&
              ["REST_TIME", "WORK_SHIFT"].includes(m.kind) &&
              Date.parse(m.startTime) < start + 15 * 60000 &&
              Date.parse(m.endTime) > start,
          )
      )
        return false;
    }
    return true;
  }
  static createProposal(params: {
    initiatingUserId: string;
    recipientUserId: string;
    relatedMomentId: string;
    recipientMomentId?: string;
    reason: string;
    matchScore: number;
    proposedTime?: string;
    proposedPlace?: string;
    meetingObjective?: string;
  }): ConnectionProposal | null {
    const a = db.getUserById(params.initiatingUserId),
      b = db.getUserById(params.recipientUserId);
    const ma = db.getMomentById(params.relatedMomentId),
      mb =
        params.recipientMomentId && db.getMomentById(params.recipientMomentId);
    if (
      !a ||
      !b ||
      !ma ||
      !mb ||
      ma.ownerId !== a.id ||
      mb.ownerId !== b.id ||
      ma.sharingPermissions === "PRIVATE" ||
      mb.sharingPermissions === "PRIVATE"
    )
      return null;
    if (
      db
        .getProposals(a.id)
        .some(
          (p) =>
            p.relatedMomentId === ma.id &&
            p.recipientUserId === b.id &&
            !terminal.includes(p.currentState),
        )
    )
      return null;
    const now = new Date().toISOString();
    const p: ConnectionProposal = {
      ...params,
      id: randomUUID(),
      currentState: "INVITATION_PENDING",
      initiatorConsent: "PENDING",
      recipientConsent: "PENDING",
      approvedDisclosures: { initiatorSharedInfo: [], recipientSharedInfo: [] },
      stateHistory: [
        "DISCOVERED",
        "ELIGIBILITY_CHECKED",
        "INVITATION_PENDING",
      ].map((state) => ({
        state: state as any,
        timestamp: now,
        note:
          state === "ELIGIBILITY_CHECKED"
            ? "Consent preferences, shared context and available time checked."
            : "Private introduction proposal.",
      })),
      createdAt: now,
      updatedAt: now,
    };
    db.addProposal(p);
    this.tell(
      b,
      p,
      "Someone with overlapping plans is open to a short introduction. " +
        p.reason +
        " Would you be interested?",
      "GENTLE",
    );
    this.emit(p);
    return p;
  }
  private static tell(
    user: UserProfile,
    p: ConnectionProposal,
    content: string,
    priority: "GENTLE" | "ACTION_REQUIRED",
  ) {
    const momentId =
      user.id === p.initiatingUserId ? p.relatedMomentId : p.recipientMomentId;
    let thread = db
      .getThreads(user.id)
      .find((t) => t.relatedMomentId === momentId);
    if (!thread)
      thread = db.createThread({
        id: randomUUID(),
        ownerUserId: user.id,
        relatedMomentId: momentId,
        relatedProposalId: p.id,
        title: "Your introduction",
        threadType: "PROPOSAL_CONSENT",
        status: "ACTIVE",
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      });
    const partner = db.getUserById(
      user.id === p.initiatingUserId ? p.recipientUserId : p.initiatingUserId,
    )!;
    const disclosed =
      p.currentState === "CONFIRMED" || p.currentState === "COMPLETED";
    db.addMessage({
      id: randomUUID(),
      threadId: thread.id,
      senderRole: "LIFEOS_AI",
      content,
      createdAt: new Date().toISOString(),
      proposalData: {
        proposalId: p.id,
        state: p.currentState,
        partnerName: disclosed ? partner.name : "A fellow participant",
        partnerProfession: disclosed ? partner.professions.join(", ") : "",
        partnerBio: disclosed ? partner.bio : "",
        venue: p.proposedPlace,
        time: p.proposedTime,
        objective: p.meetingObjective,
      },
    });
    NotificationPolicyEngine.enqueue({
      id: randomUUID(),
      recipientUserId: user.id,
      relatedThreadId: thread.id,
      priority,
      title: disclosed
        ? "Your introduction is agreed"
        : "An introduction to consider",
      message: content,
      deliveryStatus: "PENDING",
      scheduledAt: new Date().toISOString(),
      deduplicationKey: `${p.id}_${p.currentState}_${p.updatedAt}_${user.id}`,
      category: "INTRODUCTION",
    });
  }
  private static transition(
    p: ConnectionProposal,
    state: ConnectionProposal["currentState"],
    userId: string,
    note: string,
  ) {
    p.currentState = state;
    p.updatedAt = new Date().toISOString();
    p.stateHistory.push({
      state,
      timestamp: p.updatedAt,
      note,
      triggeredByUserId: userId,
    });
    db.updateProposal(p);
  }
  private static emit(p: ConnectionProposal) {
    for (const id of [p.initiatingUserId, p.recipientUserId])
      eventDispatcher.sendToUser(id, {
        type: "PROPOSAL_UPDATED",
        recipientUserId: id,
        data: { proposal: p },
        timestamp: new Date().toISOString(),
      });
  }
  static recipientExpressesInterest(id: string, userId: string) {
    const p = db.getProposalById(id);
    if (
      !p ||
      p.recipientUserId !== userId ||
      p.currentState !== "INVITATION_PENDING" ||
      !this.stillEligible(p)
    )
      return false;
    p.recipientConsent = "ACCEPTED";
    this.transition(
      p,
      "PARTICIPANT_INTERESTED",
      userId,
      "Recipient agreed to this time, place and profile disclosure after mutual consent.",
    );
    this.transition(
      p,
      "MUTUAL_CONSENT_PENDING",
      userId,
      "Waiting for initiator approval.",
    );
    this.tell(
      db.getUserById(p.initiatingUserId)!,
      p,
      "The other participant is interested. Review the time and meeting point below. Agree only if these work for you; your profile is shared after you both consent.",
      "ACTION_REQUIRED",
    );
    this.tell(
      db.getUserById(userId)!,
      p,
      "Your interest is saved. I will ask the other participant to agree before sharing profiles or adding a meeting.",
      "GENTLE",
    );
    this.emit(p);
    return true;
  }
  static initiatorApprovesProposal(id: string, userId: string) {
    const p = db.getProposalById(id);
    if (
      !p ||
      p.initiatingUserId !== userId ||
      p.currentState !== "MUTUAL_CONSENT_PENDING" ||
      p.recipientConsent !== "ACCEPTED" ||
      !this.stillEligible(p)
    )
      return false;
    const participants = [
      db.getUserById(p.initiatingUserId)!,
      db.getUserById(p.recipientUserId)!,
    ];
    // Both approvals apply to the same arrangement. Recheck protected time.
    const start = Date.parse(p.proposedTime || "");
    if (!Number.isFinite(start) || start < Date.now()) return false;
    if (
      participants.some((u) =>
        db
          .getMoments(u.id)
          .some(
            (m) =>
              m.status === "ACTIVE" &&
              ["REST_TIME", "WORK_SHIFT"].includes(m.kind) &&
              Date.parse(m.startTime) < start + 15 * 60000 &&
              Date.parse(m.endTime) > start,
          ),
      )
    )
      return false;
    p.initiatorConsent = "ACCEPTED";
    p.approvedDisclosures = {
      initiatorSharedInfo: [
        participants[0].name,
        ...participants[0].professions,
      ],
      recipientSharedInfo: [
        participants[1].name,
        ...participants[1].professions,
      ],
    };
    this.transition(
      p,
      "ACCEPTED",
      userId,
      "Both participants approved the same arrangement and professional profile disclosure.",
    );
    this.transition(
      p,
      "COORDINATING",
      userId,
      "Adding local plans. No venue reservation or external booking.",
    );
    this.transition(
      p,
      "CONFIRMED",
      userId,
      "Meeting agreed by both participants.",
    );
    for (const u of participants) {
      const partner = participants.find((v) => v.id !== u.id)!;
      db.addMoment({
        id: `meeting_${p.id}_${u.id}`,
        ownerId: u.id,
        kind: "NETWORKING_MEETING",
        description: `Introduction with ${partner.name}`,
        startTime: p.proposedTime!,
        endTime: new Date(start + 15 * 60000).toISOString(),
        approximateArea: db.getMomentById(p.relatedMomentId)!.approximateArea,
        goals: [p.meetingObjective || "A useful introduction"],
        preferences: [],
        protectedConstraints: ["No contact details shared"],
        sharingPermissions: "PRIVATE",
        status: "COORDINATING",
        createdAt: new Date().toISOString(),
      });
      this.tell(
        u,
        p,
        `You and ${partner.name} have agreed to the introduction. It is in your Moments. The meeting point is a suggestion; no venue booking has been made.`,
        "GENTLE",
      );
      eventDispatcher.sendToUser(u.id, {
        type: "MOMENT_UPDATED",
        recipientUserId: u.id,
        data: {},
        timestamp: new Date().toISOString(),
      });
    }
    this.emit(p);
    return true;
  }
  static declineProposal(id: string, userId: string, reason?: string) {
    const p = db.getProposalById(id);
    if (
      !p ||
      ![p.initiatingUserId, p.recipientUserId].includes(userId) ||
      terminal.includes(p.currentState)
    )
      return false;
    if (p.initiatingUserId === userId) p.initiatorConsent = "DECLINED";
    else p.recipientConsent = "DECLINED";
    this.transition(
      p,
      p.currentState === "CONFIRMED" ? "CANCELLED" : "DECLINED",
      userId,
      reason || "Participant chose not to proceed.",
    );
    for (const uid of [p.initiatingUserId, p.recipientUserId]) {
      const meeting = db.getMomentById(`meeting_${p.id}_${uid}`);
      if (meeting) {
        meeting.status = "CANCELLED";
        db.updateMoment(meeting);
      }
      this.tell(
        db.getUserById(uid)!,
        p,
        "This introduction has stopped. No further coordination is needed.",
        "GENTLE",
      );
    }
    this.emit(p);
    return true;
  }
  static adjustProposal(
    id: string,
    userId: string,
    newTime?: string,
    newPlace?: string,
  ) {
    const p = db.getProposalById(id);
    if (
      !p ||
      ![p.initiatingUserId, p.recipientUserId].includes(userId) ||
      terminal.includes(p.currentState)
    )
      return false;
    if (
      newTime &&
      (typeof newTime !== "string" ||
        !Number.isFinite(Date.parse(newTime)) ||
        Date.parse(newTime) < Date.now())
    )
      return false;
    if (
      newPlace !== undefined &&
      (typeof newPlace !== "string" || newPlace.length > 200)
    )
      return false;
    if (!newTime && !newPlace?.trim()) return false;
    const candidate = { ...p, proposedTime: newTime || p.proposedTime };
    if (!this.stillEligible(candidate)) return false;
    p.proposedTime = newTime || p.proposedTime;
    p.proposedPlace = newPlace?.trim() || p.proposedPlace;
    p.initiatorConsent = "PENDING";
    p.recipientConsent = "PENDING";
    p.approvedDisclosures = {
      initiatorSharedInfo: [],
      recipientSharedInfo: [],
    };
    for (const uid of [p.initiatingUserId, p.recipientUserId]) {
      const m = db.getMomentById(`meeting_${p.id}_${uid}`);
      if (m) {
        m.status = "CANCELLED";
        db.updateMoment(m);
      }
    }
    this.transition(
      p,
      "INVITATION_PENDING",
      userId,
      "Arrangement changed. Both participants must approve again.",
    );
    this.tell(
      db.getUserById(p.recipientUserId)!,
      p,
      "The time or meeting point has changed. Please review and agree to this new arrangement before it is confirmed.",
      "ACTION_REQUIRED",
    );
    this.emit(p);
    return true;
  }
  static complete(id: string, userId: string) {
    const p = db.getProposalById(id);
    if (
      !p ||
      p.currentState !== "CONFIRMED" ||
      ![p.initiatingUserId, p.recipientUserId].includes(userId)
    )
      return false;
    this.transition(
      p,
      "COMPLETED",
      userId,
      "Participant reported the introduction complete.",
    );
    for (const uid of [p.initiatingUserId, p.recipientUserId]) {
      const m = db.getMomentById(`meeting_${p.id}_${uid}`);
      if (m) {
        m.status = "FULFILLED";
        db.updateMoment(m);
      }
      db.addOutcome({
        id: randomUUID(),
        ownerId: uid,
        proposalId: p.id,
        summary: "Introduction completed. Was it useful?",
        createdAt: new Date().toISOString(),
      });
    }
    this.emit(p);
    return true;
  }
}
