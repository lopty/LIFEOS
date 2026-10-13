import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { eventDispatcher } from '../intelligence/eventDispatcher.ts';
import { interpretLifeMoment, generateCompanionReply } from '../intelligence/gemini.ts';
import { ConnectionDiscoveryEngine } from '../intelligence/connectionDiscovery.ts';
import { InteractionStateMachine } from '../intelligence/stateMachine.ts';
import { EventCascadeEngine } from '../intelligence/eventCascade.ts';
import { NotificationPolicyEngine } from '../intelligence/notificationPolicy.ts';
import { LifeMoment, ConversationMessage } from '../../types/index.ts';

export const apiRouter = Router();

// --- Middleware helper to resolve current user ---
function getSessionUser(req: Request) {
  const token = (req.headers['x-session-token'] as string) || (req.query.session as string) || (req.query.userId as string);
  if (token) {
    const user = db.getUserBySession(token) || db.getUserById(token);
    if (user) return user;
  }
  // Default to Elena Vance
  return db.getUsers()[0];
}

// --- SSE Realtime Stream ---
apiRouter.get('/events/stream', (req: Request, res: Response) => {
  const user = getSessionUser(req);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const connId = eventDispatcher.addClient(user.id, res);

  req.on('close', () => {
    eventDispatcher.removeClient(connId);
  });
});

// --- Session & Users ---
apiRouter.get('/session', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  res.json({ user, activeConnections: eventDispatcher.getActiveCount() });
});

apiRouter.get('/users', (req: Request, res: Response) => {
  res.json({ users: db.getUsers() });
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const { name, profession, primaryArea, bio } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newUser = {
    id,
    name: name.trim(),
    handle: `@${name.toLowerCase().replace(/\s+/g, '_')}`,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: bio || 'Resident exploring Dubai living opportunities.',
    professions: [profession || 'Technologist'],
    skills: ['Strategy', 'Collaboration'],
    interests: ['AI', 'Dubai Living', 'Coffee'],
    primaryArea: primaryArea || 'Dubai Marina',
    frequentedAreas: [primaryArea || 'Dubai Marina', 'Downtown Dubai'],
    scheduleRoutine: {
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workHours: '09:00 - 18:00',
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    },
    consentSettings: {
      allowProfessionalIntros: true,
      allowSocialIntros: true,
      allowTransportInsights: true,
      allowFoodOffers: true,
      requireExplicitApprovalBeforeContactShare: true,
      maxWeeklyIntros: 5,
    },
    privacyBoundaries: {
      shareExactLocation: false,
      shareWorkAffiliation: true,
      anonymousUntilConsent: true,
    },
    notificationBudget: {
      maxPerDay: 6,
      usedToday: 0,
      quietHoursActive: false,
    },
    sessionToken: `sess_${id}`,
  };

  db.updateUser(newUser);

  db.createThread({
    id: `thread_${id}_main`,
    ownerUserId: id,
    threadType: 'GENERAL_AI',
    title: `${newUser.name} & LIFEOS Companion`,
    status: 'ACTIVE',
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
  });

  res.json({ success: true, user: newUser });
});

apiRouter.put('/users/profile', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const updates = req.body;
  const updatedUser = { ...user, ...updates };
  db.updateUser(updatedUser);
  res.json({ success: true, user: updatedUser });
});

// --- Life Moments ---
apiRouter.get('/moments', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const scope = req.query.all === 'true' ? undefined : user.id;
  res.json({ moments: db.getMoments(scope) });
});

apiRouter.post('/moments', async (req: Request, res: Response) => {
  try {
    const user = getSessionUser(req);
    const { description, relatedEventId, manualKind } = req.body;

    if (!description || typeof description !== 'string') {
      res.status(400).json({ error: 'Description is required' });
      return;
    }

    // 1. Interpret moment using Gemini
    const interpreted = await interpretLifeMoment(description, user);

    const momentId = `mom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMoment: LifeMoment = {
      id: momentId,
      ownerId: user.id,
      ownerName: user.name,
      kind: manualKind || interpreted.kind,
      description: description.trim(),
      startTime: interpreted.startTimeStr,
      endTime: interpreted.endTimeStr,
      approximateArea: interpreted.approximateArea,
      goals: interpreted.goals,
      preferences: interpreted.preferences,
      protectedConstraints: interpreted.protectedConstraints,
      sharingPermissions: interpreted.sharingPermissions,
      status: 'ACTIVE',
      relatedEventId,
      createdAt: new Date().toISOString(),
    };

    db.addMoment(newMoment);

    // 2. Add confirmation message to user's AI thread
    const userThreads = db.getThreads(user.id);
    const mainThread = userThreads[0];
    if (mainThread) {
      db.addMessage({
        id: `msg_mom_ack_${Date.now()}`,
        threadId: mainThread.id,
        senderRole: 'LIFEOS_AI',
        content: `I've registered your moment: "${newMoment.description}". Area: ${newMoment.approximateArea}. Goals: ${newMoment.goals.join(', ')}. I will quietly coordinate opportunities and protect your focus.`,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Dispatch realtime event
    eventDispatcher.broadcast({
      type: 'MOMENT_CREATED',
      data: { moment: newMoment },
      timestamp: new Date().toISOString(),
    });

    // 4. Run autonomous connection discovery
    setTimeout(() => {
      ConnectionDiscoveryEngine.evaluateMoment(newMoment);
    }, 600);

    res.json({ success: true, moment: newMoment });
  } catch (err: any) {
    console.error('Error creating moment:', err);
    res.status(500).json({ error: err.message || 'Failed to create moment' });
  }
});

// --- Proposals & State Machine Actions ---
apiRouter.get('/proposals', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  res.json({ proposals: db.getProposals(user.id) });
});

apiRouter.post('/proposals/:id/respond', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const { id } = req.params;
  const { action, newTime, newPlace, reason } = req.body;

  let success = false;
  if (action === 'RECIPIENT_INTERESTED') {
    success = InteractionStateMachine.recipientExpressesInterest(id, user.id);
  } else if (action === 'INITIATOR_APPROVED') {
    success = InteractionStateMachine.initiatorApprovesProposal(id, user.id);
  } else if (action === 'DECLINE') {
    success = InteractionStateMachine.declineProposal(id, user.id, reason);
  } else if (action === 'ADJUST') {
    success = InteractionStateMachine.adjustProposal(id, user.id, newTime, newPlace);
  }

  const proposal = db.getProposalById(id);
  res.json({ success, proposal });
});

// --- Chat & Threads ---
apiRouter.get('/threads', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  let threads = db.getThreads(user.id);
  if (threads.length === 0) {
    const freshThread = db.createThread({
      id: `thread_${user.id}_default`,
      ownerUserId: user.id,
      threadType: 'GENERAL_AI',
      title: `${user.name} & LIFEOS Coordinator`,
      status: 'ACTIVE',
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    });
    threads = [freshThread];
  }
  res.json({ threads });
});

apiRouter.get('/threads/:threadId/messages', (req: Request, res: Response) => {
  const { threadId } = req.params;
  const messages = db.getMessages(threadId);
  res.json({ messages });
});

apiRouter.post('/threads/:threadId/messages', async (req: Request, res: Response) => {
  try {
    const user = getSessionUser(req);
    const { threadId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // 1. Save user message
    const userMsg: ConversationMessage = {
      id: `msg_u_${Date.now()}`,
      threadId,
      senderRole: 'USER',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    db.addMessage(userMsg);

    // 2. Fetch history
    const history = db.getMessages(threadId).map((m) => ({
      senderRole: m.senderRole,
      content: m.content,
    }));

    const activeMoments = db.getMoments(user.id).filter((m) => m.status === 'ACTIVE');

    // 3. Generate response with Gemini
    const { reply } = await generateCompanionReply(content, user, history, activeMoments[0]);

    const aiMsg: ConversationMessage = {
      id: `msg_ai_${Date.now()}`,
      threadId,
      senderRole: 'LIFEOS_AI',
      content: reply,
      createdAt: new Date().toISOString(),
    };
    db.addMessage(aiMsg);

    // 4. If user expressed an event intention, auto-create/update LifeMoment
    const lower = content.toLowerCase();
    if (
      lower.includes('attending') ||
      lower.includes('event') ||
      lower.includes('founder') ||
      lower.includes('hungry') ||
      lower.includes('rest')
    ) {
      setTimeout(async () => {
        const interpreted = await interpretLifeMoment(content, user);
        const moment: LifeMoment = {
          id: `mom_${Date.now()}`,
          ownerId: user.id,
          ownerName: user.name,
          kind: interpreted.kind,
          description: content.trim(),
          startTime: interpreted.startTimeStr,
          endTime: interpreted.endTimeStr,
          approximateArea: interpreted.approximateArea,
          goals: interpreted.goals,
          preferences: interpreted.preferences,
          protectedConstraints: interpreted.protectedConstraints,
          sharingPermissions: interpreted.sharingPermissions,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
        db.addMoment(moment);
        ConnectionDiscoveryEngine.evaluateMoment(moment);
      }, 500);
    }

    eventDispatcher.sendToUser(user.id, {
      type: 'NEW_MESSAGE',
      recipientUserId: user.id,
      data: { message: aiMsg },
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, userMessage: userMsg, aiMessage: aiMsg });
  } catch (err: any) {
    console.error('Error handling message:', err);
    res.status(500).json({ error: err.message || 'Failed to process message' });
  }
});

// --- City Events & Cascade ---
apiRouter.get('/events', (_req: Request, res: Response) => {
  res.json({ events: db.getEvents() });
});

apiRouter.post('/events/:id/rsvp', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = getSessionUser(req);
  const { attending } = req.body;

  const event = db.getEventById(id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  if (attending) {
    EventCascadeEngine.incrementAttendance(id, 1);

    // Also auto-create or link user moment
    const moment: LifeMoment = {
      id: `mom_rsvp_${Date.now()}_${user.id}`,
      ownerId: user.id,
      ownerName: user.name,
      kind: 'ATTENDING_EVENT',
      description: `Attending ${event.title} in ${event.area}.`,
      startTime: `${event.date} ${event.startTime}`,
      endTime: `${event.date} ${event.endTime}`,
      approximateArea: event.area,
      goals: ['Experience event atmosphere', 'Make valuable professional peer connections'],
      preferences: ['High quality discussions'],
      protectedConstraints: ['Explicit mutual consent required'],
      sharingPermissions: 'AGENT_COORDINATED',
      status: 'ACTIVE',
      relatedEventId: event.id,
      createdAt: new Date().toISOString(),
    };
    db.addMoment(moment);
    ConnectionDiscoveryEngine.evaluateMoment(moment);
  }

  res.json({ success: true, event: db.getEventById(id) });
});

// --- Insights ---
apiRouter.get('/insights', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  res.json({ insights: db.getInsights(user.id) });
});

apiRouter.post('/insights/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const insight = db.getInsights().find((i) => i.id === id);
  if (insight) {
    insight.status = status;
    db.updateInsight(insight);
  }
  res.json({ success: true, insight });
});

// --- Notifications ---
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  res.json({ notifications: db.getNotifications(user.id) });
});

apiRouter.post('/notifications/:id/feedback', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const { id } = req.params;
  const { action } = req.body;
  NotificationPolicyEngine.handleUserFeedback(id, user.id, action);
  res.json({ success: true, notifications: db.getNotifications(user.id) });
});

// --- 1-Click Interactive Demo Scenarios ---
apiRouter.post('/demo/run-scenario', async (req: Request, res: Response) => {
  const { scenario } = req.body;

  if (scenario === 'SCENARIO_A') {
    // SCENARIO A: Meaningful Introduction (Elena & Rashid)
    const elena = db.getUserById('user_elena_vance')!;
    const rashid = db.getUserById('user_rashid_alfalasi')!;

    // 1. Elena creates event moment with networking goal
    const elenaMoment: LifeMoment = {
      id: `mom_elena_${Date.now()}`,
      ownerId: elena.id,
      ownerName: elena.name,
      kind: 'ATTENDING_EVENT',
      description: "I'm attending Dubai Future Evening tomorrow. I want to meet founders building AI businesses.",
      startTime: 'Tomorrow 19:00',
      endTime: 'Tomorrow 23:00',
      approximateArea: 'Dubai Marina',
      goals: ['Meet AI founders building technology', 'Explore collaborative deep-tech architecture'],
      preferences: ['Quiet conversation corner', 'Quality over pitch decks'],
      protectedConstraints: ['Keep direct phone private until mutual agreement'],
      sharingPermissions: 'AGENT_COORDINATED',
      status: 'ACTIVE',
      relatedEventId: 'event_dubai_future_evening',
      createdAt: new Date().toISOString(),
    };
    db.addMoment(elenaMoment);

    // 2. Discover Rashid's compatible moment and trigger Invitation
    const rashidMoment = db.getMoments(rashid.id)[0];
    const proposal = InteractionStateMachine.createProposal({
      initiatingUserId: elena.id,
      recipientUserId: rashid.id,
      relatedMomentId: elenaMoment.id,
      recipientMomentId: rashidMoment?.id,
      reason: 'Both attending Dubai Future Evening with high synergy in applied AI and tech growth.',
      matchScore: 0.94,
      proposedTime: 'Tomorrow 20:15 - 20:45',
      proposedPlace: 'The Foundry Cafe, Marina Gate Promenade',
      meetingObjective: 'Relaxed 15-min exchange on AI infrastructure & venture scaling',
    });

    res.json({
      success: true,
      scenario: 'SCENARIO_A',
      message: 'Scenario A initiated: Elena declared AI founder goal. Private invitation sent to Rashid Al-Falasi.',
      proposal,
      elenaMoment,
    });
    return;
  }

  if (scenario === 'SCENARIO_B') {
    // SCENARIO B: Event Cascading & Transport Pro
    const event = db.getEventById('event_dubai_future_evening')!;
    event.confirmedAttendance = 1850;
    EventCascadeEngine.processEventCascade(event);

    const tariq = db.getUserById('user_tariq_mansoor')!;
    const insights = db.getInsights(tariq.id);

    res.json({
      success: true,
      scenario: 'SCENARIO_B',
      message: 'Scenario B triggered: Dubai Future Evening confirmed RSVPs updated. Transport demand projected and delivered to Tariq Mansoor for his Marina shift.',
      event,
      insights,
    });
    return;
  }

  if (scenario === 'SCENARIO_C') {
    // SCENARIO C: Everyday Life Moment (Hunger / Local Food Match)
    const user = getSessionUser(req);
    const foodMoment: LifeMoment = {
      id: `mom_food_${Date.now()}`,
      ownerId: user.id,
      ownerName: user.name,
      kind: 'FOOD_HUNGER',
      description: "I'm hungry in Downtown Dubai, budget 60 AED, looking for healthy wholesome food.",
      startTime: 'Immediate',
      endTime: 'Within 45 mins',
      approximateArea: 'Downtown Dubai',
      goals: ['Satisfying nutritious meal', 'Zero friction or long wait'],
      preferences: ['Budget ≤ 60 AED', 'Mediterranean / clean bowls'],
      protectedConstraints: ['Verified hygiene standards'],
      sharingPermissions: 'AGENT_COORDINATED',
      status: 'FULFILLED',
      createdAt: new Date().toISOString(),
    };
    db.addMoment(foodMoment);

    const thread = db.getThreads(user.id)[0];
    if (thread) {
      db.addMessage({
        id: `msg_food_sol_${Date.now()}`,
        threadId: thread.id,
        senderRole: 'LIFEOS_AI',
        content: `🥗 Everyday Life Solution:
I identified a certified fresh grain & protein bowl from Green Table Downtown (48 AED, 4 mins away on Mohammed Bin Rashid Blvd). Also checked Zaid Artisan Provisions in Alserkal for evening sourdough batches. Table hold placed for 30 minutes. No delivery fees or apps required.`,
        createdAt: new Date().toISOString(),
      });
    }

    db.addInsight({
      id: `ins_food_${Date.now()}`,
      recipientUserId: user.id,
      insightType: 'FOOD_RESCUE',
      title: 'Healthy Lunch Match in Downtown',
      summary: 'Green Table Downtown Mediterranean bowl (48 AED) ready for walk-in pickup.',
      evidence: 'Matches budget ≤ 60 AED and clean eating preference. 200m from your current sector.',
      confidence: 0.95,
      nextSuggestedAction: 'Pick up at Counter B or request table hold.',
      isActionable: true,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      scenario: 'SCENARIO_C',
      message: 'Scenario C executed: Everyday lifestyle moment resolved with zero friction.',
      foodMoment,
    });
    return;
  }

  if (scenario === 'RESET') {
    db.resetDemoData();
    res.json({ success: true, message: 'Database reset to pristine demo state.' });
    return;
  }

  res.status(400).json({ error: 'Unknown scenario' });
});
