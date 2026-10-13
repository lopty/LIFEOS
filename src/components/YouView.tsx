import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  Clock,
  Shield,
  Save,
  Check,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { TradingView } from './TradingView.tsx';

interface YouViewProps {
  currentUser: UserProfile;
  allUsers?: UserProfile[];
  onSwitchUser?: (userId: string) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const YouView: React.FC<YouViewProps> = ({
  currentUser,
  allUsers = [],
  onSwitchUser,
  onUpdateProfile,
}) => {
  const [profile, setProfile] = useState<UserProfile>(currentUser);
  const [newProfession, setNewProfession] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMarketDesk, setShowMarketDesk] = useState(false);

  useEffect(() => {
    setProfile(currentUser);
  }, [currentUser]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile(profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const addProfession = () => {
    if (!newProfession.trim()) return;
    setProfile({
      ...profile,
      professions: [...profile.professions, newProfession.trim()],
    });
    setNewProfession('');
  };

  const removeProfession = (index: number) => {
    setProfile({
      ...profile,
      professions: profile.professions.filter((_, i) => i !== index),
    });
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    setProfile({
      ...profile,
      interests: [...profile.interests, newInterest.trim()],
    });
    setNewInterest('');
  };

  const removeInterest = (index: number) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-6">
      {/* Top Profile Card */}
      <div className="rounded-3xl bg-white border border-[#E9EDF4] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center space-x-5">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#E9EDF4] shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-[#171D2B]">{profile.name}</h1>
              <span className="text-xs text-[#778296]">{profile.handle}</span>
            </div>
            <p className="text-xs font-medium text-[#5278F5] mt-0.5">
              {profile.professions.join(' · ')}
            </p>
            <p className="text-xs text-[#778296] mt-1.5 max-w-lg leading-relaxed">
              {profile.bio}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMarketDesk(!showMarketDesk)}
            className="px-4 py-2 rounded-xl bg-[#F0F5FF] text-[#5278F5] text-xs font-medium hover:bg-[#DDE8FF] transition flex items-center space-x-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{showMarketDesk ? 'View Profile' : 'Dubai Market Desk'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#5278F5] text-white text-xs font-medium hover:bg-[#4166E3] transition flex items-center space-x-1.5 shadow-xs"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resident Accounts / Switch Persona Bar */}
      {allUsers && allUsers.length > 0 && onSwitchUser && (
        <div className="rounded-2xl bg-white border border-[#E9EDF4] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-[#171D2B]">Switch Dubai Resident Persona</h2>
              <p className="text-[11px] text-[#778296]">Switch accounts to experience personalized schedules, AI coordination, and proposals</p>
            </div>
            <span className="text-[11px] text-[#5278F5] bg-[#F0F5FF] px-2.5 py-1 rounded-full font-medium">
              4 Active Residents
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {allUsers.map((u) => {
              const isActive = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => onSwitchUser(u.id)}
                  className={`p-2.5 rounded-xl text-left border transition flex items-center space-x-2.5 ${
                    isActive
                      ? 'bg-[#F0F5FF] border-[#5278F5] shadow-xs'
                      : 'bg-white border-[#E9EDF4] hover:bg-[#F7F9FD] hover:border-[#CBD5E1]'
                  }`}
                >
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover ring-1 ring-[#E9EDF4]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#171D2B] truncate flex items-center justify-between">
                      <span>{u.name.split(' ')[0]}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#5278F5] shrink-0" />}
                    </div>
                    <div className="text-[10px] text-[#778296] truncate">{u.professions[0]}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showMarketDesk ? (
        <TradingView />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Roles & Schedule */}
          <div className="space-y-6">
            {/* Multiple Chosen Roles */}
            <div className="rounded-2xl bg-white border border-[#E9EDF4] p-5 space-y-4 shadow-xs">
              <div>
                <h3 className="text-sm font-semibold text-[#171D2B]">Multiple Chosen Roles</h3>
                <p className="text-xs text-[#778296]">Your declared identities and skillsets</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.professions.map((prof, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-[#F7F9FD] text-[#171D2B] text-xs border border-[#E9EDF4] flex items-center space-x-1.5"
                  >
                    <span>{prof}</span>
                    <button onClick={() => removeProfession(idx)} className="text-[#778296] hover:text-rose-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={newProfession}
                  onChange={(e) => setNewProfession(e.target.value)}
                  placeholder="Add role (e.g. Mentor, Parent, Writer)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] text-xs text-[#171D2B] placeholder-[#778296] focus:outline-none focus:border-[#5278F5]"
                />
                <button
                  onClick={addProfession}
                  className="p-2 rounded-xl bg-[#5278F5] text-white text-xs hover:bg-[#4166E3]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Daily Routine & Quiet Hours */}
            <div className="rounded-2xl bg-white border border-[#E9EDF4] p-5 space-y-4 shadow-xs">
              <div>
                <h3 className="text-sm font-semibold text-[#171D2B]">Rhythms and Quiet Hours</h3>
                <p className="text-xs text-[#778296]">Protects your focus and rest</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[#171D2B] font-medium block mb-1">Standard Work Window</label>
                  <input
                    type="text"
                    value={profile.scheduleRoutine.workHours}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        scheduleRoutine: { ...profile.scheduleRoutine, workHours: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] text-[#171D2B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#171D2B] font-medium block mb-1">Quiet Hours Start</label>
                    <input
                      type="time"
                      value={profile.scheduleRoutine.quietHoursStart}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          scheduleRoutine: { ...profile.scheduleRoutine, quietHoursStart: e.target.value },
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] text-[#171D2B]"
                    />
                  </div>
                  <div>
                    <label className="text-[#171D2B] font-medium block mb-1">Quiet Hours End</label>
                    <input
                      type="time"
                      value={profile.scheduleRoutine.quietHoursEnd}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          scheduleRoutine: { ...profile.scheduleRoutine, quietHoursEnd: e.target.value },
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] text-[#171D2B]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Consent Policies */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-[#E9EDF4] p-5 space-y-4 shadow-xs">
              <div>
                <h3 className="text-sm font-semibold text-[#171D2B]">Consent and Privacy Policies</h3>
                <p className="text-xs text-slate-500">
                  LIFEOS operates on explicit opt-in. Unsolicited introductions are never made.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[#171D2B] block">Allow Professional Introductions</span>
                    <span className="text-[11px] text-[#778296]">Agent-mediated connections at events</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.consentSettings.allowProfessionalIntros}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        consentSettings: {
                          ...profile.consentSettings,
                          allowProfessionalIntros: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-[#5278F5]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[#171D2B] block">Require Explicit Approval Before Sharing Contact</span>
                    <span className="text-[11px] text-[#778296]">Profile remains anonymous until mutual consent</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.consentSettings.requireExplicitApprovalBeforeContactShare}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        consentSettings: {
                          ...profile.consentSettings,
                          requireExplicitApprovalBeforeContactShare: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-[#5278F5]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9FD] border border-[#E9EDF4] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[#171D2B] block">Allow Transport Demand Insights</span>
                    <span className="text-[11px] text-[#778296]">Egress projections for drivers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.consentSettings.allowTransportInsights}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        consentSettings: {
                          ...profile.consentSettings,
                          allowTransportInsights: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-[#5278F5]"
                  />
                </label>

                <div>
                  <label className="text-[#171D2B] font-medium block mb-1">
                    Weekly Introductions Cap: {profile.consentSettings.maxWeeklyIntros}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={profile.consentSettings.maxWeeklyIntros}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        consentSettings: {
                          ...profile.consentSettings,
                          maxWeeklyIntros: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-[#5278F5]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
