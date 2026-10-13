import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  MapPin,
  Calendar,
  MessageSquare,
  User,
  Bell,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Check,
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types/index.ts';
import { AnimatedAIOrb } from './AnimatedAIOrb.tsx';

interface AppNavigationProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  activeTab: 'today' | 'explore' | 'moments' | 'ai' | 'you';
  setActiveTab: (tab: 'today' | 'explore' | 'moments' | 'ai' | 'you') => void;
  onSwitchUser: (userId: string) => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onRunDemo: (scenario: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C' | 'RESET') => void;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  currentUser,
  allUsers,
  activeTab,
  setActiveTab,
  onSwitchUser,
  notifications,
  onOpenNotifications,
  onRunDemo,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dubaiTime, setDubaiTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setDubaiTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => n.deliveryStatus !== 'DISMISSED').length;

  const handleCopySecondWindowLink = (targetUserId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('session', targetUserId);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const navItems = [
    { id: 'today', label: 'Today', icon: Compass },
    { id: 'explore', label: 'Explore', icon: MapPin },
    { id: 'moments', label: 'Moments', icon: Calendar },
    { id: 'ai', label: 'AI', icon: MessageSquare, hasOrb: true },
    { id: 'you', label: 'You', icon: User },
  ] as const;

  return (
    <>
      {/* Top Header Bar for Desktop & Mobile */}
      <header className="sticky top-0 z-30 bg-[#FCFCFF]/85 backdrop-blur-md border-b border-[#E9EDF4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand + Dubai Time */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('today')}>
            <AnimatedAIOrb size="sm" />
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-[#171D2B]">
                LIFEOS
              </span>
              <span className="text-[11px] text-[#778296] font-normal leading-none">
                Dubai {dubaiTime || '11:45 PM'}
              </span>
            </div>
          </div>

          {/* Desktop Center Navigation Pills */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#F0F5FF]/70 p-1.5 rounded-2xl border border-[#E9EDF4]/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-[#5278F5] shadow-xs font-semibold'
                      : 'text-[#778296] hover:text-[#171D2B] hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5278F5]' : 'text-[#778296]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Scenarios, Notification, Profile */}
          <div className="flex items-center space-x-2.5">
            {/* Scenarios Dropdown */}
            <div className="relative">
              <button
                onClick={() => setScenarioDropdownOpen(!scenarioDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E9EDF4] hover:bg-[#F7F9FD] text-[#171D2B] text-xs font-medium transition shadow-xs"
              >
                <Play className="w-3 h-3 text-[#5278F5] fill-current" />
                <span className="hidden sm:inline">Scenarios</span>
                <ChevronDown className="w-3 h-3 text-[#778296]" />
              </button>

              {scenarioDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E9EDF4] rounded-2xl shadow-xl p-2 z-50 text-left">
                  <div className="text-[11px] font-semibold text-[#778296] uppercase tracking-wider px-2 py-1">
                    Guided Demonstrations
                  </div>
                  <button
                    onClick={() => {
                      onRunDemo('SCENARIO_A');
                      setScenarioDropdownOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#F7F9FD] transition"
                  >
                    <div className="text-xs font-semibold text-[#171D2B]">Scenario A: Meaningful Introduction</div>
                    <div className="text-[11px] text-[#778296] mt-0.5">Elena & Rashid mutual consent meeting</div>
                  </button>
                  <button
                    onClick={() => {
                      onRunDemo('SCENARIO_B');
                      setScenarioDropdownOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#F7F9FD] transition"
                  >
                    <div className="text-xs font-semibold text-[#171D2B]">Scenario B: Transport Shift Demand</div>
                    <div className="text-[11px] text-[#778296] mt-0.5">Event egress curve insight for Tariq</div>
                  </button>
                  <button
                    onClick={() => {
                      onRunDemo('SCENARIO_C');
                      setScenarioDropdownOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#F7F9FD] transition"
                  >
                    <div className="text-xs font-semibold text-[#171D2B]">Scenario C: Daily Dining Discovery</div>
                    <div className="text-[11px] text-[#778296] mt-0.5">Under 60 AED wholesome meal in Downtown</div>
                  </button>
                  <div className="border-t border-[#E9EDF4] my-1" />
                  <button
                    onClick={() => {
                      onRunDemo('RESET');
                      setScenarioDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#F7F9FD] text-rose-600 text-xs flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Baseline Data</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl bg-white border border-[#E9EDF4] hover:bg-[#F7F9FD] text-[#171D2B] transition shadow-xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[#778296]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#5278F5]" />
              )}
            </button>

            {/* Active User Switcher */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-white border border-[#E9EDF4] hover:bg-[#F7F9FD] transition shadow-xs"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#E9EDF4]"
                />
                <ChevronDown className="w-3 h-3 text-[#778296] hidden sm:block mr-1" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E9EDF4] rounded-2xl shadow-xl p-2 z-50">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[#778296] uppercase tracking-wider">
                    Switch Dubai Resident
                  </div>
                  <div className="space-y-1">
                    {allUsers.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u.id);
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left transition ${
                            isSelected ? 'bg-[#F0F5FF] text-[#171D2B]' : 'hover:bg-[#F7F9FD] text-[#778296]'
                          }`}
                        >
                          <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#171D2B] truncate flex items-center justify-between">
                              <span>{u.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#5278F5]" />}
                            </div>
                            <div className="text-[11px] text-[#778296] truncate">{u.professions[0]}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-[#E9EDF4] my-1" />
                  <button
                    onClick={() => {
                      const other = allUsers.find((u) => u.id !== currentUser.id) || allUsers[1];
                      handleCopySecondWindowLink(other.id);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#F7F9FD] text-xs text-[#5278F5] flex items-center space-x-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied 2nd Tab URL!' : 'Open 2nd Browser Session'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Native-App Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E9EDF4] px-3 py-2 pb-safe shadow-lg">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors ${
                  isActive ? 'text-[#5278F5] font-semibold' : 'text-[#778296]'
                }`}
              >
                {item.id === 'ai' && isActive ? (
                  <AnimatedAIOrb size="sm" className="mb-0.5" />
                ) : (
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#5278F5]' : 'text-[#778296]'}`} />
                )}
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
