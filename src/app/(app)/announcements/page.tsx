'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAnnouncements, UnifiedNotification } from '@/hooks/useAnnouncements';
import { Card, Badge } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  CheckCheck,
  Clock,
  Megaphone,
  ChevronRight,
  X,
  Trash2,
} from 'lucide-react';

const typeConfig: Record<UnifiedNotification['type'], { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  info: { icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Informacja' },
  success: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Sukces' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Ostrzezenie' },
  urgent: { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Pilne' },
};

type FilterType = 'all' | 'unread' | 'read';

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearReadNotifications,
  } = useAnnouncements(profile?.id);
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  if (!profile) return null;

  const readCount = notifications.filter(n => n.is_read).length;
  const hasReadPersonalNotifs = notifications.some(n => n.is_read && n.source === 'notification');

  const filters: { value: FilterType; label: string; icon: React.ElementType }[] = [
    { value: 'all', label: 'Wszystkie', icon: Megaphone },
    { value: 'unread', label: 'Nieprzeczytane', icon: Bell },
    { value: 'read', label: 'Przeczytane', icon: CheckCheck },
  ];

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const handleNotificationClick = (notification: UnifiedNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id, notification.source);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleDismiss = (e: React.MouseEvent, notification: UnifiedNotification) => {
    e.stopPropagation();
    dismissNotification(notification.id);
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-turbo-500" />
          Powiadomienia
        </h1>
        {unreadCount > 0 && (
          <Badge variant="turbo">
            {unreadCount} nowych
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map(f => {
          const Icon = f.icon;
          const count = f.value === 'all'
            ? notifications.length
            : f.value === 'unread'
              ? unreadCount
              : readCount;

          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                  ? 'bg-turbo-500 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === f.value ? 'bg-white/20' : 'bg-dark-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4 mb-4">
        {unreadCount > 0 && filter !== 'read' && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-turbo-400 hover:text-turbo-300"
          >
            <CheckCheck className="w-4 h-4" />
            Oznacz wszystkie jako przeczytane
          </button>
        )}
        {hasReadPersonalNotifs && (filter === 'all' || filter === 'read') && (
          <button
            onClick={clearReadNotifications}
            className="flex items-center gap-2 text-sm text-dark-400 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Wyczysc przeczytane
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-24 animate-pulse bg-dark-700" />
          ))}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map(notification => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <Card
                key={`${notification.source}-${notification.id}`}
                className={`cursor-pointer transition-all hover:border-dark-600 ${
                  !notification.is_read ? 'border-turbo-500/30 bg-turbo-500/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${config.bgColor} flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${!notification.is_read ? 'text-white' : 'text-dark-200'}`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-turbo-500 rounded-full flex-shrink-0" />
                      )}
                    </div>

                    <p className={`text-sm mb-2 ${!notification.is_read ? 'text-dark-300' : 'text-dark-400'}`}>
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(notification.created_at)}
                      </span>
                      <Badge
                        variant="default"
                        className={`text-xs ${config.bgColor} ${config.color} border-0`}
                      >
                        {config.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Dismiss / Navigation */}
                  <div className="flex-shrink-0 self-center flex items-center gap-1">
                    {notification.source === 'notification' && (
                      <button
                        onClick={(e) => handleDismiss(e, notification)}
                        className="p-1.5 hover:bg-dark-600 rounded transition-colors text-dark-500 hover:text-red-400"
                        title="Usun powiadomienie"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {notification.link && (
                      <ChevronRight className="w-5 h-5 text-dark-500" />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Bell className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">
            {filter === 'unread'
              ? 'Brak nieprzeczytanych powiadomien'
              : filter === 'read'
                ? 'Brak przeczytanych powiadomien'
                : 'Brak powiadomien'
            }
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-sm text-turbo-400 hover:text-turbo-300 mt-2"
            >
              Pokaz wszystkie
            </button>
          )}
        </Card>
      )}
    </div>
  );
}
