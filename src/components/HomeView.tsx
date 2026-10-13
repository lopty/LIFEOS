import React, { useState } from 'react';
import {
  Send,
  MapPin,
  Clock,
  Shield,
  ArrowRight,
  Play,
  Calendar,
  Compass,
} from 'lucide-react';
import { UserProfile, LifeMoment, LifeInsight, CityEvent, ConnectionProposal } from '../types/index.ts';

interface HomeViewProps {
  currentUser: UserProfile;
  moments: LifeMoment[];
  insights: LifeInsight[];
  events: CityEvent[];
  proposals: ConnectionProposal[];
  onOpenAiChat: () => void;
  onCreateMoment: (text: string) => Promise<void>;
  onRsvpEvent: (eventId: string, attending: boolean) => Promise<void>;
  onRunDemo: (scenario: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C') => void;
  setActiveTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  moments,
  insights,
  events,
  proposals,
  onOpenAiChat,
  onCreateMoment,
  onRsvpEvent,
  onRunDemo,
  setActiveTab,
}) => {
  const [intentionText, setIntentionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitIntention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intentionText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateMoment(intentionText.trim());
      setIntentionText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeMoments = moments.filter((m) => m.status === 'ACTIVE');
  const activeProposals = proposals.filter((p) => p.currentState !== 'DECLINED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Clean Hero Card */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-semibold text-emerald-800 tracking-wide uppercase">
            Living City Operating System
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Live your best life in Dubai. <br className="hidden sm:inline" />
            Let the city work with you.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Good day, {currentUser.name}. LIFEOS coordinates your daily rhythm across work, events, transit, meals, and rest without notifications fatigue or monetizing your life.
          </p>
        </div>

        {/* Clean Natural Language Intention Bar */}
        <form onSubmit={handleSubmitIntention} className="max-w-3xl">
          <div className="relative flex items-center bg-slate-50 border border-slate-300 rounded-2xl p-1.5 focus-within:border-slate-800 focus-within:bg-white transition shadow-sm">
            <input
              type="text"
              value={intentionText}
              onChange={(e) => setIntentionText(e.target.value)}
              placeholder="What would make today great? (e.g. Attending event tomorrow. Make it fun for me.)"
              className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none pr-32"
            />
            <button
              type="submit"
              disabled={!intentionText.trim() || isSubmitting}
              className="absolute right-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 disabled:opacity-40 transition flex items-center space-x-1.5"
            >
              <span>{isSubmitting ? 'Evaluating' : 'Add Intention'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Quick ideas:</span>
            <button
              type="button"
              onClick={() => setIntentionText("I'm attending Dubai Future Evening tomorrow. Make it fun for me.")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Attending event tomorrow. Make it fun
            </button>
            <button
              type="button"
              onClick={() => setIntentionText("I'm hungry in Downtown Dubai, budget 60 AED, clean healthy food.")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Hungry in Downtown, budget 60 AED
            </button>
            <button
              type="button"
              onClick={() => setIntentionText("I'm resting this evening and want zero non-urgent interruptions.")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Resting this evening, protect my focus
            </button>
          </div>
        </form>
      </div>

      {/* 3 Guided Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              Scenario A
            </span>
            <button
              onClick={() => onRunDemo('SCENARIO_A')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition"
            >
              <span>Run</span>
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Meaningful Introduction</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Elena specifies an AI founder goal. LIFEOS reaches out to Rashid privately and requires mutual consent before introductions.
          </p>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero contact sharing without approval</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              Scenario B
            </span>
            <button
              onClick={() => onRunDemo('SCENARIO_B')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition"
            >
              <span>Run</span>
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Transport Shift Cascade</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            A large Marina event produces clear egress demand curves for driver Tariq without broadcast spam or empty miles.
          </p>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Matches declared shift hours and zone</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              Scenario C
            </span>
            <button
              onClick={() => onRunDemo('SCENARIO_C')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition"
            >
              <span>Run</span>
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Daily Life & Dining</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Express a meal budget and preference in Downtown. LIFEOS identifies verified wholesome options and holds a table.
          </p>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>Under 60 AED, zero endless scrolling</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Moments & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Moments */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Active Moments</h2>
              <p className="text-xs text-slate-500">Voluntary life contexts currently coordinating</p>
            </div>
            <button
              onClick={() => setActiveTab('moments')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              View all
            </button>
          </div>

          {activeMoments.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 text-xs">
              No moments added yet. Write an intention above to begin.
            </div>
          ) : (
            <div className="space-y-3">
              {activeMoments.map((moment) => (
                <div
                  key={moment.id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">{moment.kind.replace('_', ' ')}</span>
                        <span>·</span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{moment.approximateArea}</span>
                        </span>
                        <span>·</span>
                        <span>{moment.startTime}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mt-1">
                        "{moment.description}"
                      </h4>
                    </div>

                    <button
                      onClick={onOpenAiChat}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 transition flex items-center space-x-1"
                    >
                      <span>Discuss</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Clean unboxed metadata */}
                  <div className="text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Goals: </span>
                    {moment.goals.join(', ')}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-2 border-t border-slate-100">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    <span>Protected: {moment.protectedConstraints.join(' · ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Proposal banner */}
          {activeProposals.length > 0 && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">
                  Connection Coordination Active
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Status: {activeProposals[0].currentState}
                </span>
              </div>
              <p className="text-xs text-slate-800 font-medium">
                {activeProposals[0].reason}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>Location: {activeProposals[0].proposedPlace}</span>
                <button
                  onClick={onOpenAiChat}
                  className="font-medium text-slate-900 hover:underline"
                >
                  Review in Companion →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Insights & Events */}
        <div className="space-y-6">
          {/* Silent Insights */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Living City Insights</h3>
              <p className="text-xs text-slate-500">Delivered quietly based on your schedule</p>
            </div>

            {insights.length === 0 ? (
              <p className="text-xs text-slate-400">No active alerts. Everything is calm.</p>
            ) : (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">{insight.title}</span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        {Math.round(insight.confidence * 100)}% match
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{insight.summary}</p>
                    <div className="text-xs font-medium text-slate-900 pt-1 border-t border-slate-200">
                      Recommendation: {insight.nextSuggestedAction}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming City Events */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Upcoming Gatherings</h3>
              <button
                onClick={() => setActiveTab('map')}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                View map
              </button>
            </div>

            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{event.title}</h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {event.area} · {event.date} {event.startTime}
                      </div>
                    </div>
                    <button
                      onClick={() => onRsvpEvent(event.id, true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition"
                    >
                      RSVP
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{event.description}</p>
                  <div className="text-[11px] text-slate-500">
                    Confirmed: {event.confirmedAttendance.toLocaleString()} attendees
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
