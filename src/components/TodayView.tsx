import React, { useState } from 'react';
import {
  Send,
  MapPin,
  Clock,
  ArrowRight,
  Sun,
  Shield,
  Coffee,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';
import { UserProfile, LifeMoment, LifeInsight, CityEvent } from '../types/index.ts';
import { AnimatedAIOrb } from './AnimatedAIOrb.tsx';

interface TodayViewProps {
  currentUser: UserProfile;
  moments: LifeMoment[];
  insights: LifeInsight[];
  events: CityEvent[];
  onOpenAiChat: () => void;
  onCreateMoment: (text: string) => Promise<void>;
  onRsvpEvent: (eventId: string, attending: boolean) => Promise<void>;
  onNavigateToMoments: () => void;
  onNavigateToExplore: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  currentUser,
  moments,
  insights,
  events,
  onOpenAiChat,
  onCreateMoment,
  onRsvpEvent,
  onNavigateToMoments,
  onNavigateToExplore,
}) => {
  const [composerText, setComposerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventRsvpd, setEventRsvpd] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleComposerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateMoment(composerText.trim());
      setComposerText('');
      onOpenAiChat();
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainEvent = events.find((e) => e.id === 'event_dubai_future_evening') || events[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Main Stream (Left 8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Personal Greeting with Luminous Orb */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#171D2B]">
                {getGreeting()}, {currentUser.name.split(' ')[0]}.
              </h1>
              <p className="text-sm sm:text-base text-[#778296] mt-1 font-normal">
                What would make today better?
              </p>
            </div>
            <AnimatedAIOrb size="md" isProcessing={isSubmitting} />
          </div>

          {/* Ambient AI Composer */}
          <div className="relative">
            {/* Soft faint atmospheric background glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#DDE8FF]/60 via-[#F7F9FD] to-[#A995F4]/20 blur-md pointer-events-none" />

            <form
              onSubmit={handleComposerSubmit}
              className="relative bg-white border border-[#E9EDF4] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-[#5278F5]/40 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="Ask LIFEOS anything or share what you plan..."
                  className="flex-1 bg-transparent text-sm sm:text-base text-[#171D2B] placeholder-[#778296]/70 focus:outline-none px-2"
                />
                <button
                  type="submit"
                  disabled={!composerText.trim() || isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-[#5278F5] hover:bg-[#4166E3] active:scale-98 disabled:opacity-40 text-white font-medium text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1.5 shadow-xs"
                >
                  <span>{isSubmitting ? 'Thinking...' : 'Send'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Up to 3 Soft Suggestion Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setComposerText("Make tomorrow's event memorable");
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#F0F5FF] hover:bg-[#DDE8FF] text-[#5278F5] text-xs font-medium transition-colors"
            >
              Make tomorrow's event memorable
            </button>
            <button
              onClick={() => {
                setComposerText("Find something good nearby");
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#F7F9FD] hover:bg-[#E9EDF4] text-[#778296] hover:text-[#171D2B] text-xs font-medium transition-colors"
            >
              Find something good nearby
            </button>
            <button
              onClick={() => {
                setComposerText("Keep my evening free");
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#F7F9FD] hover:bg-[#E9EDF4] text-[#778296] hover:text-[#171D2B] text-xs font-medium transition-colors"
            >
              Keep my evening free
            </button>
          </div>

          {/* "For you" Curated Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#171D2B] tracking-tight">
                For you
              </h2>
              <span className="text-xs text-[#778296]">Intelligent lifestyle insights</span>
            </div>

            {/* Insight 1: Founder Event at Dubai Marina with Beautiful Photography */}
            <div className="rounded-2xl bg-white border border-[#E9EDF4] p-5 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center space-x-1 text-xs font-medium text-[#5278F5]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tomorrow looks interesting</span>
                </div>
                <h3 className="text-base font-semibold text-[#171D2B] leading-snug">
                  Dubai Future Evening at Marina Gate Promenade
                </h3>
                <p className="text-xs text-[#778296] leading-relaxed max-w-md">
                  There is a founder gathering near Dubai Marina that fits your schedule. Technologists and angel peers are attending.
                </p>
                <div className="pt-2 flex items-center space-x-3 text-xs">
                  <button
                    onClick={() => {
                      if (mainEvent) {
                        onRsvpEvent(mainEvent.id, true);
                        setEventRsvpd(true);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#5278F5] text-white font-medium hover:bg-[#4166E3] transition shadow-xs flex items-center space-x-1"
                  >
                    {eventRsvpd ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>RSVP Confirmed</span>
                      </>
                    ) : (
                      <>
                        <span>Take a look</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={onOpenAiChat}
                    className="text-[#778296] hover:text-[#171D2B] font-medium transition"
                  >
                    Ask AI about attendees
                  </button>
                </div>
              </div>

              {/* Curated Luxury Visual Card (Reference 1 & 2) */}
              <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden shrink-0 shadow-xs border border-[#E9EDF4]">
                <img
                  src="/src/assets/images/dubai_marina_event_1791878647556.jpg"
                  alt="Dubai Marina"
                  className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 text-[11px] text-white font-medium drop-shadow-sm">
                  Dubai Marina
                </span>
              </div>
            </div>

            {/* Insight 2: Evening Quiet Time */}
            <div className="rounded-2xl bg-white border border-[#E9EDF4] p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium text-emerald-600">Your evening is free</div>
                <p className="text-xs text-[#778296]">
                  Nothing urgent needs your attention. Quiet hours commence at {currentUser.scheduleRoutine.quietHoursStart}.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F0F5FF] text-[#5278F5] flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5 text-[#5278F5]" />
              </div>
            </div>

            {/* Active Moments if user has any */}
            {moments.length > 0 && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#171D2B] uppercase tracking-wider">
                    Your Active Moments
                  </h3>
                  <button
                    onClick={onNavigateToMoments}
                    className="text-xs text-[#5278F5] hover:underline font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2.5">
                  {moments.slice(0, 2).map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] flex items-center justify-between hover:bg-white transition"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-[#171D2B]">{m.description}</div>
                        <div className="text-[11px] text-[#778296]">
                          {m.approximateArea} · {m.goals.join(', ')}
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-[#5278F5] bg-white px-2.5 py-1 rounded-lg border border-[#E9EDF4]">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Personal Timeline (Right 4 Cols) */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          {/* Weather & Day Card (Reference 3) */}
          <div className="rounded-2xl bg-white border border-[#E9EDF4] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#778296]">Dubai, UAE</span>
                <div className="text-xl font-semibold text-[#171D2B]">26°C Sunny</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#DDE8FF]/60 flex items-center justify-center text-[#5278F5]">
                <Sun className="w-5 h-5" />
              </div>
            </div>

            <div className="border-t border-[#E9EDF4] pt-3 text-xs text-[#778296] flex items-center justify-between">
              <span>Comfortable coastal breeze</span>
              <span className="text-[#171D2B] font-medium">Clear Evening</span>
            </div>
          </div>

          {/* Daily Rhythm / Schedule Timeline (Reference 3) */}
          <div className="rounded-2xl bg-white border border-[#E9EDF4] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#171D2B]">Today's Rhythm</h3>
              <Clock className="w-4 h-4 text-[#778296]" />
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5278F5] mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-[#171D2B]">Morning Focus</div>
                  <div className="text-[11px] text-[#778296]">{currentUser.scheduleRoutine.workHours.split('-')[0] || '09:00'} · Deep engineering</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A995F4] mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-[#171D2B]">Open Coordination</div>
                  <div className="text-[11px] text-[#778296]">14:00 – 17:00 · Casual syncs</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-[#171D2B]">Rejuvenation</div>
                  <div className="text-[11px] text-[#778296]">From {currentUser.scheduleRoutine.quietHoursStart} · Quiet hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Dining Match preview with photography */}
          <div
            onClick={onNavigateToExplore}
            className="rounded-2xl bg-white border border-[#E9EDF4] p-4 shadow-xs hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center space-x-3">
              <img
                src="/src/assets/images/mediterranean_dining_1791878647881.jpg"
                alt="Green Table"
                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E9EDF4]"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#171D2B] truncate group-hover:text-[#5278F5] transition">
                  Green Table Downtown
                </div>
                <div className="text-[11px] text-[#778296] truncate">Mediterranean Bowl · 48 AED</div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Table hold ready</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#778296] group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
