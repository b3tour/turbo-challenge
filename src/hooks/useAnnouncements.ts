'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Typ dla ogloszen globalnych (announcements)
export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  created_by: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  is_read?: boolean;
  source?: 'announcement' | 'notification';
}

// Typ dla powiadomien indywidualnych (notifications)
export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'xp_gain' | 'level_up' | 'achievement' | 'mission_approved' | 'mission_rejected' | 'card_received' | 'battle_challenge' | 'battle_result' | 'system' | 'tuning_result';
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

// Zunifikowany typ do wyswietlania
export interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  created_at: string;
  is_read: boolean;
  source: 'announcement' | 'notification';
  originalType?: UserNotification['type'];
  link?: string | null;
}

// Mapowanie oryginalnego typu powiadomienia na docelowy URL
function getNotificationLink(type: UserNotification['type']): string | null {
  switch (type) {
    case 'battle_challenge':
    case 'battle_result':
      return '/arena';
    case 'mission_approved':
    case 'mission_rejected':
      return '/missions';
    case 'achievement':
    case 'card_received':
      return '/cards';
    case 'level_up':
      return '/profile';
    case 'xp_gain':
      return '/leaderboard';
    case 'tuning_result':
      return '/arena';
    case 'system':
    default:
      return null;
  }
}

// Mapowanie typow powiadomien na typy wizualne
const notificationTypeMap: Record<UserNotification['type'], Announcement['type']> = {
  xp_gain: 'success',
  level_up: 'success',
  achievement: 'success',
  mission_approved: 'success',
  mission_rejected: 'warning',
  card_received: 'success',
  battle_challenge: 'urgent',
  battle_result: 'success',
  tuning_result: 'info',
  system: 'info',
};

// Etykiety grupowania dla dropdown
export function getGroupLabel(type: UserNotification['type'], count: number): string {
  switch (type) {
    case 'battle_result': return `${count} wynikow bitew`;
    case 'battle_challenge': return `${count} wyzwan do bitwy`;
    case 'tuning_result': return `${count} wynikow wyzwan tuningu`;
    case 'card_received': return `${count} nowych kart`;
    case 'mission_approved': return `${count} zatwierdzonych misji`;
    case 'mission_rejected': return `${count} odrzuconych misji`;
    case 'xp_gain': return `${count} nagrod XP`;
    case 'level_up': return `${count} nowych poziomow`;
    case 'achievement': return `${count} osiagniec`;
    default: return `${count} powiadomien`;
  }
}

interface UseAnnouncementsOptions {
  onNewNotification?: (notification: UnifiedNotification) => void;
}

export function useAnnouncements(userId?: string, options?: UseAnnouncementsOptions) {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Ref for callback - avoids stale closure / dependency loop
  const onNewRef = useRef(options?.onNewNotification);
  onNewRef.current = options?.onNewNotification;

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Pobierz ogloszenia globalne
      const { data: announcements, error: annError } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false });

      if (annError) console.error('Error fetching announcements:', annError);

      // Pobierz przeczytane ogloszenia
      const { data: reads, error: readsError } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', userId);

      if (readsError) console.error('Error fetching reads:', readsError);

      const readIds = new Set((reads || []).map(r => r.announcement_id));

      // Pobierz powiadomienia indywidualne
      const { data: userNotifs, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) console.error('Error fetching notifications:', notifError);

      // Zunifikuj ogloszenia
      const unifiedAnnouncements: UnifiedNotification[] = (announcements || []).map(a => ({
        id: a.id,
        title: a.title,
        message: a.message,
        type: a.type as Announcement['type'],
        created_at: a.created_at,
        is_read: readIds.has(a.id),
        source: 'announcement' as const,
      }));

      // Zunifikuj powiadomienia
      const unifiedNotifications: UnifiedNotification[] = (userNotifs || []).map(n => {
        const origType = n.type as UserNotification['type'];
        return {
          id: n.id,
          title: n.title,
          message: n.message,
          type: notificationTypeMap[origType] || 'info',
          created_at: n.created_at,
          is_read: n.read,
          source: 'notification' as const,
          originalType: origType,
          link: getNotificationLink(origType),
        };
      });

      // Polacz i posortuj
      const all = [...unifiedAnnouncements, ...unifiedNotifications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(all);
      setUnreadCount(all.filter(n => !n.is_read).length);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();

    // Subskrybuj nowe ogloszenia
    const announcementsChannel = supabase
      .channel('announcements_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'announcements' },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'announcements' },
        () => fetchAll()
      )
      .subscribe();

    // Subskrybuj powiadomienia dla tego uzytkownika
    const notificationsChannel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Bezposredni update stanu z payloadu realtime (bez refetch)
          const newNotif = payload.new as UserNotification;
          const origType = newNotif.type as UserNotification['type'];
          const unified: UnifiedNotification = {
            id: newNotif.id,
            title: newNotif.title,
            message: newNotif.message,
            type: notificationTypeMap[origType] || 'info',
            created_at: newNotif.created_at,
            is_read: false,
            source: 'notification',
            originalType: origType,
            link: getNotificationLink(origType),
          };

          // Dodaj na poczatek listy (deduplikacja)
          setNotifications(prev => {
            if (prev.some(n => n.id === unified.id && n.source === 'notification')) return prev;
            return [unified, ...prev];
          });
          setUnreadCount(prev => prev + 1);

          // Callback dla toast
          if (onNewRef.current) {
            onNewRef.current(unified);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [fetchAll, userId]);

  // Oznacz pojedyncze jako przeczytane
  const markAsRead = async (notificationId: string, source: 'announcement' | 'notification') => {
    if (!userId) return;

    if (source === 'announcement') {
      const { error } = await supabase
        .from('announcement_reads')
        .upsert({
          announcement_id: notificationId,
          user_id: userId
        }, {
          onConflict: 'announcement_id,user_id'
        });

      if (error) console.error('Error marking announcement as read:', error);
    } else {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) console.error('Error marking notification as read:', error);
    }

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Batch: oznacz wszystkie jako przeczytane (1-2 zapytania zamiast N)
  const markAllAsRead = async () => {
    if (!userId) return;

    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;

    // Batch: oznacz wszystkie powiadomienia jednym UPDATE
    const hasUnreadNotifs = unread.some(n => n.source === 'notification');
    if (hasUnreadNotifs) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    }

    // Batch: upsert wszystkich announcement_reads naraz
    const unreadAnnouncements = unread.filter(n => n.source === 'announcement');
    if (unreadAnnouncements.length > 0) {
      const readsToInsert = unreadAnnouncements.map(a => ({
        announcement_id: a.id,
        user_id: userId,
      }));
      await supabase
        .from('announcement_reads')
        .upsert(readsToInsert, { onConflict: 'announcement_id,user_id' });
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Usun (dismiss) powiadomienie indywidualne
  const dismissNotification = async (notificationId: string) => {
    // Optimistic update
    const target = notifications.find(n => n.id === notificationId && n.source === 'notification');
    setNotifications(prev => prev.filter(n => !(n.id === notificationId && n.source === 'notification')));
    if (target && !target.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error dismissing notification:', error);
      // Revert on error
      if (target) {
        setNotifications(prev =>
          [target, ...prev].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
        if (!target.is_read) setUnreadCount(prev => prev + 1);
      }
    }
  };

  // Usun wszystkie przeczytane powiadomienia indywidualne
  const clearReadNotifications = async () => {
    if (!userId) return;

    const readNotifs = notifications.filter(n => n.is_read && n.source === 'notification');
    if (readNotifs.length === 0) return;

    // Optimistic update
    setNotifications(prev => prev.filter(n => !(n.is_read && n.source === 'notification')));

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true);

    if (error) {
      console.error('Error clearing read notifications:', error);
      fetchAll(); // Revert by refetching
    }
  };

  return {
    announcements: notifications,
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearReadNotifications,
    refresh: fetchAll
  };
}

// Hook dla admina - zarzadzanie ogloszeniami
export function useAnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createAnnouncement = async (
    title: string,
    message: string,
    type: Announcement['type'],
    expiresAt?: Date
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Nie zalogowany' };

    const { error } = await supabase
      .from('announcements')
      .insert({
        title,
        message,
        type,
        created_by: user.id,
        expires_at: expiresAt?.toISOString() || null,
        is_active: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    fetchAll();
    return { success: true, error: null };
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    fetchAll();
    return { success: true, error: null };
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    fetchAll();
    return { success: true, error: null };
  };

  return {
    announcements,
    loading,
    createAnnouncement,
    deleteAnnouncement,
    toggleActive,
    refresh: fetchAll
  };
}

// Funkcja pomocnicza do wysylania powiadomien indywidualnych
export async function sendUserNotification(
  userId: string,
  title: string,
  message: string,
  type: UserNotification['type'],
  data?: Record<string, unknown>
) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      data: data || null,
      read: false
    });

  if (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
