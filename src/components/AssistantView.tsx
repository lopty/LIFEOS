import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  User,
  Shield,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Check,
  X,
} from 'lucide-react';
import {
  UserProfile,
  ConversationThread,
  ConversationMessage,
  ConnectionProposal,
} from '../types/index.ts';
import { AnimatedAIOrb } from './AnimatedAIOrb.tsx';

interface AssistantViewProps {
  currentUser: UserProfile;
  threads: ConversationThread[];
  activeThreadId: string;
  setActiveThreadId: (id: string) => void;
  messages: ConversationMessage[];
  onSendMessage: (threadId: string, content: string) => Promise<void>;
  onRespondProposal: (
    proposalId: string,
    action: 'RECIPIENT_INTERESTED' | 'INITIATOR_APPROVED' | 'DECLINE' | 'ADJUST',
    options?: { newTime?: string; newPlace?: string; reason?: string }
  ) => Promise<void>;
  proposals: ConnectionProposal[];
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  currentUser,
  threads,
  activeThreadId,
  setActiveThreadId,
  messages,
  onSendMessage,
  onRespondProposal,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustProposalId, setAdjustProposalId] = useState('');
  const [adjustTime, setAdjustTime] = useState('Tomorrow 20:15');
  const [adjustPlace, setAdjustPlace] = useState('The Foundry Cafe, Marina Gate');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || !activeThreadId) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    try {
      await onSendMessage(activeThreadId, text);
    } finally {
      setIsSending(false);
    }
  };

  const currentThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 h-[calc(100vh-80px)] flex flex-col">
      {/* Top Header with Fluid AI Orb presence */}
      <div className="pb-4 border-b border-[#E9EDF4] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AnimatedAIOrb size="md" isProcessing={isSending} />
          <div>
            <h2 className="text-base font-semibold text-[#171D2B]">
              LIFEOS Companion
            </h2>
            <p className="text-xs text-[#778296]">
              {isSending ? 'Thinking...' : 'Ready to help with your day'}
            </p>
          </div>
        </div>

        {/* Thread Selector Pill if multiple threads exist */}
        {threads.length > 1 && (
          <select
            value={activeThreadId}
            onChange={(e) => setActiveThreadId(e.target.value)}
            className="text-xs text-[#778296] bg-white border border-[#E9EDF4] rounded-xl px-3 py-1.5 focus:outline-none"
          >
            {threads.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto py-6 space-y-5 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <AnimatedAIOrb size="hero" />
            <h3 className="text-lg font-semibold text-[#171D2B]">
              How can I assist your Dubai day?
            </h3>
            <p className="text-xs text-[#778296] max-w-sm">
              I can help coordinate event introductions, find quiet spots, protect your personal rhythm, or discover verified local experiences.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.senderRole === 'USER';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className="max-w-lg space-y-2.5">
                  {/* Clean Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#F0F5FF] text-[#171D2B] rounded-tr-xs'
                        : 'bg-white border border-[#E9EDF4] text-[#171D2B] shadow-2xs rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>

                  {/* Contextual Action Card (e.g. Consent-based introduction, Reference 4) */}
                  {msg.proposalData && (
                    <div className="rounded-2xl bg-white border border-[#E9EDF4] p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E9EDF4] pb-2.5">
                        <span className="text-xs font-semibold text-[#5278F5] flex items-center space-x-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Introduction Proposal</span>
                        </span>
                        <span className="text-[11px] font-medium text-[#778296]">
                          {msg.proposalData.state}
                        </span>
                      </div>

                      {/* Partner Profile Summary */}
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-[#171D2B]">
                          {msg.proposalData.partnerName}
                        </div>
                        <div className="text-xs text-[#5278F5]">
                          {msg.proposalData.partnerProfession}
                        </div>
                        <p className="text-xs text-[#778296] italic pt-1">
                          "{msg.proposalData.partnerBio}"
                        </p>
                      </div>

                      {/* Venue and Time */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#F7F9FD] p-2.5 rounded-xl border border-[#E9EDF4]">
                        <div>
                          <span className="text-[10px] text-[#778296] block font-medium">VENUE</span>
                          <span className="text-[#171D2B] font-medium truncate block">
                            {msg.proposalData.venue || 'The Foundry Cafe, Marina Gate'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#778296] block font-medium">TIME</span>
                          <span className="text-[#171D2B] font-medium truncate block">
                            {msg.proposalData.time || 'Tomorrow 20:15'}
                          </span>
                        </div>
                      </div>

                      {/* Clean Actions (Interested / Not now) */}
                      {msg.actionOptions &&
                        msg.proposalData.state !== 'CONFIRMED' &&
                        msg.proposalData.state !== 'DECLINED' && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E9EDF4]">
                            {msg.actionOptions.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (opt.action === 'ADJUST_MEETING') {
                                    setAdjustProposalId(msg.proposalData!.proposalId);
                                    setAdjustModalOpen(true);
                                  } else if (opt.action === 'RECIPIENT_INTERESTED') {
                                    onRespondProposal(msg.proposalData!.proposalId, 'RECIPIENT_INTERESTED');
                                  } else if (opt.action === 'INITIATOR_APPROVED') {
                                    onRespondProposal(msg.proposalData!.proposalId, 'INITIATOR_APPROVED');
                                  } else if (opt.action === 'DECLINE_PROPOSAL' || opt.action === 'RECIPIENT_DECLINED') {
                                    onRespondProposal(msg.proposalData!.proposalId, 'DECLINE');
                                  }
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-medium transition shadow-2xs ${
                                  opt.variant === 'primary'
                                    ? 'bg-[#5278F5] hover:bg-[#4166E3] text-white'
                                    : opt.variant === 'danger'
                                    ? 'bg-white border border-[#E9EDF4] text-rose-600 hover:bg-rose-50'
                                    : 'bg-white border border-[#E9EDF4] text-[#171D2B] hover:bg-[#F7F9FD]'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  <div className="text-[10px] text-[#778296]/80 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Modern AI Composer (Reference 4 and Reference 5) */}
      <div className="relative pt-2">
        <form
          onSubmit={handleSend}
          className="bg-white border border-[#E9EDF4] rounded-2xl p-2 sm:p-2.5 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-[#5278F5]/40 transition-all flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask or reply to LIFEOS..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#171D2B] placeholder-[#778296]/70 focus:outline-none px-3"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-xl bg-[#5278F5] hover:bg-[#4166E3] active:scale-98 disabled:opacity-40 text-white transition flex items-center justify-center shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Adjust Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9EDF4] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-semibold text-[#171D2B]">
              Suggest Alternative Timing
            </h3>
            <p className="text-xs text-[#778296]">
              LIFEOS will adjust the arrangement quietly without pressure.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#171D2B] font-medium block mb-1">Time</label>
                <input
                  type="text"
                  value={adjustTime}
                  onChange={(e) => setAdjustTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] text-[#171D2B]"
                />
              </div>

              <div>
                <label className="text-[#171D2B] font-medium block mb-1">Venue</label>
                <input
                  type="text"
                  value={adjustPlace}
                  onChange={(e) => setAdjustPlace(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] text-[#171D2B]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E9EDF4]">
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F7F9FD] hover:bg-[#E9EDF4] text-[#778296] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRespondProposal(adjustProposalId, 'ADJUST', {
                    newTime: adjustTime,
                    newPlace: adjustPlace,
                  });
                  setAdjustModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#5278F5] text-white font-medium text-xs hover:bg-[#4166E3]"
              >
                Send Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
