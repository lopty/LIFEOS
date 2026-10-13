export type ConnectionState =
  | 'DISCOVERED'
  | 'ELIGIBILITY_CHECKED'
  | 'INVITATION_PENDING'
  | 'PARTICIPANT_INTERESTED'
  | 'MUTUAL_CONSENT_PENDING'
  | 'ACCEPTED'
  | 'COORDINATING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED';

export type MomentType =
  | 'ATTENDING_EVENT'
  | 'WORK_SHIFT'
  | 'FOOD_HUNGER'
  | 'SOCIAL_GATHERING'
  | 'NETWORKING_MEETING'
  | 'REST_TIME'
  | 'SERVICE_OFFER'
  | 'SURPLUS_FOOD'
  | 'COMMUNITY_ACTIVITY'
  | 'TRANSIT_JOURNEY';

export type NotificationPriority = 'SILENT' | 'GENTLE' | 'ACTION_REQUIRED';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  handle: string;
  bio: string;
  professions: string[];
  skills: string[];
  interests: string[];
  primaryArea: string; // e.g. "Dubai Marina", "Downtown Dubai", "DIFC", "Business Bay"
  frequentedAreas: string[];
  scheduleRoutine: {
    workDays: string[];
    workHours: string;
    quietHoursStart: string; // e.g. "22:00"
    quietHoursEnd: string; // e.g. "07:00"
  };
  consentSettings: {
    allowProfessionalIntros: boolean;
    allowSocialIntros: boolean;
    allowTransportInsights: boolean;
    allowFoodOffers: boolean;
    requireExplicitApprovalBeforeContactShare: boolean;
    maxWeeklyIntros: number;
  };
  privacyBoundaries: {
    shareExactLocation: boolean;
    shareWorkAffiliation: boolean;
    anonymousUntilConsent: boolean;
  };
  notificationBudget: {
    maxPerDay: number;
    usedToday: number;
    quietHoursActive: boolean;
  };
  sessionToken: string;
}

export interface LifeMoment {
  id: string;
  ownerId: string;
  ownerName?: string;
  kind: MomentType;
  description: string; // natural language description
  startTime: string; // ISO string
  endTime: string; // ISO string
  approximateArea: string; // e.g. "Dubai Marina"
  goals: string[]; // e.g. ["Meet AI founders", "Explore seed funding"]
  preferences: string[]; // e.g. ["Quiet venue", "Tech focused"]
  protectedConstraints: string[]; // e.g. ["No direct contact info share", "Free by 21:30"]
  sharingPermissions: 'PRIVATE' | 'AGENT_COORDINATED' | 'COMMUNITY_VISIBLE';
  status: 'ACTIVE' | 'COORDINATING' | 'FULFILLED' | 'CANCELLED';
  relatedEventId?: string;
  createdAt: string;
}

export interface ConnectionProposal {
  id: string;
  initiatingUserId: string;
  recipientUserId: string;
  relatedMomentId: string;
  recipientMomentId?: string;
  reason: string;
  matchScore: number;
  currentState: ConnectionState;
  approvedDisclosures: {
    initiatorSharedInfo: string[];
    recipientSharedInfo: string[];
  };
  proposedTime?: string;
  proposedPlace?: string;
  meetingObjective?: string;
  initiatorConsent?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  recipientConsent?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  stateHistory: {
    state: ConnectionState;
    timestamp: string;
    note: string;
    triggeredByUserId?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationThread {
  id: string;
  ownerUserId: string;
  relatedMomentId?: string;
  relatedProposalId?: string;
  threadType: 'GENERAL_AI' | 'MOMENT_COORDINATION' | 'PROPOSAL_CONSENT' | 'INSIGHT';
  title: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'RESOLVED';
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  threadId: string;
  senderRole: 'USER' | 'LIFEOS_AI' | 'SYSTEM';
  content: string;
  createdAt: string;
  sourceActionId?: string;
  proposalData?: {
    proposalId: string;
    state: ConnectionState;
    partnerName: string;
    partnerProfession: string;
    partnerBio: string;
    venue?: string;
    time?: string;
    objective?: string;
  };
  actionOptions?: {
    label: string;
    action: string;
    payload?: any;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
}

export interface CityEvent {
  id: string;
  title: string;
  area: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  organizerId: string;
  organizerName: string;
  category: string;
  description: string;
  estimatedAttendance: number;
  confirmedAttendance: number;
  transportDemandEstimate?: {
    peakOutflowTime: string;
    estimatedTaxisNeeded: number;
    corridors: { destination: string; sharePercentage: number }[];
    notes: string;
  };
  requiredServices?: {
    serviceType: string;
    slots: number;
    status: 'OPEN' | 'PARTIAL' | 'FILLED';
  }[];
}

export interface LifeInsight {
  id: string;
  recipientUserId: string;
  relatedMomentId?: string;
  insightType: 'TRANSPORT_DEMAND' | 'SCHEDULE_BUFFER' | 'FOOD_RESCUE' | 'OPPORTUNITY' | 'WELLBEING';
  title: string;
  summary: string;
  evidence: string;
  confidence: number;
  nextSuggestedAction: string;
  isActionable: boolean;
  status: 'NEW' | 'ACCEPTED' | 'DISMISSED';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  relatedThreadId?: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  deliveryStatus: 'PENDING' | 'DELIVERED' | 'DISMISSED' | 'SNOOZED';
  scheduledAt: string;
  deliveredAt?: string;
  deduplicationKey: string;
  category: 'INTRODUCTION' | 'MOMENT_UPDATE' | 'CITY_PULSE' | 'SCHEDULE';
}

export interface PaperTradeAsset {
  symbol: string;
  name: string;
  market: string; // e.g. "DFM", "Nasdaq Dubai"
  price: number;
  changePercent: number;
  volume: string;
}

export interface RealtimeEventPayload {
  type:
    | 'MOMENT_CREATED'
    | 'MOMENT_UPDATED'
    | 'PROPOSAL_UPDATED'
    | 'NEW_MESSAGE'
    | 'NEW_NOTIFICATION'
    | 'INSIGHT_GENERATED'
    | 'EVENT_CASCADE_UPDATED';
  recipientUserId?: string;
  data: any;
  timestamp: string;
}
