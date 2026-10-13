import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Shield,
  ChevronRight,
  Sparkles,
  Check,
  X,
  User,
} from 'lucide-react';
import { LifeMoment, ConnectionProposal, UserProfile } from '../types/index.ts';

interface MomentsViewProps {
  moments: LifeMoment[];
  proposals: ConnectionProposal[];
  currentUser: UserProfile;
  onCreateMoment: (text: string) => Promise<void>;
  onRespondProposal: (
    proposalId: string,
    action: 'RECIPIENT_INTERESTED' | 'INITIATOR_APPROVED' | 'DECLINE' | 'ADJUST'
  ) => Promise<void>;
  onOpenAiChat: () => void;
}

export const MomentsView: React.FC<MomentsViewProps> = ({
  moments,
  proposals,
  currentUser,
  onCreateMoment,
  onRespondProposal,
  onOpenAiChat,
}) => {
  const [selectedMoment, setSelectedMoment] = useState<LifeMoment | null>(moments[0] || null);
  const [newMomentInput, setNewMomentInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Group moments into Today, Tomorrow, Upcoming
  const todayMoments = moments.filter(
    (m) => m.startTime.toLowerCase().includes('today') || m.startTime.toLowerCase().includes('immediate')
  );
  const tomorrowMoments = moments.filter((m) => m.startTime.toLowerCase().includes('tomorrow'));
  const upcomingMoments = moments.filter(
    (m) =>
      !m.startTime.toLowerCase().includes('today') &&
      !m.startTime.toLowerCase().includes('tomorrow') &&
      !m.startTime.toLowerCase().includes('immediate')
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMomentInput.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await onCreateMoment(newMomentInput.trim());
      setNewMomentInput('');
    } finally {
      setIsCreating(false);
    }
  };

  // Find related proposal for selected moment
  const relatedProposal = selectedMoment
    ? proposals.find(
        (p) =>
          p.relatedMomentId === selectedMoment.id ||
          p.recipientMomentId === selectedMoment.id
      )
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#171D2B] tracking-tight">
            Personal Moments
          </h1>
          <p className="text-xs text-[#778296] mt-0.5">
            Your life journal and voluntary plans in Dubai.
          </p>
        </div>

        {/* Quick moment creator */}
        <form onSubmit={handleCreate} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMomentInput}
            onChange={(e) => setNewMomentInput(e.target.value)}
            placeholder="Plan an activity or moment..."
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-white border border-[#E9EDF4] text-xs text-[#171D2B] placeholder-[#778296] focus:outline-none focus:border-[#5278F5]"
          />
          <button
            type="submit"
            disabled={!newMomentInput.trim() || isCreating}
            className="px-3.5 py-2 rounded-xl bg-[#5278F5] text-white text-xs font-medium hover:bg-[#4166E3] disabled:opacity-40 transition flex items-center space-x-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Timeline Columns (7 Cols, Reference 3) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section: Tomorrow */}
          {tomorrowMoments.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#171D2B] tracking-wide uppercase">
                Tomorrow
              </div>
              <div className="space-y-2.5">
                {tomorrowMoments.map((m) => {
                  const isSelected = selectedMoment?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMoment(m)}
                      className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? 'border-[#5278F5] ring-2 ring-[#5278F5]/10'
                          : 'border-[#E9EDF4] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-[#171D2B]">{m.description}</h4>
                          <div className="flex items-center space-x-2 text-xs text-[#778296]">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-[#778296]" />
                              <span>{m.approximateArea}</span>
                            </span>
                            <span>·</span>
                            <span>{m.startTime}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-[#5278F5] bg-[#F0F5FF] px-2.5 py-1 rounded-lg">
                          {m.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Today */}
          {todayMoments.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#171D2B] tracking-wide uppercase">
                Today
              </div>
              <div className="space-y-2.5">
                {todayMoments.map((m) => {
                  const isSelected = selectedMoment?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMoment(m)}
                      className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? 'border-[#5278F5] ring-2 ring-[#5278F5]/10'
                          : 'border-[#E9EDF4] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-[#171D2B]">{m.description}</h4>
                          <div className="flex items-center space-x-2 text-xs text-[#778296]">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-[#778296]" />
                              <span>{m.approximateArea}</span>
                            </span>
                            <span>·</span>
                            <span>{m.startTime}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-[#5278F5] bg-[#F0F5FF] px-2.5 py-1 rounded-lg">
                          {m.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Upcoming */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#171D2B] tracking-wide uppercase">
              Upcoming
            </div>
            {upcomingMoments.length === 0 && tomorrowMoments.length === 0 && todayMoments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-[#E9EDF4] text-center text-xs text-[#778296]">
                No moments scheduled yet. Type a plan above to add one.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingMoments.map((m) => {
                  const isSelected = selectedMoment?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMoment(m)}
                      className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? 'border-[#5278F5] ring-2 ring-[#5278F5]/10'
                          : 'border-[#E9EDF4] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-[#171D2B]">{m.description}</h4>
                          <div className="flex items-center space-x-2 text-xs text-[#778296]">
                            <span>{m.approximateArea}</span>
                            <span>·</span>
                            <span>{m.startTime}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-[#778296] bg-[#F7F9FD] px-2.5 py-1 rounded-lg">
                          {m.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Refined Detail Panel (5 Cols, Section 10) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedMoment ? (
            <div className="rounded-3xl bg-white border border-[#E9EDF4] p-6 shadow-xs space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] uppercase font-semibold text-[#5278F5] tracking-wider">
                  Moment Details
                </span>
                <h3 className="text-lg font-semibold text-[#171D2B] leading-snug">
                  {selectedMoment.description}
                </h3>
                <div className="text-xs text-[#778296] pt-1 flex items-center space-x-2">
                  <span>{selectedMoment.approximateArea}</span>
                  <span>·</span>
                  <span>{selectedMoment.startTime}</span>
                </div>
              </div>

              {/* Your Plans & Goals */}
              <div className="space-y-2 text-xs border-t border-[#E9EDF4] pt-4">
                <div className="font-semibold text-[#171D2B]">Your Intentions</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMoment.goals.map((g, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#F0F5FF] text-[#5278F5] font-medium text-[11px]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connections Coordination */}
              <div className="space-y-2 text-xs border-t border-[#E9EDF4] pt-4">
                <div className="font-semibold text-[#171D2B]">Connections & Introductions</div>
                {relatedProposal ? (
                  <div className="p-3.5 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#171D2B]">
                        Status: {relatedProposal.currentState}
                      </span>
                      <span className="text-[10px] text-[#5278F5] font-semibold">Active</span>
                    </div>
                    <p className="text-[11px] text-[#778296] leading-relaxed">
                      {relatedProposal.reason}
                    </p>
                    <div className="text-[11px] text-[#171D2B] font-medium pt-1">
                      Venue: {relatedProposal.proposedPlace} · {relatedProposal.proposedTime}
                    </div>

                    {/* Step Actions */}
                    {relatedProposal.currentState === 'INVITATION_PENDING' && (
                      <button
                        onClick={() => onRespondProposal(relatedProposal.id, 'RECIPIENT_INTERESTED')}
                        className="w-full mt-2 py-2 rounded-lg bg-[#5278F5] text-white text-xs font-medium hover:bg-[#4166E3]"
                      >
                        Recipient Expresses Interest
                      </button>
                    )}
                    {relatedProposal.currentState === 'MUTUAL_CONSENT_PENDING' && (
                      <button
                        onClick={() => onRespondProposal(relatedProposal.id, 'INITIATOR_APPROVED')}
                        className="w-full mt-2 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                      >
                        Confirm & Schedule Meeting
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#778296]">
                    Autonomous agent is quietly matching compatible peers attending this moment.
                  </p>
                )}
              </div>

              {/* Privacy protection */}
              <div className="text-[11px] text-[#778296] flex items-center space-x-1.5 pt-2 border-t border-[#E9EDF4]">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected: {selectedMoment.protectedConstraints.join(' · ')}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-[#E9EDF4] text-center text-xs text-[#778296]">
              Select any moment from the timeline to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
