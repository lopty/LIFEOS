import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import "dotenv/config";
import { Attendance, Outcome } from "../types/index.ts";
import {
  UserProfile,
  LifeMoment,
  ConnectionProposal,
  ConversationThread,
  ConversationMessage,
  CityEvent,
  LifeInsight,
  NotificationItem,
} from "../types/index.ts";

const DATA_DIR = path.resolve(process.env.LIFEOS_DATA_DIR || "data");
const DB_FILE_PATH = path.join(DATA_DIR, "lifeos-store.json");

export interface DatabaseSchema {
  users: UserProfile[];
  moments: LifeMoment[];
  proposals: ConnectionProposal[];
  threads: ConversationThread[];
  messages: ConversationMessage[];
  events: CityEvent[];
  insights: LifeInsight[];
  notifications: NotificationItem[];
  attendance?: Attendance[];
  outcomes?: Outcome[];
  paperAccounts?: Record<
    string,
    {
      cash: number;
      holdings: Record<string, number>;
      trades: {
        symbol: string;
        side: string;
        quantity: number;
        price: number;
        time: string;
      }[];
    }
  >;
}

const INITIAL_USERS: UserProfile[] = [
  {
    id: "user_elena_vance",
    name: "Elena Vance",
    handle: "@elena_vance",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    bio: "Founder at Autonomous Neural Systems. Relocated to Dubai to build edge AI robotics.",
    professions: ["AI Founder", "Robotics Systems Architect"],
    skills: ["LLMs", "Embodied AI", "Seed Fundraising", "Product Architecture"],
    interests: [
      "AI Hardware",
      "Venture Capital",
      "Deep Tech",
      "Specialty Coffee",
    ],
    primaryArea: "Dubai Marina",
    frequentedAreas: ["Dubai Marina", "DIFC", "Palm Jumeirah"],
    scheduleRoutine: {
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workHours: "09:00 - 19:00",
      quietHoursStart: "22:30",
      quietHoursEnd: "07:00",
    },
    consentSettings: {
      allowProfessionalIntros: true,
      allowSocialIntros: true,
      allowTransportInsights: false,
      allowFoodOffers: true,
      requireExplicitApprovalBeforeContactShare: true,
      maxWeeklyIntros: 4,
    },
    privacyBoundaries: {
      shareExactLocation: false,
      shareWorkAffiliation: true,
      anonymousUntilConsent: true,
    },
    notificationBudget: {
      maxPerDay: 5,
      usedToday: 1,
      quietHoursActive: false,
    },
    sessionToken: "sess_elena_9238",
  },
  {
    id: "user_rashid_alfalasi",
    name: "Rashid Al-Falasi",
    handle: "@rashid_falasi",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "FinTech Engineering VP & Angel Investor. Looking to support UAE-based applied AI companies.",
    professions: ["FinTech VP", "Angel Investor", "Tech Mentor"],
    skills: [
      "FinTech",
      "High-Frequency Systems",
      "Seed Stage Mentorship",
      "Enterprise Scaling",
    ],
    interests: [
      "AI Businesses",
      "Autonomous Tech",
      "Gulf Tech Ecosystem",
      "Padel",
    ],
    primaryArea: "Downtown Dubai",
    frequentedAreas: ["Downtown Dubai", "Dubai Marina", "DIFC"],
    scheduleRoutine: {
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workHours: "08:30 - 18:00",
      quietHoursStart: "23:00",
      quietHoursEnd: "06:30",
    },
    consentSettings: {
      allowProfessionalIntros: true,
      allowSocialIntros: false,
      allowTransportInsights: false,
      allowFoodOffers: false,
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
    sessionToken: "sess_rashid_4102",
  },
  {
    id: "user_tariq_mansoor",
    name: "Tariq Mansoor",
    handle: "@tariq_transport",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Professional fleet driver & executive transport specialist operating in Marina, JBR, and Downtown.",
    professions: ["Transport Professional", "Executive Chauffeur"],
    skills: [
      "Dubai Highway Routes",
      "VIP Chauffeur Services",
      "Airport Express",
      "Customer Care",
    ],
    interests: ["Smart City Mobility", "Fleet Logistics", "Cricket"],
    primaryArea: "Dubai Marina",
    frequentedAreas: ["Dubai Marina", "JBR", "Downtown Dubai", "DXB Airport"],
    scheduleRoutine: {
      workDays: [
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      workHours: "18:00 - 02:00",
      quietHoursStart: "03:30",
      quietHoursEnd: "12:00",
    },
    consentSettings: {
      allowProfessionalIntros: false,
      allowSocialIntros: false,
      allowTransportInsights: true,
      allowFoodOffers: true,
      requireExplicitApprovalBeforeContactShare: true,
      maxWeeklyIntros: 0,
    },
    privacyBoundaries: {
      shareExactLocation: true,
      shareWorkAffiliation: false,
      anonymousUntilConsent: false,
    },
    notificationBudget: {
      maxPerDay: 8,
      usedToday: 1,
      quietHoursActive: false,
    },
    sessionToken: "sess_tariq_7811",
  },
  {
    id: "user_sarah_jenkins",
    name: "Sarah Jenkins",
    handle: "@sarah_events_dxb",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    bio: "Head of Programming for Dubai Future Evenings & Innovation Summits.",
    professions: ["Event Organiser", "Community Director"],
    skills: [
      "Major Event Production",
      "VIP Protocol",
      "Supplier Coordination",
      "Audience Logistics",
    ],
    interests: ["Emerging Tech", "Smart Cities", "Hospitality", "Dubai Art"],
    primaryArea: "Dubai Marina",
    frequentedAreas: ["Dubai Marina", "DIFC", "World Trade Centre"],
    scheduleRoutine: {
      workDays: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      workHours: "10:00 - 21:00",
      quietHoursStart: "23:30",
      quietHoursEnd: "07:30",
    },
    consentSettings: {
      allowProfessionalIntros: true,
      allowSocialIntros: true,
      allowTransportInsights: true,
      allowFoodOffers: true,
      requireExplicitApprovalBeforeContactShare: true,
      maxWeeklyIntros: 10,
    },
    privacyBoundaries: {
      shareExactLocation: false,
      shareWorkAffiliation: true,
      anonymousUntilConsent: false,
    },
    notificationBudget: {
      maxPerDay: 12,
      usedToday: 2,
      quietHoursActive: false,
    },
    sessionToken: "sess_sarah_6391",
  },
  {
    id: "user_layla_noor",
    name: "Layla Noor",
    handle: "@layla_noor",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    bio: "Independent ESG Strategist & parent. Works flexibly between Business Bay and home.",
    professions: ["Strategy Consultant", "Parent", "Sustainability Lead"],
    skills: ["ESG Reporting", "Corporate Strategy", "Workshop Facilitation"],
    interests: ["Work-Life Harmony", "Child Enrichment", "Wellness", "Pilates"],
    primaryArea: "Business Bay",
    frequentedAreas: ["Business Bay", "Downtown Dubai", "Jumeirah"],
    scheduleRoutine: {
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      workHours: "09:00 - 15:30",
      quietHoursStart: "21:00",
      quietHoursEnd: "06:30",
    },
    consentSettings: {
      allowProfessionalIntros: true,
      allowSocialIntros: true,
      allowTransportInsights: false,
      allowFoodOffers: true,
      requireExplicitApprovalBeforeContactShare: true,
      maxWeeklyIntros: 2,
    },
    privacyBoundaries: {
      shareExactLocation: false,
      shareWorkAffiliation: true,
      anonymousUntilConsent: true,
    },
    notificationBudget: {
      maxPerDay: 4,
      usedToday: 0,
      quietHoursActive: false,
    },
    sessionToken: "sess_layla_3829",
  },
  {
    id: "user_karim_zaid",
    name: "Karim Zaid",
    handle: "@karim_culinary",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    bio: "Artisan Sourdough Baker & Founder at Zaid Artisan Provisions. Passionate about zero food waste in Dubai.",
    professions: ["Artisan Baker", "Restaurateur"],
    skills: [
      "Artisan Baking",
      "Fermentation",
      "Sustainable Food Ops",
      "Catering",
    ],
    interests: [
      "Food Rescue",
      "Culinary Craft",
      "Local Farmers",
      "Community Hubs",
    ],
    primaryArea: "Alserkal Avenue",
    frequentedAreas: ["Alserkal Avenue", "Jumeirah", "Dubai Marina"],
    scheduleRoutine: {
      workDays: [
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      workHours: "05:00 - 15:00",
      quietHoursStart: "21:00",
      quietHoursEnd: "04:30",
    },
    consentSettings: {
      allowProfessionalIntros: false,
      allowSocialIntros: true,
      allowTransportInsights: false,
      allowFoodOffers: true,
      requireExplicitApprovalBeforeContactShare: false,
      maxWeeklyIntros: 3,
    },
    privacyBoundaries: {
      shareExactLocation: false,
      shareWorkAffiliation: true,
      anonymousUntilConsent: false,
    },
    notificationBudget: {
      maxPerDay: 5,
      usedToday: 0,
      quietHoursActive: false,
    },
    sessionToken: "sess_karim_1922",
  },
];

const INITIAL_EVENTS: CityEvent[] = [
  {
    id: "event_dubai_future_evening",
    title: "Dubai Future Evening",
    area: "Dubai Marina",
    venue: "Marina Gate Promenade & Yacht Terrace",
    date: "Tomorrow",
    startTime: "19:00",
    endTime: "23:00",
    organizerId: "user_sarah_jenkins",
    organizerName: "Sarah Jenkins",
    category: "Technology & Frontier Innovation",
    description:
      "An open gathering of Dubai technologists, deep-tech founders, engineers, and visionaries discussing autonomous systems and sovereign compute.",
    estimatedAttendance: 10000,
    confirmedAttendance: 1420,
    transportDemandEstimate: {
      peakOutflowTime: "22:30 - 23:45",
      estimatedTaxisNeeded: 420,
      corridors: [
        { destination: "Downtown / DIFC Corridor", sharePercentage: 42 },
        { destination: "Palm Jumeirah & JBR Local", sharePercentage: 35 },
        { destination: "DXB Airport / Deira Express", sharePercentage: 23 },
      ],
      notes:
        "Marina Gate bottlenecks expected at 23:00. Chauffeur staging designated at North Marina valet loop.",
    },
    requiredServices: [
      {
        serviceType: "Technical Stage Assistants",
        slots: 4,
        status: "PARTIAL",
      },
      { serviceType: "Specialty Beverage Artisan", slots: 2, status: "FILLED" },
      { serviceType: "Transport Staging Marshals", slots: 6, status: "OPEN" },
    ],
  },
  {
    id: "event_difc_fintech_sunrise",
    title: "DIFC FinTech & Web3 Sunrise",
    area: "DIFC",
    venue: "Gate Village Building 4",
    date: "Thursday",
    startTime: "08:30",
    endTime: "11:00",
    organizerId: "org_difc_innovation",
    organizerName: "DIFC Innovation Hub",
    category: "Financial Infrastructure",
    description:
      "Breakfast dialogue on cross-border settlements and algorithmic liquidity.",
    estimatedAttendance: 450,
    confirmedAttendance: 310,
  },
  {
    id: "event_alserkal_makers_salon",
    title: "Alserkal Sustainable Living & Food Salon",
    area: "Alserkal Avenue",
    venue: "Warehouse 46",
    date: "Friday",
    startTime: "17:00",
    endTime: "21:30",
    organizerId: "user_karim_zaid",
    organizerName: "Karim Zaid",
    category: "Community & Craft",
    description:
      "Community gathering exploring circular gastronomy, surplus food stewardship, and local production.",
    estimatedAttendance: 250,
    confirmedAttendance: 180,
  },
];

const INITIAL_INSIGHTS: LifeInsight[] = [
  {
    id: "ins_tariq_marina_demand",
    recipientUserId: "user_tariq_mansoor",
    relatedMomentId: undefined,
    insightType: "TRANSPORT_DEMAND",
    title: "Marina Gate Evening Outflow Window",
    summary:
      "Dubai Future Evening ends at 23:00 with ~1,400 confirmed attendees. Peak transport demand is projected between 22:30 and 23:45.",
    evidence:
      "Calculated from actual confirmed RSVPs (1,420) and historical Marina egress flow. Fits your active 18:00 - 02:00 Marina shift.",
    confidence: 0.92,
    nextSuggestedAction:
      "Stage near North Marina Valet Loop around 22:20 without queuing on main tram line.",
    isActionable: true,
    status: "NEW",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

class DatabaseManager {
  private data: DatabaseSchema;
  private sqlite: DatabaseSync;

  constructor() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    this.sqlite = new DatabaseSync(path.join(DATA_DIR, "lifeos.sqlite"));
    this.sqlite.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), document TEXT NOT NULL)",
    );
    const existing = this.sqlite
      .prepare("SELECT document FROM app_state WHERE id=1")
      .get() as { document: string } | undefined;
    this.data = existing ? JSON.parse(existing.document) : this.loadDatabase();
    this.data.attendance ||= [];
    this.data.outcomes ||= [];
    for (const user of this.data.users) {
      if (!user.sessionToken || user.sessionToken.length < 40)
        user.sessionToken = randomBytes(32).toString("hex");
      user.allowEventDiscovery ??= true;
      user.goals ||= [];
    }
    for (const event of this.data.events) {
      event.isDemo ??= true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date))
        event.date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      event.confirmedAttendance = this.data.attendance.filter(
        (a) => a.eventId === event.id && a.attending,
      ).length;
      if (event.isDemo) event.transportDemandEstimate = undefined;
    }
    for (const moment of this.data.moments) {
      if (!Number.isFinite(Date.parse(moment.startTime))) {
        const event = this.data.events.find(
          (e) => e.id === moment.relatedEventId,
        );
        const date =
          event?.date ||
          new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        moment.startTime = `${date}T${event?.startTime || "19:00"}:00+04:00`;
        moment.endTime = `${date}T${event?.endTime || "23:00"}:00+04:00`;
      }
    }
    for (const insight of this.data.insights)
      if (insight.id === "ins_tariq_marina_demand") {
        insight.title = "Sample transport context";
        insight.evidence =
          "Imported AI Studio demonstration, not independently verified attendance or historical demand.";
        insight.summary =
          "Confirm attendees in Explore to calculate a fresh estimate from application records.";
        insight.confidence = 0;
        insight.isActionable = false;
      }
    for (const proposal of this.data.proposals) {
      if (
        !Number.isFinite(Date.parse(proposal.proposedTime || "")) &&
        !["DECLINED", "CANCELLED", "EXPIRED", "COMPLETED"].includes(
          proposal.currentState,
        )
      ) {
        proposal.currentState = "EXPIRED";
        proposal.updatedAt = new Date().toISOString();
        proposal.stateHistory.push({
          state: "EXPIRED",
          timestamp: proposal.updatedAt,
          note: "Imported prototype arrangement has no valid dated time. Create a fresh proposal with independent consent.",
        });
      }
    }
    this.saveDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(
        "Could not read existing database, initializing fresh state:",
        err,
      );
    }

    const initialData: DatabaseSchema = {
      users: INITIAL_USERS,
      moments: [
        {
          id: "mom_rashid_future_evening",
          ownerId: "user_rashid_alfalasi",
          ownerName: "Rashid Al-Falasi",
          kind: "ATTENDING_EVENT",
          description:
            "Attending Dubai Future Evening. Interested in meeting founders building technology and applied AI.",
          startTime: "Tomorrow 19:00",
          endTime: "Tomorrow 23:00",
          approximateArea: "Dubai Marina",
          goals: [
            "Meet AI founders building deep-tech",
            "Explore early-stage advisory & angel investments",
          ],
          preferences: [
            "Casual coffee or quiet conversation corner",
            "Quality discussion over pitch decks",
          ],
          protectedConstraints: [
            "No unscheduled contact sharing",
            "Wrap by 21:45",
          ],
          sharingPermissions: "AGENT_COORDINATED",
          status: "ACTIVE",
          relatedEventId: "event_dubai_future_evening",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
      proposals: [],
      threads: [
        {
          id: "thread_elena_main",
          ownerUserId: "user_elena_vance",
          threadType: "GENERAL_AI",
          title: "Elena & LIFEOS Coordinator",
          status: "ACTIVE",
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "thread_rashid_main",
          ownerUserId: "user_rashid_alfalasi",
          threadType: "GENERAL_AI",
          title: "Rashid & LIFEOS Coordinator",
          status: "ACTIVE",
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "thread_tariq_main",
          ownerUserId: "user_tariq_mansoor",
          threadType: "GENERAL_AI",
          title: "Tariq & Fleet Companion",
          status: "ACTIVE",
          unreadCount: 1,
          updatedAt: new Date().toISOString(),
        },
      ],
      messages: [
        {
          id: "msg_tariq_welcome",
          threadId: "thread_tariq_main",
          senderRole: "LIFEOS_AI",
          content:
            "Good evening Tariq. Your Marina shift starts at 18:00. I have quiet insights ready on tonight’s demand curves at Marina Gate.",
          createdAt: new Date(Date.now() - 3500000).toISOString(),
        },
      ],
      events: INITIAL_EVENTS,
      insights: INITIAL_INSIGHTS,
      notifications: [
        {
          id: "notif_tariq_init",
          recipientUserId: "user_tariq_mansoor",
          priority: "GENTLE",
          title: "Transport Demand Insight",
          message:
            "Dubai Marina evening outflow projection ready for your shift.",
          deliveryStatus: "DELIVERED",
          scheduledAt: new Date(Date.now() - 3600000).toISOString(),
          deliveredAt: new Date(Date.now() - 3600000).toISOString(),
          deduplicationKey: "tariq_marina_demand_notif",
          category: "CITY_PULSE",
        },
      ],
    };

    this.saveDatabase(initialData);
    return initialData;
  }

  private saveDatabase(dataToSave?: DatabaseSchema) {
    const toSave = dataToSave || this.data;
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.sqlite
        .prepare(
          "INSERT INTO app_state (id, document) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET document=excluded.document",
        )
        .run(JSON.stringify(toSave));
    } catch (err) {
      throw new Error("Unable to persist LIFEOS data", { cause: err });
    }
  }

  // --- Users ---
  public getUsers(): UserProfile[] {
    return this.data.users;
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserBySession(token: string): UserProfile | undefined {
    return this.data.users.find((u) => u.sessionToken === token);
  }

  public updateUser(user: UserProfile) {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.saveDatabase();
  }

  // --- Moments ---
  public getMoments(userId?: string): LifeMoment[] {
    if (userId) {
      return this.data.moments.filter((m) => m.ownerId === userId);
    }
    return this.data.moments;
  }

  public getMomentById(id: string): LifeMoment | undefined {
    return this.data.moments.find((m) => m.id === id);
  }

  public addMoment(moment: LifeMoment): LifeMoment {
    if (this.data.moments.some((m) => m.id === moment.id)) {
      this.updateMoment(moment);
      return moment;
    }
    this.data.moments.unshift(moment);
    this.saveDatabase();
    return moment;
  }

  public updateMoment(moment: LifeMoment) {
    const idx = this.data.moments.findIndex((m) => m.id === moment.id);
    if (idx >= 0) {
      this.data.moments[idx] = moment;
      this.saveDatabase();
    }
  }

  // --- Proposals ---
  public getProposals(userId?: string): ConnectionProposal[] {
    if (userId) {
      return this.data.proposals.filter(
        (p) => p.initiatingUserId === userId || p.recipientUserId === userId,
      );
    }
    return this.data.proposals;
  }

  public getProposalById(id: string): ConnectionProposal | undefined {
    return this.data.proposals.find((p) => p.id === id);
  }

  public addProposal(proposal: ConnectionProposal): ConnectionProposal {
    this.data.proposals.unshift(proposal);
    this.saveDatabase();
    return proposal;
  }

  public updateProposal(proposal: ConnectionProposal) {
    const idx = this.data.proposals.findIndex((p) => p.id === proposal.id);
    if (idx >= 0) {
      this.data.proposals[idx] = proposal;
      this.saveDatabase();
    }
  }

  // --- Threads & Messages ---
  public getThreads(userId: string): ConversationThread[] {
    return this.data.threads
      .filter((t) => t.ownerUserId === userId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }

  public getThreadById(id: string): ConversationThread | undefined {
    return this.data.threads.find((t) => t.id === id);
  }

  public createThread(thread: ConversationThread): ConversationThread {
    this.data.threads.unshift(thread);
    this.saveDatabase();
    return thread;
  }

  public updateThread(thread: ConversationThread) {
    const idx = this.data.threads.findIndex((t) => t.id === thread.id);
    if (idx >= 0) {
      this.data.threads[idx] = thread;
      this.saveDatabase();
    }
  }

  public getMessages(threadId: string): ConversationMessage[] {
    return this.data.messages
      .filter((m) => m.threadId === threadId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  public addMessage(msg: ConversationMessage): ConversationMessage {
    this.data.messages.push(msg);
    // Update thread updatedAt
    const thread = this.data.threads.find((t) => t.id === msg.threadId);
    if (thread) {
      thread.updatedAt = msg.createdAt;
      if (msg.senderRole === "LIFEOS_AI") {
        thread.unreadCount += 1;
      }
    }
    this.saveDatabase();
    return msg;
  }

  // --- Events ---
  public getEvents(): CityEvent[] {
    return this.data.events;
  }

  public getEventById(id: string): CityEvent | undefined {
    return this.data.events.find((e) => e.id === id);
  }

  public addEvent(event: CityEvent): CityEvent {
    this.data.events.push(event);
    this.saveDatabase();
    return event;
  }

  public updateEvent(event: CityEvent) {
    const idx = this.data.events.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      this.data.events[idx] = event;
      this.saveDatabase();
    }
  }

  // --- Insights ---
  public getInsights(userId?: string): LifeInsight[] {
    if (userId) {
      return this.data.insights.filter((i) => i.recipientUserId === userId);
    }
    return this.data.insights;
  }

  public addInsight(insight: LifeInsight): LifeInsight {
    if (this.data.insights.some((i) => i.id === insight.id)) {
      this.updateInsight(insight);
      return insight;
    }
    this.data.insights.unshift(insight);
    this.saveDatabase();
    return insight;
  }

  public updateInsight(insight: LifeInsight) {
    const idx = this.data.insights.findIndex((i) => i.id === insight.id);
    if (idx >= 0) {
      this.data.insights[idx] = insight;
      this.saveDatabase();
    }
  }

  // --- Notifications ---
  public getNotifications(userId: string): NotificationItem[] {
    return this.data.notifications
      .filter((n) => n.recipientUserId === userId)
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      );
  }

  public addNotification(notif: NotificationItem): NotificationItem {
    // Check deduplication key
    const exists = this.data.notifications.some(
      (n) =>
        n.deduplicationKey === notif.deduplicationKey &&
        n.recipientUserId === notif.recipientUserId,
    );
    if (exists) return notif;

    this.data.notifications.unshift(notif);
    this.saveDatabase();
    return notif;
  }

  public updateNotification(notif: NotificationItem) {
    const idx = this.data.notifications.findIndex((n) => n.id === notif.id);
    if (idx >= 0) {
      this.data.notifications[idx] = notif;
      this.saveDatabase();
    }
  }

  public resetDemoData() {
    // Resetting a shared database would erase participant data. Use a separate
    // LIFEOS_DATA_DIR for a fresh demo instead.
    throw new Error(
      "Use a separate LIFEOS_DATA_DIR to start a fresh demonstration.",
    );
  }

  public getAttendance(userId?: string) {
    return (this.data.attendance || []).filter(
      (a) => !userId || a.userId === userId,
    );
  }
  public setAttendance(record: Attendance) {
    const records = (this.data.attendance ||= []);
    const index = records.findIndex(
      (a) => a.userId === record.userId && a.eventId === record.eventId,
    );
    if (index < 0) records.push(record);
    else records[index] = record;
    this.saveDatabase();
  }
  public addOutcome(outcome: Outcome) {
    this.data.outcomes!.unshift(outcome);
    this.saveDatabase();
  }
  public getOutcomes(userId: string) {
    return this.data.outcomes!.filter((o) => o.ownerId === userId);
  }
  public feedbackOutcome(id: string, userId: string, helpful: boolean) {
    const outcome = this.data.outcomes!.find(
      (o) => o.id === id && o.ownerId === userId,
    );
    if (!outcome) return false;
    outcome.helpful = helpful;
    this.saveDatabase();
    return true;
  }
  public getPaperAccount(userId: string) {
    const accounts = (this.data.paperAccounts ||= {});
    return (accounts[userId] ||= { cash: 100000, holdings: {}, trades: [] });
  }
  public paperTrade(
    userId: string,
    symbol: string,
    side: string,
    quantity: number,
    price: number,
  ) {
    const account = this.getPaperAccount(userId);
    if (side === "BUY") {
      if (account.cash < quantity * price)
        throw new Error("Not enough virtual cash.");
      account.cash -= quantity * price;
      account.holdings[symbol] = (account.holdings[symbol] || 0) + quantity;
    } else {
      if ((account.holdings[symbol] || 0) < quantity)
        throw new Error("Not enough virtual shares.");
      account.cash += quantity * price;
      account.holdings[symbol] -= quantity;
    }
    account.trades.unshift({
      symbol,
      side,
      quantity,
      price,
      time: new Date().toISOString(),
    });
    this.saveDatabase();
    return account;
  }
}

export const db = new DatabaseManager();
