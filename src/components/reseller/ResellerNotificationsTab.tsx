import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Bell,
  Tag,
  DollarSign,
  CheckCheck,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { NotificationItem } from '../../types/index.js';
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents.js';

interface SwipeableCardProps {
  item: NotificationItem;
  lang: string;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ item, lang, onRead, onDismiss }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = touch.clientX;
    isHorizontalSwipeRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const diffX = touch.clientX - startXRef.current;
    const diffY = touch.clientY - startYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      // Prevent browser vertical scrolling during swipe-to-dismiss
      if (e.cancelable) e.preventDefault();
      currentXRef.current = touch.clientX;
      setOffsetX(diffX);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (!isHorizontalSwipeRef.current) {
      setOffsetX(0);
      return;
    }

    // Facebook-style threshold: 80px swipe triggers dismiss
    if (Math.abs(offsetX) > 80) {
      const exitDir = offsetX > 0 ? 1 : -1;
      setOffsetX(exitDir * 400);
      setIsDismissed(true);
      setTimeout(() => {
        onDismiss(item.id);
      }, 220);
    } else {
      setOffsetX(0);
    }
    isHorizontalSwipeRef.current = null;
  };

  return (
    <div
      style={{
        maxHeight: isDismissed ? '0px' : '220px',
        opacity: isDismissed ? 0 : 1,
        marginBottom: isDismissed ? '0px' : undefined,
        transition: isDismissed
          ? 'max-height 0.25s ease-out, opacity 0.2s ease-out, margin 0.25s ease-out'
          : undefined,
      }}
      className="w-full max-w-full overflow-hidden"
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onRead(item.id)}
        style={{
          transform: `translateX(${offsetX}px)`,
          opacity: isDismissed ? 0 : Math.max(0.15, 1 - Math.abs(offsetX) / 280),
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out',
        }}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-colors cursor-pointer flex items-start gap-3 w-full max-w-full min-w-0 select-none ${
          item.isRead
            ? 'bg-[#f8fafc] border-slate-200/90 hover:bg-white hover:border-slate-300'
            : 'bg-emerald-50/50 border-emerald-200/90 shadow-2xs hover:border-emerald-400'
        }`}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border ${
          item.type === 'COMMISSION'
            ? 'bg-emerald-100/70 border-emerald-200 text-emerald-700'
            : item.type === 'SALE'
            ? 'bg-sky-100/70 border-sky-200 text-sky-700'
            : 'bg-white border-slate-200 text-[#009245]'
        }`}>
          {item.type === 'COMMISSION' ? (
            <DollarSign className="w-4 h-4" />
          ) : item.type === 'SALE' ? (
            <Tag className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
        </div>

        <div className="space-y-0.5 flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-wrap sm:flex-nowrap items-baseline justify-between gap-1.5 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 break-words line-clamp-2 min-w-0 flex-1">
              {lang === 'bn' ? item.titleBn : item.titleEn}
            </h4>
            <span className="text-[10px] text-slate-400 font-medium shrink-0 whitespace-nowrap">
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-slate-600 break-words leading-relaxed min-w-0 pt-0.5">
            {lang === 'bn' ? item.messageBn : item.messageEn}
          </p>
        </div>

        {!item.isRead && (
          <span className="w-2 h-2 rounded-full bg-[#009245] shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
};

export const ResellerNotificationsTab: React.FC = () => {
  const { lang, employeeToken } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Retention setting (7 days default, toggleable to 15 days)
  const [retentionDays, setRetentionDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tawzoon_notif_retention');
      return saved ? parseInt(saved, 10) : 7;
    } catch {
      return 7;
    }
  });

  const handleSetRetention = (days: number) => {
    setRetentionDays(days);
    try {
      localStorage.setItem('tawzoon_notif_retention', String(days));
    } catch {}
  };

  // Dismissal state persistence in localStorage (Facebook swipe-to-dismiss)
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tawzoon_dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem('tawzoon_dismissed_notifications', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Audio chime: plays ONCE only when genuine new incoming notification arrives live
  const isInitialLoadRef = useRef(true);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());

  const playNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const fetchNotifs = useCallback(async () => {
    if (!employeeToken) return;
    setLoading(true);
    try {
      const data = await api.employeeGetNotifications(employeeToken);
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);

      // Silent on initial load/mount: populate known IDs without playing sound
      if (isInitialLoadRef.current) {
        list.forEach((item) => knownNotificationIdsRef.current.add(item.id));
        isInitialLoadRef.current = false;
        return;
      }

      // Check for genuine new incoming notification ID
      let hasNew = false;
      for (const item of list) {
        if (!knownNotificationIdsRef.current.has(item.id)) {
          knownNotificationIdsRef.current.add(item.id);
          hasNew = true;
        }
      }

      // Play alert chime once only if a brand-new notification arrived
      if (hasNew) {
        playNotificationChime();
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeToken, playNotificationChime]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // Real-time synchronization
  useRealtimeEvents((event) => {
    if (
      event.type === 'NEW_NOTIFICATION' ||
      event.type === 'NOTIFICATION_ADDED' ||
      event.type === 'BRANDING_UPDATED' ||
      (event.type === 'STATE_UPDATED' && (event.data?.type === 'NOTIFICATION_ADDED' || event.data?.type === 'BRANDING_UPDATED'))
    ) {
      fetchNotifs();
    }
  });

  const handleMarkAsRead = async (id: string) => {
    if (!employeeToken) return;
    try {
      await api.employeeMarkNotificationRead(employeeToken, id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      window.dispatchEvent(new CustomEvent('tawzoon_notifications_updated'));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!employeeToken) return;
    try {
      await api.employeeMarkAllNotificationsRead(employeeToken);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new CustomEvent('tawzoon_notifications_updated'));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Retention filter (7 days default, up to 15 days if chosen) and dismissal filtering
  const now = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  const filteredNotifications = notifications.filter((item) => {
    if (dismissedIds.includes(item.id)) return false;
    const itemTime = new Date(item.createdAt).getTime();
    if (now - itemTime > maxAgeMs) return false;
    return true;
  });

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 w-full max-w-full overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2.5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#009245]" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'রিসেলার নোটিফিকেশন ও ঘোষণা' : 'Notifications & Announcements'}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* Retention Selector (7 vs 15 days) */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 text-[10px] font-bold">
            <span className="text-slate-400 pl-1.5 flex items-center gap-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
            </span>
            <button
              type="button"
              onClick={() => handleSetRetention(7)}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                retentionDays === 7
                  ? 'bg-white dark:bg-slate-700 text-[#009245] shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? '৭ দিন' : '7d'}
            </button>
            <button
              type="button"
              onClick={() => handleSetRetention(15)}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                retentionDays === 15
                  ? 'bg-white dark:bg-slate-700 text-[#009245] shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? '১৫ দিন' : '15d'}
            </button>
          </div>

          {unreadCount > 0 && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-[#e31b23] border border-rose-200 font-bold">
              {unreadCount} {lang === 'bn' ? 'টি নতুন' : 'unread'}
            </span>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#009245] border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-slate-200/80 p-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {lang === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {lang === 'bn'
              ? 'আপনার জন্য বর্তমানে কোনো নোটিফিকেশন নেই।'
              : 'You have no notifications in the selected time frame.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 w-full max-w-full overflow-hidden">
          {filteredNotifications.map((item) => (
            <SwipeableCard
              key={item.id}
              item={item}
              lang={lang}
              onRead={handleMarkAsRead}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
};
