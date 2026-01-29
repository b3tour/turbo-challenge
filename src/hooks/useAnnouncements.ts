'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Typ dla ogłoszeń globalnych (announcements)
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

// Typ dla powiadomień indywidualnych (notifications)
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

// Zunifikowany typ do wyświetlania
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
      return '/battles';
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
      return '/tuning';
    case 'system':
    default:
      return null;
  }
}

// Mapowanie typów powiadomień na typy wizualne
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

export function useAnnouncements(userId?: string) {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Pobierz ogłoszenia globalne
      const { data: announcements, error: annError } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false });

      if (annError) console.error('Error fetching announcements:', annError);

      // Pobierz przeczytane ogłoszenia
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

      // Zunifikuj ogłoszenia
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

      // Połącz i posortuj
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

    // Subskrybuj nowe ogłoszenia
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

    // Subskrybuj nowe powiadomienia dla tego użytkownika
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
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [fetchAll, userId]);

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

  const markAllAsRead = async () => {
    if (!userId) return;

    const unread = notifications.filter(n => !n.is_read);

    // Oznacz ogłoszenia
    const unreadAnnouncements = unread.filter(n => n.source === 'announcement');
    for (const ann of unreadAnnouncements) {
      await supabase
        .from('announcement_reads')
        .upsert({
          announcement_id: ann.id,
          user_id: userId
        }, {
          onConflict: 'announcement_id,user_id'
        });
    }

    // Oznacz powiadomienia
    const unreadNotifications = unread.filter(n => n.source === 'notification');
    if (unreadNotifications.length > 0) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return {
    announcements: notifications, // zachowaj starą nazwę dla kompatybilności
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchAll
  };
}

// Hook dla admina - zarządzanie ogłoszeniami
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

// Funkcja pomocnicza do wysyłania powiadomień indywidualnych
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
