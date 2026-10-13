import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./services/apiClient.ts";
import {
  UserProfile,
  LifeMoment,
  ConnectionProposal,
  ConversationThread,
  ConversationMessage,
  CityEvent,
  LifeInsight,
  NotificationItem,
  Attendance,
  Outcome,
} from "./types/index.ts";
import {
  AppShell,
  Today,
  Ask,
  Moments,
  Explore,
  Profile,
  Inbox,
  Welcome,
} from "./components/LifeUI.tsx";
export type Screen = "today" | "explore" | "moments" | "ai" | "you";
export default function App() {
  const [screen, setScreen] = useState<Screen>("today");
  const [user, setUser] = useState<UserProfile | null>(null),
    [boot, setBoot] = useState<any>(null),
    [loading, setLoading] = useState(true);
  const [moments, setMoments] = useState<LifeMoment[]>([]),
    [proposals, setProposals] = useState<ConnectionProposal[]>([]),
    [threads, setThreads] = useState<ConversationThread[]>([]),
    [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [events, setEvents] = useState<CityEvent[]>([]),
    [attendance, setAttendance] = useState<Attendance[]>([]),
    [insights, setInsights] = useState<LifeInsight[]>([]),
    [notifications, setNotifications] = useState<NotificationItem[]>([]),
    [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [threadId, setThreadId] = useState(""),
    [inbox, setInbox] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const session = useRef(0),
    thread = useRef("");
  const changeThread = useCallback((id: string) => {
    thread.current = id;
    setThreadId(id);
  }, []);
  const refresh = useCallback(async () => {
    const version = session.current;
    const [s, m, p, t, e, i, n, o] = await Promise.all([
      api.getSession(),
      api.getMoments(),
      api.getProposals(),
      api.getThreads(),
      api.getEvents(),
      api.getInsights(),
      api.getNotifications(),
      api.request("/outcomes"),
    ]);
    if (version !== session.current) return;
    setUser(s.user);
    setMoments(m.moments);
    setProposals(p.proposals);
    setThreads(t.threads);
    setEvents(e.events);
    setAttendance(e.attendance);
    setInsights(i.insights);
    setNotifications(n.notifications);
    setOutcomes(o.outcomes);
    const id = t.threads.some(
      (t: ConversationThread) => t.id === thread.current,
    )
      ? thread.current
      : t.threads.find((t: ConversationThread) => t.threadType === "GENERAL_AI")
          ?.id || t.threads[0]?.id;
    if (id) {
      changeThread(id);
      const result = await api.getMessages(id);
      if (version === session.current && thread.current === id)
        setMessages(result.messages);
    }
  }, [changeThread]);
  useEffect(() => {
    (async () => {
      try {
        setBoot(await api.request("/bootstrap"));
        if (api.getSessionToken()) await refresh();
      } catch (e) {
        setError((e as Error).message);
        api.setSessionToken("");
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const unsub = api.subscribeToRealtime((p) => {
      clearTimeout(timer);
      timer = setTimeout(
        () => refresh().catch((e) => setError(e.message)),
        180,
      );
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [user?.id, refresh]);
  useEffect(() => {
    if (!threadId) return;
    let alive = true;
    api
      .getMessages(threadId)
      .then((r) => {
        if (alive) setMessages(r.messages);
      })
      .catch((e) => setError(e.message));
    return () => {
      alive = false;
    };
  }, [threadId]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);
  const run = async (operation: () => Promise<any>) => {
    setBusy(true);
    setError("");
    try {
      const result = await operation();
      await refresh();
      return result;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  };
  const activate = async (data: any) => {
    session.current++;
    setMessages([]);
    changeThread("");
    api.setSessionToken(data.sessionToken);
    setUser(data.user);
    await refresh();
    setScreen("today");
    setError("");
  };
  const enterDemo = async (id: string) => {
    setLoading(true);
    try {
      await activate(
        await api.request("/demo/session", "POST", { userId: id }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const createUser = async (data: any) => {
    await activate(await api.createUser(data));
  };
  const send = async (content: string) => {
    let id = thread.current;
    if (!id) {
      const r = await api.request("/threads", "POST", {});
      id = r.thread.id;
      changeThread(id);
    }
    setScreen("ai");
    await run(() => api.sendMessage(id, content));
  };
  const discuss = async (momentId: string) => {
    try {
      const existing = threads.find((t) => t.relatedMomentId === momentId);
      const target =
        existing ||
        (await api.request("/threads", "POST", { momentId })).thread;
      changeThread(target.id);
      setScreen("ai");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const demo = async (scenario: string) => {
    await run(async () => {
      const r = await api.runDemoScenario(scenario);
      setNotice(r.message);
    });
  };
  if (loading && !user)
    return (
      <div className="loading-screen">
        <span className="signature-orb thinking" />
        <p>Making room for your day.</p>
      </div>
    );
  if (!user)
    return (
      <Welcome
        boot={boot}
        loading={loading}
        onDemo={enterDemo}
        onCreate={createUser}
        error={error}
      />
    );
  const common = { busy, onAction: run };
  return (
    <AppShell
      user={user}
      screen={screen}
      onNavigate={setScreen}
      onInbox={() => setInbox(true)}
      unread={
        notifications.filter((n) => n.deliveryStatus === "DELIVERED").length
      }
    >
      {error && (
        <div role="alert" className="alert error">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="alert">
          {notice}
          <button aria-label="Dismiss message" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      <div className="screen-enter" key={screen}>
        {screen === "today" && (
          <Today
            user={user}
            moments={moments}
            events={events}
            insights={insights}
            outcomes={outcomes}
            proposals={proposals}
            onSend={send}
            onNavigate={setScreen}
            ai={boot?.ai}
            {...common}
          />
        )}
        {screen === "ai" && (
          <Ask
            user={user}
            threads={threads}
            activeId={threadId}
            onSelect={changeThread}
            messages={messages}
            proposals={proposals}
            onSend={send}
            onNew={async () => {
              const r = await api.request("/threads", "POST", {});
              changeThread(r.thread.id);
              await refresh();
            }}
            {...common}
          />
        )}
        {screen === "moments" && (
          <Moments
            moments={moments}
            proposals={proposals}
            user={user}
            onDiscuss={discuss}
            onSend={send}
            {...common}
          />
        )}
        {screen === "explore" && (
          <Explore
            events={events}
            attendance={attendance}
            moments={moments}
            user={user}
            {...common}
          />
        )}
        {screen === "you" && (
          <Profile
            key={user.id}
            user={user}
            boot={boot}
            onDemo={enterDemo}
            onCreate={createUser}
            onSave={(updates) => run(() => api.updateProfile(updates))}
            onDemoScenario={demo}
            onLeave={() => {
              session.current++;
              api.setSessionToken("");
              setUser(null);
              changeThread("");
            }}
            {...common}
          />
        )}
      </div>
      {inbox && (
        <Inbox
          notifications={notifications}
          onClose={() => setInbox(false)}
          onOpen={(id) => {
            if (id) changeThread(id);
            setScreen("ai");
            setInbox(false);
          }}
          {...common}
        />
      )}
    </AppShell>
  );
}
