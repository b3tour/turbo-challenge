'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { useLevels } from '@/hooks/useLevels';
import { Card, Badge, Button, Modal } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { MissionCard, QRScanner, PhotoUpload, Quiz, GPSChecker } from '@/components/missions';
import { Mission, MissionType } from '@/types';
import { missionTypeStyles, missionTypeNames, formatNumber } from '@/lib/utils';
import { Target, Filter, Zap, QrCode, Camera, HelpCircle, MapPin, ListTodo, Lock, CheckCircle, Loader2, Ban } from 'lucide-react';

const missionIconMap: Record<string, React.ElementType> = {
  qr_code: QrCode,
  photo: Camera,
  quiz: HelpCircle,
  gps: MapPin,
  manual: ListTodo,
};

type FilterType = 'all' | MissionType;

export default function MissionsPage() {
  const { profile } = useAuth();
  const { calculateLevel } = useLevels();
  const userLevel = profile ? calculateLevel(profile.total_xp) : null;

  const {
    missions,
    userSubmissions,
    loading,
    isMissionLocked,
    completeMissionQR,
    completeMissionPhoto,
    completeMissionQuiz,
    completeMissionGPS,
  } = useMissions({ userId: profile?.id, userLevel: userLevel?.id || 1 });
  const { success, error: showError, info } = useToast();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [missionPhase, setMissionPhase] = useState<'detail' | 'execute'>('detail');

  if (!profile) return null;

  const filters: { value: FilterType; label: string; iconType?: string }[] = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'qr_code', label: 'QR', iconType: 'qr_code' },
    { value: 'photo', label: 'Zdjęcie', iconType: 'photo' },
    { value: 'quiz', label: 'Quiz', iconType: 'quiz' },
    { value: 'gps', label: 'GPS', iconType: 'gps' },
  ];

  const getUserSubmission = (missionId: string) => {
    return userSubmissions.find(s => s.mission_id === missionId) || null;
  };

  // Funkcja do określenia priorytetu statusu (niższy = wyżej w liście)
  const getStatusPriority = (mission: Mission): number => {
    const lockStatus = isMissionLocked(mission);
    const submission = getUserSubmission(mission.id);

    if (!lockStatus.locked && !submission) {
      return 0; // Do zrobienia - najwyższy priorytet
    }
    if (!lockStatus.locked && submission?.status === 'pending') {
      return 1; // Oczekuje na weryfikację
    }
    if (!lockStatus.locked && (submission?.status === 'rejected' || submission?.status === 'revoked')) {
      return 2; // Odrzucone — do ponownego zrobienia
    }
    if (lockStatus.locked) {
      return 3; // Zablokowane poziomem — nad ukończonymi
    }
    if (submission?.status === 'approved') {
      return 4; // Ukończone
    }
    if (submission?.status === 'failed') {
      return 5; // Niezaliczone — na końcu
    }
    return 6;
  };

  // Filtruj i sortuj misje
  const filteredMissions = missions
    .filter(m => filter === 'all' || m.type === filter)
    .sort((a, b) => {
      const priorityA = getStatusPriority(a);
      const priorityB = getStatusPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    setMissionPhase('detail');
    setShowMissionModal(true);
  };

  const closeModal = () => {
    setShowMissionModal(false);
    setSelectedMission(null);
    setMissionPhase('detail');
  };

  const handleQRScan = async (code: string) => {
    if (!selectedMission) return;

    const result = await completeMissionQR(selectedMission.id, code, profile.id);

    setShowQRScanner(false);
    setSelectedMission(null);
    setMissionPhase('detail');

    if (result.success) {
      success('Misja ukończona!', `Zdobyłeś +${result.xp} XP`);
    } else {
      showError('Błąd', result.error || 'Nie udało się ukończyć misji');
    }
  };

  const handlePhotoUpload = async (url: string) => {
    if (!selectedMission) return;

    const result = await completeMissionPhoto(selectedMission.id, url, profile.id);
    closeModal();

    if (result.success) {
      info('Zgłoszenie wysłane!', 'Twoje zdjęcie czeka na weryfikację');
    } else {
      showError('Błąd', result.error || 'Nie udało się wysłać zdjęcia');
    }
  };

  const handleQuizComplete = async (answers: Record<string, string>, timeMs?: number) => {
    if (!selectedMission) return;

    const isSpeedrun = selectedMission.quiz_data?.mode === 'speedrun';
    const result = await completeMissionQuiz(selectedMission.id, answers, profile.id, timeMs);
    closeModal();

    if (result.success) {
      if (result.passed) {
        if (isSpeedrun && timeMs) {
          const seconds = (timeMs / 1000).toFixed(2);
          success('Quiz zaliczony!', `Czas: ${seconds}s - Zdobyłeś +${result.xp} XP`);
        } else {
          success('Quiz zaliczony!', `Wynik: ${result.score}% - Zdobyłeś +${result.xp} XP`);
        }
      } else {
        showError('Quiz niezaliczony', `Wynik: ${result.score}% - Wymagane: ${selectedMission.quiz_data?.passing_score}%`);
      }
    } else {
      showError('Błąd', result.error || 'Nie udało się ukończyć quizu');
    }
  };

  const handleGPSSuccess = async (lat: number, lng: number) => {
    if (!selectedMission) return;

    const result = await completeMissionGPS(selectedMission.id, lat, lng, profile.id);
    closeModal();

    if (result.success) {
      success('Lokalizacja potwierdzona!', `Zdobyłeś +${result.xp} XP`);
    } else {
      showError('Błąd', result.error || 'Nie udało się potwierdzić lokalizacji');
    }
  };

  const renderMissionContent = () => {
    if (!selectedMission) return null;

    // Faza 1: Szczegóły misji
    if (missionPhase === 'detail') {
      const lockStatus = isMissionLocked(selectedMission);
      const submission = getUserSubmission(selectedMission.id);
      const isCompleted = submission?.status === 'approved';
      const isPending = submission?.status === 'pending';
      const isFailed = submission?.status === 'failed';
      const style = missionTypeStyles[selectedMission.type] || missionTypeStyles.manual;
      const Icon = missionIconMap[selectedMission.type] || ListTodo;

      return (
        <div className="p-4 space-y-3">
          {/* Ikona + Tytuł (inline) */}
          <div className="flex items-center gap-2.5">
            <Icon className={`w-5 h-5 ${style.color} flex-shrink-0`} />
            <h3 className="text-lg font-bold text-white">{selectedMission.title}</h3>
          </div>

          {/* Opis */}
          <p className="text-dark-300 text-sm leading-relaxed">{selectedMission.description}</p>

          {/* Nagroda */}
          <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
            <span className="text-sm font-medium text-white">Nagroda</span>
            <span className="flex items-center gap-1 text-sm font-bold text-pink-500">
              <Zap className="w-3.5 h-3.5" />
              {selectedMission.xp_reward} XP
            </span>
          </div>

          {/* Lokalizacja */}
          {selectedMission.location_name && (
            <div className="p-3 bg-dark-700/50 rounded-xl flex items-center gap-2">
              <MapPin className="w-4 h-4 text-dark-400" />
              <span className="text-sm text-white">{selectedMission.location_name}</span>
            </div>
          )}

          {/* Wymagany poziom */}
          {selectedMission.required_level > 1 && (
            <p className="text-sm text-dark-400">
              Wymagany poziom: {selectedMission.required_level}
            </p>
          )}

          {/* Akcja lub status */}
          {lockStatus.locked ? (
            <div className="text-center p-3 bg-dark-700/30 rounded-xl">
              <Lock className="w-6 h-6 text-dark-500 mx-auto mb-1" />
              <p className="text-dark-400 text-sm">Wymaga poziomu {lockStatus.requiredLevel}</p>
              <p className="text-dark-500 text-xs">Twój poziom: {userLevel?.id || 1}</p>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium text-sm">Misja ukończona</span>
              <span className="text-dark-400 text-xs ml-auto">+{formatNumber(submission?.xp_awarded || selectedMission.xp_reward)} XP</span>
            </div>
          ) : isPending ? (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-xl">
              <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
              <span className="text-yellow-400 font-medium text-sm">Oczekuje na weryfikację</span>
            </div>
          ) : isFailed ? (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl">
              <Ban className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium text-sm">Misja niezaliczona</span>
            </div>
          ) : (
            <Button
              fullWidth
              size="lg"
              onClick={() => {
                if (selectedMission.type === 'qr_code') {
                  setShowMissionModal(false);
                  setShowQRScanner(true);
                } else {
                  setMissionPhase('execute');
                }
              }}
            >
              Rozpocznij misję
            </Button>
          )}
        </div>
      );
    }

    // Faza 2: Wykonanie misji
    switch (selectedMission.type) {
      case 'photo':
        return (
          <PhotoUpload
            onUpload={handlePhotoUpload}
            onCancel={closeModal}
            requirements={selectedMission.photo_requirements}
            userId={profile.id}
            missionId={selectedMission.id}
          />
        );
      case 'quiz':
        if (!selectedMission.quiz_data) return null;
        return (
          <Quiz
            quizData={selectedMission.quiz_data}
            onComplete={handleQuizComplete}
            onCancel={closeModal}
          />
        );
      case 'gps':
        if (!selectedMission.location_lat || !selectedMission.location_lng) return null;
        return (
          <GPSChecker
            targetLat={selectedMission.location_lat}
            targetLng={selectedMission.location_lng}
            targetRadius={selectedMission.location_radius || 50}
            locationName={selectedMission.location_name}
            onSuccess={handleGPSSuccess}
            onCancel={closeModal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
          <Target className="w-7 h-7 text-pink-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Misje</h1>
          <p className="text-dark-400">Realizuj zadania i graj o nagrody!</p>
        </div>
        <Badge variant="default">
          {filteredMissions.length}
        </Badge>
      </div>

      {/* Filters — segmented control */}
      <div className="bg-surface-2 rounded-xl p-1 flex gap-1 mb-4">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.value
                ? 'bg-pink-500 text-white shadow-sm'
                : 'bg-transparent text-dark-400 hover:text-dark-300'
            }`}
          >
            {f.iconType && (() => { const Icon = missionIconMap[f.iconType]; return Icon ? <Icon className="w-4 h-4" /> : null; })()}
            {f.label}
          </button>
        ))}
      </div>

      {/* Missions List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredMissions.length > 0 ? (
        <div className="space-y-2">
          {filteredMissions.map(mission => {
            const lockStatus = isMissionLocked(mission);
            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                userSubmission={getUserSubmission(mission.id)}
                onClick={() => handleMissionClick(mission)}
                isLevelLocked={lockStatus.locked}
                requiredLevel={lockStatus.requiredLevel}
              />
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Filter className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">Brak misji dla wybranych filtrów</p>
        </Card>
      )}

      {/* Mission Modal */}
      <Modal
        isOpen={showMissionModal && selectedMission !== null}
        onClose={closeModal}
        title={missionPhase === 'detail' ? undefined : selectedMission?.title}
        size="lg"
      >
        {renderMissionContent()}
      </Modal>

      {/* QR Scanner (full screen) */}
      {showQRScanner && selectedMission && (
        <QRScanner
          expectedCode={selectedMission.qr_code_value}
          onScan={handleQRScan}
          onClose={() => {
            setShowQRScanner(false);
            setSelectedMission(null);
            setMissionPhase('detail');
          }}
        />
      )}
    </div>
  );
}
