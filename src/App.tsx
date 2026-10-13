import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/apiClient.ts';
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
} from './types/index.ts';

import { AppNavigation } from './components/AppNavigation.tsx';
import { TodayView } from './components/TodayView.tsx';
import { ExploreView } from './components/ExploreView.tsx';
import { MomentsView } from './components/MomentsView.tsx';
import { AssistantView } from './components/AssistantView.tsx';
import { YouView } from './components/YouView.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'explore' | 'moments' | 'ai' | 'you'>('today');
  const [moments, setMoments] = useState<LifeMoment[]>([]);
  const [proposals, setProposals] = useState<ConnectionProposal[]>([]);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [insights, setInsights] = useState<LifeInsight[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [scenarioBanner, setScenarioBanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadInitialData = useCallback(async () => {
    try {
      const [sessionData, usersData, momentsData, proposalsData, threadsData, eventsData, insightsData, notifsData] =
        await Promise.all([
          api.getSession(),
          api.getUsers(),
          api.getMoments(),
          api.getProposals(),
          api.getThreads(),
          api.getEvents(),
          api.getInsights(),
          api.getNotifications(),
        ]);

      setCurrentUser(sessionData.user);
      setAllUsers(usersData.users || []);
      setMoments(momentsData.moments || []);
      setProposals(proposalsData.proposals || []);
      setEvents(eventsData.events || []);
      setInsights(insightsData.insights || []);
      setNotifications(notifsData.notifications || []);

      const userThreads = threadsData.threads || [];
      setThreads(userThreads);
      if (userThreads.length > 0) {
        const targetThreadId = activeThreadId && userThreads.some((t) => t.id === activeThreadId)
          ? activeThreadId
          : userThreads[0].id;
        setActiveThreadId(targetThreadId);

        const msgs = await api.getMessages(targetThreadId);
        setMessages(msgs.messages || []);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeThreadId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const unsubscribe = api.subscribeToRealtime((payload: RealtimeEventPayload) => {
      console.log('Realtime SSE event received:', payload.type);

      if (payload.type === 'MOMENT_CREATED' || payload.type === 'MOMENT_UPDATED') {
        api.getMoments().then((res) => setMoments(res.moments || []));
      }

      if (payload.type === 'PROPOSAL_UPDATED') {
        api.getProposals().then((res) => setProposals(res.proposals || []));
        api.getThreads().then((res) => {
          setThreads(res.threads || []);
          if (activeThreadId) {
            api.getMessages(activeThreadId).then((m) => setMessages(m.messages || []));
          }
        });
        api.getNotifications().then((res) => setNotifications(res.notifications || []));
      }

      if (payload.type === 'NEW_MESSAGE') {
        if (activeThreadId) {
          api.getMessages(activeThreadId).then((m) => setMessages(m.messages || []));
        }
      }

      if (payload.type === 'INSIGHT_GENERATED') {
        api.getInsights().then((res) => setInsights(res.insights || []));
      }

      if (payload.type === 'EVENT_CASCADE_UPDATED') {
        api.getEvents().then((res) => setEvents(res.events || []));
      }
    });

    return () => unsubscribe();
  }, [activeThreadId]);

  useEffect(() => {
    if (activeThreadId) {
      api.getMessages(activeThreadId).then((res) => setMessages(res.messages || []));
    }
  }, [activeThreadId]);

  const handleSwitchUser = async (userId: string) => {
    setIsLoading(true);
    api.setSessionToken(userId);
    const url = new URL(window.location.href);
    url.searchParams.set('session', userId);
    window.history.pushState({}, '', url.toString());
    await loadInitialData();
  };

  const handleCreateMoment = async (text: string) => {
    const res = await api.createMoment({ description: text });
    if (res.success && res.moment) {
      setMoments((prev) => [res.moment, ...prev]);
      const [pRes, tRes] = await Promise.all([api.getProposals(), api.getThreads()]);
      setProposals(pRes.proposals || []);
      setThreads(tRes.threads || []);
      if (tRes.threads && tRes.threads.length > 0) {
        api.getMessages(tRes.threads[0].id).then((m) => setMessages(m.messages || []));
      }
    }
  };

  const handleSendMessage = async (threadId: string, content: string) => {
    const res = await api.sendMessage(threadId, content);
    if (res.success) {
      const msgs = await api.getMessages(threadId);
      setMessages(msgs.messages || []);
      const [mRes, pRes] = await Promise.all([api.getMoments(), api.getProposals()]);
      setMoments(mRes.moments || []);
      setProposals(pRes.proposals || []);
    }
  };

  const handleRespondProposal = async (
    proposalId: string,
    action: 'RECIPIENT_INTERESTED' | 'INITIATOR_APPROVED' | 'DECLINE' | 'ADJUST',
    options?: { newTime?: string; newPlace?: string; reason?: string }
  ) => {
    const res = await api.respondToProposal(proposalId, action, options);
    if (res.success) {
      const [pRes, tRes, nRes] = await Promise.all([
        api.getProposals(),
        api.getThreads(),
        api.getNotifications(),
      ]);
      setProposals(pRes.proposals || []);
      setThreads(tRes.threads || []);
      setNotifications(nRes.notifications || []);
      if (activeThreadId) {
        const msgs = await api.getMessages(activeThreadId);
        setMessages(msgs.messages || []);
      }
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    const res = await api.updateProfile(updates);
    if (res.success && res.user) {
      setCurrentUser(res.user);
    }
  };

  const handleRsvpEvent = async (eventId: string, attending: boolean) => {
    const res = await api.rsvpEvent(eventId, attending);
    if (res.success && res.event) {
      setEvents((prev) => prev.map((e) => (e.id === eventId ? res.event : e)));
      const [mRes, iRes] = await Promise.all([api.getMoments(), api.getInsights()]);
      setMoments(mRes.moments || []);
      setInsights(iRes.insights || []);
    }
  };

  const handleRunDemo = async (scenario: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C' | 'RESET') => {
    setIsLoading(true);
    try {
      const res = await api.runDemoScenario(scenario);
      setScenarioBanner(res.message);
      setTimeout(() => setScenarioBanner(null), 5000);

      await loadInitialData();

      if (scenario === 'SCENARIO_A') {
        setActiveTab('ai');
      } else if (scenario === 'SCENARIO_B') {
        setActiveTab('explore');
      } else if (scenario === 'SCENARIO_C') {
        setActiveTab('today');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationFeedback = async (
    id: string,
    action: 'DISMISS' | 'SNOOZE' | 'NOT_INTERESTED' | 'STOP_TOPIC'
  ) => {
    const res = await api.feedbackNotification(id, action);
    if (res.success) {
      setNotifications(res.notifications || []);
    }
  };

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#FCFCFF] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-[#5278F5] text-white flex items-center justify-center font-bold text-sm shadow-md animate-pulse">
          L
        </div>
        <p className="text-xs font-medium text-[#778296]">
          Loading LIFEOS Dubai...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen ambient-soft-mesh text-[#171D2B] flex flex-col font-sans selection:bg-[#DDE8FF] selection:text-[#5278F5]">
      {/* Soft Future Navigation */}
      {currentUser && (
        <AppNavigation
          currentUser={currentUser}
          allUsers={allUsers}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSwitchUser={handleSwitchUser}
          notifications={notifications}
          onOpenNotifications={() => setNotificationDrawerOpen(true)}
          onRunDemo={handleRunDemo}
        />
      )}

      {/* Scenario Notification Banner */}
      {scenarioBanner && (
        <div className="bg-[#5278F5] text-white px-4 py-2 text-center text-xs font-medium shadow-sm flex items-center justify-center space-x-2 animate-fadeIn">
          <span>{scenarioBanner}</span>
          <button
            onClick={() => setScenarioBanner(null)}
            className="ml-2 underline text-white/80 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Views */}
      <main className="flex-1">
        {activeTab === 'today' && currentUser && (
          <TodayView
            currentUser={currentUser}
            moments={moments}
            insights={insights}
            events={events}
            onOpenAiChat={() => setActiveTab('ai')}
            onCreateMoment={handleCreateMoment}
            onRsvpEvent={handleRsvpEvent}
            onNavigateToMoments={() => setActiveTab('moments')}
            onNavigateToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreView
            events={events}
            moments={moments}
            insights={insights}
            onRsvpEvent={handleRsvpEvent}
          />
        )}

        {activeTab === 'moments' && currentUser && (
          <MomentsView
            moments={moments}
            proposals={proposals}
            currentUser={currentUser}
            onCreateMoment={handleCreateMoment}
            onRespondProposal={handleRespondProposal}
            onOpenAiChat={() => setActiveTab('ai')}
          />
        )}

        {activeTab === 'ai' && currentUser && (
          <AssistantView
            currentUser={currentUser}
            threads={threads}
            activeThreadId={activeThreadId}
            setActiveThreadId={setActiveThreadId}
            messages={messages}
            onSendMessage={handleSendMessage}
            onRespondProposal={handleRespondProposal}
            proposals={proposals}
          />
        )}

        {activeTab === 'you' && currentUser && (
          <YouView
            currentUser={currentUser}
            allUsers={allUsers}
            onSwitchUser={handleSwitchUser}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        onFeedback={handleNotificationFeedback}
        onNavigateToChat={() => setActiveTab('ai')}
      />

      {/* Soft Clean Minimalist Footer */}
      <footer className="mt-auto border-t border-[#E9EDF4] bg-white/70 py-6 text-xs text-[#778296] hidden md:block">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#171D2B]">LIFEOS</span>
            <span>·</span>
            <span>Live your best life in Dubai. Let the city work with you.</span>
          </div>
          <div className="text-[11px] text-[#778296]/80">
            Soft Future Edition · GST (UTC+4)
          </div>
        </div>
      </footer>
    </div>
  );
}
