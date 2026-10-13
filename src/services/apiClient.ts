import {
  UserProfile,
  LifeMoment,
  ConnectionProposal,
  ConversationThread,
  ConversationMessage,
  CityEvent,
  LifeInsight,
  NotificationItem,
  RealtimeEventPayload,
} from '../types/index.ts';

const SESSION_STORAGE_KEY = 'lifeos_active_session_token';

class ApiClient {
  private sessionToken: string;
  private sseSource: EventSource | null = null;
  private listeners: ((event: RealtimeEventPayload) => void)[] = [];

  constructor() {
    // Check URL param first (e.g., ?session=user_rashid_alfalasi)
    const urlParams = new URLSearchParams(window.location.search);
    const querySession = urlParams.get('session') || urlParams.get('userId');

    if (querySession) {
      this.sessionToken = querySession;
      localStorage.setItem(SESSION_STORAGE_KEY, querySession);
    } else {
      this.sessionToken = localStorage.getItem(SESSION_STORAGE_KEY) || 'user_elena_vance';
    }
  }

  public getSessionToken(): string {
    return this.sessionToken;
  }

  public setSessionToken(token: string) {
    this.sessionToken = token;
    localStorage.setItem(SESSION_STORAGE_KEY, token);
    this.reconnectSSE();
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-session-token': this.sessionToken,
    };
  }

  // --- Realtime SSE ---
  public subscribeToRealtime(callback: (event: RealtimeEventPayload) => void): () => void {
    this.listeners.push(callback);
    if (!this.sseSource) {
      this.connectSSE();
    }
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
      if (this.listeners.length === 0 && this.sseSource) {
        this.sseSource.close();
        this.sseSource = null;
      }
    };
  }

  private connectSSE() {
    try {
      this.sseSource = new EventSource(`/api/events/stream?session=${encodeURIComponent(this.sessionToken)}`);

      this.sseSource.onmessage = (e) => {
        try {
          const payload: RealtimeEventPayload = JSON.parse(e.data);
          this.listeners.forEach((cb) => cb(payload));

          // Trigger native notification if permission granted and priority relevant
          if (
            (payload.type === 'NEW_NOTIFICATION' || payload.type === 'PROPOSAL_UPDATED') &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            const title = payload.data?.proposal ? 'LIFEOS Connection Update' : 'LIFEOS City Pulse';
            const body =
              payload.data?.message?.content ||
              payload.data?.proposal?.reason ||
              'A new living moment update is ready in your Dubai hub.';
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        } catch (err) {
          console.warn('Error parsing SSE event:', err);
        }
      };

      this.sseSource.onerror = () => {
        // Handled silently; browser auto-reconnects SSE
      };
    } catch (err) {
      console.warn('Could not establish SSE connection:', err);
    }
  }

  private reconnectSSE() {
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }
    if (this.listeners.length > 0) {
      this.connectSSE();
    }
  }

  // --- API Calls ---
  public async getSession(): Promise<{ user: UserProfile; activeConnections: number }> {
    const res = await fetch(`/api/session?session=${encodeURIComponent(this.sessionToken)}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  public async getUsers(): Promise<{ users: UserProfile[] }> {
    const res = await fetch('/api/users');
    return res.json();
  }

  public async createUser(data: {
    name: string;
    profession?: string;
    primaryArea?: string;
    bio?: string;
  }): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  public async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    return res.json();
  }

  public async getMoments(all?: boolean): Promise<{ moments: LifeMoment[] }> {
    const res = await fetch(`/api/moments?all=${all ? 'true' : 'false'}&session=${this.sessionToken}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  public async createMoment(params: {
    description: string;
    relatedEventId?: string;
    manualKind?: string;
  }): Promise<{ success: boolean; moment: LifeMoment }> {
    const res = await fetch('/api/moments', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    return res.json();
  }

  public async getProposals(): Promise<{ proposals: ConnectionProposal[] }> {
    const res = await fetch(`/api/proposals?session=${this.sessionToken}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  public async respondToProposal(
    proposalId: string,
    action: 'RECIPIENT_INTERESTED' | 'INITIATOR_APPROVED' | 'DECLINE' | 'ADJUST',
    options?: { newTime?: string; newPlace?: string; reason?: string }
  ): Promise<{ success: boolean; proposal: ConnectionProposal }> {
    const res = await fetch(`/api/proposals/${proposalId}/respond`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, ...options }),
    });
    return res.json();
  }

  public async getThreads(): Promise<{ threads: ConversationThread[] }> {
    const res = await fetch(`/api/threads?session=${this.sessionToken}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  public async getMessages(threadId: string): Promise<{ messages: ConversationMessage[] }> {
    const res = await fetch(`/api/threads/${threadId}/messages`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  public async sendMessage(
    threadId: string,
    content: string
  ): Promise<{ success: boolean; userMessage: ConversationMessage; aiMessage: ConversationMessage }> {
    const res = await fetch(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
    });
    return res.json();
  }

  public async getEvents(): Promise<{ events: CityEvent[] }> {
    const res = await fetch('/api/events');
    return res.json();
  }

  public async rsvpEvent(eventId: string, attending: boolean): Promise<{ success: boolean; event: CityEvent }> {
    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ attending }),
    });
    return res.json();
  }

  public async getInsights(): Promise<{ insights: LifeInsight[] }> {
    const res = await fetch(`/api/insights?session=${this.sessionToken}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  public async updateInsightStatus(id: string, status: 'ACCEPTED' | 'DISMISSED'): Promise<any> {
    const res = await fetch(`/api/insights/${id}/status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  }

  public async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    const res = await fetch(`/api/notifications?session=${this.sessionToken}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  public async feedbackNotification(
    id: string,
    action: 'DISMISS' | 'SNOOZE' | 'NOT_INTERESTED' | 'STOP_TOPIC'
  ): Promise<{ success: boolean; notifications: NotificationItem[] }> {
    const res = await fetch(`/api/notifications/${id}/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action }),
    });
    return res.json();
  }

  public async runDemoScenario(scenario: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C' | 'RESET'): Promise<any> {
    const res = await fetch('/api/demo/run-scenario', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ scenario }),
    });
    return res.json();
  }
}

export const api = new ApiClient();
