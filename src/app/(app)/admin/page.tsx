'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, Button, Badge, Input, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Mission, Submission, User } from '@/types';
import {
  formatNumber,
  formatDateTime,
  missionTypeIcons,
  missionTypeNames,
  generateQRCode,
} from '@/lib/utils';
import {
  Shield,
  Users,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Settings,
  BarChart3,
  Image as ImageIcon,
} from 'lucide-react';

type AdminTab = 'overview' | 'submissions' | 'missions' | 'users';

export default function AdminPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMissions: 0,
    pendingSubmissions: 0,
    totalXP: 0,
  });

  // Modal states
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    xp_reward: 50,
    type: 'qr_code' as Mission['type'],
    location_name: '',
    qr_code_value: '',
  });

  // Sprawdź czy użytkownik jest adminem
  useEffect(() => {
    if (profile && !profile.is_admin) {
      router.push('/dashboard');
    }
  }, [profile, router]);

  // Pobierz dane
  useEffect(() => {
    if (!profile?.is_admin) return;

    const fetchData = async () => {
      setLoading(true);

      // Pobierz statystyki
      const [usersRes, missionsRes, submissionsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('missions').select('*'),
        supabase
          .from('submissions')
          .select('*, user:users(*), mission:missions(*)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (usersRes.data) setUsers(usersRes.data as User[]);
      if (missionsRes.data) setMissions(missionsRes.data as Mission[]);
      if (submissionsRes.data) setPendingSubmissions(submissionsRes.data as Submission[]);

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalMissions: missionsRes.data?.length || 0,
        pendingSubmissions: submissionsRes.data?.length || 0,
        totalXP: usersRes.data?.reduce((sum, u) => sum + (u.total_xp || 0), 0) || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, [profile?.is_admin]);

  const handleApproveSubmission = async (submission: Submission) => {
    if (!submission.mission) return;

    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        xp_awarded: submission.mission.xp_reward,
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    if (error) {
      showError('Błąd', 'Nie udało się zatwierdzić zgłoszenia');
      return;
    }

    // Dodaj XP użytkownikowi
    await supabase.rpc('add_user_xp', {
      p_user_id: submission.user_id,
      p_xp_amount: submission.mission.xp_reward,
    });

    success('Zatwierdzone!', `Przyznano ${submission.mission.xp_reward} XP`);
    setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
    setShowSubmissionModal(false);
    setSelectedSubmission(null);
  };

  const handleRejectSubmission = async (submission: Submission, reason?: string) => {
    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'rejected',
        admin_notes: reason,
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    if (error) {
      showError('Błąd', 'Nie udało się odrzucić zgłoszenia');
      return;
    }

    success('Odrzucone', 'Zgłoszenie zostało odrzucone');
    setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
    setShowSubmissionModal(false);
    setSelectedSubmission(null);
  };

  const handleCreateMission = async () => {
    if (!newMission.title || !newMission.description) {
      showError('Błąd', 'Wypełnij wymagane pola');
      return;
    }

    const missionData = {
      ...newMission,
      qr_code_value: newMission.type === 'qr_code'
        ? (newMission.qr_code_value || generateQRCode())
        : null,
      status: 'active',
    };

    const { data, error } = await supabase
      .from('missions')
      .insert(missionData)
      .select()
      .single();

    if (error) {
      showError('Błąd', 'Nie udało się utworzyć misji');
      return;
    }

    success('Misja utworzona!', `Kod QR: ${data.qr_code_value || 'N/A'}`);
    setMissions(prev => [data as Mission, ...prev]);
    setShowMissionModal(false);
    setNewMission({
      title: '',
      description: '',
      xp_reward: 50,
      type: 'qr_code',
      location_name: '',
      qr_code_value: '',
    });
  };

  if (!profile?.is_admin) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: BarChart3 },
    { id: 'submissions', label: 'Zgłoszenia', icon: Clock, badge: stats.pendingSubmissions },
    { id: 'missions', label: 'Misje', icon: Target },
    { id: 'users', label: 'Użytkownicy', icon: Users },
  ];

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-turbo-500/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-turbo-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Panel Admina</h1>
          <p className="text-sm text-dark-400">Zarządzaj aplikacją Turbo Challenge</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-turbo-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-24 animate-pulse bg-dark-700" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="text-center">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                  <div className="text-sm text-dark-400">Użytkowników</div>
                </Card>

                <Card className="text-center">
                  <Target className="w-8 h-8 text-turbo-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.totalMissions}</div>
                  <div className="text-sm text-dark-400">Misji</div>
                </Card>

                <Card className="text-center">
                  <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.pendingSubmissions}</div>
                  <div className="text-sm text-dark-400">Oczekujących</div>
                </Card>

                <Card className="text-center">
                  <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{formatNumber(stats.totalXP)}</div>
                  <div className="text-sm text-dark-400">Łączne XP</div>
                </Card>
              </div>

              {stats.pendingSubmissions > 0 && (
                <Card className="border-yellow-500/30">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium text-white">Oczekujące zgłoszenia</p>
                      <p className="text-sm text-dark-400">
                        {stats.pendingSubmissions} zgłoszeń wymaga weryfikacji
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setActiveTab('submissions')}>
                      Sprawdź
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="space-y-3">
              {pendingSubmissions.length === 0 ? (
                <Card className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-dark-300">Brak oczekujących zgłoszeń</p>
                </Card>
              ) : (
                pendingSubmissions.map(submission => (
                  <Card
                    key={submission.id}
                    hover
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowSubmissionModal(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {submission.photo_url && (
                        <div className="w-16 h-16 rounded-lg bg-dark-700 overflow-hidden">
                          <img
                            src={submission.photo_url}
                            alt="Submission"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {submission.mission?.title}
                        </p>
                        <p className="text-sm text-dark-400">
                          od: {submission.user?.nick}
                        </p>
                        <p className="text-xs text-dark-500">
                          {formatDateTime(submission.created_at)}
                        </p>
                      </div>
                      <Badge variant="warning">Oczekuje</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Missions Tab */}
          {activeTab === 'missions' && (
            <div className="space-y-4">
              <Button fullWidth onClick={() => setShowMissionModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Dodaj nową misję
              </Button>

              <div className="space-y-3">
                {missions.map(mission => (
                  <Card key={mission.id}>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{missionTypeIcons[mission.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{mission.title}</p>
                        <p className="text-sm text-dark-400">
                          {missionTypeNames[mission.type]} • {mission.xp_reward} XP
                        </p>
                        {mission.qr_code_value && (
                          <p className="text-xs text-turbo-400 font-mono">
                            QR: {mission.qr_code_value}
                          </p>
                        )}
                      </div>
                      <Badge variant={mission.status === 'active' ? 'success' : 'default'}>
                        {mission.status === 'active' ? 'Aktywna' : 'Nieaktywna'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {users.map(user => (
                <Card key={user.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-white font-bold">
                      {user.nick.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{user.nick}</p>
                        {user.is_admin && (
                          <Badge variant="turbo" size="sm">Admin</Badge>
                        )}
                      </div>
                      <p className="text-sm text-dark-400">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-turbo-400">{formatNumber(user.total_xp)}</div>
                      <div className="text-xs text-dark-500">Lvl {user.level}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* New Mission Modal */}
      <Modal
        isOpen={showMissionModal}
        onClose={() => setShowMissionModal(false)}
        title="Nowa misja"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Tytuł misji *"
            value={newMission.title}
            onChange={e => setNewMission(prev => ({ ...prev, title: e.target.value }))}
            placeholder="np. Selfie z maskotką"
          />

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Opis *</label>
            <textarea
              value={newMission.description}
              onChange={e => setNewMission(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Opisz co użytkownik ma zrobić..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-turbo-500 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Typ misji</label>
              <select
                value={newMission.type}
                onChange={e => setNewMission(prev => ({ ...prev, type: e.target.value as Mission['type'] }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              >
                <option value="qr_code">Kod QR</option>
                <option value="photo">Zdjęcie</option>
                <option value="quiz">Quiz</option>
                <option value="gps">Lokalizacja GPS</option>
                <option value="manual">Ręczna</option>
              </select>
            </div>

            <Input
              label="Nagroda XP"
              type="number"
              value={newMission.xp_reward}
              onChange={e => setNewMission(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 50 }))}
            />
          </div>

          <Input
            label="Lokalizacja (opcjonalnie)"
            value={newMission.location_name}
            onChange={e => setNewMission(prev => ({ ...prev, location_name: e.target.value }))}
            placeholder="np. Strefa Turbo"
          />

          {newMission.type === 'qr_code' && (
            <Input
              label="Wartość kodu QR (zostaw puste dla autogeneracji)"
              value={newMission.qr_code_value}
              onChange={e => setNewMission(prev => ({ ...prev, qr_code_value: e.target.value }))}
              placeholder="np. TC-EVENT-001"
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowMissionModal(false)} className="flex-1">
              Anuluj
            </Button>
            <Button onClick={handleCreateMission} className="flex-1">
              Utwórz misję
            </Button>
          </div>
        </div>
      </Modal>

      {/* Submission Review Modal */}
      <Modal
        isOpen={showSubmissionModal && selectedSubmission !== null}
        onClose={() => {
          setShowSubmissionModal(false);
          setSelectedSubmission(null);
        }}
        title="Weryfikacja zgłoszenia"
        size="lg"
      >
        {selectedSubmission && (
          <div className="space-y-4">
            <Card variant="outlined">
              <p className="text-sm text-dark-400">Misja</p>
              <p className="font-medium text-white">{selectedSubmission.mission?.title}</p>
              <p className="text-sm text-dark-400 mt-2">Użytkownik</p>
              <p className="text-white">{selectedSubmission.user?.nick}</p>
              <p className="text-sm text-dark-400 mt-2">Data zgłoszenia</p>
              <p className="text-white">{formatDateTime(selectedSubmission.created_at)}</p>
            </Card>

            {selectedSubmission.photo_url && (
              <div>
                <p className="text-sm text-dark-400 mb-2">Przesłane zdjęcie</p>
                <img
                  src={selectedSubmission.photo_url}
                  alt="Submission"
                  className="w-full rounded-xl"
                />
              </div>
            )}

            {selectedSubmission.quiz_score !== null && (
              <Card variant="outlined">
                <p className="text-sm text-dark-400">Wynik quizu</p>
                <p className="text-2xl font-bold text-white">{selectedSubmission.quiz_score}%</p>
              </Card>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="danger"
                onClick={() => handleRejectSubmission(selectedSubmission)}
                className="flex-1"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Odrzuć
              </Button>
              <Button
                variant="success"
                onClick={() => handleApproveSubmission(selectedSubmission)}
                className="flex-1"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Zatwierdź (+{selectedSubmission.mission?.xp_reward} XP)
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
