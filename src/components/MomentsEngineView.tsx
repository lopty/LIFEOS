import React, { useState } from 'react';
import {
  GitBranch,
  CheckCircle2,
  Clock,
  Shield,
  MapPin,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  LifeMoment,
  ConnectionProposal,
  ConnectionState,
  CityEvent,
  UserProfile,
} from '../types/index.ts';

interface MomentsEngineViewProps {
  moments: LifeMoment[];
  proposals: ConnectionProposal[];
  events: CityEvent[];
  currentUser: UserProfile;
  onCreateMoment: (text: string) => Promise<void>;
  onRespondProposal: (
    proposalId: string,
    action: 'RECIPIENT_INTERESTED' | 'INITIATOR_APPROVED' | 'DECLINE' | 'ADJUST'
  ) => Promise<void>;
}

const STATE_STEPS: ConnectionState[] = [
  'DISCOVERED',
  'ELIGIBILITY_CHECKED',
  'INVITATION_PENDING',
  'PARTICIPANT_INTERESTED',
  'MUTUAL_CONSENT_PENDING',
  'ACCEPTED',
  'COORDINATING',
  'CONFIRMED',
  'COMPLETED',
];

export const MomentsEngineView: React.FC<MomentsEngineViewProps> = ({
  moments,
  proposals,
  currentUser,
  onCreateMoment,
  onRespondProposal,
}) => {
  const [selectedProposal, setSelectedProposal] = useState<ConnectionProposal | null>(
    proposals[0] || null
  );
  const [newMomentText, setNewMomentText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMomentText.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await onCreateMoment(newMomentText.trim());
      setNewMomentText('');
    } finally {
      setIsCreating(false);
    }
  };

  const getStepStatus = (step: ConnectionState, current: ConnectionState) => {
    if (current === 'DECLINED' || current === 'CANCELLED' || current === 'FAILED') {
      return 'FAILED';
    }
    const stepIdx = STATE_STEPS.indexOf(step);
    const currIdx = STATE_STEPS.indexOf(current);
    if (stepIdx < currIdx) return 'COMPLETED';
    if (stepIdx === currIdx) return 'ACTIVE';
    return 'UPCOMING';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-emerald-800" />
          <h1 className="text-xl font-bold text-slate-900">Living Moments and State Engine</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Inspect how intentions move safely through mutual consent before introductions are finalized.
        </p>
      </div>

      {/* Add Moment */}
      <form
        onSubmit={handleCreate}
        className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Living Moment or Intention</span>
          </label>
          <span className="text-xs text-slate-400">Natural language interpreter</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMomentText}
            onChange={(e) => setNewMomentText(e.target.value)}
            placeholder="Describe what you plan or need (e.g. Attending event tomorrow, looking for founders)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
          />
          <button
            type="submit"
            disabled={!newMomentText.trim() || isCreating}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs disabled:opacity-40 transition flex items-center space-x-1"
          >
            <span>{isCreating ? 'Evaluating' : 'Save Moment'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* State Machine */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Multi-Party Coordination State Machine</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Requires human agreement on both sides before personal details are exchanged.
            </p>
          </div>

          {proposals.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Proposal:</span>
              <select
                value={selectedProposal?.id || ''}
                onChange={(e) => {
                  const p = proposals.find((prop) => prop.id === e.target.value);
                  if (p) setSelectedProposal(p);
                }}
                className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none"
              >
                {proposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    Proposal #{p.id.substring(5, 11)} ({p.currentState})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedProposal ? (
          <div className="space-y-6">
            {/* Timeline */}
            <div className="overflow-x-auto pb-2">
              <div className="flex items-center min-w-[750px] justify-between">
                {STATE_STEPS.map((step, idx) => {
                  const status = getStepStatus(step, selectedProposal.currentState);
                  const isCurrent = selectedProposal.currentState === step;
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center text-center space-y-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-semibold transition ${
                            status === 'COMPLETED'
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-slate-900 text-white ring-2 ring-slate-400'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-medium max-w-[80px] leading-tight ${
                            isCurrent
                              ? 'text-slate-900 font-semibold'
                              : status === 'COMPLETED'
                              ? 'text-slate-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.replace('_', ' ')}
                        </span>
                      </div>

                      {idx < STATE_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 ${
                            status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Proposal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 font-medium">Match Context</div>
                <div className="text-xs font-semibold text-slate-900">{selectedProposal.reason}</div>
                <div className="text-xs text-slate-600">
                  Target Venue: {selectedProposal.proposedPlace}
                </div>
                <div className="text-xs text-slate-600">
                  Target Time: {selectedProposal.proposedTime}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-500 font-medium">Available Actions</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedProposal.currentState === 'INVITATION_PENDING' && (
                    <button
                      onClick={() => onRespondProposal(selectedProposal.id, 'RECIPIENT_INTERESTED')}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs"
                    >
                      Step 1: Recipient Expresses Interest
                    </button>
                  )}

                  {selectedProposal.currentState === 'MUTUAL_CONSENT_PENDING' && (
                    <button
                      onClick={() => onRespondProposal(selectedProposal.id, 'INITIATOR_APPROVED')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                    >
                      Step 2: Initiator Formally Confirms Meeting
                    </button>
                  )}

                  {selectedProposal.currentState === 'CONFIRMED' && (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium text-xs flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Meeting Confirmed on Both Calendars</span>
                    </div>
                  )}

                  {selectedProposal.currentState !== 'CONFIRMED' &&
                    selectedProposal.currentState !== 'DECLINED' && (
                      <button
                        onClick={() => onRespondProposal(selectedProposal.id, 'DECLINE')}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-xs border border-slate-300"
                      >
                        Decline Gracefully
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* Audit Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700">Audit Trail:</h4>
              <div className="space-y-1.5 text-xs">
                {selectedProposal.stateHistory.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 text-xs">
                        {h.state.replace('_', ' ')}
                      </span>
                      <p className="text-slate-600 text-xs">{h.note}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No active connection proposals yet.</p>
        )}
      </div>

      {/* Moments Directory */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">All Registered Moments</h2>

        <div className="space-y-2.5">
          {moments.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-slate-500">
                  <span className="font-semibold text-slate-800">{m.ownerName}</span>
                  <span>·</span>
                  <span>{m.kind.replace('_', ' ')}</span>
                  <span>·</span>
                  <span>{m.approximateArea}</span>
                </div>
                <p className="text-slate-800 font-medium">"{m.description}"</p>
                <div className="text-slate-500">Goals: {m.goals.join(', ')}</div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium">
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
