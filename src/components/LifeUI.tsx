import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Moon,
  Search,
} from "lucide-react";
import { api } from "../services/apiClient.ts";
import {
  Attendance,
  CityEvent,
  ConnectionProposal,
  ConversationMessage,
  ConversationThread,
  LifeInsight,
  LifeMoment,
  NotificationItem,
  Outcome,
  UserProfile,
} from "../types/index.ts";
import type { Screen } from "../App.tsx";
import marina from "../assets/images/dubai_marina_event_1791878647556.jpg";
import difc from "../assets/images/difc_gate_architecture_1791878648834.jpg";
import food from "../assets/images/mediterranean_dining_1791878647881.jpg";
import artisan from "../assets/images/alserkal_artisan_bread_1791878648639.jpg";
type Actions = {
  busy: boolean;
  onAction: (fn: () => Promise<any>) => Promise<any>;
};
const ignore = () => {};
const pretty = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (s) => s.toUpperCase());
export function when(value: string, options: Intl.DateTimeFormatOptions = {}) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("en-GB", {
        timeZone: "Asia/Dubai",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        ...options,
      });
}
const localDate = (iso: string) => {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return new Date(d.getTime() + 4 * 3600000).toISOString().slice(0, 16);
};
const fromLocal = (value: string) =>
  new Date(`${value}:00+04:00`).toISOString();
function Avatar({ user }: { user: UserProfile }) {
  return (
    <span className="avatar">
      {user.avatar ? <img src={user.avatar} alt="" /> : user.name.slice(0, 1)}
    </span>
  );
}
export function AppShell({
  user,
  screen,
  onNavigate,
  onInbox,
  unread,
  children,
}: {
  user: UserProfile;
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onInbox: () => void;
  unread: number;
  children: React.ReactNode;
}) {
  const items = [
    { id: "today", label: "Today", icon: Home },
    { id: "explore", label: "Explore", icon: Compass },
    { id: "moments", label: "Moments", icon: CalendarDays },
    { id: "ai", label: "Ask", icon: MessageCircle },
    { id: "you", label: "You", icon: SlidersHorizontal },
  ] as const;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <button className="brand" onClick={() => onNavigate("today")}>
          <span className="brand-mark">
            l<span>·</span>
          </span>
          <span>
            LIFEOS<small>Life, a little lighter.</small>
          </span>
        </button>
        <nav aria-label="Main navigation">
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={screen === id ? "page" : undefined}
              className={`nav-item ${screen === id ? "active" : ""}`}
              onClick={() => onNavigate(id)}
            >
              <Icon size={20} strokeWidth={1.65} />
              <span>{label}</span>
              {screen === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="quiet-note">
            <span className="signature-orb small" />
            <p>
              Here when you need.
              <br />
              <span>Quiet when you don't.</span>
            </p>
          </div>
          <button className="user-link" onClick={() => onNavigate("you")}>
            <Avatar user={user} />
            <span>
              {user.name}
              <small>{user.primaryArea}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <span className="mobile-brand">LIFEOS</span>
          <span className="location">
            <MapPin size={14} />
            {user.primaryArea}
            <span className="location-divider">/</span>
            <span className="muted">Dubai</span>
          </span>
          <div className="topbar-actions">
            {user.id.startsWith("user_") && (
              <span className="sample-tag">Sample participant</span>
            )}
            <button
              className="icon-button"
              aria-label="Open inbox"
              onClick={onInbox}
            >
              <Bell size={19} strokeWidth={1.65} />
              {unread > 0 && <i />}
            </button>
            <button
              className="icon-button profile-button"
              aria-label="Your profile"
              onClick={() => onNavigate("you")}
            >
              <Avatar user={user} />
            </button>
          </div>
        </header>
        <main
          id="main"
          className={`content ${screen === "ai" ? "chat-content" : ""}`}
        >
          {children}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-current={screen === id ? "page" : undefined}
            className={screen === id ? "active" : ""}
            onClick={() => onNavigate(id)}
          >
            <Icon size={21} strokeWidth={1.7} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
export function Composer({
  onSend,
  busy,
  placeholder = "What would make today better?",
  compact = false,
}: {
  onSend: (text: string) => Promise<any>;
  busy: boolean;
  placeholder?: string;
  compact?: boolean;
}) {
  const [text, setText] = useState("");
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    try {
      await onSend(text.trim());
      setText("");
    } catch {}
  };
  return (
    <form className={`composer ${compact ? "compact" : ""}`} onSubmit={submit}>
      <textarea
        aria-label="Message LIFEOS"
        dir="auto"
        maxLength={4000}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="composer-bottom">
        <span>
          <span className={`signature-orb small ${busy ? "thinking" : ""}`} />
          {busy
            ? "Thinking about your day…"
            : "Around your life. At your pace."}
        </span>
        <button
          className="send-button"
          aria-label="Send message"
          disabled={busy || !text.trim()}
        >
          <ArrowUp size={21} />
        </button>
      </div>
    </form>
  );
}
function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-ring" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
export function Today({
  user,
  moments,
  events,
  insights,
  outcomes,
  proposals,
  onSend,
  onNavigate,
  ai,
  busy,
  onAction,
}: Actions & {
  user: UserProfile;
  moments: LifeMoment[];
  events: CityEvent[];
  insights: LifeInsight[];
  outcomes: Outcome[];
  proposals: ConnectionProposal[];
  onSend: (s: string) => Promise<any>;
  onNavigate: (s: Screen) => void;
  ai: any;
}) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const upcoming = moments
    .filter(
      (m) =>
        !["CANCELLED", "FULFILLED"].includes(m.status) &&
        (!Number.isFinite(Date.parse(m.endTime)) ||
          Date.parse(m.endTime) > Date.now()),
    )
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  const relevant = events.find((e) =>
    [user.primaryArea, ...user.frequentedAreas].includes(e.area),
  );
  const activeInsights = insights.filter((i) => i.status === "NEW").slice(0, 2);
  const pending = proposals.filter(
    (p) =>
      (p.currentState === "INVITATION_PENDING" &&
        p.recipientUserId === user.id) ||
      (p.currentState === "MUTUAL_CONSENT_PENDING" &&
        p.initiatingUserId === user.id),
  ).length;
  return (
    <>
      <div className="today-grid">
        <div className="today-primary">
          <div className="greeting">
            <p className="date-label">
              {new Date().toLocaleDateString("en-GB", {
                timeZone: "Asia/Dubai",
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1>
              {greeting}, {user.name.split(" ")[0]}
              <span>.</span>
            </h1>
            <p>What would make today better?</p>
          </div>
          <div className="composer-halo">
            <Composer onSend={onSend} busy={busy} />
          </div>
          <div className="suggestions">
            {[
              "Find something good nearby",
              "Protect my evening",
              "Make a plan",
            ].map((s) => (
              <button
                key={s}
                onClick={() =>
                  onSend(
                    s === "Protect my evening"
                      ? "I want to rest this evening from 20:00 until 23:00. Please protect that time."
                      : s,
                  ).catch(ignore)
                }
                disabled={busy}
              >
                {s}
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
          {!ai?.configured && (
            <div className="setup-note">
              <span className="status-dot" />
              <p>
                Your personal intelligence is ready for a key.
                <br />
                <span>
                  Add GEMINI_API_KEY to .env, then restart. Sample flows work
                  without it.
                </span>
              </p>
              <button onClick={() => onNavigate("you")}>
                Setup
                <ChevronRight size={15} />
              </button>
            </div>
          )}
          <Section
            title="For your day"
            action={<span className="muted small-text">Only what matters</span>}
          >
            {pending > 0 && (
              <button
                className="insight-row actionable"
                onClick={() => onNavigate("moments")}
              >
                <span className="insight-symbol">
                  <MessageCircle size={20} />
                </span>
                <span>
                  <strong>An introduction to consider</strong>
                  <p>
                    {pending === 1
                      ? "Someone has an overlapping intention."
                      : "You have a few invitations to review."}{" "}
                    You decide whether to continue.
                  </p>
                </span>
                <ArrowUpRight size={18} />
              </button>
            )}
            {activeInsights.map((i) => (
              <div className="insight-row" key={i.id}>
                {i.id.startsWith("demo_food_") ? (
                  <img
                    className="insight-photo"
                    src={food}
                    alt="Illustrative meal"
                  />
                ) : (
                  <span className="insight-symbol">
                    <Compass size={20} />
                  </span>
                )}
                <div>
                  <strong>{i.title}</strong>
                  <p>{i.summary}</p>
                  <details className="evidence">
                    <summary>Why this is here</summary>
                    <p>{i.evidence}</p>
                  </details>
                  <div className="inline-actions">
                    {i.isActionable && (
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() =>
                          onAction(() =>
                            i.id.startsWith("demo_food_")
                              ? api.request(
                                  `/insights/${i.id}/execute`,
                                  "POST",
                                  {},
                                )
                              : api.updateInsightStatus(i.id, "ACCEPTED"),
                          ).catch(ignore)
                        }
                      >
                        {i.id.startsWith("demo_food_")
                          ? "Save sample pickup"
                          : "Useful to me"}
                        <ArrowUpRight size={14} />
                      </button>
                    )}
                    <button
                      className="text-button muted"
                      disabled={busy}
                      onClick={() =>
                        onAction(() =>
                          api.updateInsightStatus(i.id, "DISMISSED"),
                        ).catch(ignore)
                      }
                    >
                      Not now
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!activeInsights.length && !pending && (
              <div className="insight-row">
                <span className="insight-symbol lavender">
                  <Moon size={20} />
                </span>
                <div>
                  <strong>A little room to breathe</strong>
                  <p>
                    Your protected time is{" "}
                    {user.scheduleRoutine.quietHoursStart} to{" "}
                    {user.scheduleRoutine.quietHoursEnd}. Suggestions can wait.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => onNavigate("you")}
                  >
                    Adjust your rhythm
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </Section>
          {relevant && (
            <Section
              title="A little closer to you"
              action={
                <button
                  className="text-button"
                  onClick={() => onNavigate("explore")}
                >
                  Explore
                  <ArrowUpRight size={14} />
                </button>
              }
            >
              <button
                className="experience-preview"
                onClick={() => onNavigate("explore")}
              >
                <img
                  src={
                    relevant.area === "DIFC"
                      ? difc
                      : relevant.area === "Alserkal Avenue"
                        ? artisan
                        : marina
                  }
                  alt="Illustrative district photograph"
                  loading="lazy"
                />
                <div>
                  <span className="sample-tag">
                    {relevant.isDemo
                      ? "Sample experience"
                      : "Participant listing"}
                  </span>
                  <h3>{relevant.title}</h3>
                  <p>
                    {relevant.area} · {relevant.startTime}
                  </p>
                  <span className="text-button">
                    Take a look
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </button>
            </Section>
          )}
          {outcomes.some((o) => o.helpful === undefined) && (
            <Section title="Looking back">
              {outcomes
                .filter((o) => o.helpful === undefined)
                .slice(0, 2)
                .map((o) => (
                  <div className="outcome-row" key={o.id}>
                    <div>
                      <strong>{o.summary}</strong>
                      <p>Did this make your day better?</p>
                    </div>
                    <div className="inline-actions">
                      <button
                        disabled={busy}
                        onClick={() =>
                          onAction(() =>
                            api.request(`/outcomes/${o.id}/feedback`, "POST", {
                              helpful: true,
                            }),
                          ).catch(ignore)
                        }
                      >
                        Yes
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          onAction(() =>
                            api.request(`/outcomes/${o.id}/feedback`, "POST", {
                              helpful: false,
                            }),
                          ).catch(ignore)
                        }
                      >
                        Not really
                      </button>
                    </div>
                  </div>
                ))}
            </Section>
          )}
        </div>
        <aside className="day-rail">
          <div className="day-card">
            <div className="section-heading">
              <h2>Your rhythm</h2>
              <CalendarDays size={17} />
            </div>
            <WeekStrip />
            <div className="rail-divider" />
            {upcoming.length ? (
              upcoming.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  className="rail-moment"
                  onClick={() => onNavigate("moments")}
                >
                  <span className="timeline-dot" />
                  <span>
                    <small>{when(m.startTime)}</small>
                    <strong>{m.description}</strong>
                    <span>{m.approximateArea}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="rail-empty">
                <span className="empty-ring" />
                <p>A little space in your day.</p>
                <small>Tell me when something is on your mind.</small>
              </div>
            )}
            <button
              className="text-button rail-link"
              onClick={() => onNavigate("moments")}
            >
              Your moments
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="privacy-note">
            <ShieldCheck size={17} />
            <p>
              Your pace. Your boundaries.
              <br />
              <span>You choose what to share.</span>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
function WeekStrip() {
  const now = new Date();
  const dubai = new Date(now.getTime() + 4 * 3600000);
  const day = dubai.getUTCDay();
  return (
    <div className="week-strip">
      {Array.from({ length: 7 }, (_, i) => {
        const d = new Date(dubai);
        d.setUTCDate(dubai.getUTCDate() - ((day + 6) % 7) + i);
        const today = d.getUTCDate() === dubai.getUTCDate();
        return (
          <span className={today ? "current" : ""} key={i}>
            <small>{["M", "T", "W", "T", "F", "S", "S"][i]}</small>
            <b>{d.getUTCDate()}</b>
            {today && <i />}
          </span>
        );
      })}
    </div>
  );
}
function Proposal({
  proposal: p,
  user,
  busy,
  onAction,
}: Actions & { proposal: ConnectionProposal; user: UserProfile }) {
  const [adjust, setAdjust] = useState(false),
    [time, setTime] = useState(localDate(p.proposedTime || "")),
    [place, setPlace] = useState(p.proposedPlace || "");
  const recipient = p.recipientUserId === user.id,
    canAccept = recipient
      ? p.currentState === "INVITATION_PENDING"
      : p.currentState === "MUTUAL_CONSENT_PENDING";
  const closed = [
    "CANCELLED",
    "DECLINED",
    "EXPIRED",
    "COMPLETED",
    "FAILED",
  ].includes(p.currentState);
  const respond = (action: string, options?: any) =>
    onAction(() => api.respondToProposal(p.id, action, options)).catch(ignore);
  return (
    <div className="proposal">
      <div className="proposal-top">
        <span className="insight-symbol">
          <MessageCircle size={18} />
        </span>
        <div>
          <strong>
            {p.currentState === "CONFIRMED"
              ? "An agreed introduction"
              : "A possible introduction"}
          </strong>
          <small>{pretty(p.currentState)}</small>
        </div>
      </div>
      <p>{p.reason}</p>
      <div className="proposal-detail">
        <span>
          <CalendarDays size={15} />
          {when(p.proposedTime || "Time to agree")}
        </span>
        <span>
          <MapPin size={15} />
          {p.proposedPlace}
        </span>
      </div>
      {!closed && (
        <>
          <p className="small-text muted">
            Accepting agrees to this time and place, and to sharing your name,
            roles and bio after both people consent. Contact details stay
            private.
          </p>
          <div className="inline-actions">
            {canAccept && (
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  respond(
                    recipient ? "RECIPIENT_INTERESTED" : "INITIATOR_APPROVED",
                  )
                }
              >
                {recipient ? "Interested" : "Agree to introduction"}
              </button>
            )}
            {p.currentState === "CONFIRMED" && (
              <button
                className="primary"
                disabled={busy}
                onClick={() => respond("COMPLETE")}
              >
                We met
              </button>
            )}
            <button disabled={busy} onClick={() => setAdjust(!adjust)}>
              Suggest a change
            </button>
            <button disabled={busy} onClick={() => respond("DECLINE")}>
              {p.currentState === "CONFIRMED"
                ? "Cancel introduction"
                : "Not this time"}
            </button>
          </div>
        </>
      )}
      {adjust && !closed && (
        <form
          className="adjust-form"
          onSubmit={(e) => {
            e.preventDefault();
            respond("ADJUST", { newTime: fromLocal(time), newPlace: place });
            setAdjust(false);
          }}
        >
          <label>
            Dubai time
            <input
              type="datetime-local"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label>
            Public meeting point
            <input
              required
              maxLength={200}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </label>
          <button className="primary" disabled={busy}>
            Ask both people to agree again
          </button>
        </form>
      )}
    </div>
  );
}
export function Ask({
  user,
  threads,
  activeId,
  onSelect,
  messages,
  proposals,
  onSend,
  onNew,
  busy,
  onAction,
}: Actions & {
  user: UserProfile;
  threads: ConversationThread[];
  activeId: string;
  onSelect: (id: string) => void;
  messages: ConversationMessage[];
  proposals: ConnectionProposal[];
  onSend: (s: string) => Promise<any>;
  onNew: () => Promise<any>;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end", behavior: "instant" });
  }, [messages.length, busy]);
  return (
    <div className="ask-layout">
      <PageTitle
        title="A little help, whenever."
        subtitle="Your plans, your questions, your everyday life."
        action={
          <button
            className="icon-button"
            aria-label="New conversation"
            onClick={() => onNew().catch(ignore)}
          >
            <Plus size={20} />
          </button>
        }
      />
      <div className="thread-controls">
        <label>
          Conversation
          <select value={activeId} onChange={(e) => onSelect(e.target.value)}>
            {threads.map((t) => (
              <option value={t.id} key={t.id}>
                {t.title}
                {t.unreadCount ? " · new" : ""}
              </option>
            ))}
          </select>
        </label>
        <span>
          <ShieldCheck size={14} />
          Private to you
        </span>
      </div>
      <div className="conversation" aria-live="polite">
        {!messages.length && (
          <div className="chat-welcome">
            <span className="signature-orb" />
            <h2>What's on your mind, {user.name.split(" ")[0]}?</h2>
            <p>
              A plan for tomorrow. A quieter evening.
              <br />
              Something good nearby. Start anywhere.
            </p>
          </div>
        )}
        {messages.map((m) => {
          const p =
            m.proposalData &&
            proposals.find((p) => p.id === m.proposalData!.proposalId);
          return (
            <div
              key={m.id}
              className={`conversation-message ${m.senderRole === "USER" ? "from-user" : "from-ai"}`}
            >
              <span className="message-label">
                {m.senderRole === "USER" ? "You" : "LIFEOS"}
              </span>
              <div dir="auto" className="message-text">
                {m.content}
              </div>
              {p && (
                <Proposal
                  proposal={p}
                  user={user}
                  busy={busy}
                  onAction={onAction}
                />
              )}
            </div>
          );
        })}
        {busy && (
          <div className="thinking-row">
            <span className="signature-orb small thinking" />
            <span>Thinking about what works for you…</span>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div className="chat-composer">
        <Composer
          compact
          onSend={onSend}
          busy={busy}
          placeholder="Tell me what's on your mind…"
        />
        <small>Enter to send · Shift + Enter for a new line</small>
      </div>
    </div>
  );
}
export function Moments({
  moments,
  proposals,
  user,
  onDiscuss,
  onSend,
  busy,
  onAction,
}: Actions & {
  moments: LifeMoment[];
  proposals: ConnectionProposal[];
  user: UserProfile;
  onDiscuss: (id: string) => Promise<any>;
  onSend: (s: string) => Promise<any>;
}) {
  const [selected, setSelected] = useState<LifeMoment | null>(null),
    [showAdd, setShowAdd] = useState(false),
    [filter, setFilter] = useState("Upcoming");
  const selectedLive =
    (selected && moments.find((m) => m.id === selected.id)) || null;
  const pending = proposals.filter(
    (p) =>
      !["COMPLETED", "CANCELLED", "DECLINED", "EXPIRED", "FAILED"].includes(
        p.currentState,
      ),
  );
  const visible = moments
    .filter(
      (m) =>
        filter === "All" ||
        (!["FULFILLED", "CANCELLED"].includes(m.status) &&
          (!Number.isFinite(Date.parse(m.endTime)) ||
            Date.parse(m.endTime) > Date.now())),
    )
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  const group = (m: LifeMoment) => {
    if (!Number.isFinite(Date.parse(m.startTime))) return "Upcoming";
    const date = new Date(Date.parse(m.startTime) + 4 * 3600000)
        .toISOString()
        .slice(0, 10),
      today = new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 10),
      tomorrow = new Date(Date.now() + 28 * 3600000).toISOString().slice(0, 10);
    return date === today
      ? "Today"
      : date === tomorrow
        ? "Tomorrow"
        : when(m.startTime, { hour: undefined, minute: undefined });
  };
  return (
    <>
      <PageTitle
        title="Your moments"
        subtitle="The things you're doing. The things you want from them."
        action={
          <button className="primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} />A new moment
          </button>
        }
      />
      {showAdd && (
        <div className="section">
          <Composer
            onSend={async (s) => {
              await onSend(s);
              setShowAdd(false);
            }}
            busy={busy}
            placeholder="I'm going to the gym at 6 PM…"
          />
        </div>
      )}
      {pending.length > 0 && (
        <Section title="Worth a conversation">
          {pending.map((p) => (
            <Proposal
              key={p.id}
              proposal={p}
              user={user}
              busy={busy}
              onAction={onAction}
            />
          ))}
        </Section>
      )}
      <div className="segmented">
        {["Upcoming", "All"].map((f) => (
          <button
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
            key={f}
          >
            {f}
          </button>
        ))}
      </div>
      {!visible.length ? (
        <Empty title="Your time is yours.">
          Share a plan or intention when you're ready.
        </Empty>
      ) : (
        <div className="moment-timeline">
          {visible.map((m, i) => (
            <React.Fragment key={m.id}>
              {(i === 0 || group(visible[i - 1]) !== group(m)) && (
                <h2>{group(m)}</h2>
              )}
              <button className="moment-item" onClick={() => setSelected(m)}>
                <span
                  className={`moment-dot ${m.kind === "REST_TIME" ? "rest" : ""}`}
                />
                <div>
                  <span className="moment-category">{pretty(m.kind)}</span>
                  <h3>{m.description}</h3>
                  <p>
                    {when(m.startTime)} · {m.approximateArea}
                  </p>
                  {m.goals.length > 0 && <small>{m.goals.join(" · ")}</small>}
                </div>
                <span
                  className={`status-pill ${m.status === "FULFILLED" ? "done" : ""}`}
                >
                  {pretty(m.status)}
                </span>
                <ChevronRight size={16} />
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
      {selectedLive && (
        <Modal title="Your moment" onClose={() => setSelected(null)}>
          <MomentEditor
            moment={selectedLive}
            busy={busy}
            onAction={onAction}
            onDiscuss={() => {
              setSelected(null);
              onDiscuss(selectedLive.id);
            }}
            onClose={() => setSelected(null)}
          />
        </Modal>
      )}
    </>
  );
}
function MomentEditor({
  moment: m,
  busy,
  onAction,
  onDiscuss,
  onClose,
}: Actions & {
  moment: LifeMoment;
  onDiscuss: () => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(m.description),
    [goals, setGoals] = useState(m.goals.join(", ")),
    [start, setStart] = useState(localDate(m.startTime)),
    [end, setEnd] = useState(localDate(m.endTime)),
    [sharing, setSharing] = useState(m.sharingPermissions);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAction(() =>
        api.request(`/moments/${m.id}`, "PATCH", {
          description,
          goals: goals
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          startTime: fromLocal(start),
          endTime: fromLocal(end),
          sharingPermissions: sharing,
        }),
      );
      onClose();
    } catch {}
  };
  if (m.id.startsWith("meeting_"))
    return (
      <div className="form-stack">
        <h3>{m.description}</h3>
        <p className="muted">
          {when(m.startTime)} · {m.approximateArea}
        </p>
        <p className="muted">
          Change the time or place through the introduction card in Moments so
          both people can agree.
        </p>
        <div className="inline-actions">
          <button className="secondary" onClick={onDiscuss}>
            Talk about this
          </button>
          <button
            className="primary"
            disabled={busy || m.status === "FULFILLED"}
            onClick={() =>
              onAction(() =>
                api.request(`/moments/${m.id}`, "PATCH", {
                  status: "FULFILLED",
                }),
              )
                .then(onClose)
                .catch(ignore)
            }
          >
            We met
          </button>
          <button
            className="secondary"
            disabled={busy || m.status === "CANCELLED"}
            onClick={() =>
              onAction(() =>
                api.request(`/moments/${m.id}`, "PATCH", {
                  status: "CANCELLED",
                }),
              )
                .then(onClose)
                .catch(ignore)
            }
          >
            Cancel introduction
          </button>
        </div>
      </div>
    );
  return (
    <form className="form-stack" onSubmit={save}>
      <label>
        What you're doing
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
        />
      </label>
      <label>
        What you want from it
        <input
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="Separate goals with commas"
        />
      </label>
      <div className="form-grid">
        <label>
          Starts (Dubai time)
          <input
            type="datetime-local"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          Ends (Dubai time)
          <input
            type="datetime-local"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <label>
        Who can help
        <select
          value={sharing}
          disabled={m.kind === "REST_TIME"}
          onChange={(e) => setSharing(e.target.value as any)}
        >
          <option value="PRIVATE">Keep this private</option>
          <option value="AGENT_COORDINATED">Allow private coordination</option>
          <option value="COMMUNITY_VISIBLE">
            Available for city coordination
          </option>
        </select>
      </label>
      <div className="detail-list">
        <p>
          <strong>Preferences</strong>
          {m.preferences.join(", ") || "None stated"}
        </p>
        <p>
          <strong>Your boundaries</strong>
          {m.protectedConstraints.join(", ") ||
            "Your profile privacy settings apply"}
        </p>
      </div>
      <div className="inline-actions">
        <button className="primary" disabled={busy}>
          Save changes
        </button>
        <button type="button" onClick={onDiscuss}>
          Talk about this
        </button>
      </div>
      <div className="inline-actions">
        <button
          type="button"
          disabled={busy || m.status === "FULFILLED"}
          onClick={() =>
            onAction(() =>
              api.request(`/moments/${m.id}`, "PATCH", { status: "FULFILLED" }),
            )
              .then(onClose)
              .catch(ignore)
          }
        >
          Mark complete
        </button>
        <button
          type="button"
          disabled={busy || m.status === "CANCELLED"}
          onClick={() =>
            onAction(() =>
              api.request(`/moments/${m.id}`, "PATCH", { status: "CANCELLED" }),
            )
              .then(onClose)
              .catch(ignore)
          }
        >
          Cancel moment
        </button>
      </div>
    </form>
  );
}
const districts = [
  { name: "Dubai Marina", x: 25, y: 78, lat: 25.0805, lng: 55.1403 },
  { name: "Palm Jumeirah", x: 14, y: 47, lat: 25.1124, lng: 55.139 },
  { name: "Alserkal Avenue", x: 49, y: 64, lat: 25.1422, lng: 55.2255 },
  { name: "Business Bay", x: 66, y: 41, lat: 25.185, lng: 55.26 },
  { name: "Downtown Dubai", x: 78, y: 25, lat: 25.197, lng: 55.2744 },
  { name: "DIFC", x: 84, y: 10, lat: 25.214, lng: 55.28 },
];
export function Explore({
  events,
  attendance,
  busy,
  onAction,
}: Actions & {
  events: CityEvent[];
  attendance: Attendance[];
  moments: LifeMoment[];
  user: UserProfile;
}) {
  const [search, setSearch] = useState(""),
    [area, setArea] = useState("All areas"),
    [publish, setPublish] = useState(false),
    [realMap, setRealMap] = useState(false);
  const district = districts.find((d) => d.name === area) || districts[0];
  const filtered = events.filter(
    (e) =>
      (area === "All areas" || e.area === area) &&
      `${e.title} ${e.description} ${e.area}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Around your world"
        subtitle="A few places, plans and possibilities. At your pace."
        action={
          <button className="secondary" onClick={() => setPublish(true)}>
            <Plus size={16} />
            Host something
          </button>
        }
      />
      <div className="search-field">
        <Search size={18} />
        <input
          aria-label="Search city experiences"
          placeholder="A neighbourhood, an interest, a little inspiration…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="explore-grid">
        <div className="city-map">
          <div className="map-heading">
            <span>Dubai, a little closer</span>
            <button
              className="text-button"
              onClick={() => setRealMap(!realMap)}
            >
              {realMap ? "District view" : "Street map"}
              <ArrowUpRight size={13} />
            </button>
          </div>
          {realMap ? (
            <iframe
              title="OpenStreetMap of selected district"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${district.lng - 0.035}%2C${district.lat - 0.025}%2C${district.lng + 0.035}%2C${district.lat + 0.025}&layer=mapnik`}
              loading="lazy"
            />
          ) : (
            <div className="district-map">
              <svg
                viewBox="0 0 500 520"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="water" x2="1" y2="1">
                    <stop stopColor="#dcebf4" />
                    <stop offset="1" stopColor="#eff5fa" />
                  </linearGradient>
                </defs>
                <rect width="500" height="520" fill="#f6f5f1" />
                <path
                  d="M0 0 H330 Q180 120 180 200 T90 390 L0 520Z"
                  fill="url(#water)"
                />
                <path
                  d="M335 -10 Q210 120 210 205 T115 420 L90 530"
                  stroke="#fff"
                  strokeWidth="18"
                  fill="none"
                />
                <path
                  d="M360 -10 Q235 120 235 205 T140 420 L115 530"
                  stroke="#dfddd5"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M480 50 L200 520 M490 150 L280 520 M460 270 L320 520 M280 30 L500 230 M240 130 L500 370 M180 280 L390 520"
                  stroke="#fff"
                  strokeWidth="6"
                  fill="none"
                />
                <path d="M90 280L125 250L145 285L120 330Z" fill="#d4e0d6" />
                <path d="M390 75L440 95L405 150L370 130Z" fill="#e2eadf" />
                <text
                  x="40"
                  y="70"
                  fill="#91aabc"
                  fontSize="12"
                  letterSpacing="3"
                >
                  ARABIAN GULF
                </text>
              </svg>
              {districts.map((d) => (
                <button
                  key={d.name}
                  style={{ left: `${d.x}%`, top: `${d.y}%` }}
                  className={`map-pin ${area === d.name ? "selected" : ""}`}
                  onClick={() => setArea(d.name)}
                >
                  <span />
                  <small>{d.name}</small>
                </button>
              ))}
            </div>
          )}
          <div className="map-foot">
            <span>
              {realMap
                ? "© OpenStreetMap contributors"
                : "District illustration · not navigation"}
            </span>
            <button
              className="text-button"
              onClick={() => setArea("All areas")}
            >
              All areas
            </button>
          </div>
        </div>
        <div className="city-results">
          <label className="area-select">
            Looking around
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option>All areas</option>
              {districts.map((d) => (
                <option key={d.name}>{d.name}</option>
              ))}
            </select>
          </label>
          {filtered.length ? (
            filtered.map((e) => {
              const joined = attendance.some(
                (a) => a.eventId === e.id && a.attending,
              );
              return (
                <div className="experience-card" key={e.id}>
                  <div className="experience-image">
                    <img
                      loading="lazy"
                      src={
                        e.area === "DIFC"
                          ? difc
                          : e.area === "Alserkal Avenue"
                            ? artisan
                            : marina
                      }
                      alt="Illustrative district photograph"
                    />
                    <span className="photo-label">Illustrative image</span>
                  </div>
                  <div className="experience-info">
                    <span className="sample-tag">
                      {e.isDemo ? "Sample event" : "Participant published"}
                    </span>
                    <h3>{e.title}</h3>
                    <p>
                      {e.area} · {e.date} · {e.startTime}
                    </p>
                    <p>{e.description}</p>
                    <details>
                      <summary>Details and context</summary>
                      <p>
                        {e.venue}
                        <br />
                        {e.organizerName}
                        <br />
                        {e.confirmedAttendance} independently confirmed ·{" "}
                        {e.estimatedAttendance.toLocaleString()} organiser
                        estimate
                      </p>
                      {e.transportDemandEstimate && (
                        <p>{e.transportDemandEstimate.notes}</p>
                      )}
                      {e.requiredServices?.map((s) => (
                        <p key={s.serviceType}>
                          {s.serviceType}: {s.slots} slots ({pretty(s.status)})
                        </p>
                      ))}
                    </details>
                    <button
                      className={joined ? "secondary" : "primary"}
                      disabled={busy}
                      onClick={() =>
                        onAction(() => api.rsvpEvent(e.id, !joined)).catch(
                          ignore,
                        )
                      }
                    >
                      {joined ? (
                        <>
                          <Check size={16} />
                          In your plans · cancel
                        </>
                      ) : (
                        <>
                          I'd like to go
                          <ArrowUpRight size={16} />
                        </>
                      )}
                    </button>
                    <small>
                      {joined
                        ? "Tell LIFEOS what you want from the experience in Ask."
                        : "Adds a personal plan. It does not book a ticket."}
                    </small>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty title="A little quieter here.">
              Try another area or publish your own gathering.
            </Empty>
          )}
        </div>
      </div>
      {publish && (
        <Modal title="Bring people together" onClose={() => setPublish(false)}>
          <EventForm
            busy={busy}
            onAction={onAction}
            onClose={() => setPublish(false)}
          />
        </Modal>
      )}
    </>
  );
}
function EventForm({
  busy,
  onAction,
  onClose,
}: Actions & { onClose: () => void }) {
  const [values, setValues] = useState({
    title: "",
    area: "Dubai Marina",
    venue: "",
    date: "",
    startTime: "19:00",
    endTime: "21:00",
    description: "",
    category: "Community",
    estimatedAttendance: 0,
  });
  const change = (key: string, value: any) =>
    setValues({ ...values, [key]: value });
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        onAction(() => api.request("/events", "POST", values))
          .then(onClose)
          .catch(ignore);
      }}
    >
      <p className="muted">
        Publish your own gathering. Interested residents can decide whether to
        attend.
      </p>
      <label>
        Title
        <input
          required
          maxLength={200}
          value={values.title}
          onChange={(e) => change("title", e.target.value)}
        />
      </label>
      <div className="form-grid">
        <label>
          District
          <select
            value={values.area}
            onChange={(e) => change("area", e.target.value)}
          >
            {districts.map((d) => (
              <option key={d.name}>{d.name}</option>
            ))}
          </select>
        </label>
        <label>
          Public venue
          <input
            required
            value={values.venue}
            onChange={(e) => change("venue", e.target.value)}
          />
        </label>
      </div>
      <label>
        Date
        <input
          type="date"
          required
          value={values.date}
          onChange={(e) => change("date", e.target.value)}
        />
      </label>
      <div className="form-grid">
        <label>
          Start (Dubai)
          <input
            type="time"
            required
            value={values.startTime}
            onChange={(e) => change("startTime", e.target.value)}
          />
        </label>
        <label>
          End (Dubai)
          <input
            type="time"
            required
            value={values.endTime}
            onChange={(e) => change("endTime", e.target.value)}
          />
        </label>
      </div>
      <label>
        What is it about?
        <textarea
          value={values.description}
          onChange={(e) => change("description", e.target.value)}
        />
      </label>
      <div className="form-grid">
        <label>
          Category
          <input
            value={values.category}
            onChange={(e) => change("category", e.target.value)}
          />
        </label>
        <label>
          Estimated attendance
          <input
            type="number"
            min="0"
            max="100000"
            value={values.estimatedAttendance}
            onChange={(e) =>
              change("estimatedAttendance", Number(e.target.value))
            }
          />
        </label>
      </div>
      <button className="primary" disabled={busy}>
        Publish gathering
      </button>
    </form>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Tab") {
          const focus = ref.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
          );
          if (!focus?.length) return;
          const first = focus[0],
            last = focus[focus.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            aria-label="Close dialog"
            className="icon-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Inbox({
  notifications,
  onClose,
  onOpen,
  busy,
  onAction,
}: Actions & {
  notifications: NotificationItem[];
  onClose: () => void;
  onOpen: (id?: string) => void;
}) {
  const visible = notifications.filter((n) => n.deliveryStatus !== "DISMISSED");
  const groups = visible.reduce<Record<string, NotificationItem[]>>(
    (groups, n) => {
      const key = n.relatedThreadId || n.category;
      (groups[key] ||= []).push(n);
      return groups;
    },
    {},
  );
  return (
    <Modal title="A few things worth knowing" onClose={onClose}>
      <p className="muted">
        Useful updates. No need to catch up on everything.
      </p>
      {!visible.length ? (
        <Empty title="You're all caught up.">Enjoy the space.</Empty>
      ) : (
        Object.entries(groups).map(([key, items]) => (
          <div className="inbox-group" key={key}>
            <h3>
              {items[0].relatedThreadId
                ? "Your conversation"
                : pretty(items[0].category)}
            </h3>
            {items.map((n) => (
              <div className="inbox-item" key={n.id}>
                <small>
                  {n.deliveryStatus === "PENDING"
                    ? "Waiting for your quiet time to end"
                    : n.deliveryStatus === "SNOOZED"
                      ? "Snoozed"
                      : when(n.scheduledAt)}
                </small>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <div className="inline-actions">
                  <button onClick={() => onOpen(n.relatedThreadId)}>
                    Open conversation
                    <ArrowUpRight size={14} />
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      onAction(() =>
                        api.feedbackNotification(n.id, "SNOOZE"),
                      ).catch(ignore)
                    }
                  >
                    Later
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      onAction(() =>
                        api.feedbackNotification(n.id, "DISMISS"),
                      ).catch(ignore)
                    }
                  >
                    Dismiss
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      onAction(() =>
                        api.feedbackNotification(n.id, "NOT_INTERESTED"),
                      ).catch(ignore)
                    }
                  >
                    Not interested
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      onAction(() =>
                        api.feedbackNotification(n.id, "STOP_TOPIC"),
                      ).catch(ignore)
                    }
                  >
                    Stop this topic
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </Modal>
  );
}
export function Welcome({
  boot,
  onDemo,
  onCreate,
  error,
  loading,
}: {
  boot: any;
  onDemo: (id: string) => Promise<any>;
  onCreate: (data: any) => Promise<any>;
  error: string;
  loading: boolean;
}) {
  const [create, setCreate] = useState(false);
  return (
    <div className="welcome">
      <div className="welcome-brand">
        LIFEOS<span>Life, a little lighter.</span>
      </div>
      <div className="welcome-copy">
        <span className="signature-orb" />
        <p className="date-label">Your life, connected.</p>
        <h1>
          A little more ease.
          <br />A little more possibility.
        </h1>
        <p>
          A personal intelligence that works around your day.
          <br />
          Your pace, your plans, your Dubai.
        </p>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button
          className="primary"
          disabled={loading}
          onClick={() => setCreate(true)}
        >
          Make room for my day
          <ArrowUpRight size={17} />
        </button>
        {boot?.demoEnabled && (
          <div className="welcome-demos">
            <p>Or explore with a sample participant</p>
            {boot.demoUsers.map((u: any) => (
              <button
                disabled={loading}
                key={u.id}
                onClick={() => onDemo(u.id)}
              >
                <span>{u.name.split(" ")[0]}</span>
                <small>{u.professions[0]}</small>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="welcome-foot">
        Private conversations. Thoughtful connections. Time to simply be.
      </div>
      {create && (
        <Modal title="A little about you" onClose={() => setCreate(false)}>
          <ParticipantForm onCreate={onCreate} />
        </Modal>
      )}
    </div>
  );
}
function ParticipantForm({
  onCreate,
}: {
  onCreate: (data: any) => Promise<any>;
}) {
  const [name, setName] = useState(""),
    [profession, setProfession] = useState(""),
    [area, setArea] = useState("Dubai Marina"),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await onCreate({
            name,
            profession: profession || "Resident",
            primaryArea: area,
          });
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <p className="muted">
        Start with the basics. Introductions and city suggestions are off until
        you choose them.
      </p>
      <label>
        Your name
        <input
          required
          autoComplete="name"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        One of your roles
        <input
          maxLength={100}
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          placeholder="Designer, parent, driver, founder…"
        />
      </label>
      <label>
        Your usual district
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          {districts.map((d) => (
            <option key={d.name}>{d.name}</option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <button className="primary" disabled={saving}>
        {saving ? "Creating your space…" : "Start my day"}
      </button>
    </form>
  );
}
export function Profile({
  user,
  boot,
  onSave,
  onDemo,
  onCreate,
  onDemoScenario,
  onLeave,
  busy,
  onAction,
}: Actions & {
  user: UserProfile;
  boot: any;
  onSave: (u: Partial<UserProfile>) => Promise<any>;
  onDemo: (id: string) => Promise<any>;
  onCreate: (data: any) => Promise<any>;
  onDemoScenario: (s: string) => Promise<any>;
  onLeave: () => void;
}) {
  const [draft, setDraft] = useState(user),
    [saved, setSaved] = useState(false),
    [create, setCreate] = useState(false),
    [market, setMarket] = useState(false),
    [copied, setCopied] = useState(false),
    [notificationState, setNotificationState] = useState(
      "Notification" in window ? Notification.permission : "unavailable",
    );
  const update = (key: string, value: any) =>
    setDraft({ ...draft, [key]: value });
  const toggle = (key: string, value: boolean) =>
    setDraft({
      ...draft,
      consentSettings: { ...draft.consentSettings, [key]: value },
    });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
  };
  const accessLink = `${window.location.origin}${window.location.pathname}#access=${api.getSessionToken()}`;
  return (
    <>
      <PageTitle
        title="A life that's yours"
        subtitle="A few details help the city fit around you."
        action={
          <button className="secondary" onClick={() => setMarket(!market)}>
            {market ? "Back to you" : "Paper trading"}
            <ArrowUpRight size={16} />
          </button>
        }
      />
      {market ? (
        <PaperMarket busy={busy} onAction={onAction} />
      ) : (
        <>
          <div className="profile-heading">
            <Avatar user={user} />
            <div>
              <h2>{user.name}</h2>
              <p>{user.professions.join(" · ")}</p>
            </div>
            <span className="sample-tag">
              {user.id.startsWith("user_")
                ? "Sample participant"
                : "Private participant"}
            </span>
          </div>
          <form className="profile-form form-stack" onSubmit={save}>
            <details className="settings-section" open>
              <summary>
                About you
                <span>Roles, interests and the things you care about</span>
              </summary>
              <div className="settings-body">
                <div className="form-grid">
                  <label>
                    Name
                    <input
                      required
                      value={draft.name}
                      maxLength={100}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </label>
                  <label>
                    Usual district
                    <select
                      value={draft.primaryArea}
                      onChange={(e) => update("primaryArea", e.target.value)}
                    >
                      {districts.map((d) => (
                        <option key={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  A little about you
                  <textarea
                    maxLength={500}
                    value={draft.bio}
                    onChange={(e) => update("bio", e.target.value)}
                  />
                </label>
                {(
                  [
                    "professions",
                    "skills",
                    "interests",
                    "goals",
                    "frequentedAreas",
                  ] as const
                ).map((key) => (
                  <TokenEditor
                    key={key}
                    label={
                      {
                        professions: "Your roles",
                        skills: "Your skills",
                        interests: "Your interests",
                        goals: "Personal goals",
                        frequentedAreas: "Other places in your life",
                      }[key]
                    }
                    values={draft[key] || []}
                    onChange={(v) => update(key, v)}
                  />
                ))}
              </div>
            </details>
            <details className="settings-section">
              <summary>
                Your rhythm<span>Working days and protected time</span>
              </summary>
              <div className="settings-body">
                <div className="weekday-picker">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <button
                      type="button"
                      key={day}
                      aria-pressed={draft.scheduleRoutine.workDays.includes(
                        day,
                      )}
                      className={
                        draft.scheduleRoutine.workDays.includes(day)
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        update("scheduleRoutine", {
                          ...draft.scheduleRoutine,
                          workDays: draft.scheduleRoutine.workDays.includes(day)
                            ? draft.scheduleRoutine.workDays.filter(
                                (d) => d !== day,
                              )
                            : [...draft.scheduleRoutine.workDays, day],
                        })
                      }
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <label>
                  Typical work window
                  <input
                    value={draft.scheduleRoutine.workHours}
                    placeholder="09:00 - 18:00"
                    onChange={(e) =>
                      update("scheduleRoutine", {
                        ...draft.scheduleRoutine,
                        workHours: e.target.value,
                      })
                    }
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Quiet time starts
                    <input
                      type="time"
                      value={draft.scheduleRoutine.quietHoursStart}
                      onChange={(e) =>
                        update("scheduleRoutine", {
                          ...draft.scheduleRoutine,
                          quietHoursStart: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Quiet time ends
                    <input
                      type="time"
                      value={draft.scheduleRoutine.quietHoursEnd}
                      onChange={(e) =>
                        update("scheduleRoutine", {
                          ...draft.scheduleRoutine,
                          quietHoursEnd: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <Toggle
                  label="Pause interruptions for now"
                  checked={draft.notificationBudget.quietHoursActive}
                  onChange={(v) =>
                    update("notificationBudget", {
                      ...draft.notificationBudget,
                      quietHoursActive: v,
                    })
                  }
                />
              </div>
            </details>
            <details className="settings-section">
              <summary>
                Connections and privacy
                <span>You decide when to connect and what to share</span>
              </summary>
              <div className="settings-body">
                <Toggle
                  label="Professional introductions"
                  checked={draft.consentSettings.allowProfessionalIntros}
                  onChange={(v) => toggle("allowProfessionalIntros", v)}
                />
                <Toggle
                  label="Social introductions"
                  checked={draft.consentSettings.allowSocialIntros}
                  onChange={(v) => toggle("allowSocialIntros", v)}
                />
                <Toggle
                  label="Transport demand insights"
                  checked={draft.consentSettings.allowTransportInsights}
                  onChange={(v) => toggle("allowTransportInsights", v)}
                />
                <Toggle
                  label="Food suggestions"
                  checked={draft.consentSettings.allowFoodOffers}
                  onChange={(v) => toggle("allowFoodOffers", v)}
                />
                <Toggle
                  label="Relevant city experiences"
                  checked={Boolean(draft.allowEventDiscovery)}
                  onChange={(v) => update("allowEventDiscovery", v)}
                />
                <label>
                  Maximum introductions per week
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={draft.consentSettings.maxWeeklyIntros}
                    onChange={(e) => toggleNumber(e.target.value)}
                  />
                </label>
                <p className="muted small-text">
                  Each introduction needs both people to agree. Names, roles and
                  bio are shared after mutual consent. No contact details or
                  exact location are shared.
                </p>
              </div>
            </details>
            <details className="settings-section">
              <summary>
                Notifications<span>Fewer, more useful interruptions</span>
              </summary>
              <div className="settings-body">
                <label>
                  Maximum notifications per day
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={draft.notificationBudget.maxPerDay}
                    onChange={(e) =>
                      update("notificationBudget", {
                        ...draft.notificationBudget,
                        maxPerDay: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <p className="muted">
                  Stopped topics: {draft.stoppedTopics?.join(", ") || "None"}
                </p>
                {Boolean(draft.stoppedTopics?.length) && (
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => update("stoppedTopics", [])}
                  >
                    Allow these topics again
                  </button>
                )}
                <button
                  type="button"
                  className="secondary"
                  onClick={async () => {
                    if ("Notification" in window) {
                      const result = await Notification.requestPermission();
                      setNotificationState(result);
                    }
                  }}
                >
                  Browser notifications: {notificationState}
                </button>
                <small>
                  Browser notifications work while the website is open. Your
                  quiet time and budget still apply.
                </small>
              </div>
            </details>
            <div className="profile-save">
              <span>
                {saved
                  ? "Saved. Your preferences are in place."
                  : "Your choices apply after saving."}
              </span>
              <button className="primary" disabled={busy}>
                {saved ? <Check size={16} /> : null}
                {busy ? "Saving…" : "Save your preferences"}
              </button>
            </div>
          </form>
          <Section title="Your private space">
            <p className="muted">
              Save your private access link to open your conversation in another
              browser or device. Anyone with this link can access your profile.
            </p>
            <div className="inline-actions">
              <button
                className="secondary"
                onClick={() => {
                  navigator.clipboard
                    .writeText(accessLink)
                    .then(() => setCopied(true))
                    .catch(ignore);
                }}
              >
                {copied ? "Private link copied" : "Copy my private access link"}
              </button>
              <button className="secondary" onClick={() => setCreate(true)}>
                Create another participant
              </button>
              <button className="text-button muted" onClick={onLeave}>
                Leave this session
              </button>
            </div>
          </Section>
          <details className="settings-section">
            <summary>
              Intelligence and connections
              <span>Gemini setup and available capabilities</span>
            </summary>
            <div className="settings-body">
              <div className="setup-note">
                <span className="status-dot" />
                <p>
                  {boot?.ai?.configured
                    ? "Gemini key configured"
                    : "Gemini is waiting for your key"}
                  <br />
                  <span>Model: {boot?.ai?.model}</span>
                </p>
              </div>
              <p className="muted">
                Copy .env.example to .env, add GEMINI_API_KEY, then restart the
                server. Your key stays on the server.
              </p>
              <p className="muted">
                Local plans, private introductions, attendance, in-app updates
                and paper trading are connected. Live provider bookings,
                external calendars, venue reservations and closed-browser push
                are not connected.
              </p>
            </div>
          </details>
          {boot?.demoEnabled && (
            <details className="settings-section">
              <summary>
                Sample experiences<span>Try the multi-participant flows</span>
              </summary>
              <div className="settings-body">
                <p className="muted">
                  These are sample participants and simulated listings. No
                  action approves another participant's invitation.
                </p>
                <div className="demo-participants">
                  {boot.demoUsers.map((u: any) => (
                    <button
                      className="secondary"
                      type="button"
                      key={u.id}
                      disabled={busy}
                      onClick={() => onDemo(u.id)}
                    >
                      {u.name.split(" ")[0]}
                      <small>{u.professions[0]}</small>
                    </button>
                  ))}
                </div>
                <div className="inline-actions">
                  {[
                    ["SCENARIO_A", "Introduction"],
                    ["SCENARIO_B", "Driver context"],
                    ["SCENARIO_C", "Food coordination"],
                  ].map(([s, label]) => (
                    <button
                      className="secondary"
                      key={s}
                      disabled={busy}
                      onClick={() => onDemoScenario(s).catch(ignore)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <small>
                  For introductions: run the sample, open Rashid in another
                  browser, accept his invitation, then approve it as Elena. Each
                  user responds independently.
                </small>
              </div>
            </details>
          )}
        </>
      )}
      {create && (
        <Modal
          title="Another private participant"
          onClose={() => setCreate(false)}
        >
          <ParticipantForm
            onCreate={async (data) => {
              await onCreate(data);
              setCreate(false);
            }}
          />
        </Modal>
      )}
    </>
  );
  function toggleNumber(value: string) {
    update("consentSettings", {
      ...draft.consentSettings,
      maxWeeklyIntros: Number(value),
    });
  }
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
function TokenEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState("");
  const add = () => {
    if (text.trim() && !values.includes(text.trim()))
      onChange([...values, text.trim()]);
    setText("");
  };
  return (
    <div className="token-editor">
      <span>{label}</span>
      <div className="tokens">
        {values.map((v) => (
          <span key={v}>
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => onChange(values.filter((x) => x !== v))}
            >
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="token-input">
        <input
          aria-label={`Add to ${label}`}
          maxLength={200}
          placeholder="Add something…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={`Add to ${label}`}
          onClick={add}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
function PaperMarket({ busy, onAction }: Actions) {
  const [data, setData] = useState<any>(null),
    [symbol, setSymbol] = useState("EMAAR"),
    [quantity, setQuantity] = useState(10),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .request("/paper")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  const trade = async (side: string) => {
    setError("");
    try {
      const result = await onAction(() =>
        api.request("/paper/trade", "POST", { symbol, quantity, side }),
      );
      setData({ ...data, account: result.account });
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (!data) return <p>{error || "Loading your virtual portfolio…"}</p>;
  return (
    <div className="paper-market">
      <div className="setup-note">
        <p>
          Practice, at your pace.
          <br />
          <span>
            Virtual AED and fixed sample prices. No real trades or live market
            data.
          </span>
        </p>
      </div>
      <div className="market-balance">
        <small>Virtual cash</small>
        <h2>
          AED{" "}
          {data.account.cash.toLocaleString("en-GB", {
            maximumFractionDigits: 2,
          })}
        </h2>
      </div>
      <div className="market-assets">
        {data.assets.map((a: any) => (
          <button
            key={a.symbol}
            className={a.symbol === symbol ? "selected" : ""}
            onClick={() => setSymbol(a.symbol)}
          >
            <span>
              <strong>{a.name}</strong>
              <small>
                {data.account.holdings[a.symbol] || 0} virtual shares
              </small>
            </span>
            <b>AED {a.price}</b>
          </button>
        ))}
      </div>
      <div className="form-stack">
        <label>
          Number of shares
          <input
            type="number"
            min="1"
            max="100000"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        <div className="inline-actions">
          <button
            className="primary"
            disabled={busy}
            onClick={() => trade("BUY")}
          >
            Buy virtually
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => trade("SELL")}
          >
            Sell virtually
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
      <Section title="Your practice history">
        {data.account.trades.length ? (
          data.account.trades.slice(0, 10).map((t: any, i: number) => (
            <div className="trade-row" key={i}>
              <span>
                {pretty(t.side)} {t.quantity} {t.symbol}
              </span>
              <small>
                {when(t.time)} · AED {(t.quantity * t.price).toFixed(2)}
              </small>
            </div>
          ))
        ) : (
          <p className="muted">Your first practice trade will appear here.</p>
        )}
      </Section>
    </div>
  );
}
