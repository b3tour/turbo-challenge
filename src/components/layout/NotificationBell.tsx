'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAnnouncements, UnifiedNotification, getGroupLabel, UserNotification } from '@/hooks/useAnnouncements';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/utils';
import {
  Bell,
  X,
  CheckCheck,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Trash2,
  Layers,
} from 'lucide-react';

const typeConfig: Record<UnifiedNotification['type'], { icon: React.ElementType; color: string; bgColor: string }> = {
  info: { icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  success: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  urgent: { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

// --- Grupowanie powiadomien w dropdown ---

interface DropdownItem {
  key: string;
  isGroup: boolean;
  title: string;
  message: string;
  type: UnifiedNotification['type'];
  created_at: string;
  is_read: boolean;
  link?: string | null;
  source: 'announcement' | 'notification';
  id: string;
  count?: number;
  groupItems?: UnifiedNotification[];
}

function buildDropdownItems(notifications: UnifiedNotification[]): DropdownItem[] {
  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  const items: DropdownItem[] = [];

  // Grupuj nieprzeczytane wg originalType (tylko grupy 3+)
  const unreadByType = new Map<string, UnifiedNotification[]>();
  const unreadSingles: UnifiedNotification[] = [];

  for (const n of unread) {
    if (n.source === 'announcement' || !n.originalType) {
      unreadSingles.push(n);
      continue;
    }
    const key = n.originalType;
    if (!unreadByType.has(key)) unreadByType.set(key, []);
    unreadByType.get(key)!.push(n);
  }

  Array.from(unreadByType.entries()).forEach(([typeKey, group]) => {
    if (group.length >= 3) {
      items.push({
        key: `group-${typeKey}`,
        isGroup: true,
        title: getGroupLabel(typeKey as UserNotification['type'], group.length),
        message: 'Kliknij aby zobaczyc szczegoly',
        type: group[0].type,
        created_at: group[0].created_at,
        is_read: false,
        link: group[0].link,
        source: 'notification',
        id: group[0].id,
        count: group.length,
        groupItems: group,
      });
    } else {
      unreadSingles.push(...group);
    }
  });

  // Dodaj niezgrupowane nieprzeczytane (posortowane wg daty)
  const sortedUnreadSingles = [...unreadSingles].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  for (const n of sortedUnreadSingles) {
    items.push({
      key: `${n.source}-${n.id}`,
      isGroup: false,
      title: n.title,
      message: n.message,
      type: n.type,
      created_at: n.created_at,
      is_read: false,
      link: n.link,
      source: n.source,
      id: n.id,
    });
  }

  // Dodaj przeczytane (bez grupowania)
  for (const n of read) {
    items.push({
      key: `${n.source}-${n.id}`,
      isGroup: false,
      title: n.title,
      message: n.message,
      type: n.type,
      created_at: n.created_at,
      is_read: true,
      link: n.link,
      source: n.source,
      id: n.id,
    });
  }

  return items.slice(0, 8);
}

// --- Komponent ---

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const { info } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toast callback dla nowych powiadomien z realtime
  const handleNewNotification = useCallback((n: UnifiedNotification) => {
    info(n.title, n.message);
  }, [info]);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearReadNotifications,
  } = useAnnouncements(userId, { onNewNotification: handleNewNotification });

  // Zamknij dropdown po kliknieciu poza
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Zgrupowane elementy dropdown (nieprzeczytane najpierw)
  const dropdownItems = useMemo(() => buildDropdownItems(notifications), [notifications]);
  const hasReadNotifications = notifications.some(n => n.is_read && n.source === 'notification');

  const handleItemClick = (item: DropdownItem) => {
    if (item.isGroup) {
      setIsOpen(false);
      router.push('/announcements');
      return;
    }

    if (!item.is_read) {
      markAsRead(item.id, item.source);
    }
    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismissNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-dark-700 transition-colors"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-turbo-400' : 'text-dark-400'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 max-h-[28rem] bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700 bg-dark-850">
            <h3 className="font-medium text-white">Powiadomienia</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-turbo-400 hover:text-turbo-300 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Przeczytaj
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-dark-700 rounded"
              >
                <X className="w-4 h-4 text-dark-400" />
              </button>
            </div>
          </div>

          {/* Lista powiadomien */}
          <div className="overflow-y-auto max-h-72">
            {dropdownItems.length === 0 ? (
              <div className="text-center py-8 text-dark-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Brak powiadomien</p>
              </div>
            ) : (
              dropdownItems.map(item => {
                const config = typeConfig[item.type];
                const Icon = item.isGroup ? Layers : config.icon;

                return (
                  <div
                    key={item.key}
                    onClick={() => handleItemClick(item)}
                    className={`group px-4 py-3 border-b border-dark-700/50 cursor-pointer transition-colors hover:bg-dark-700/50 ${
                      !item.is_read ? 'bg-dark-750' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${config.bgColor} flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-medium truncate ${!item.is_read ? 'text-white' : 'text-dark-300'}`}>
                            {item.title}
                          </h4>
                          {item.isGroup && item.count && (
                            <span className="text-xs bg-turbo-500/20 text-turbo-400 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                              {item.count}
                            </span>
                          )}
                          {!item.is_read && !item.isGroup && (
                            <span className="w-2 h-2 bg-turbo-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-dark-400 line-clamp-2 mt-0.5">
                          {item.message}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">
                          {formatDateTime(item.created_at)}
                        </p>
                      </div>
                      {/* Przycisk usun - zawsze widoczny (mobile) */}
                      {!item.isGroup && item.source === 'notification' && (
                        <button
                          onClick={(e) => handleDismiss(e, item.id)}
                          className="p-1.5 hover:bg-dark-600 rounded transition-colors flex-shrink-0 text-dark-500 hover:text-red-400"
                          title="Usun powiadomienie"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-dark-700 flex">
            {hasReadNotifications && (
              <button
                onClick={clearReadNotifications}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 text-xs text-dark-400 hover:text-red-400 hover:bg-dark-700/50 transition-colors border-r border-dark-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Wyczysc przeczytane
              </button>
            )}
            <Link
              href="/announcements"
              onClick={() => setIsOpen(false)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 text-sm text-turbo-400 hover:text-turbo-300 hover:bg-dark-700/50 transition-colors"
            >
              Zobacz wszystkie
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
