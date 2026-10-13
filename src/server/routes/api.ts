import { randomUUID, randomBytes } from "node:crypto";
import { Router, Request, Response } from "express";
import { db } from "../db.ts";
import { eventDispatcher } from "../intelligence/eventDispatcher.ts";
import {
  aiStatus,
  interpretLifeMoment,
  generateCompanionReply,
  momentKinds,
  InterpretedMomentResult,
} from "../intelligence/gemini.ts";
import { ConnectionDiscoveryEngine } from "../intelligence/connectionDiscovery.ts";
import { InteractionStateMachine } from "../intelligence/stateMachine.ts";
import { EventCascadeEngine } from "../intelligence/eventCascade.ts";
import { NotificationPolicyEngine } from "../intelligence/notificationPolicy.ts";
import {
  LifeFlowEngine,
  ProactiveScheduler,
} from "../intelligence/lifeFlow.ts";
import { CityEvent, LifeMoment, UserProfile } from "../../types/index.ts";
export const apiRouter = Router();
const demoEnabled = () =>
  process.env.ENABLE_DEMO === "true" ||
  (process.env.NODE_ENV !== "production" &&
    !process.argv.includes("--production") &&
    process.env.ENABLE_DEMO !== "false");
const safeUser = (user: UserProfile) => {
  const { sessionToken, ...profile } = user;
  return profile;
};
const userOf = (req: Request) =>
  db.getUserBySession(
    (req.headers["x-session-token"] as string) || (req.query.session as string),
  )!;
const fail = (res: Response, error: unknown) =>
  res.status(400).json({
    error:
      error instanceof Error
        ? error.message
        : "Unable to complete the request.",
  });
const asyncRoute =
  (handler: (req: Request, res: Response) => Promise<any>) =>
  (req: Request, res: Response) => {
    handler(req, res).catch((e) => fail(res, e));
  };
const validText = (value: unknown, max = 4000) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
apiRouter.get("/bootstrap", (_req, res) =>
  res.json({
    ai: aiStatus(),
    demoEnabled: demoEnabled(),
    demoUsers: demoEnabled()
      ? db
          .getUsers()
          .filter(
            (u) =>
              u.id.startsWith("user_") &&
              [
                "user_elena_vance",
                "user_rashid_alfalasi",
                "user_tariq_mansoor",
                "user_sarah_jenkins",
              ].includes(u.id),
          )
          .map((u) => ({
            id: u.id,
            name: u.name,
            professions: u.professions,
            primaryArea: u.primaryArea,
          }))
      : [],
  }),
);
apiRouter.post("/demo/session", (req, res) => {
  if (!demoEnabled())
    return res.status(403).json({ error: "Demo mode is disabled." });
  const user = db.getUserById(req.body.userId);
  if (
    !user ||
    ![
      "user_elena_vance",
      "user_rashid_alfalasi",
      "user_tariq_mansoor",
      "user_sarah_jenkins",
    ].includes(user.id)
  )
    return res.status(404).json({ error: "Demo participant not found." });
  res.json({ user: safeUser(user), sessionToken: user.sessionToken });
});
apiRouter.post("/users", (req, res) => {
  if (!validText(req.body.name, 100))
    return res.status(400).json({ error: "Enter your name." });
  const id = randomUUID();
  const user: UserProfile = {
    id,
    name: req.body.name.trim(),
    handle: "",
    avatar: "",
    bio: typeof req.body.bio === "string" ? req.body.bio.slice(0, 500) : "",
    professions: [
      typeof req.body.profession === "string"
        ? req.body.profession.slice(0, 100)
        : "Resident",
    ],
    skills: [],
    interests: [],
    goals: [],
    primaryArea:
      typeof req.body.primaryArea === "string"
        ? req.body.primaryArea.slice(0, 100)
        : "Dubai Marina",
    frequentedAreas: [],
    scheduleRoutine: {
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workHours: "09:00 - 18:00",
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    },
    consentSettings: {
      allowProfessionalIntros: false,
      allowSocialIntros: false,
      allowTransportInsights: false,
      allowFoodOffers: false,
      requireExplicitApprovalBeforeContactShare: true,
      maxWeeklyIntros: 3,
    },
    privacyBoundaries: {
      shareExactLocation: false,
      shareWorkAffiliation: false,
      anonymousUntilConsent: true,
    },
    notificationBudget: { maxPerDay: 4, usedToday: 0, quietHoursActive: false },
    allowEventDiscovery: false,
    sessionToken: randomBytes(32).toString("hex"),
  };
  db.updateUser(user);
  res.status(201).json({
    success: true,
    user: safeUser(user),
    sessionToken: user.sessionToken,
  });
});
// All subsequent endpoints are scoped to an unguessable participant credential.
apiRouter.use((req, res, next) => {
  if (!userOf(req))
    return res.status(401).json({
      error:
        "Your private session is missing or invalid. Open your saved access link or create a participant.",
    });
  next();
});
apiRouter.get("/session", (req, res) =>
  res.json({ user: safeUser(userOf(req)), ai: aiStatus() }),
);
apiRouter.get("/users", (_req, res) => res.json({ users: [] }));
apiRouter.get("/events/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const id = eventDispatcher.addClient(userOf(req).id, res);
  const heartbeat = setInterval(() => res.write(": keepalive\n\n"), 20000);
  req.on("close", () => {
    clearInterval(heartbeat);
    eventDispatcher.removeClient(id);
  });
});
apiRouter.put("/users/profile", (req, res) => {
  const u = userOf(req),
    b = req.body,
    updated = structuredClone(u);
  for (const key of ["name", "bio", "primaryArea"] as const)
    if (b[key] !== undefined) {
      if (typeof b[key] !== "string" || b[key].length > 500)
        return res.status(400).json({ error: "Invalid profile text." });
      updated[key] = b[key].trim();
    }
  for (const key of [
    "professions",
    "skills",
    "interests",
    "frequentedAreas",
    "goals",
    "stoppedTopics",
  ] as const)
    if (b[key] !== undefined) {
      if (
        !Array.isArray(b[key]) ||
        b[key].length > 30 ||
        b[key].some((s: any) => typeof s !== "string" || s.length > 200)
      )
        return res.status(400).json({ error: "Invalid profile list." });
      updated[key] = b[key];
    }
  if (b.scheduleRoutine) {
    const s = { ...u.scheduleRoutine, ...b.scheduleRoutine };
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.quietHoursStart) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.quietHoursEnd) ||
      !/^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d$/.test(
        s.workHours,
      ) ||
      !Array.isArray(s.workDays) ||
      s.workDays.some(
        (d: any) =>
          ![
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].includes(d),
      )
    )
      return res
        .status(400)
        .json({ error: "Use valid times and weekdays for your schedule." });
    updated.scheduleRoutine = s;
  }
  for (const key of [
    "consentSettings",
    "privacyBoundaries",
    "notificationBudget",
  ] as const)
    if (b[key]) {
      const next = { ...u[key] };
      for (const field of Object.keys(next)) {
        if (b[key][field] === undefined) continue;
        const value = b[key][field];
        if (
          typeof value !== typeof (next as any)[field] ||
          (typeof value === "number" &&
            (!Number.isInteger(value) || value < 0 || value > 20))
        )
          return res.status(400).json({ error: "Invalid preference value." });
        (next as any)[field] = value;
      }
      (updated as any)[key] = next;
    }
  updated.notificationBudget.usedToday = u.notificationBudget.usedToday;
  updated.consentSettings.requireExplicitApprovalBeforeContactShare = true;
  if (typeof b.allowEventDiscovery === "boolean")
    updated.allowEventDiscovery = b.allowEventDiscovery;
  db.updateUser(updated);
  NotificationPolicyEngine.processQueue();
  res.json({ success: true, user: safeUser(updated) });
});
function saveMoment(
  user: UserProfile,
  description: string,
  interpreted: InterpretedMomentResult,
  id?: string,
  relatedEventId?: string,
) {
  const old = id ? db.getMomentById(id) : undefined;
  const linkedEvent =
    interpreted.kind === "ATTENDING_EVENT"
      ? db
          .getEvents()
          .find(
            (e) =>
              description.toLowerCase().includes(e.title.toLowerCase()) &&
              e.area === interpreted.approximateArea,
          )
      : undefined;
  const moment: LifeMoment = {
    id: id || randomUUID(),
    ownerId: user.id,
    kind: interpreted.kind,
    description,
    startTime: interpreted.startTimeStr,
    endTime: interpreted.endTimeStr,
    approximateArea: interpreted.approximateArea,
    goals: interpreted.goals,
    preferences: interpreted.preferences,
    protectedConstraints: interpreted.protectedConstraints,
    sharingPermissions: interpreted.sharingPermissions,
    status: "ACTIVE",
    relatedEventId: relatedEventId || old?.relatedEventId || linkedEvent?.id,
    createdAt: old?.createdAt || new Date().toISOString(),
  };
  if (old) db.updateMoment(moment);
  else db.addMoment(moment);
  eventDispatcher.sendToUser(user.id, {
    type: old ? "MOMENT_UPDATED" : "MOMENT_CREATED",
    recipientUserId: user.id,
    data: {},
    timestamp: new Date().toISOString(),
  });
  ConnectionDiscoveryEngine.evaluateMoment(moment);
  LifeFlowEngine.review(user.id);
  if (moment.kind === "FOOD_HUNGER") {
    const insight = {
      id: `food_${moment.id}`,
      recipientUserId: user.id,
      relatedMomentId: moment.id,
      insightType: "FOOD_RESCUE" as const,
      title: "Your food preferences are saved",
      summary: `Looking in ${moment.approximateArea}. ${moment.preferences.join(". ")}`,
      evidence:
        "No verified live provider is connected. You can try the clearly labelled food demo in You.",
      confidence: 0,
      nextSuggestedAction:
        "Review your preferences or try the sample food scenario.",
      isActionable: false,
      status: "NEW" as const,
      createdAt: new Date().toISOString(),
    };
    if (db.getInsights(user.id).some((i) => i.id === insight.id))
      db.updateInsight(insight);
    else db.addInsight(insight);
  }
  return moment;
}
apiRouter.get("/moments", (req, res) =>
  res.json({ moments: db.getMoments(userOf(req).id) }),
);
apiRouter.post(
  "/moments",
  asyncRoute(async (req, res) => {
    if (!validText(req.body.description))
      return res
        .status(400)
        .json({ error: "Describe your moment in 1 to 4000 characters." });
    const u = userOf(req),
      i = await interpretLifeMoment(req.body.description, u);
    res.json({
      success: true,
      moment: saveMoment(u, req.body.description.trim(), i),
    });
  }),
);
apiRouter.patch("/moments/:id", (req, res) => {
  const u = userOf(req),
    existing = db.getMomentById(req.params.id);
  if (!existing || existing.ownerId !== u.id)
    return res.status(404).json({ error: "Moment not found." });
  const meetingProposal = db
    .getProposals(u.id)
    .find((p) => `meeting_${p.id}_${u.id}` === existing.id);
  if (meetingProposal) {
    const success =
      req.body.status === "CANCELLED"
        ? InteractionStateMachine.declineProposal(meetingProposal.id, u.id)
        : req.body.status === "FULFILLED"
          ? InteractionStateMachine.complete(meetingProposal.id, u.id)
          : false;
    if (success) return res.json({ success: true });
    return res
      .status(409)
      .json({
        error:
          "Use the introduction card to change an agreed meeting. Both participants must approve the change.",
      });
  }
  const m = structuredClone(existing);
  if (req.body.description !== undefined) {
    if (!validText(req.body.description))
      return res.status(400).json({ error: "Enter a description." });
    m.description = req.body.description.trim();
  }
  for (const key of ["startTime", "endTime"] as const)
    if (req.body[key]) {
      if (!Number.isFinite(Date.parse(req.body[key])))
        return res.status(400).json({ error: "Choose valid times." });
      m[key] = req.body[key];
    }
  if (
    Number.isFinite(Date.parse(m.startTime)) &&
    Date.parse(m.endTime) <= Date.parse(m.startTime)
  )
    return res
      .status(400)
      .json({ error: "End time must be after start time." });
  if (
    req.body.status &&
    !["ACTIVE", "FULFILLED", "CANCELLED"].includes(req.body.status)
  )
    return res.status(400).json({ error: "Invalid status." });
  if (req.body.status) m.status = req.body.status;
  if (req.body.goals) {
    if (
      !Array.isArray(req.body.goals) ||
      req.body.goals.some((s: any) => typeof s !== "string")
    )
      return res.status(400).json({ error: "Invalid goals." });
    m.goals = req.body.goals;
  }
  if (req.body.sharingPermissions) {
    if (
      !["PRIVATE", "AGENT_COORDINATED", "COMMUNITY_VISIBLE"].includes(
        req.body.sharingPermissions,
      )
    )
      return res.status(400).json({ error: "Invalid sharing preference." });
    m.sharingPermissions = req.body.sharingPermissions;
  }
  if (m.kind === "REST_TIME") m.sharingPermissions = "PRIVATE";
  db.updateMoment(m);
  if (m.status === "CANCELLED" || m.sharingPermissions === "PRIVATE")
    for (const p of db
      .getProposals(u.id)
      .filter(
        (p) => p.relatedMomentId === m.id || p.recipientMomentId === m.id,
      ))
      InteractionStateMachine.declineProposal(
        p.id,
        u.id,
        "Related plan cancelled or made private.",
      );
  if (m.status === "FULFILLED" && existing.status !== "FULFILLED")
    db.addOutcome({
      id: randomUUID(),
      ownerId: u.id,
      relatedMomentId: m.id,
      summary: m.description,
      createdAt: new Date().toISOString(),
    });
  if (m.status === "ACTIVE") ConnectionDiscoveryEngine.evaluateMoment(m);
  LifeFlowEngine.review(u.id);
  eventDispatcher.sendToUser(u.id, {
    type: "MOMENT_UPDATED",
    recipientUserId: u.id,
    data: {},
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, moment: m });
});
apiRouter.get("/proposals", (req, res) =>
  res.json({ proposals: db.getProposals(userOf(req).id) }),
);
apiRouter.post("/proposals/:id/respond", (req, res) => {
  const uid = userOf(req).id,
    b = req.body,
    id = req.params.id;
  const success =
    b.action === "RECIPIENT_INTERESTED"
      ? InteractionStateMachine.recipientExpressesInterest(id, uid)
      : b.action === "INITIATOR_APPROVED"
        ? InteractionStateMachine.initiatorApprovesProposal(id, uid)
        : b.action === "DECLINE"
          ? InteractionStateMachine.declineProposal(id, uid, b.reason)
          : b.action === "ADJUST"
            ? InteractionStateMachine.adjustProposal(
                id,
                uid,
                b.newTime,
                b.newPlace,
              )
            : b.action === "COMPLETE"
              ? InteractionStateMachine.complete(id, uid)
              : false;
  if (!success)
    return res.status(409).json({
      error:
        "This action is not available. Refresh the proposal and check its time and approvals.",
    });
  res.json({ success: true });
});
apiRouter.get("/threads", (req, res) => {
  const u = userOf(req);
  let threads = db.getThreads(u.id);
  if (!threads.length)
    threads = [
      db.createThread({
        id: randomUUID(),
        ownerUserId: u.id,
        threadType: "GENERAL_AI",
        title: "Your conversation",
        status: "ACTIVE",
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      }),
    ];
  res.json({ threads });
});
apiRouter.post("/threads", (req, res) => {
  res.json({
    thread: db.createThread({
      id: randomUUID(),
      ownerUserId: userOf(req).id,
      relatedMomentId: db
        .getMoments(userOf(req).id)
        .find((m) => m.id === req.body.momentId)?.id,
      threadType: req.body.momentId ? "MOMENT_COORDINATION" : "GENERAL_AI",
      title: req.body.momentId ? "About your moment" : "Your conversation",
      status: "ACTIVE",
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    }),
  });
});
apiRouter.use("/threads/:threadId/messages", (req, res, next) => {
  const t = db.getThreadById(req.params.threadId);
  if (!t || t.ownerUserId !== userOf(req).id)
    return res.status(404).json({ error: "Conversation not found." });
  next();
});
apiRouter.get("/threads/:threadId/messages", (req, res) => {
  const t = db.getThreadById(req.params.threadId)!;
  t.unreadCount = 0;
  db.updateThread(t);
  res.json({ messages: db.getMessages(t.id) });
});
const pendingChats = new Set<string>();
apiRouter.post(
  "/threads/:threadId/messages",
  asyncRoute(async (req, res) => {
    if (!validText(req.body.content))
      return res
        .status(400)
        .json({ error: "Enter a message in 1 to 4000 characters." });
    const u = userOf(req),
      threadId = req.params.threadId;
    if (pendingChats.has(threadId))
      return res
        .status(409)
        .json({ error: "Please wait for your previous message to finish." });
    pendingChats.add(threadId);
    try {
      const result = await generateCompanionReply(
        req.body.content,
        u,
        db.getMessages(threadId),
        db.getMoments(u.id).filter((m) => m.status === "ACTIVE"),
        {
          events: db.getEvents(),
          insights: db.getInsights(u.id),
          proposals: db.getProposals(u.id),
        },
      );
      const userMessage = db.addMessage({
        id: randomUUID(),
        threadId,
        senderRole: "USER",
        content: req.body.content.trim(),
        createdAt: new Date().toISOString(),
      });
      let moment;
      if (result.action !== "NONE" && result.moment)
        moment = saveMoment(
          u,
          result.description || req.body.content.trim(),
          result.moment,
          result.action === "UPDATE_MOMENT" ? result.momentId : undefined,
        );
      const aiMessage = db.addMessage({
        id: randomUUID(),
        threadId,
        senderRole: "LIFEOS_AI",
        content: result.reply,
        createdAt: new Date().toISOString(),
      });
      eventDispatcher.sendToUser(u.id, {
        type: "NEW_MESSAGE",
        recipientUserId: u.id,
        data: { threadId },
        timestamp: new Date().toISOString(),
      });
      res.json({ success: true, userMessage, aiMessage, moment });
    } finally {
      pendingChats.delete(threadId);
    }
  }),
);
apiRouter.get("/events", (req, res) =>
  res.json({
    events: db.getEvents(),
    attendance: db.getAttendance(userOf(req).id),
  }),
);
apiRouter.post("/events", (req, res) => {
  const b = req.body,
    u = userOf(req);
  if (
    !validText(b.title, 200) ||
    !validText(b.area, 100) ||
    !validText(b.venue, 200) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(b.date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.startTime) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.endTime) ||
    b.endTime <= b.startTime ||
    Date.parse(`${b.date}T${b.startTime}:00+04:00`) <= Date.now()
  )
    return res.status(400).json({
      error:
        "Enter an event title, district, venue, and future date with valid start and end times.",
    });
  const event: CityEvent = {
    id: randomUUID(),
    title: b.title.trim(),
    area: b.area,
    venue: b.venue,
    date: b.date,
    startTime: b.startTime,
    endTime: b.endTime,
    organizerId: u.id,
    organizerName: u.name,
    category:
      typeof b.category === "string" ? b.category.slice(0, 100) : "Community",
    description:
      typeof b.description === "string" ? b.description.slice(0, 2000) : "",
    estimatedAttendance: Math.max(
      0,
      Math.min(100000, Number(b.estimatedAttendance) || 0),
    ),
    confirmedAttendance: 0,
    isDemo: false,
  };
  db.addEvent(event);
  EventCascadeEngine.publish(event);
  res.status(201).json({ success: true, event });
});
apiRouter.post("/events/:id/rsvp", (req, res) => {
  const u = userOf(req),
    event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found." });
  if (typeof req.body.attending !== "boolean")
    return res.status(400).json({ error: "Choose attendance." });
  const attending = req.body.attending,
    prior = db.getAttendance(u.id).find((a) => a.eventId === event.id);
  if (prior?.attending === attending) return res.json({ success: true, event });
  db.setAttendance({ userId: u.id, eventId: event.id, attending, goals: [] });
  if (attending) {
    const id = `attendance_${event.id}_${u.id}`,
      old = db.getMomentById(id);
    const moment: LifeMoment = {
      id,
      ownerId: u.id,
      kind: "ATTENDING_EVENT",
      description: `Attending ${event.title}`,
      startTime: `${event.date}T${event.startTime}:00+04:00`,
      endTime: `${event.date}T${event.endTime}:00+04:00`,
      approximateArea: event.area,
      goals: [],
      preferences: [],
      protectedConstraints: ["No introductions without a stated goal"],
      sharingPermissions: "PRIVATE",
      status: "ACTIVE",
      relatedEventId: event.id,
      createdAt: old?.createdAt || new Date().toISOString(),
    };
    if (old) db.updateMoment(moment);
    else db.addMoment(moment);
    const thread = db.getThreads(u.id)[0];
    if (thread)
      db.addMessage({
        id: randomUUID(),
        threadId: thread.id,
        senderRole: "LIFEOS_AI",
        content: `${event.isDemo ? "Your sample plan" : "Your plan"} for ${event.title} is saved. What would make it worthwhile: learning, meeting people, or simply enjoying yourself? This records your intention to attend; it is not a ticket or venue booking.`,
        createdAt: new Date().toISOString(),
      });
  } else
    for (const m of db
      .getMoments(u.id)
      .filter((m) => m.relatedEventId === event.id && m.status === "ACTIVE")) {
      m.status = "CANCELLED";
      db.updateMoment(m);
      for (const p of db
        .getProposals(u.id)
        .filter(
          (p) => p.relatedMomentId === m.id || p.recipientMomentId === m.id,
        ))
        InteractionStateMachine.declineProposal(
          p.id,
          u.id,
          "Attendance cancelled.",
        );
    }
  EventCascadeEngine.processEventCascade(event);
  eventDispatcher.sendToUser(u.id, {
    type: "MOMENT_UPDATED",
    recipientUserId: u.id,
    data: {},
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, event });
});
apiRouter.get("/insights", (req, res) =>
  res.json({ insights: db.getInsights(userOf(req).id) }),
);
apiRouter.post("/insights/:id/status", (req, res) => {
  const insight = db
    .getInsights(userOf(req).id)
    .find((i) => i.id === req.params.id);
  if (!insight) return res.status(404).json({ error: "Insight not found." });
  if (!["ACCEPTED", "DISMISSED"].includes(req.body.status))
    return res.status(400).json({ error: "Invalid insight action." });
  insight.status = req.body.status;
  db.updateInsight(insight);
  res.json({ success: true });
});
apiRouter.get("/notifications", (req, res) =>
  res.json({ notifications: db.getNotifications(userOf(req).id) }),
);
apiRouter.post("/notifications/:id/feedback", (req, res) => {
  if (
    !["DISMISS", "SNOOZE", "NOT_INTERESTED", "STOP_TOPIC"].includes(
      req.body.action,
    ) ||
    !NotificationPolicyEngine.handleUserFeedback(
      req.params.id,
      userOf(req).id,
      req.body.action,
    )
  )
    return res.status(404).json({ error: "Notification or action not found." });
  res.json({ success: true });
});
apiRouter.get("/outcomes", (req, res) =>
  res.json({ outcomes: db.getOutcomes(userOf(req).id) }),
);
apiRouter.post("/outcomes/:id/feedback", (req, res) => {
  if (
    typeof req.body.helpful !== "boolean" ||
    !db.feedbackOutcome(req.params.id, userOf(req).id, req.body.helpful)
  )
    return res.status(404).json({ error: "Outcome not found." });
  res.json({ success: true });
});
apiRouter.post("/demo/run-scenario", (req, res) => {
  if (!demoEnabled())
    return res.status(403).json({ error: "Demo mode is disabled." });
  const u = userOf(req),
    scenario = req.body.scenario;
  if (scenario === "SCENARIO_A") {
    const a = db.getUserById("user_elena_vance")!,
      b = db.getUserById("user_rashid_alfalasi")!,
      start = new Date(Date.now() + 86400000).toISOString(),
      end = new Date(Date.now() + 90000000).toISOString();
    for (const person of [a, b]) {
      const id = `demo_network_${person.id}`;
      const m: LifeMoment = {
        id,
        ownerId: person.id,
        kind: "ATTENDING_EVENT",
        description: "Sample founder gathering in Dubai Marina",
        startTime: start,
        endTime: end,
        approximateArea: "Dubai Marina",
        goals: ["Meet founders building AI businesses"],
        preferences: [],
        protectedConstraints: [],
        sharingPermissions: "AGENT_COORDINATED",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
      if (db.getMomentById(id)) db.updateMoment(m);
      else db.addMoment(m);
    }
    ConnectionDiscoveryEngine.evaluateMoment(
      db.getMomentById(`demo_network_${a.id}`)!,
    );
    res.json({
      success: true,
      message:
        "Sample plans created. Open Rashid in another browser and accept his private invitation, then return to Elena to agree. No approval is simulated.",
    });
  } else if (scenario === "SCENARIO_B") {
    const event = db.getEvents()[0];
    EventCascadeEngine.processEventCascade(event);
    res.json({
      success: true,
      message:
        "Demand recalculated from independent attendance records. Add attendees through Explore; driver insights appear only when declared shifts overlap and demand is sufficient.",
    });
  } else if (scenario === "SCENARIO_C") {
    db.addInsight({
      id: `demo_food_${u.id}`,
      recipientUserId: u.id,
      insightType: "FOOD_RESCUE",
      title: "Sample food option",
      summary:
        "Demo grain bowl, AED 48, in your declared district. Not a real listing or verified provider.",
      evidence:
        "Simulated availability for testing the approval flow. No food exchange or booking takes place.",
      confidence: 0,
      nextSuggestedAction: "Accept to save a simulated pickup plan.",
      isActionable: true,
      status: "NEW",
      createdAt: new Date().toISOString(),
    });
    res.json({
      success: true,
      message:
        "A clearly simulated food option is ready in Today. Accept it to record a sample pickup plan.",
    });
  } else res.status(400).json({ error: "Choose a supported sample scenario." });
});
apiRouter.post("/insights/:id/execute", (req, res) => {
  const u = userOf(req),
    insight = db.getInsights(u.id).find((i) => i.id === req.params.id);
  if (
    !insight ||
    !insight.id.startsWith("demo_food_") ||
    insight.status !== "NEW"
  )
    return res
      .status(409)
      .json({ error: "This sample action is no longer available." });
  const m = saveMoment(u, "Sample food pickup (no real booking)", {
    kind: "FOOD_HUNGER",
    approximateArea: u.primaryArea,
    goals: ["Try the sample coordination flow"],
    preferences: ["Demo budget: AED 48"],
    protectedConstraints: ["Simulation only"],
    sharingPermissions: "PRIVATE",
    startTimeStr: new Date().toISOString(),
    endTimeStr: new Date(Date.now() + 3600000).toISOString(),
  });
  insight.status = "ACCEPTED";
  db.updateInsight(insight);
  db.addOutcome({
    id: randomUUID(),
    ownerId: u.id,
    relatedMomentId: m.id,
    summary: "Simulated food pickup accepted. No external booking.",
    createdAt: new Date().toISOString(),
  });
  res.json({ success: true });
});
setInterval(() => ProactiveScheduler.tick(), 30000).unref();
const paperAssets = [
  { symbol: "EMAAR", name: "Emaar", price: 8.85 },
  { symbol: "SALIK", name: "Salik", price: 3.42 },
  { symbol: "DEWA", name: "DEWA", price: 2.58 },
];
apiRouter.get("/paper", (req, res) =>
  res.json({
    assets: paperAssets,
    account: db.getPaperAccount(userOf(req).id),
  }),
);
apiRouter.post("/paper/trade", (req, res) => {
  const { symbol, side, quantity } = req.body,
    asset = paperAssets.find((a) => a.symbol === symbol);
  if (
    !asset ||
    !["BUY", "SELL"].includes(side) ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 100000
  )
    return res.status(400).json({
      error: "Choose an asset and a positive whole number of shares.",
    });
  try {
    res.json({
      account: db.paperTrade(
        userOf(req).id,
        symbol,
        side,
        quantity,
        asset.price,
      ),
    });
  } catch (e) {
    fail(res, e);
  }
});
