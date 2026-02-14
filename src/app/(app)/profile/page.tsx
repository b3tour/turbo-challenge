'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, Badge, Button, Avatar, ProgressBar, Modal, Input, AvatarEditor } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { formatNumber, formatDate } from '@/lib/utils';
import { useLevels } from '@/hooks/useLevels';
import {
  LogOut,
  Edit2,
  Calendar,
  Phone,
  Mail,
  Shield,
  Camera,
  Loader2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, signOut, updateProfile, refreshProfile } = useAuth();
  const { getUserRank } = useLeaderboard();
  const { success, error: showError } = useToast();
  const { levels, calculateLevel, calculateLevelProgress, xpToNextLevel, getNextLevel } = useLevels();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editNick, setEditNick] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [avatarImageSrc, setAvatarImageSrc] = useState<string | null>(null);
  const [nickChangesCount, setNickChangesCount] = useState(0);

  // Synchronicznie pobierz ranking użytkownika z cache
  const userRank = profile?.id ? getUserRank(profile.id) : null;

  useEffect(() => {
    if (profile) {
      setEditNick(profile.nick);
      setEditPhone(profile.phone || '');
      // Pobierz liczbę zmian nicku
      fetchNickChangesCount();
    }
  }, [profile]);

  const fetchNickChangesCount = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('users')
      .select('nick_changes_count')
      .eq('id', profile.id)
      .single();
    if (data) {
      setNickChangesCount(data.nick_changes_count || 0);
    }
  };

  if (!profile) return null;

  const level = calculateLevel(profile.total_xp);
  const progress = calculateLevelProgress(profile.total_xp);
  const xpNeeded = xpToNextLevel(profile.total_xp);
  const nextLevel = getNextLevel(level.id);

  // Otwórz edytor zdjęcia po wybraniu pliku
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Sprawdź rozmiar (max 5MB przed kadrowaniem)
    if (file.size > 5 * 1024 * 1024) {
      showError('Błąd', 'Zdjęcie jest za duże. Maksymalny rozmiar to 5MB.');
      return;
    }

    // Sprawdź typ pliku
    if (!file.type.startsWith('image/')) {
      showError('Błąd', 'Wybierz plik graficzny (JPG, PNG, itp.)');
      return;
    }

    // Konwertuj na data URL i otwórz edytor
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarImageSrc(reader.result as string);
      setShowAvatarEditor(true);
    };
    reader.readAsDataURL(file);

    // Wyczyść input
    event.target.value = '';
  };

  // Zapisz przycięte zdjęcie
  const handleAvatarSave = async (croppedImage: Blob) => {
    if (!profile) return;

    setIsUploadingAvatar(true);

    try {
      const fileName = `${profile.id}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      // Upload do Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('mission-photos')
        .upload(filePath, croppedImage, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Pobierz publiczny URL
      const { data: { publicUrl } } = supabase.storage
        .from('mission-photos')
        .getPublicUrl(filePath);

      // Zaktualizuj profil
      const { success: updateSuccess, error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      });

      if (updateSuccess) {
        success('Zdjęcie zaktualizowane', 'Twoje zdjęcie profilowe zostało zmienione');
        setShowAvatarEditor(false);
        setAvatarImageSrc(null);
        refreshProfile();
      } else {
        throw new Error(updateError || 'Nie udało się zaktualizować profilu');
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      showError('Błąd', err.message || 'Nie udało się wgrać zdjęcia');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      // Jeśli nick się zmienił, użyj RPC z limitem
      if (editNick !== profile?.nick) {
        const { data, error: rpcError } = await supabase
          .rpc('request_nick_change', {
            p_user_id: profile?.id,
            p_new_nick: editNick
          });

        if (rpcError) {
          showError('Błąd', rpcError.message);
          setIsSaving(false);
          return;
        }

        if (data && data.length > 0) {
          const result = data[0];
          if (!result.success) {
            showError('Błąd', result.message);
            setIsSaving(false);
            return;
          }

          if (result.requires_approval) {
            success('Prośba wysłana', result.message);
          } else {
            success('Nick zmieniony', result.message);
          }
        }
      }

      // Aktualizuj telefon (zawsze dozwolone)
      if (editPhone !== (profile?.phone || '')) {
        await updateProfile({ phone: editPhone || undefined });
      }

      setShowEditModal(false);
      refreshProfile();
      fetchNickChangesCount();
    } catch (err: any) {
      showError('Błąd', err.message || 'Nie udało się zaktualizować profilu');
    }

    setIsSaving(false);
  };

  return (
    <div className="py-6 space-y-8">
      {/* Profile Header */}
      <Card variant="glass" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-turbo-500/5 rounded-full blur-3xl" />

        <div className="flex items-start gap-4 mb-6">
          <div className="relative group">
            <Avatar
              src={profile.avatar_url}
              fallback={profile.nick}
              size="xl"
              showBorder
            />
            {/* Przycisk zmiany zdjęcia */}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
                disabled={isUploadingAvatar}
              />
              {isUploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </label>
            {/* Przycisk mobilny - widoczny zawsze na telefonie */}
            <button
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              className="md:hidden absolute -bottom-2 -right-2 w-8 h-8 bg-turbo-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
            {/* Badge poziomu */}
            <div
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: level.badge_color }}
            >
              {level.badge_icon}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{profile.nick}</h1>
              {profile.is_admin && (
                <Badge variant="turbo" size="sm">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-dark-300">{level.name}</p>
            {userRank && (
              <p className="text-turbo-400 text-sm mt-1">
                #{userRank} w rankingu
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditModal(true)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>

        {/* XP Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-dark-400">Poziom {level.id}</span>
            <span className="text-turbo-400 font-bold">
              {formatNumber(profile.total_xp)} XP
            </span>
          </div>
          <ProgressBar value={progress} size="lg" animated />
          <p className="text-xs text-dark-500 mt-2 text-center">
            {nextLevel
              ? `${formatNumber(xpNeeded)} XP do poziomu ${nextLevel.id} (${nextLevel.name})`
              : 'Maksymalny poziom osiągnięty!'}
          </p>
        </div>

        {/* Donation Progress - zawsze widoczny */}
        <div className="pt-4 mt-4 border-t border-dark-700">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-dark-400 flex items-center gap-1">
              <span className="text-base leading-none">❤️</span>
              Wsparcie Turbo Pomoc
            </span>
            <span className="text-red-400 font-bold">
              {(profile.donation_total || 0).toFixed(2)} zł
            </span>
          </div>
          <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((profile.donation_total || 0) / 100) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-dark-500 mt-2 text-center">
            {(profile.donation_total || 0) > 0
              ? 'Dziękujemy za Twój wkład!'
              : 'Kup kartę i wesprzyj fundację!'}
          </p>
        </div>
      </Card>

      {/* Account Info */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Informacje o koncie</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl">
            <Mail className="w-5 h-5 text-dark-400" />
            <div className="flex-1">
              <p className="text-sm text-dark-400">Email</p>
              <p className="text-white">{profile.email}</p>
            </div>
          </div>

          {profile.phone && (
            <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl">
              <Phone className="w-5 h-5 text-dark-400" />
              <div className="flex-1">
                <p className="text-sm text-dark-400">Telefon</p>
                <p className="text-white">{profile.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl">
            <Calendar className="w-5 h-5 text-dark-400" />
            <div className="flex-1">
              <p className="text-sm text-dark-400">Dołączył/a</p>
              <p className="text-white">{formatDate(profile.created_at)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Level Progress */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Postęp poziomów</h2>

        <div className="space-y-3">
          {levels.slice(0, 5).map(lvl => {
            const isCurrentLevel = lvl.id === level.id;
            const isCompleted = profile.total_xp >= lvl.max_xp;
            const isLocked = lvl.min_xp > profile.total_xp;

            return (
              <div
                key={lvl.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isCurrentLevel
                    ? 'bg-turbo-500/10 border-turbo-500/30'
                    : isCompleted
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-dark-700 border-dark-600'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: isLocked ? '#334155' : `${lvl.badge_color}20`,
                  }}
                >
                  {lvl.badge_icon}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isLocked ? 'text-dark-400' : 'text-white'}`}>
                    {lvl.name}
                  </p>
                  <p className="text-xs text-dark-400">
                    {formatNumber(lvl.min_xp)} - {lvl.max_xp === Infinity ? '∞' : formatNumber(lvl.max_xp)} XP
                  </p>
                </div>
                {isCurrentLevel && (
                  <Badge variant="turbo" size="sm">Aktualny</Badge>
                )}
                {isCompleted && !isCurrentLevel && (
                  <Badge variant="success" size="sm">✓</Badge>
                )}
              </div>
            );
          })}

          {levels.length > 5 && (
            <p className="text-center text-dark-400 text-sm">
              + {levels.length - 5} więcej poziomów do odblokowania
            </p>
          )}
        </div>
      </Card>

      {/* Admin Panel Link */}
      {profile.is_admin && (
        <Button
          variant="secondary"
          fullWidth
          onClick={() => router.push('/admin')}
          className="border-turbo-500/50"
        >
          <Shield className="w-5 h-5 mr-2 text-turbo-500" />
          Panel Admina
        </Button>
      )}

      {/* Legal */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Informacje prawne</h2>
        <div className="space-y-2">
          <Link
            href="/terms"
            className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl hover:bg-surface-3 transition-colors"
          >
            <FileText className="w-5 h-5 text-dark-400" />
            <span className="text-white text-sm">Regulamin</span>
          </Link>
          <Link
            href="/privacy"
            className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl hover:bg-surface-3 transition-colors"
          >
            <ShieldCheck className="w-5 h-5 text-dark-400" />
            <span className="text-white text-sm">Polityka prywatności</span>
          </Link>
        </div>
        {profile.terms_accepted_at && (
          <p className="text-xs text-dark-500 mt-3">
            Regulamin zaakceptowany: {formatDate(profile.terms_accepted_at)}
          </p>
        )}
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        fullWidth
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Wyloguj się
      </Button>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edytuj profil"
      >
        <div className="space-y-4">
          <div>
            <Input
              label="Nick"
              value={editNick}
              onChange={e => setEditNick(e.target.value)}
              disabled={isSaving}
            />
            {nickChangesCount < 2 ? (
              <p className="text-xs text-dark-400 mt-1">
                Pozostało darmowych zmian nicku: {2 - nickChangesCount}
              </p>
            ) : (
              <p className="text-xs text-yellow-500 mt-1">
                Zmiana nicku wymaga akceptacji administratora
              </p>
            )}
          </div>

          <Input
            label="Numer telefonu (opcjonalnie)"
            value={editPhone}
            onChange={e => setEditPhone(e.target.value)}
            placeholder="+48 123 456 789"
            disabled={isSaving}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={isSaving}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSaveProfile}
              loading={isSaving}
              className="flex-1"
            >
              Zapisz
            </Button>
          </div>
        </div>
      </Modal>

      {/* Avatar Editor Modal */}
      {avatarImageSrc && (
        <AvatarEditor
          isOpen={showAvatarEditor}
          onClose={() => {
            setShowAvatarEditor(false);
            setAvatarImageSrc(null);
          }}
          imageSrc={avatarImageSrc}
          onSave={handleAvatarSave}
          isSaving={isUploadingAvatar}
        />
      )}
    </div>
  );
}
