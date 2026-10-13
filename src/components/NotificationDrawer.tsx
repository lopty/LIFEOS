import React from 'react';
import {
  Bell,
  X,
  Clock,
  Check,
  ThumbsDown,
  VolumeX,
} from 'lucide-react';
import { NotificationItem } from '../types/index.ts';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onFeedback: (
    id: string,
    action: 'DISMISS' | 'SNOOZE' | 'NOT_INTERESTED' | 'STOP_TOPIC'
  ) => Promise<void>;
  onNavigateToChat: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onFeedback,
  onNavigateToChat,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity" />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 pt-3">
              LIFEOS notifies you only when there is genuine contextual value. Commercial broadcasts are blocked.
            </p>

            <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Your inbox is up to date and quiet.
                </div>
              ) : (
                notifications.map((n) => {
                  const isAction = n.priority === 'ACTION_REQUIRED';
                  return (
                    <div
                      key={n.id}
                      className={`p-4 rounded-2xl border transition space-y-2 ${
                        isAction
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase text-slate-500">
                          {n.priority.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(n.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-900">{n.title}</h4>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                        <button
                          onClick={() => {
                            onNavigateToChat();
                            onClose();
                          }}
                          className="text-slate-900 hover:underline font-medium"
                        >
                          Open in Companion →
                        </button>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onFeedback(n.id, 'SNOOZE')}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500"
                            title="Snooze 1 hour"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onFeedback(n.id, 'NOT_INTERESTED')}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500"
                            title="Not interested"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onFeedback(n.id, 'DISMISS')}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500"
                            title="Dismiss"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center space-x-2">
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            <span>Quiet hours automatically buffer incoming notifications.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
