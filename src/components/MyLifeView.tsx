import React, { useState } from 'react';
import {
  User,
  Briefcase,
  Clock,
  MapPin,
  Shield,
  Bell,
  Heart,
  Save,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';

interface MyLifeViewProps {
  currentUser: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const MyLifeView: React.FC<MyLifeViewProps> = ({ currentUser, onUpdateProfile }) => {
  const [profile, setProfile] = useState<UserProfile>(currentUser);
  const [newProfession, setNewProfession] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center space-x-5">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-16 h-16 rounded-2xl object-cover ring-1 ring-slate-200 shadow-sm"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
              <span className="text-xs text-slate-400">{profile.handle}</span>
            </div>
            <p className="text-xs font-medium text-emerald-800 mt-0.5">
              {profile.professions.join(', ')}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
              {profile.bio}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition flex items-center space-x-2 shadow-sm"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving' : 'Save Preferences'}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Roles & Schedule */}
        <div className="space-y-6">
          {/* Chosen Roles */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Chosen Roles and Professions</h3>
              <p className="text-xs text-slate-500">Add or manage your active life identities</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.professions.map((prof, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs flex items-center space-x-1.5"
                >
                  <span>{prof}</span>
                  <button onClick={() => removeProfession(idx)} className="text-slate-400 hover:text-rose-500">
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
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
              />
              <button
                onClick={addProfession}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Schedule Routine */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Schedule and Quiet Hours</h3>
              <p className="text-xs text-slate-500">Protect focus during designated periods</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Standard Work Window</label>
                <input
                  type="text"
                  value={profile.scheduleRoutine.workHours}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      scheduleRoutine: { ...profile.scheduleRoutine, workHours: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Quiet Hours Start</label>
                  <input
                    type="time"
                    value={profile.scheduleRoutine.quietHoursStart}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        scheduleRoutine: { ...profile.scheduleRoutine, quietHoursStart: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Quiet Hours End</label>
                  <input
                    type="time"
                    value={profile.scheduleRoutine.quietHoursEnd}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        scheduleRoutine: { ...profile.scheduleRoutine, quietHoursEnd: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Districts */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Primary Dubai Districts</h3>
              <p className="text-xs text-slate-500">Where you live, work, and spend time</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Primary Area</label>
                <select
                  value={profile.primaryArea}
                  onChange={(e) => setProfile({ ...profile, primaryArea: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                >
                  <option value="Dubai Marina">Dubai Marina</option>
                  <option value="Downtown Dubai">Downtown Dubai</option>
                  <option value="DIFC">DIFC</option>
                  <option value="Business Bay">Business Bay</option>
                  <option value="Alserkal Avenue">Alserkal Avenue</option>
                  <option value="Palm Jumeirah">Palm Jumeirah</option>
                  <option value="JBR">JBR</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Frequented Areas</label>
                <div className="text-slate-600 text-xs">
                  {profile.frequentedAreas.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Consent Controls */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Consent and Privacy Policies</h3>
              <p className="text-xs text-slate-500">
                LIFEOS operates on explicit opt-in. Unsolicited introductions are never made.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Professional Introductions</span>
                  <span className="text-[11px] text-slate-500">Agent-mediated introductions at events</span>
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
                  className="w-4 h-4 rounded text-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-900 block">Require Explicit Approval Before Sharing Contact</span>
                  <span className="text-[11px] text-slate-500">Profile remains anonymous until mutual consent</span>
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
                  className="w-4 h-4 rounded text-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Transport Demand Insights</span>
                  <span className="text-[11px] text-slate-500">Egress projections for drivers</span>
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
                  className="w-4 h-4 rounded text-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Food Offers and Local Dining</span>
                  <span className="text-[11px] text-slate-500">Fresh dining and surplus rescue matches</span>
                </div>
                <input
                  type="checkbox"
                  checked={profile.consentSettings.allowFoodOffers}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      consentSettings: {
                        ...profile.consentSettings,
                        allowFoodOffers: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-slate-900"
                />
              </label>

              <div>
                <label className="text-slate-700 font-medium block mb-1">
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
                  className="w-full accent-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Passions and Interests</h3>
              <p className="text-xs text-slate-500">Helps discover meaningful connections</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs flex items-center space-x-1"
                >
                  <span>{interest}</span>
                  <button onClick={() => removeInterest(idx)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add passion (e.g. Specialty Coffee, Padel, AI)..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
              />
              <button
                onClick={addInterest}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
