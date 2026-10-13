import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  User,
  Shield,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import {
  UserProfile,
  ConversationThread,
  ConversationMessage,
  ConnectionProposal,
} from '../types/index.ts';

interface ChatViewProps {
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

export const ChatView: React.FC<ChatViewProps> = ({
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
  const [adjustTime, setAdjustTime] = useState('Tomorrow 21:00');
  const [adjustPlace, setAdjustPlace] = useState('Marina Gate North Lounge');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm h-[calc(100vh-140px)] flex flex-col md:flex-row">
        {/* Threads sidebar */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {threads.length} threads
            </span>
          </div>

          <div className="overflow-y-auto flex-1 space-y-1.5 py-3">
            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex flex-col space-y-0.5 ${
                    isActive
                      ? 'bg-white shadow-sm border border-slate-200 font-semibold text-slate-900'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs truncate">{thread.title}</span>
                    {thread.unreadCount > 0 && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {thread.threadType.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-1">
            <div className="flex items-center space-x-1.5 font-medium text-slate-700">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Private Coordinator</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your identity and contact info remain strictly private until mutual approval.
            </p>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {currentThread?.title || 'LIFEOS Companion'}
              </h3>
              <p className="text-xs text-slate-500">
                Personal living city companion for {currentUser.name}
              </p>
            </div>

            <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Zone: {currentUser.primaryArea}
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.senderRole === 'USER';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xl space-y-2">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>

                    {/* Clean Proposal Card */}
                    {msg.proposalData && (
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-semibold text-slate-900">
                            Introduction Proposal
                          </span>
                          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {msg.proposalData.state}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-slate-900">
                            {msg.proposalData.partnerName}
                          </div>
                          <div className="text-xs text-slate-600">
                            {msg.proposalData.partnerProfession}
                          </div>
                          <p className="text-xs text-slate-500 italic pt-1">
                            "{msg.proposalData.partnerBio}"
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                          <div>
                            <span className="text-[10px] text-slate-500 block">VENUE</span>
                            <span className="text-slate-800 font-medium">
                              {msg.proposalData.venue || 'Marina Gate Promenade'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">TIME</span>
                            <span className="text-slate-800 font-medium">
                              {msg.proposalData.time || 'Tomorrow 20:15'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        {msg.actionOptions &&
                          msg.proposalData.state !== 'CONFIRMED' &&
                          msg.proposalData.state !== 'DECLINED' && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
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
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                    opt.variant === 'primary'
                                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                      : opt.variant === 'danger'
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 text-xs">
            <span className="text-slate-400 self-center">Suggestions:</span>
            <button
              onClick={() => setInputText("I'm attending this event tomorrow. Make it fun for me.")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
            >
              Attending event tomorrow. Make it fun
            </button>
            <button
              onClick={() => setInputText("I want to meet founders working on technology.")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
            >
              Meet technology founders
            </button>
            <button
              onClick={() => setInputText("I'm hungry in Downtown Dubai, budget 60 AED.")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
            >
              Hungry in Downtown, budget 60 AED
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message LIFEOS..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-800 pr-24 transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="absolute right-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 disabled:opacity-40 transition flex items-center space-x-1"
              >
                <span>{isSending ? 'Sending' : 'Send'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Suggest Alternative Arrangement</h3>
            <p className="text-xs text-slate-500">
              LIFEOS will adjust the arrangement quietly without pressure.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Preferred Time</label>
                <input
                  type="text"
                  value={adjustTime}
                  onChange={(e) => setAdjustTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Preferred Venue</label>
                <input
                  type="text"
                  value={adjustPlace}
                  onChange={(e) => setAdjustPlace(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
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
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs"
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
