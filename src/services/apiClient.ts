import { RealtimeEventPayload, UserProfile } from "../types/index.ts";
const SESSION_KEY = "lifeos_private_session";
class ApiClient {
  private token = "";
  constructor() {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    this.token =
      fragment.get("access") || sessionStorage.getItem(SESSION_KEY) || "";
    if (this.token) sessionStorage.setItem(SESSION_KEY, this.token);
    if (fragment.has("access"))
      window.history.replaceState({}, "", window.location.pathname);
  }
  getSessionToken() {
    return this.token;
  }
  setSessionToken(token: string) {
    this.token = token;
    sessionStorage.setItem(SESSION_KEY, token);
  }
  async request(path: string, method = "GET", body?: unknown): Promise<any> {
    const res = await fetch(`/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-session-token": this.token,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(
        "The server did not return a valid response. Check that it is running.",
      );
    }
    if (!res.ok)
      throw new Error(data.error || "Could not complete the request.");
    return data;
  }
  subscribeToRealtime(callback: (event: RealtimeEventPayload) => void) {
    if (!this.token) return () => {};
    const source = new EventSource(
      `/api/events/stream?session=${encodeURIComponent(this.token)}`,
    );
    source.onmessage = (e) => {
      try {
        const p = JSON.parse(e.data);
        callback(p);
        const n = p.data?.notification;
        if (
          p.type === "NEW_NOTIFICATION" &&
          n?.deliveryStatus === "DELIVERED" &&
          n.priority !== "SILENT" &&
          "Notification" in window &&
          Notification.permission === "granted"
        )
          new Notification(n.title, { body: n.message });
      } catch {}
    };
    return () => source.close();
  }
  getSession() {
    return this.request("/session");
  }
  getUsers() {
    return this.request("/users");
  }
  createUser(data: any) {
    return this.request("/users", "POST", data);
  }
  updateProfile(updates: Partial<UserProfile>) {
    return this.request("/users/profile", "PUT", updates);
  }
  getMoments(all?: boolean) {
    return this.request("/moments");
  }
  createMoment(params: any) {
    return this.request("/moments", "POST", params);
  }
  getProposals() {
    return this.request("/proposals");
  }
  respondToProposal(id: string, action: string, options?: any) {
    return this.request(`/proposals/${id}/respond`, "POST", {
      action,
      ...options,
    });
  }
  getThreads() {
    return this.request("/threads");
  }
  getMessages(id: string) {
    return this.request(`/threads/${id}/messages`);
  }
  sendMessage(id: string, content: string) {
    return this.request(`/threads/${id}/messages`, "POST", { content });
  }
  getEvents() {
    return this.request("/events");
  }
  rsvpEvent(id: string, attending: boolean) {
    return this.request(`/events/${id}/rsvp`, "POST", { attending });
  }
  getInsights() {
    return this.request("/insights");
  }
  updateInsightStatus(id: string, status: string) {
    return this.request(`/insights/${id}/status`, "POST", { status });
  }
  getNotifications() {
    return this.request("/notifications");
  }
  feedbackNotification(id: string, action: string) {
    return this.request(`/notifications/${id}/feedback`, "POST", { action });
  }
  runDemoScenario(scenario: string) {
    return this.request("/demo/run-scenario", "POST", { scenario });
  }
}
export const api = new ApiClient();
