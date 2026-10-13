import React, { useState, useEffect } from 'react';
import {
  Compass,
  MessageSquare,
  User,
  MapPin,
  GitBranch,
  TrendingUp,
  Bell,
  ChevronDown,
  Check,
  Play,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types/index.ts';

interface NavbarProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchUser: (userId: string) => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onRunDemo: (scenario: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C' | 'RESET') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  activeTab,
  setActiveTab,
  onSwitchUser,
  notifications,
  onOpenNotifications,
  onRunDemo,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
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
    { id: 'home', label: 'Today', icon: Compass },
    { id: 'ai', label: 'Companion', icon: MessageSquare },
    { id: 'map', label: 'City Map', icon: MapPin },
    { id: 'moments', label: 'Moments', icon: GitBranch },
    { id: 'mylife', label: 'My Profile', icon: User },
    { id: 'trade', label: 'Market', icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Micro top header for Dubai status & Multi-session */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-slate-700">Dubai {dubaiTime || '11:45 PM'}</span>
          <span>·</span>
          <span>GST (UTC+4)</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline text-emerald-700 font-medium">Living City Active</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Scenario Runner */}
          <div className="relative">
            <button
              onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition"
            >
              <Play className="w-3 h-3 text-emerald-600 fill-current" />
              <span>Demo Scenarios</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {demoDropdownOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 text-left">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Guided Demonstrations
                </div>
                <button
                  onClick={() => {
                    onRunDemo('SCENARIO_A');
                    setDemoDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="text-xs font-semibold text-slate-900">Scenario A: Introduction</div>
                  <div className="text-[11px] text-slate-500">Elena and Rashid mutual consent meeting</div>
                </button>
                <button
                  onClick={() => {
                    onRunDemo('SCENARIO_B');
                    setDemoDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="text-xs font-semibold text-slate-900">Scenario B: Transport Shift</div>
                  <div className="text-[11px] text-slate-500">Event demand curve insight for Tariq</div>
                </button>
                <button
                  onClick={() => {
                    onRunDemo('SCENARIO_C');
                    setDemoDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="text-xs font-semibold text-slate-900">Scenario C: Daily Dining</div>
                  <div className="text-[11px] text-slate-500">Fast healthy meal match in Downtown</div>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    onRunDemo('RESET');
                    setDemoDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-rose-600 text-xs flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const otherUser = allUsers.find((u) => u.id !== currentUser.id) || allUsers[1];
              handleCopySecondWindowLink(otherUser.id);
            }}
            className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 text-xs font-medium transition"
            title="Open second browser window to test live multi-user coordination"
          >
            <ExternalLink className="w-3 h-3" />
            <span>{copiedLink ? 'Copied 2nd Tab URL' : 'Open 2nd Session'}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer"
          onClick={() => setActiveTab('home')}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight">
            L
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-base text-slate-900 tracking-tight">LIFEOS</span>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Dubai
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Active Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-left transition bg-white"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center space-x-1">
                  <span>{currentUser.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[100px]">
                  {currentUser.primaryArea}
                </div>
              </div>
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Resident Profile
                </div>
                <div className="space-y-1">
                  {allUsers.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u.id);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2.5 p-2 rounded-lg text-left transition ${
                          isSelected ? 'bg-slate-100 font-semibold text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-900 truncate flex items-center justify-between">
                            <span>{u.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{u.professions[0]}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden border-t border-slate-200 px-2 py-1 flex justify-around bg-white">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
