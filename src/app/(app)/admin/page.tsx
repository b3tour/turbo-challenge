'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, Button, Badge, Input, Modal, AlertDialog } from '@/components/ui';
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
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  BarChart3,
  ChevronDown,
  ChevronUp,
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
    activeMissions: 0,
    pendingSubmissions: 0,
    totalXP: 0,
  });

  // Modal states
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedMission, setExpandedMission] = useState<string | null>(null);

  const [missionForm, setMissionForm] = useState({
    title: '',
    description: '',
    xp_reward: 50,
    type: 'photo' as Mission['type'],
    location_name: '',
    qr_code_value: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Sprawdź czy użytkownik jest adminem
  useEffect(() => {
    if (profile && !profile.is_admin) {
      router.push('/dashboard');
    }
  }, [profile, router]);

  // Pobierz dane
  const fetchData = async () => {
    if (!profile?.is_admin) return;

    setLoading(true);

    const [usersRes, missionsRes, submissionsRes] = await Promise.all([
      supabase.from('users').select('*').order('total_xp', { ascending: false }),
      supabase.from('missions').select('*').order('created_at', { ascending: false }),
      supabase
        .from('submissions')
        .select('*, user:users(*), mission:missions(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

    if (usersRes.data) setUsers(usersRes.data as User[]);
    if (missionsRes.data) setMissions(missionsRes.data as Mission[]);
    if (submissionsRes.data) setPendingSubmissions(submissionsRes.data as Submission[]);

    const missionsList = missionsRes.data || [];
    setStats({
      totalUsers: usersRes.data?.length || 0,
      totalMissions: missionsList.length,
      activeMissions: missionsList.filter(m => m.status === 'active').length,
      pendingSubmissions: submissionsRes.data?.length || 0,
      totalXP: usersRes.data?.reduce((sum, u) => sum + (u.total_xp || 0), 0) || 0,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.is_admin]);

  // === SUBMISSION HANDLERS ===
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
    fetchData();
  };

  const handleRejectSubmission = async (submission: Submission, reason?: string) => {
    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'rejected',
        admin_notes: reason || 'Zgłoszenie nie spełnia wymagań',
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

  // === MISSION HANDLERS ===
  const resetMissionForm = () => {
    setMissionForm({
      title: '',
      description: '',
      xp_reward: 50,
      type: 'photo',
      location_name: '',
      qr_code_value: '',
      status: 'active',
    });
    setSelectedMission(null);
    setIsEditing(false);
  };

  const openCreateMission = () => {
    resetMissionForm();
    setShowMissionModal(true);
  };

  const openEditMission = (mission: Mission) => {
    setMissionForm({
      title: mission.title,
      description: mission.description,
      xp_reward: mission.xp_reward,
      type: mission.type,
      location_name: mission.location_name || '',
      qr_code_value: mission.qr_code_value || '',
      status: mission.status,
    });
    setSelectedMission(mission);
    setIsEditing(true);
    setShowMissionModal(true);
  };

  const handleSaveMission = async () => {
    if (!missionForm.title || !missionForm.description) {
      showError('Błąd', 'Wypełnij wymagane pola (tytuł i opis)');
      return;
    }

    const missionData = {
      title: missionForm.title,
      description: missionForm.description,
      xp_reward: missionForm.xp_reward,
      type: missionForm.type,
      location_name: missionForm.location_name || null,
      qr_code_value: missionForm.type === 'qr_code'
        ? (missionForm.qr_code_value || generateQRCode())
        : null,
      status: missionForm.status,
    };

    if (isEditing && selectedMission) {
      // Aktualizacja istniejącej misji
      const { error } = await supabase
        .from('missions')
        .update(missionData)
        .eq('id', selectedMission.id);

      if (error) {
        showError('Błąd', 'Nie udało się zaktualizować misji');
        return;
      }

      success('Zapisano!', 'Misja została zaktualizowana');
    } else {
      // Tworzenie nowej misji
      const { error } = await supabase
        .from('missions')
        .insert(missionData);

      if (error) {
        showError('Błąd', 'Nie udało się utworzyć misji');
        return;
      }

      success('Utworzono!', 'Nowa misja została dodana');
    }

    setShowMissionModal(false);
    resetMissionForm();
    fetchData();
  };

  const handleToggleMissionStatus = async (mission: Mission) => {
    const newStatus = mission.status === 'active' ? 'inactive' : 'active';

    const { error } = await supabase
      .from('missions')
      .update({ status: newStatus })
      .eq('id', mission.id);

    if (error) {
      showError('Błąd', 'Nie udało się zmienić statusu misji');
      return;
    }

    success(
      newStatus === 'active' ? 'Aktywowano!' : 'Dezaktywowano!',
      `Misja "${mission.title}" jest teraz ${newStatus === 'active' ? 'aktywna' : 'nieaktywna'}`
    );
    fetchData();
  };

  const handleDeleteMission = async () => {
    if (!missionToDelete) return;

    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionToDelete.id);

    if (error) {
      showError('Błąd', 'Nie udało się usunąć misji. Możliwe że są powiązane zgłoszenia.');
      return;
    }

    success('Usunięto!', `Misja "${missionToDelete.title}" została usunięta`);
    setShowDeleteDialog(false);
    setMissionToDelete(null);
    fetchData();
  };

  const handleDuplicateMission = async (mission: Mission) => {
    const { error } = await supabase
      .from('missions')
      .insert({
        title: `${mission.title} (kopia)`,
        description: mission.description,
        xp_reward: mission.xp_reward,
        type: mission.type,
        location_name: mission.location_name,
        qr_code_value: mission.type === 'qr_code' ? generateQRCode() : null,
        status: 'inactive',
      });

    if (error) {
      showError('Błąd', 'Nie udało się zduplikować misji');
      return;
    }

    success('Zduplikowano!', 'Kopia misji została utworzona (nieaktywna)');
    fetchData();
  };

  if (!profile?.is_admin) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: BarChart3 },
    { id: 'submissions', label: 'Zgłoszenia', icon: Clock, badge: stats.pendingSubmissions },
    { id: 'missions', label: 'Misje', icon: Target, badge: stats.totalMissions },
    { id: 'users', label: 'Gracze', icon: Users, badge: stats.totalUsers },
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
          <p className="text-sm text-dark-400">Zarządzaj Turbo Challenge</p>
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
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                tab.id === 'submissions' ? 'bg-red-500' : 'bg-dark-600'
              }`}>
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
                  <div className="text-sm text-dark-400">Graczy</div>
                </Card>

                <Card className="text-center">
                  <Target className="w-8 h-8 text-turbo-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {stats.activeMissions}/{stats.totalMissions}
                  </div>
                  <div className="text-sm text-dark-400">Aktywnych misji</div>
                </Card>

                <Card className="text-center">
                  <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.pendingSubmissions}</div>
                  <div className="text-sm text-dark-400">Do weryfikacji</div>
                </Card>

                <Card className="text-center">
                  <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{formatNumber(stats.totalXP)}</div>
                  <div className="text-sm text-dark-400">Łączne XP</div>
                </Card>
              </div>

              {stats.pendingSubmissions > 0 && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
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

              {/* Szybkie akcje */}
              <Card>
                <h3 className="font-semibold text-white mb-3">Szybkie akcje</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" onClick={openCreateMission}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nowa misja
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('users')}>
                    <Users className="w-4 h-4 mr-1" />
                    Zobacz graczy
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="space-y-3">
              {pendingSubmissions.length === 0 ? (
                <Card className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-white font-medium">Wszystko sprawdzone!</p>
                  <p className="text-dark-400 text-sm">Brak oczekujących zgłoszeń</p>
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
                        <div className="w-16 h-16 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                          <img
                            src={submission.photo_url}
                            alt="Zgłoszenie"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {submission.mission?.title}
                        </p>
                        <p className="text-sm text-dark-400">
                          od: <span className="text-accent-400">{submission.user?.nick}</span>
                        </p>
                        <p className="text-xs text-dark-500">
                          {formatDateTime(submission.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="warning">Oczekuje</Badge>
                        <span className="text-xs text-turbo-400">
                          +{submission.mission?.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Missions Tab */}
          {activeTab === 'missions' && (
            <div className="space-y-4">
              <Button fullWidth onClick={openCreateMission}>
                <Plus className="w-5 h-5 mr-2" />
                Dodaj nową misję
              </Button>

              <div className="space-y-3">
                {missions.length === 0 ? (
                  <Card className="text-center py-8">
                    <Target className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-400">Brak misji</p>
                    <p className="text-sm text-dark-500">Dodaj pierwszą misję powyżej</p>
                  </Card>
                ) : (
                  missions.map(mission => (
                    <Card key={mission.id} className="overflow-hidden">
                      {/* Nagłówek misji */}
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setExpandedMission(
                          expandedMission === mission.id ? null : mission.id
                        )}
                      >
                        <div className="text-2xl">{missionTypeIcons[mission.type]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{mission.title}</p>
                          <p className="text-sm text-dark-400">
                            {missionTypeNames[mission.type]} • {mission.xp_reward} XP
                          </p>
                        </div>
                        <Badge variant={mission.status === 'active' ? 'success' : 'default'}>
                          {mission.status === 'active' ? 'Aktywna' : 'Nieaktywna'}
                        </Badge>
                        {expandedMission === mission.id ? (
                          <ChevronUp className="w-5 h-5 text-dark-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-dark-400" />
                        )}
                      </div>

                      {/* Rozwinięte szczegóły */}
                      {expandedMission === mission.id && (
                        <div className="mt-4 pt-4 border-t border-dark-700">
                          <p className="text-sm text-dark-300 mb-3">{mission.description}</p>

                          {mission.location_name && (
                            <p className="text-xs text-dark-400 mb-2">
                              📍 {mission.location_name}
                            </p>
                          )}

                          {mission.qr_code_value && (
                            <p className="text-xs text-turbo-400 font-mono mb-3">
                              QR: {mission.qr_code_value}
                            </p>
                          )}

                          {/* Przyciski akcji */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditMission(mission);
                              }}
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edytuj
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleMissionStatus(mission);
                              }}
                            >
                              {mission.status === 'active' ? (
                                <>
                                  <ToggleRight className="w-4 h-4 mr-1" />
                                  Dezaktywuj
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-4 h-4 mr-1" />
                                  Aktywuj
                                </>
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateMission(mission);
                              }}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Duplikuj
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMissionToDelete(mission);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Usuń
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {users.map((user, index) => (
                <Card key={user.id}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-dark-700 text-dark-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-white font-bold overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.nick} className="w-full h-full object-cover" />
                      ) : (
                        user.nick.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">{user.nick}</p>
                        {user.is_admin && (
                          <Badge variant="turbo" size="sm">Admin</Badge>
                        )}
                      </div>
                      <p className="text-sm text-dark-400 truncate">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-turbo-400">{formatNumber(user.total_xp)}</div>
                      <div className="text-xs text-dark-500">XP</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Mission Modal (Create/Edit) */}
      <Modal
        isOpen={showMissionModal}
        onClose={() => {
          setShowMissionModal(false);
          resetMissionForm();
        }}
        title={isEditing ? 'Edytuj misję' : 'Nowa misja'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Tytuł misji *"
            value={missionForm.title}
            onChange={e => setMissionForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="np. Selfie z maskotką"
          />

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Opis *</label>
            <textarea
              value={missionForm.description}
              onChange={e => setMissionForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Opisz co użytkownik ma zrobić..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-turbo-500 min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Typ misji</label>
              <select
                value={missionForm.type}
                onChange={e => setMissionForm(prev => ({ ...prev, type: e.target.value as Mission['type'] }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              >
                <option value="photo">📷 Zdjęcie</option>
                <option value="qr_code">📱 Kod QR</option>
                <option value="quiz">❓ Quiz</option>
                <option value="gps">📍 Lokalizacja GPS</option>
                <option value="manual">✋ Ręczna weryfikacja</option>
              </select>
            </div>

            <Input
              label="Nagroda XP"
              type="number"
              value={missionForm.xp_reward}
              onChange={e => setMissionForm(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 0 }))}
              min={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Status</label>
              <select
                value={missionForm.status}
                onChange={e => setMissionForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              >
                <option value="active">✅ Aktywna</option>
                <option value="inactive">⏸️ Nieaktywna</option>
              </select>
            </div>

            <Input
              label="Lokalizacja"
              value={missionForm.location_name}
              onChange={e => setMissionForm(prev => ({ ...prev, location_name: e.target.value }))}
              placeholder="np. Hala główna"
            />
          </div>

          {missionForm.type === 'qr_code' && (
            <Input
              label="Wartość kodu QR"
              value={missionForm.qr_code_value}
              onChange={e => setMissionForm(prev => ({ ...prev, qr_code_value: e.target.value }))}
              placeholder="Zostaw puste dla autogeneracji"
              helperText="Unikalny kod który będzie zakodowany w QR"
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMissionModal(false);
                resetMissionForm();
              }}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button onClick={handleSaveMission} className="flex-1">
              {isEditing ? 'Zapisz zmiany' : 'Utwórz misję'}
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-dark-400">Misja</p>
                  <p className="font-medium text-white">{selectedSubmission.mission?.title}</p>
                </div>
                <div>
                  <p className="text-dark-400">Nagroda</p>
                  <p className="font-medium text-turbo-400">{selectedSubmission.mission?.xp_reward} XP</p>
                </div>
                <div>
                  <p className="text-dark-400">Gracz</p>
                  <p className="font-medium text-white">{selectedSubmission.user?.nick}</p>
                </div>
                <div>
                  <p className="text-dark-400">Data</p>
                  <p className="text-white">{formatDateTime(selectedSubmission.created_at)}</p>
                </div>
              </div>
            </Card>

            {selectedSubmission.photo_url && (
              <div>
                <p className="text-sm text-dark-400 mb-2">Przesłane zdjęcie:</p>
                <img
                  src={selectedSubmission.photo_url}
                  alt="Zgłoszenie"
                  className="w-full rounded-xl max-h-80 object-contain bg-dark-800"
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
                Zatwierdź
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setMissionToDelete(null);
        }}
        onConfirm={handleDeleteMission}
        title="Usuń misję"
        message={`Czy na pewno chcesz usunąć misję "${missionToDelete?.title}"? Ta operacja jest nieodwracalna.`}
        confirmText="Usuń"
        cancelText="Anuluj"
        variant="danger"
      />
    </div>
  );
}
