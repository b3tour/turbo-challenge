'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, Button, Badge, Input, Modal, AlertDialog } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Mission, MissionStatus, Submission, User, QuizData, QuizQuestion, QuizMode, SurveyData, SurveyOption, Reward, RewardType, CollectibleCard, CardRarity, CardType, CardOrder, CardOrderStatus, MysteryPackPurchase, MysteryPackStatus } from '@/types';
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
  BarChart3,
  Eye,
  Mail,
  Phone,
  Calendar,
  Award,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  Minus,
  RotateCcw,
  ImageIcon,
  AlertTriangle,
  Undo2,
  Trophy,
  Save,
  Gift,
  Upload,
  Layers,
  Sparkles,
  Ban,
  ShoppingCart,
  Heart,
  CreditCard,
  Crown,
  Package,
  UserPlus,
  Check,
  Search,
} from 'lucide-react';
import { LEVELS } from '@/lib/utils';
import { Level } from '@/types';
import AnnouncementsAdmin from '@/components/admin/AnnouncementsAdmin';
import AppContentAdmin from '@/components/admin/AppContentAdmin';
import { sendUserNotification } from '@/hooks/useAnnouncements';
import { Bell, FileText, ClipboardList } from 'lucide-react';

type AdminTab = 'overview' | 'submissions' | 'missions' | 'users' | 'levels' | 'rewards' | 'cards' | 'orders' | 'mystery' | 'announcements' | 'content';

const tabs: { id: AdminTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'overview', label: 'Przeglad', icon: BarChart3, description: 'Statystyki i podsumowanie' },
  { id: 'submissions', label: 'Zgloszenia', icon: Clock, description: 'Weryfikuj zgloszenia' },
  { id: 'missions', label: 'Misje', icon: Target, description: 'Zarzadzaj misjami' },
  { id: 'users', label: 'Gracze', icon: Users, description: 'Lista wszystkich graczy' },
  { id: 'rewards', label: 'Nagrody', icon: Gift, description: 'Nagrody dla TOP graczy' },
  { id: 'cards', label: 'Karty', icon: Layers, description: 'Karty kolekcjonerskie' },
  { id: 'orders', label: 'Zamówienia', icon: ShoppingCart, description: 'Zamówienia kart' },
  { id: 'mystery', label: 'Mystery', icon: Package, description: 'Pakiety Mystery Garage' },
  { id: 'announcements', label: 'Powiadomienia', icon: Bell, description: 'Wysyłaj powiadomienia' },
  { id: 'content', label: 'Treść', icon: FileText, description: 'Edytuj info o aplikacji' },
  { id: 'levels', label: 'Poziomy', icon: Trophy, description: 'Progi XP i nazwy poziomow' },
];

const RARITY_OPTIONS: { value: CardRarity; label: string; color: string }[] = [
  { value: 'common', label: 'Common', color: 'text-gray-400' },
  { value: 'rare', label: 'Rare', color: 'text-blue-400' },
  { value: 'epic', label: 'Epic', color: 'text-purple-400' },
  { value: 'legendary', label: 'Legend', color: 'text-yellow-400' },
];

export default function AdminPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // User details modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // XP management
  const [showXpModal, setShowXpModal] = useState(false);
  const [customXpAmount, setCustomXpAmount] = useState(50);
  const [xpNote, setXpNote] = useState('');
  const [xpOperation, setXpOperation] = useState<'add' | 'subtract'>('add');

  // Card assignment
  const [showGrantCardModal, setShowGrantCardModal] = useState(false);
  const [grantingCard, setGrantingCard] = useState(false);
  const [userCardsForUser, setUserCardsForUser] = useState<string[]>([]);
  const [userCardsDetails, setUserCardsDetails] = useState<(CollectibleCard & { user_card_id: string; obtained_from: string; obtained_at: string })[]>([]);

  // Card owners modal
  const [showCardOwnersModal, setShowCardOwnersModal] = useState(false);
  const [selectedCardForOwners, setSelectedCardForOwners] = useState<CollectibleCard | null>(null);
  const [cardOwners, setCardOwners] = useState<{ user: User; user_card_id: string; obtained_from: string; obtained_at: string }[]>([]);
  const [loadingCardOwners, setLoadingCardOwners] = useState(false);
  const [removingCard, setRemovingCard] = useState<string | null>(null);
  const [showAssignToPlayer, setShowAssignToPlayer] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignSearchResults, setAssignSearchResults] = useState<User[]>([]);
  const [assigningToPlayer, setAssigningToPlayer] = useState(false);

  // Bulk starter pack assignment
  const [showStarterPackModal, setShowStarterPackModal] = useState(false);
  const [assigningStarterPacks, setAssigningStarterPacks] = useState(false);
  const [starterPackSize, setStarterPackSize] = useState(5);
  const [starterPackProgress, setStarterPackProgress] = useState({ current: 0, total: 0, assigned: 0 });

  // Bulk reset & redistribute
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingCards, setResettingCards] = useState(false);
  const [resetPackSize, setResetPackSize] = useState(30);
  const [resetProgress, setResetProgress] = useState({ phase: '' as '' | 'deleting' | 'assigning', current: 0, total: 0, assigned: 0 });
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Owner card search
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [ownerSearchResults, setOwnerSearchResults] = useState<User[]>([]);
  const [ownerSearchLoading, setOwnerSearchLoading] = useState(false);
  const [selectedOwnerUser, setSelectedOwnerUser] = useState<User | null>(null);
  const ownerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Photo preview
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [selectedPhotoSubmission, setSelectedPhotoSubmission] = useState<Submission | null>(null);

  // Delete user
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Survey results
  const [showSurveyResultsModal, setShowSurveyResultsModal] = useState(false);
  const [surveyResultsMission, setSurveyResultsMission] = useState<Mission | null>(null);
  const [surveyResults, setSurveyResults] = useState<{ total_votes: number; votes: Record<string, number>; other_answers?: string[] } | null>(null);
  const [loadingSurveyResults, setLoadingSurveyResults] = useState(false);

  // Change nick
  const [showChangeNickModal, setShowChangeNickModal] = useState(false);
  const [newNick, setNewNick] = useState('');
  const [nickError, setNickError] = useState('');

  // Levels management
  const [editableLevels, setEditableLevels] = useState<Level[]>([]);
  const [levelsLoaded, setLevelsLoaded] = useState(false);
  const [savingLevels, setSavingLevels] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);

  // Common emojis for levels - expanded list
  const commonEmojis = [
    // Transport / Speed
    '🏎️', '🚗', '🚀', '🏁', '⚡', '💨', '🔥', '✈️', '🛞', '🏍️',
    // Achievements / Trophies
    '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '👑', '💎', '⭐', '🌟',
    // Nature / Growth
    '🌱', '🌿', '🌳', '🌲', '🍀', '🌸', '🌺', '🌻', '🌈', '☀️',
    // Power / Strength
    '💪', '🦾', '🛡️', '⚔️', '🗡️', '🔱', '👊', '✊', '🤘', '💥',
    // Animals
    '🦁', '🐯', '🦅', '🐉', '🦈', '🐺', '🦊', '🐻', '🦄', '🐲',
    // Gaming / Fun
    '🎯', '🎮', '🕹️', '🎲', '🎪', '🎭', '🎨', '🎸', '🎺', '🥁',
    // Symbols
    '💫', '✨', '💠', '🔶', '🔷', '❤️', '🧡', '💛', '💚', '💙',
    // Misc
    '👹', '👺', '🤖', '👽', '👻', '💀', '🎃', '😎', '🥷', '🧙'
  ];

  // Rewards management
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoaded, setRewardsLoaded] = useState(false);
  const [savingRewards, setSavingRewards] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardForm, setRewardForm] = useState({
    place: 1,
    title: '',
    description: '',
    value: '',
    sponsor: '',
    image_url: '',
    reward_type: 'xp' as RewardType,
  });

  // Cards management
  const [cards, setCards] = useState<CollectibleCard[]>([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardFilterRarity, setCardFilterRarity] = useState<'all' | CardRarity>('all');
  const [cardFilterType, setCardFilterType] = useState<'all' | 'car' | 'hero'>('all');
  const [savingCard, setSavingCard] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CollectibleCard | null>(null);
  const [cardForm, setCardForm] = useState({
    name: '',
    description: '',
    rarity: 'common' as CardRarity,
    card_type: 'achievement' as CardType,
    category: '',
    points: 10,
    total_supply: '',
    image_url: '',
    // Pola do zakupu
    is_purchasable: false,
    price: '',
    xp_reward: '',
    // Pola dla samochodów
    car_brand: '',
    car_model: '',
    car_horsepower: '',
    car_torque: '',
    car_max_speed: '',
    car_year: '',
    // Dodatkowe info o aucie (widoczne po odblokowaniu)
    car_engine: '',
    car_cylinders: '',
    car_acceleration: '',
    car_weight: '',
    car_drivetrain: '',
    car_fun_fact: '',
    // Pola dla Heroes
    is_hero: false,
    hero_name: '',
    hero_title: '',
    // Karta Właściciela
    is_owner_card: false,
    owner_user_id: '',
  });

  // Upload obrazka karty
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [uploadingCardImage, setUploadingCardImage] = useState(false);

  // Galeria zdjęć karty
  const [cardGalleryImages, setCardGalleryImages] = useState<{ id?: string; url: string; file?: File }[]>([]);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

  // Zamówienia kart
  const [orders, setOrders] = useState<CardOrder[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  // Mystery Garage purchases
  const [mysteryPurchases, setMysteryPurchases] = useState<MysteryPackPurchase[]>([]);
  const [mysteryLoaded, setMysteryLoaded] = useState(false);
  const [processingMystery, setProcessingMystery] = useState<string | null>(null);

  const [missionForm, setMissionForm] = useState({
    title: '',
    description: '',
    xp_reward: 50,
    type: 'photo' as Mission['type'],
    location_name: '',
    qr_code_value: '',
    status: 'active' as MissionStatus,
    required_level: 1,
    quiz_passing_score: 70,
    quiz_time_limit: 0,
    quiz_mode: 'classic' as QuizMode,
    quiz_questions: [] as QuizQuestion[],
    survey_question: '',
    survey_options: [{ id: 'opt_1', text: '' }, { id: 'opt_2', text: '' }] as SurveyOption[],
    survey_allow_other: true,
    survey_show_results: false,
  });

  // Sprawdz czy uzytkownik jest adminem
  useEffect(() => {
    if (profile && !profile.is_admin) {
      router.push('/dashboard');
    }
  }, [profile, router]);

  // Pobierz dane
  const fetchData = async () => {
    if (!profile?.is_admin) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [usersRes, missionsRes, submissionsRes] = await Promise.all([
        supabase.from('users').select('*').order('total_xp', { ascending: false }),
        supabase.from('missions').select('*').order('created_at', { ascending: false }),
        supabase
          .from('submissions')
          .select('*, user:users!submissions_user_id_fkey(*), mission:missions(*)')
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
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

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
      showError('Blad', 'Nie udalo sie zatwierdzic zgloszenia');
      return;
    }

    await supabase.rpc('add_user_xp', {
      p_user_id: submission.user_id,
      p_xp_amount: submission.mission.xp_reward,
    });

    // Wyślij powiadomienie do użytkownika
    await sendUserNotification(
      submission.user_id,
      'Misja zatwierdzona!',
      `Twoja misja "${submission.mission.title}" została zatwierdzona. Otrzymujesz +${submission.mission.xp_reward} XP!`,
      'mission_approved',
      { mission_id: submission.mission.id, xp_awarded: submission.mission.xp_reward }
    );

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
        admin_notes: reason || 'Zgloszenie nie spelnia wymagan',
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    if (error) {
      showError('Blad', 'Nie udalo sie odrzucic zgloszenia');
      return;
    }

    // Wyślij powiadomienie do użytkownika
    const missionTitle = submission.mission?.title || 'Misja';
    await sendUserNotification(
      submission.user_id,
      'Misja odrzucona',
      `Twoja misja "${missionTitle}" została odrzucona. Powód: ${reason || 'Zgłoszenie nie spełnia wymagań'}. Możesz spróbować ponownie.`,
      'mission_rejected',
      { mission_id: submission.mission?.id, reason: reason || 'Zgloszenie nie spelnia wymagan' }
    );

    success('Odrzucone', 'Zgloszenie zostalo odrzucone');
    setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
    setShowSubmissionModal(false);
    setSelectedSubmission(null);
    fetchData();
  };

  // Oznacz jako nieukończone (gracz nie może ponownie wykonać misji)
  const handleFailSubmission = async (submission: Submission, reason?: string) => {
    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'failed',
        admin_notes: reason || 'Misja nieukonczona - brak mozliwosci ponownego wykonania',
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    if (error) {
      showError('Blad', 'Nie udalo sie oznaczyc jako nieukonczone');
      return;
    }

    success('Nieukonczone', 'Misja zostala oznaczona jako nieukonczona');
    setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
    setShowSubmissionModal(false);
    setSelectedSubmission(null);
    fetchData();
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
      required_level: 1,
      quiz_passing_score: 70,
      quiz_time_limit: 0,
      quiz_mode: 'classic',
      quiz_questions: [],
      survey_question: '',
      survey_options: [{ id: 'opt_1', text: '' }, { id: 'opt_2', text: '' }],
      survey_allow_other: true,
      survey_show_results: false,
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
      required_level: mission.required_level || 1,
      quiz_passing_score: mission.quiz_data?.passing_score || 70,
      quiz_time_limit: mission.quiz_data?.time_limit || 0,
      quiz_mode: mission.quiz_data?.mode || 'classic',
      quiz_questions: mission.quiz_data?.questions || [],
      survey_question: (mission.survey_data as SurveyData | undefined)?.question || '',
      survey_options: (mission.survey_data as SurveyData | undefined)?.options || [{ id: 'opt_1', text: '' }, { id: 'opt_2', text: '' }],
      survey_allow_other: (mission.survey_data as SurveyData | undefined)?.allow_other ?? true,
      survey_show_results: (mission.survey_data as SurveyData | undefined)?.show_results ?? false,
    });
    setSelectedMission(mission);
    setIsEditing(true);
    setShowMissionModal(true);
  };

  // === QUIZ HANDLERS ===
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      points: 10,
      answers: [
        { id: `a_${Date.now()}_1`, text: '', is_correct: true },
        { id: `a_${Date.now()}_2`, text: '', is_correct: false },
      ],
    };
    setMissionForm(prev => ({
      ...prev,
      quiz_questions: [...prev.quiz_questions, newQuestion],
    }));
  };

  const removeQuestion = (questionId: string) => {
    setMissionForm(prev => ({
      ...prev,
      quiz_questions: prev.quiz_questions.filter(q => q.id !== questionId),
    }));
  };

  const updateQuestion = (questionId: string, field: string, value: string | number) => {
    setMissionForm(prev => ({
      ...prev,
      quiz_questions: prev.quiz_questions.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    }));
  };

  const addAnswer = (questionId: string) => {
    setMissionForm(prev => ({
      ...prev,
      quiz_questions: prev.quiz_questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...q.answers,
                { id: `a_${Date.now()}`, text: '', is_correct: false },
              ],
            }
          : q
      ),
    }));
  };

  const removeAnswer = (questionId: string, answerId: string) => {
    setMissionForm(prev => ({
      ...prev,
      quiz_questions: prev.quiz_questions.map(q =>
        q.id === questionId
          ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
          : q
      ),
    }));
  };

  const updateAnswer = (questionId: string, answerId: string, field: string, value: string | boolean) => {
    setMissionForm(prev => ({
      ...prev,
      quiz_questions: prev.quiz_questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map(a =>
                a.id === answerId ? { ...a, [field]: value } : a
              ),
            }
          : q
      ),
    }));
  };

  const setCorrectAnswer = (questionId: string, answerId: string) => {
    setMissionForm(prev => ({
      ...prev,
      quiz_questions: prev.quiz_questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map(a => ({
                ...a,
                is_correct: a.id === answerId,
              })),
            }
          : q
      ),
    }));
  };

  const handleSaveMission = async () => {
    if (!missionForm.title || !missionForm.description) {
      showError('Blad', 'Wypelnij wymagane pola (tytul i opis)');
      return;
    }

    if (missionForm.type === 'quiz') {
      if (missionForm.quiz_questions.length === 0) {
        showError('Blad', 'Quiz musi miec co najmniej jedno pytanie');
        return;
      }
      for (const q of missionForm.quiz_questions) {
        if (!q.question.trim()) {
          showError('Blad', 'Wszystkie pytania musza miec tresc');
          return;
        }
        if (q.answers.length < 2) {
          showError('Blad', 'Kazde pytanie musi miec co najmniej 2 odpowiedzi');
          return;
        }
        if (!q.answers.some(a => a.is_correct)) {
          showError('Blad', 'Kazde pytanie musi miec zaznaczona poprawna odpowiedz');
          return;
        }
        for (const a of q.answers) {
          if (!a.text.trim()) {
            showError('Blad', 'Wszystkie odpowiedzi musza miec tresc');
            return;
          }
        }
      }
    }

    // Walidacja ankiety
    if (missionForm.type === 'survey') {
      if (!missionForm.survey_question.trim()) {
        showError('Blad', 'Ankieta musi miec pytanie');
        return;
      }
      if (missionForm.survey_options.length < 2) {
        showError('Blad', 'Ankieta musi miec co najmniej 2 opcje');
        return;
      }
      for (const opt of missionForm.survey_options) {
        if (!opt.text.trim()) {
          showError('Blad', 'Wszystkie opcje musza miec tresc');
          return;
        }
      }
    }

    const surveyData: SurveyData | null = missionForm.type === 'survey'
      ? {
          question: missionForm.survey_question,
          options: missionForm.survey_options,
          allow_other: missionForm.survey_allow_other,
          show_results: missionForm.survey_show_results,
        }
      : null;

    const quizData: QuizData | null = missionForm.type === 'quiz'
      ? {
          questions: missionForm.quiz_questions,
          passing_score: missionForm.quiz_passing_score,
          time_limit: missionForm.quiz_mode === 'classic' && missionForm.quiz_time_limit > 0
            ? missionForm.quiz_time_limit
            : undefined,
          mode: missionForm.quiz_mode,
        }
      : null;

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
      required_level: missionForm.required_level,
      quiz_data: quizData,
      survey_data: surveyData,
    };

    if (isEditing && selectedMission) {
      const { error } = await supabase
        .from('missions')
        .update(missionData)
        .eq('id', selectedMission.id);

      if (error) {
        showError('Blad', 'Nie udalo sie zaktualizowac misji');
        return;
      }

      success('Zapisano!', 'Misja zostala zaktualizowana');
    } else {
      const { error } = await supabase
        .from('missions')
        .insert(missionData);

      if (error) {
        showError('Blad', 'Nie udalo sie utworzyc misji');
        return;
      }

      success('Utworzono!', 'Nowa misja zostala dodana');
    }

    setShowMissionModal(false);
    resetMissionForm();
    fetchData();
  };

  const openSurveyResults = async (mission: Mission) => {
    setSurveyResultsMission(mission);
    setShowSurveyResultsModal(true);
    setLoadingSurveyResults(true);

    const { data, error: fetchError } = await supabase
      .from('submissions')
      .select('survey_answers')
      .eq('mission_id', mission.id)
      .eq('status', 'approved')
      .not('survey_answers', 'is', null);

    if (fetchError || !data) {
      setSurveyResults(null);
      setLoadingSurveyResults(false);
      return;
    }

    const votes: Record<string, number> = {};
    const otherAnswers: string[] = [];

    for (const row of data) {
      const ans = row.survey_answers as string;
      if (ans.startsWith('other:')) {
        otherAnswers.push(ans.substring(6));
      } else {
        votes[ans] = (votes[ans] || 0) + 1;
      }
    }

    setSurveyResults({
      total_votes: data.length,
      votes,
      other_answers: otherAnswers.length > 0 ? otherAnswers : undefined,
    });
    setLoadingSurveyResults(false);
  };

  const handleToggleMissionStatus = async (mission: Mission) => {
    const newStatus = mission.status === 'active' ? 'inactive' : 'active';

    const { error } = await supabase
      .from('missions')
      .update({ status: newStatus })
      .eq('id', mission.id);

    if (error) {
      showError('Blad', 'Nie udalo sie zmienic statusu misji');
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
      showError('Blad', 'Nie udalo sie usunac misji. Mozliwe ze sa powiazane zgloszenia.');
      return;
    }

    success('Usunieto!', `Misja "${missionToDelete.title}" zostala usunieta`);
    setShowDeleteDialog(false);
    setMissionToDelete(null);
    fetchData();
  };

  // === USER DETAILS ===
  const openUserDetails = async (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setLoadingUserDetails(true);
    setUserCardsDetails([]);

    // Pobierz zgłoszenia użytkownika
    const { data, error } = await supabase
      .from('submissions')
      .select('*, mission:missions(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUserSubmissions(data as Submission[]);
    }

    // Pobierz karty użytkownika z pełnymi danymi
    const { data: userCardsData } = await supabase
      .from('user_cards')
      .select('id, card_id, obtained_from, obtained_at, card:cards(*)')
      .eq('user_id', user.id)
      .order('obtained_at', { ascending: false });

    if (userCardsData) {
      setUserCardsForUser(userCardsData.map(uc => uc.card_id));
      setUserCardsDetails(userCardsData.map(uc => ({
        ...(uc.card as unknown as CollectibleCard),
        user_card_id: uc.id,
        obtained_from: uc.obtained_from,
        obtained_at: uc.obtained_at,
      })));
    } else {
      setUserCardsForUser([]);
      setUserCardsDetails([]);
    }

    setLoadingUserDetails(false);
  };

  const getUserStats = () => {
    const approved = userSubmissions.filter(s => s.status === 'approved').length;
    const pending = userSubmissions.filter(s => s.status === 'pending').length;
    const rejected = userSubmissions.filter(s => s.status === 'rejected').length;
    const revoked = userSubmissions.filter(s => s.status === 'revoked').length;
    const totalXpEarned = userSubmissions
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + (s.xp_awarded || 0), 0);
    return { approved, pending, rejected, revoked, totalXpEarned };
  };

  // === CARD ASSIGNMENT ===
  const handleGrantCard = async (card: CollectibleCard) => {
    if (!selectedUser) return;

    setGrantingCard(true);

    try {
      // Sprawdź czy użytkownik już ma tę kartę
      if (userCardsForUser.includes(card.id)) {
        showError('Błąd', 'Użytkownik już posiada tę kartę');
        setGrantingCard(false);
        return;
      }

      // Sprawdź czy karta ma jeszcze dostępne sztuki (total_supply)
      if (card.total_supply) {
        const currentSold = card.sold_count || 0;
        if (currentSold >= card.total_supply) {
          showError('Błąd', `Karta "${card.name}" osiągnęła limit ${card.total_supply} szt. i nie może być przyznana`);
          setGrantingCard(false);
          return;
        }
      }

      // Dodaj kartę do kolekcji użytkownika
      const { error: cardError } = await supabase
        .from('user_cards')
        .insert({
          user_id: selectedUser.id,
          card_id: card.id,
          obtained_from: 'admin',
        });

      if (cardError) throw cardError;

      // Aktualizuj sold_count jeśli karta ma limit
      if (card.total_supply) {
        await supabase
          .from('cards')
          .update({ sold_count: (card.sold_count || 0) + 1 })
          .eq('id', card.id);
      }

      // Aktualizuj lokalną listę kart użytkownika
      setUserCardsForUser(prev => [...prev, card.id]);

      // Wyślij powiadomienie do użytkownika
      await sendUserNotification(
        selectedUser.id,
        'Otrzymujesz kartę!',
        `Otrzymałeś kartę "${card.name}" od administracji. Sprawdź swoją kolekcję!`,
        'card_received',
        { card_id: card.id, card_name: card.name }
      );

      success('Przyznano!', `Karta "${card.name}" została przyznana graczowi ${selectedUser.nick}`);
      setShowGrantCardModal(false);

      // Odśwież listę kart użytkownika
      const { data: refreshedCards } = await supabase
        .from('user_cards')
        .select('id, card_id, obtained_from, obtained_at, card:cards(*)')
        .eq('user_id', selectedUser.id)
        .order('obtained_at', { ascending: false });

      if (refreshedCards) {
        setUserCardsDetails(refreshedCards.map(uc => ({
          ...(uc.card as unknown as CollectibleCard),
          user_card_id: uc.id,
          obtained_from: uc.obtained_from,
          obtained_at: uc.obtained_at,
        })));
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Nieznany błąd';
      showError('Błąd', errorMessage);
    } finally {
      setGrantingCard(false);
    }
  };

  // === CARD OWNERS ===
  const openCardOwners = async (card: CollectibleCard) => {
    setSelectedCardForOwners(card);
    setShowCardOwnersModal(true);
    setLoadingCardOwners(true);
    setCardOwners([]);

    const { data, error } = await supabase
      .from('user_cards')
      .select('id, obtained_from, obtained_at, user:users(*)')
      .eq('card_id', card.id)
      .order('obtained_at', { ascending: false });

    if (!error && data) {
      setCardOwners(data.map(uc => ({
        user: uc.user as unknown as User,
        user_card_id: uc.id,
        obtained_from: uc.obtained_from,
        obtained_at: uc.obtained_at,
      })));
    }

    setLoadingCardOwners(false);
  };

  // === REMOVE CARD FROM USER ===
  const handleRemoveCardFromUser = async (userCardId: string, userId: string, cardId: string, cardName: string) => {
    // Ochrona Karty Właściciela
    const cardData = cards.find(c => c.id === cardId);
    if (cardData?.owner_user_id && cardData.owner_user_id === userId) {
      showError('Chroniona karta', `"${cardName}" jest Kartą Właściciela i nie może być usunięta od jej właściciela.`);
      return;
    }

    if (!confirm(`Czy na pewno chcesz usunąć kartę "${cardName}" od tego gracza?`)) return;

    setRemovingCard(userCardId);

    try {
      const { error } = await supabase
        .from('user_cards')
        .delete()
        .eq('id', userCardId);

      if (error) throw error;

      // Wyślij powiadomienie do użytkownika
      await sendUserNotification(
        userId,
        'Karta usunięta',
        `Karta "${cardName}" została usunięta z Twojej kolekcji przez administrację.`,
        'system',
        { card_id: cardId, card_name: cardName }
      );

      success('Usunięto!', `Karta "${cardName}" została usunięta`);

      // Odśwież dane w zależności od kontekstu
      if (showCardOwnersModal && selectedCardForOwners) {
        // Odśwież listę właścicieli karty
        setCardOwners(prev => prev.filter(o => o.user_card_id !== userCardId));
      }

      if (showUserModal && selectedUser) {
        // Odśwież listę kart użytkownika
        setUserCardsForUser(prev => prev.filter(id => {
          const cardDetail = userCardsDetails.find(c => c.user_card_id === userCardId);
          return cardDetail ? id !== cardDetail.id : true;
        }));
        setUserCardsDetails(prev => prev.filter(c => c.user_card_id !== userCardId));
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Nieznany błąd';
      showError('Błąd', errorMessage);
    } finally {
      setRemovingCard(null);
    }
  };

  // === ASSIGN CARD TO PLAYER ===
  const handleSearchPlayersForAssign = async (query: string) => {
    setAssignSearchQuery(query);
    if (query.length < 2) {
      setAssignSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('id, nick, avatar_url, total_xp, level')
      .ilike('nick', `%${query}%`)
      .limit(10);

    setAssignSearchResults((data || []) as User[]);
  };

  const handleAssignCardToUser = async (targetUser: User) => {
    if (!selectedCardForOwners) return;

    // Sprawdź czy gracz już ma tę kartę
    const alreadyOwns = cardOwners.some(o => o.user.id === targetUser.id);
    if (alreadyOwns) {
      showError('Już posiada', `${targetUser.nick} już ma kartę "${selectedCardForOwners.name}"`);
      return;
    }

    setAssigningToPlayer(true);

    try {
      const { data, error } = await supabase
        .from('user_cards')
        .insert({
          user_id: targetUser.id,
          card_id: selectedCardForOwners.id,
          obtained_from: 'admin',
        })
        .select('id, obtained_from, obtained_at')
        .single();

      if (error) throw error;

      // Aktualizuj sold_count jeśli karta ma limit
      if (selectedCardForOwners.total_supply) {
        await supabase
          .from('cards')
          .update({ sold_count: (selectedCardForOwners.sold_count || 0) + 1 })
          .eq('id', selectedCardForOwners.id);
      }

      // Powiadomienie dla gracza
      await sendUserNotification(
        targetUser.id,
        'Nowa karta!',
        `Otrzymałeś kartę "${selectedCardForOwners.name}" od administracji. Sprawdź swoją kolekcję!`,
        'card_received',
        { card_id: selectedCardForOwners.id, card_name: selectedCardForOwners.name }
      );

      success('Przydzielono!', `Karta "${selectedCardForOwners.name}" → ${targetUser.nick}`);

      // Dodaj do listy właścicieli
      setCardOwners(prev => [{
        user: targetUser,
        user_card_id: data.id,
        obtained_from: data.obtained_from,
        obtained_at: data.obtained_at,
      }, ...prev]);

      // Zamknij panel przydzielania
      setShowAssignToPlayer(false);
      setAssignSearchQuery('');
      setAssignSearchResults([]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Nieznany błąd';
      showError('Błąd', errorMessage);
    } finally {
      setAssigningToPlayer(false);
    }
  };

  // === STARTER PACK ASSIGNMENT ===
  const handleAssignStarterPacks = async () => {
    setAssigningStarterPacks(true);
    setStarterPackProgress({ current: 0, total: 0, assigned: 0 });

    try {
      // Pobierz wszystkie karty samochodów
      const { data: allCarCards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('card_type', 'car')
        .eq('is_active', true)
        .is('is_hero', false)
        .is('owner_user_id', null);

      if (cardsError || !allCarCards || allCarCards.length === 0) {
        showError('Błąd', 'Brak dostępnych kart samochodów w bazie');
        setAssigningStarterPacks(false);
        return;
      }

      // Śledź globalnie ile kart zostało przydzielonych (dla limitów total_supply)
      const globalCardAssignments: Record<string, number> = {};

      // Funkcja sprawdzająca czy karta jest dostępna (uwzględnia total_supply)
      const isCardAvailable = (card: CollectibleCard): boolean => {
        if (!card.total_supply) return true; // Brak limitu
        const currentSold = (card.sold_count || 0) + (globalCardAssignments[card.id] || 0);
        return currentSold < card.total_supply;
      };

      // Filtruj karty które mają dostępne sztuki i grupuj według rzadkości
      const getAvailableCardsByRarity = () => ({
        common: allCarCards.filter(c => c.rarity === 'common' && isCardAvailable(c)),
        rare: allCarCards.filter(c => c.rarity === 'rare' && isCardAvailable(c)),
        epic: allCarCards.filter(c => c.rarity === 'epic' && isCardAvailable(c)),
        legendary: allCarCards.filter(c => c.rarity === 'legendary' && isCardAvailable(c)),
      });

      // Pobierz wszystkich użytkowników
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, nick');

      if (usersError || !allUsers) {
        showError('Błąd', 'Nie udało się pobrać listy użytkowników');
        setAssigningStarterPacks(false);
        return;
      }

      setStarterPackProgress({ current: 0, total: allUsers.length, assigned: 0 });

      let totalAssigned = 0;

      for (let i = 0; i < allUsers.length; i++) {
        const user = allUsers[i];

        // Pobierz karty które użytkownik już ma
        const { data: existingCards } = await supabase
          .from('user_cards')
          .select('card_id')
          .eq('user_id', user.id);

        const existingCardIds = new Set(existingCards?.map(c => c.card_id) || []);

        // Losuj karty dla tego użytkownika
        const selectedCards: CollectibleCard[] = [];
        const usedCardIds = new Set<string>();

        // Funkcja losowania karty z danej rzadkości (z uwzględnieniem limitu)
        const pickRandomCard = (rarity: string): CollectibleCard | null => {
          const cardsByRarity = getAvailableCardsByRarity();
          const pool = cardsByRarity[rarity as keyof typeof cardsByRarity]?.filter(
            c => !existingCardIds.has(c.id) && !usedCardIds.has(c.id)
          ) || [];
          if (pool.length === 0) return null;
          const card = pool[Math.floor(Math.random() * pool.length)];
          usedCardIds.add(card.id);
          // Zwiększ globalny licznik przydziałów
          globalCardAssignments[card.id] = (globalCardAssignments[card.id] || 0) + 1;
          return card;
        };

        // Losuj karty według szans (60% common, 25% rare, 12% epic, 3% legendary)
        for (let j = 0; j < starterPackSize; j++) {
          const roll = Math.random() * 100;
          let card: CollectibleCard | null = null;

          if (roll < 3) {
            card = pickRandomCard('legendary') || pickRandomCard('epic') || pickRandomCard('rare') || pickRandomCard('common');
          } else if (roll < 15) {
            card = pickRandomCard('epic') || pickRandomCard('rare') || pickRandomCard('common');
          } else if (roll < 40) {
            card = pickRandomCard('rare') || pickRandomCard('common');
          } else {
            card = pickRandomCard('common') || pickRandomCard('rare');
          }

          if (card) {
            selectedCards.push(card);
          }
        }

        // Dodaj karty użytkownikowi
        if (selectedCards.length > 0) {
          const insertData = selectedCards.map(card => ({
            user_id: user.id,
            card_id: card.id,
            obtained_from: 'admin',
          }));

          const { error: insertError } = await supabase
            .from('user_cards')
            .insert(insertData);

          if (!insertError) {
            totalAssigned += selectedCards.length;

            // Aktualizuj sold_count dla kart z limitem
            for (const card of selectedCards) {
              if (card.total_supply) {
                await supabase
                  .from('cards')
                  .update({ sold_count: (card.sold_count || 0) + 1 })
                  .eq('id', card.id);
              }
            }

            // Wyślij powiadomienie
            await sendUserNotification(
              user.id,
              'Pakiet startowy!',
              `Otrzymałeś ${selectedCards.length} kart w pakiecie startowym! Sprawdź swoją kolekcję.`,
              'card_received',
              { cards_count: selectedCards.length }
            );
          }
        }

        setStarterPackProgress({ current: i + 1, total: allUsers.length, assigned: totalAssigned });
      }

      success('Gotowe!', `Przydzielono łącznie ${totalAssigned} kart dla ${allUsers.length} użytkowników`);
      setShowStarterPackModal(false);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Nieznany błąd';
      showError('Błąd', errorMessage);
    } finally {
      setAssigningStarterPacks(false);
    }
  };

  // === OWNER CARD SEARCH (debounced) ===
  const handleOwnerSearch = (query: string) => {
    setOwnerSearchQuery(query);
    if (ownerSearchTimer.current) clearTimeout(ownerSearchTimer.current);

    if (query.length < 2) {
      setOwnerSearchResults([]);
      setOwnerSearchLoading(false);
      return;
    }

    setOwnerSearchLoading(true);
    ownerSearchTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, nick, avatar_url, email')
        .ilike('nick', `%${query}%`)
        .limit(10);

      if (data) {
        setOwnerSearchResults(data as User[]);
      }
      setOwnerSearchLoading(false);
    }, 300);
  };

  // === BULK RESET & REDISTRIBUTE ===
  const handleBulkResetAndRedistribute = async () => {
    if (resetConfirmText !== 'RESETUJ') return;

    setResettingCards(true);
    setResetProgress({ phase: 'deleting', current: 0, total: 0, assigned: 0 });

    try {
      // 1. Pobierz karty z owner_user_id (karty właścicieli) — z paginacją
      const ownerCards: { id: string; owner_user_id: string }[] = [];
      let ocFrom = 0;
      const ocPageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('cards')
          .select('id, owner_user_id')
          .not('owner_user_id', 'is', null)
          .range(ocFrom, ocFrom + ocPageSize - 1);
        if (error) throw new Error(`Błąd pobierania owner cards: ${JSON.stringify(error)}`);
        if (!data || data.length === 0) break;
        ownerCards.push(...data);
        if (data.length < ocPageSize) break;
        ocFrom += ocPageSize;
      }

      const ownerMap = new Map<string, string>();
      ownerCards.forEach((c: { id: string; owner_user_id: string }) => {
        if (c.owner_user_id) ownerMap.set(c.id, c.owner_user_id);
      });

      // 2. Pobierz WSZYSTKIE user_cards (z paginacją, aby ominąć limit 1000)
      const allUserCards: { id: string; user_id: string; card_id: string }[] = [];
      let ucFrom = 0;
      const ucPageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('user_cards')
          .select('id, user_id, card_id')
          .range(ucFrom, ucFrom + ucPageSize - 1);
        if (error) throw new Error(`Błąd pobierania user_cards: ${JSON.stringify(error)}`);
        if (!data || data.length === 0) break;
        allUserCards.push(...data);
        if (data.length < ucPageSize) break;
        ucFrom += ucPageSize;
      }

      if (allUserCards.length === 0) {
        showError('Info', 'Brak kart do usunięcia');
        setResettingCards(false);
        return;
      }

      // 3. Filtruj — zachowaj tylko karty właściciela (owner card przypisana do właściciela)
      const toDelete = allUserCards.filter(uc => {
        const ownerId = ownerMap.get(uc.card_id);
        // Usuwamy wszystko OPRÓCZ kart, gdzie właściciel karty = użytkownik
        return !(ownerId && ownerId === uc.user_id);
      });

      // 4. Usuń batchami po 100
      setResetProgress({ phase: 'deleting', current: 0, total: toDelete.length, assigned: 0 });
      const batchSize = 100;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        const ids = batch.map(uc => uc.id);
        const { error } = await supabase.from('user_cards').delete().in('id', ids);
        if (error) throw new Error(`Błąd usuwania kart: ${JSON.stringify(error)}`);
        setResetProgress(prev => ({
          ...prev,
          phase: 'deleting',
          current: Math.min(i + batchSize, toDelete.length),
          total: toDelete.length,
        }));
      }

      // 5. Pobierz dostępne karty do losowania (bez owner cards i hero)
      const availableCards: CollectibleCard[] = [];
      let acFrom = 0;
      const acPageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .eq('card_type', 'car')
          .eq('is_active', true)
          .is('owner_user_id', null)
          .is('is_hero', false)
          .range(acFrom, acFrom + acPageSize - 1);
        if (error) throw new Error(`Błąd pobierania kart: ${JSON.stringify(error)}`);
        if (!data || data.length === 0) break;
        availableCards.push(...(data as CollectibleCard[]));
        if (data.length < acPageSize) break;
        acFrom += acPageSize;
      }

      if (availableCards.length === 0) {
        showError('Błąd', 'Brak dostępnych kart do rozdania');
        setResettingCards(false);
        return;
      }

      // 6. Pobierz WSZYSTKICH użytkowników (z paginacją)
      const allUsers: { id: string; nick: string }[] = [];
      let uFrom = 0;
      const uPageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('users')
          .select('id, nick')
          .range(uFrom, uFrom + uPageSize - 1);
        if (error) throw new Error(`Błąd pobierania użytkowników: ${JSON.stringify(error)}`);
        if (!data || data.length === 0) break;
        allUsers.push(...data);
        if (data.length < uPageSize) break;
        uFrom += uPageSize;
      }

      if (allUsers.length === 0) {
        showError('Błąd', 'Brak użytkowników');
        setResettingCards(false);
        return;
      }

      // 7. Losowo przydziel karty każdemu graczowi
      setResetProgress({ phase: 'assigning', current: 0, total: allUsers.length, assigned: 0 });

      const cardsByRarity = {
        common: availableCards.filter((c: CollectibleCard) => c.rarity === 'common'),
        rare: availableCards.filter((c: CollectibleCard) => c.rarity === 'rare'),
        epic: availableCards.filter((c: CollectibleCard) => c.rarity === 'epic'),
        legendary: availableCards.filter((c: CollectibleCard) => c.rarity === 'legendary'),
      };

      let totalAssigned = 0;

      for (let i = 0; i < allUsers.length; i++) {
        const user = allUsers[i];
        const selectedCards: CollectibleCard[] = [];
        const usedCardIds = new Set<string>();

        // Karty właściciela są już w kolekcji — wykluczyć z losowania
        ownerMap.forEach((ownerUserId, cardId) => {
          if (ownerUserId === user.id) usedCardIds.add(cardId);
        });

        for (let j = 0; j < resetPackSize; j++) {
          const roll = Math.random() * 100;
          let targetRarity: CardRarity;
          if (roll < 3) targetRarity = 'legendary';
          else if (roll < 15) targetRarity = 'epic';
          else if (roll < 40) targetRarity = 'rare';
          else targetRarity = 'common';

          let pool = cardsByRarity[targetRarity].filter((c: CollectibleCard) => !usedCardIds.has(c.id));
          if (pool.length === 0) {
            // Fallback do innej rzadkości
            for (const fallback of ['rare', 'common', 'epic', 'legendary'] as CardRarity[]) {
              pool = cardsByRarity[fallback].filter((c: CollectibleCard) => !usedCardIds.has(c.id));
              if (pool.length > 0) break;
            }
          }
          if (pool.length === 0) break;

          const card = pool[Math.floor(Math.random() * pool.length)];
          selectedCards.push(card);
          usedCardIds.add(card.id);
        }

        if (selectedCards.length > 0) {
          const { error } = await supabase.from('user_cards').insert(
            selectedCards.map(card => ({
              user_id: user.id,
              card_id: card.id,
              obtained_from: 'admin' as const,
            }))
          );
          if (error) throw new Error(`Błąd przydzielania kart dla ${user.nick}: ${JSON.stringify(error)}`);
          totalAssigned += selectedCards.length;
        }

        setResetProgress({
          phase: 'assigning',
          current: i + 1,
          total: allUsers.length,
          assigned: totalAssigned,
        });
      }

      success('Gotowe!', `Zresetowano karty i przydzielono ${totalAssigned} kart dla ${allUsers.length} graczy`);
      setShowResetModal(false);
      setResetConfirmText('');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Nieznany błąd';
      showError('Błąd resetu', errorMessage);
    } finally {
      setResettingCards(false);
    }
  };

  // === XP MANAGEMENT ===
  const handleManualXp = async (amount: number, note: string) => {
    if (!selectedUser) return;

    const actualAmount = xpOperation === 'subtract' ? -Math.abs(amount) : Math.abs(amount);

    // Update user XP directly
    const newXp = Math.max(0, (selectedUser.total_xp || 0) + actualAmount);

    const { error } = await supabase
      .from('users')
      .update({ total_xp: newXp })
      .eq('id', selectedUser.id);

    if (error) {
      showError('Błąd', 'Nie udało się zaktualizować XP');
      return;
    }

    // Wyślij powiadomienie do użytkownika
    if (actualAmount > 0) {
      await sendUserNotification(
        selectedUser.id,
        'Otrzymujesz XP!',
        `Otrzymałeś +${actualAmount} XP od administracji.${note ? ` Powód: ${note}` : ''}`,
        'xp_gain',
        { xp_amount: actualAmount, note }
      );
    } else {
      await sendUserNotification(
        selectedUser.id,
        'Korekta XP',
        `Twoje XP zostało skorygowane o ${actualAmount}.${note ? ` Powód: ${note}` : ''}`,
        'system',
        { xp_amount: actualAmount, note }
      );
    }

    // Log the manual XP change (optional - could add to a separate table)
    console.log(`Manual XP ${xpOperation}: ${actualAmount} for user ${selectedUser.nick}. Note: ${note}`);

    success(
      xpOperation === 'add' ? 'Dodano XP!' : 'Odjęto XP!',
      `${xpOperation === 'add' ? '+' : ''}${actualAmount} XP dla ${selectedUser.nick}`
    );

    // Update local state
    setSelectedUser(prev => prev ? { ...prev, total_xp: newXp } : null);
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, total_xp: newXp } : u));

    setShowXpModal(false);
    setCustomXpAmount(50);
    setXpNote('');
  };

  // === REVOKE/RESTORE SUBMISSION ===
  const handleRevokeSubmission = async (submission: Submission) => {
    if (!submission.mission || !selectedUser) return;

    const xpToRemove = submission.xp_awarded || submission.mission.xp_reward;

    // Update submission status to revoked
    const { error: submissionError } = await supabase
      .from('submissions')
      .update({
        status: 'revoked',
        admin_notes: `Wycofane przez admina ${profile?.nick} w dniu ${new Date().toLocaleString('pl-PL')}`,
      })
      .eq('id', submission.id);

    if (submissionError) {
      showError('Błąd', 'Nie udało się wycofać misji');
      return;
    }

    // Subtract XP from user
    const newXp = Math.max(0, (selectedUser.total_xp || 0) - xpToRemove);
    await supabase
      .from('users')
      .update({ total_xp: newXp })
      .eq('id', selectedUser.id);

    success('Wycofano!', `Misja "${submission.mission.title}" została wycofana (-${xpToRemove} XP)`);

    // Update local state
    setSelectedUser(prev => prev ? { ...prev, total_xp: newXp } : null);
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, total_xp: newXp } : u));
    setUserSubmissions(prev => prev.map(s =>
      s.id === submission.id ? { ...s, status: 'revoked' as const } : s
    ));
  };

  // Przywróć wycofaną misję (status revoked -> approved, oddaj XP)
  const handleRestoreSubmission = async (submission: Submission) => {
    if (!submission.mission || !selectedUser) return;

    const xpToRestore = submission.xp_awarded || submission.mission.xp_reward;

    // Update submission status back to approved
    const { error: submissionError } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        admin_notes: `Przywrócone przez admina ${profile?.nick} w dniu ${new Date().toLocaleString('pl-PL')}`,
      })
      .eq('id', submission.id);

    if (submissionError) {
      showError('Błąd', 'Nie udało się przywrócić misji');
      return;
    }

    // Add XP back to user
    const newXp = (selectedUser.total_xp || 0) + xpToRestore;
    await supabase
      .from('users')
      .update({ total_xp: newXp })
      .eq('id', selectedUser.id);

    success('Przywrócono!', `Misja "${submission.mission.title}" została przywrócona (+${xpToRestore} XP)`);

    // Update local state
    setSelectedUser(prev => prev ? { ...prev, total_xp: newXp } : null);
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, total_xp: newXp } : u));
    setUserSubmissions(prev => prev.map(s =>
      s.id === submission.id ? { ...s, status: 'approved' as const } : s
    ));
  };

  // Resetuj misję (usuń zgłoszenie - pozwól na ponowną próbę)
  // Używane dla: failed, rejected
  const handleResetSubmission = async (submission: Submission) => {
    if (!submission.mission) return;

    // Usuń zgłoszenie całkowicie
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submission.id);

    if (error) {
      showError('Błąd', 'Nie udało się zresetować misji');
      return;
    }

    success('Zresetowano!', `Misja "${submission.mission.title}" została zresetowana - gracz może spróbować ponownie`);

    // Usuń z lokalnego stanu
    setUserSubmissions(prev => prev.filter(s => s.id !== submission.id));
  };

  // === DELETE USER ===
  const handleDeleteUser = async () => {
    if (!userToDelete || deleteConfirmText !== userToDelete.nick) {
      showError('Błąd', 'Wpisz poprawnie nick gracza aby potwierdzić');
      return;
    }

    const userId = userToDelete.id;
    const userNick = userToDelete.nick;

    // First delete all user submissions
    const { error: submissionsError } = await supabase
      .from('submissions')
      .delete()
      .eq('user_id', userId);

    if (submissionsError) {
      console.error('Delete submissions error:', submissionsError);
      showError('Błąd', 'Nie udało się usunąć zgłoszeń gracza: ' + submissionsError.message);
      return;
    }

    // Then delete the user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      console.error('Delete user error:', userError);
      showError('Błąd', 'Nie udało się usunąć gracza: ' + userError.message);
      return;
    }

    // Verify the user was actually deleted
    const { data: checkUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkUser) {
      console.error('User still exists after delete!');
      showError('Błąd', 'Nie udało się usunąć gracza. Sprawdź uprawnienia w Supabase (RLS).');
      return;
    }

    success('Usunięto!', `Gracz "${userNick}" został usunięty z systemu`);

    // Close modals first
    setShowDeleteUserDialog(false);
    setShowUserModal(false);
    setUserToDelete(null);
    setDeleteConfirmText('');
    setSelectedUser(null);

    // Update local state immediately
    setUsers(prev => prev.filter(u => u.id !== userId));

    // Then refresh data from server
    await fetchData();
  };

  // === PHOTO PREVIEW ===
  const openPhotoPreview = (submission: Submission) => {
    if (submission.photo_url) {
      setSelectedPhotoUrl(submission.photo_url);
      setSelectedPhotoSubmission(submission);
      setShowPhotoModal(true);
    }
  };

  // === REWARDS MANAGEMENT ===
  useEffect(() => {
    if (activeTab === 'rewards' && !rewardsLoaded) {
      loadRewards();
    }
  }, [activeTab, rewardsLoaded]);

  const loadRewards = async () => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('place', { ascending: true });

    if (!error && data) {
      setRewards(data as Reward[]);
    } else {
      // Domyślne nagrody
      setRewards([
        { id: '1', place: 1, title: 'Nagroda za 1. miejsce', description: '', is_active: true, created_at: new Date().toISOString() },
        { id: '2', place: 2, title: 'Nagroda za 2. miejsce', description: '', is_active: true, created_at: new Date().toISOString() },
        { id: '3', place: 3, title: 'Nagroda za 3. miejsce', description: '', is_active: true, created_at: new Date().toISOString() },
      ]);
    }
    setRewardsLoaded(true);
  };

  const openRewardModal = (reward?: Reward, defaultType?: RewardType) => {
    if (reward) {
      setEditingReward(reward);
      setRewardForm({
        place: reward.place,
        title: reward.title,
        description: reward.description,
        value: reward.value || '',
        sponsor: reward.sponsor || '',
        image_url: reward.image_url || '',
        reward_type: reward.reward_type || 'xp',
      });
    } else {
      setEditingReward(null);
      const type = defaultType || 'xp';
      const typeRewards = rewards.filter(r => (r.reward_type || 'xp') === type);
      const nextPlace = type === 'lottery' ? 0 : (typeRewards.length > 0 ? Math.max(...typeRewards.map(r => r.place)) + 1 : 1);
      setRewardForm({
        place: nextPlace,
        title: '',
        description: '',
        value: '',
        sponsor: '',
        image_url: '',
        reward_type: type,
      });
    }
    setShowRewardModal(true);
  };

  const handleSaveReward = async () => {
    if (!rewardForm.title.trim()) {
      showError('Błąd', 'Podaj tytuł nagrody');
      return;
    }

    setSavingRewards(true);

    const rewardData = {
      place: rewardForm.reward_type === 'lottery' ? 0 : rewardForm.place,
      title: rewardForm.title.trim(),
      description: rewardForm.description.trim(),
      value: rewardForm.value.trim() || null,
      sponsor: rewardForm.sponsor.trim() || null,
      image_url: rewardForm.image_url.trim() || null,
      is_active: true,
      reward_type: rewardForm.reward_type,
    };

    if (editingReward) {
      // Update
      const { error } = await supabase
        .from('rewards')
        .update(rewardData)
        .eq('id', editingReward.id);

      if (error) {
        // Jeśli tabela nie istnieje, utwórz ją
        if (error.code === '42P01') {
          showError('Tabela nie istnieje', 'Utwórz tabelę "rewards" w Supabase');
        } else {
          showError('Błąd', error.message);
        }
        setSavingRewards(false);
        return;
      }

      setRewards(prev => prev.map(r => r.id === editingReward.id ? { ...r, ...rewardData } : r));
      success('Zapisano!', 'Nagroda została zaktualizowana');
    } else {
      // Insert
      const { data, error } = await supabase
        .from('rewards')
        .insert(rewardData)
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          showError('Tabela nie istnieje', 'Utwórz tabelę "rewards" w Supabase');
        } else {
          showError('Błąd', error.message);
        }
        setSavingRewards(false);
        return;
      }

      setRewards(prev => [...prev, data as Reward].sort((a, b) => a.place - b.place));
      success('Dodano!', 'Nowa nagroda została dodana');
    }

    setShowRewardModal(false);
    setSavingRewards(false);
  };

  const handleDeleteReward = async (reward: Reward) => {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', reward.id);

    if (error) {
      showError('Błąd', error.message);
      return;
    }

    setRewards(prev => prev.filter(r => r.id !== reward.id));
    success('Usunięto!', 'Nagroda została usunięta');
  };

  // === CARDS MANAGEMENT ===
  useEffect(() => {
    if (activeTab === 'cards' && !cardsLoaded) {
      loadCards();
    }
  }, [activeTab, cardsLoaded]);

  const loadCards = async () => {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('rarity', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data) {
      setCards(data as CollectibleCard[]);
    } else {
      setCards([]);
    }
    setCardsLoaded(true);
  };

  const openCardModal = (card?: CollectibleCard) => {
    if (card) {
      setEditingCard(card);
      setCardForm({
        name: card.name,
        description: card.description,
        rarity: card.rarity,
        card_type: card.card_type || 'achievement',
        category: card.category,
        points: card.points,
        total_supply: card.total_supply?.toString() || '',
        image_url: card.image_url || '',
        is_purchasable: card.is_purchasable || false,
        price: card.price?.toString() || '',
        xp_reward: card.xp_reward?.toString() || '',
        car_brand: card.car_brand || '',
        car_model: card.car_model || '',
        car_horsepower: card.car_horsepower?.toString() || '',
        car_torque: card.car_torque?.toString() || '',
        car_max_speed: card.car_max_speed?.toString() || '',
        car_year: card.car_year?.toString() || '',
        car_engine: card.car_engine || '',
        car_cylinders: card.car_cylinders?.toString() || '',
        car_acceleration: card.car_acceleration?.toString() || '',
        car_weight: card.car_weight?.toString() || '',
        car_drivetrain: card.car_drivetrain || '',
        car_fun_fact: card.car_fun_fact || '',
        is_hero: card.is_hero || false,
        hero_name: card.hero_name || '',
        hero_title: card.hero_title || '',
        is_owner_card: !!card.owner_user_id,
        owner_user_id: card.owner_user_id || '',
      });
      // Load owner user data if set
      if (card.owner_user_id) {
        supabase.from('users').select('id, nick, avatar_url, email').eq('id', card.owner_user_id).single().then(({ data }) => {
          if (data) setSelectedOwnerUser(data as User);
        });
      } else {
        setSelectedOwnerUser(null);
      }
    } else {
      setEditingCard(null);
      setCardForm({
        name: '',
        description: '',
        rarity: 'common',
        card_type: 'achievement',
        category: '',
        points: 10,
        total_supply: '',
        image_url: '',
        is_purchasable: false,
        price: '',
        xp_reward: '',
        car_brand: '',
        car_model: '',
        car_horsepower: '',
        car_torque: '',
        car_max_speed: '',
        car_year: '',
        car_engine: '',
        car_cylinders: '',
        car_acceleration: '',
        car_weight: '',
        car_drivetrain: '',
        car_fun_fact: '',
        is_hero: false,
        hero_name: '',
        hero_title: '',
        is_owner_card: false,
        owner_user_id: '',
      });
      setSelectedOwnerUser(null);
    }
    // Reset image states
    setCardImageFile(null);
    setCardImagePreview(null);
    setCardGalleryImages([]);
    setOwnerSearchQuery('');
    setOwnerSearchResults([]);
    setShowCardModal(true);

    // Load gallery images when editing
    if (card) {
      loadCardGalleryImages(card.id);
    }
  };

  // Load gallery images for a card
  const loadCardGalleryImages = async (cardId: string) => {
    const { data, error: fetchError } = await supabase
      .from('card_images')
      .select('*')
      .eq('card_id', cardId)
      .order('display_order', { ascending: true });

    if (!fetchError && data) {
      setCardGalleryImages(data.map((img: { id: string; image_url: string }) => ({
        id: img.id,
        url: img.image_url,
      })));
    }
  };

  // Obsługa wyboru pliku obrazka karty
  const handleCardImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Walidacja formatu
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showError('Nieprawidłowy format', 'Dozwolone formaty: JPG, PNG, WebP');
      return;
    }

    // Walidacja rozmiaru (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Za duży plik', 'Maksymalny rozmiar pliku to 5MB');
      return;
    }

    setCardImageFile(file);

    // Tworzenie podglądu
    const reader = new FileReader();
    reader.onloadend = () => {
      setCardImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Usuwanie wybranego obrazka
  const handleRemoveCardImage = () => {
    setCardImageFile(null);
    setCardImagePreview(null);
    setCardForm(prev => ({ ...prev, image_url: '' }));
  };

  // Obsługa wyboru zdjęcia do galerii
  const handleGalleryImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Walidacja formatu
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showError('Nieprawidłowy format', 'Dozwolone formaty: JPG, PNG, WebP');
      return;
    }

    // Walidacja rozmiaru (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Za duży plik', 'Maksymalny rozmiar pliku to 5MB');
      return;
    }

    // Limit 6 zdjęć
    if (cardGalleryImages.length >= 6) {
      showError('Limit zdjęć', 'Maksymalnie 6 zdjęć w galerii');
      return;
    }

    // Tworzenie podglądu i dodanie do listy
    const reader = new FileReader();
    reader.onloadend = () => {
      setCardGalleryImages(prev => [
        ...prev,
        { url: reader.result as string, file }
      ]);
    };
    reader.readAsDataURL(file);

    // Reset inputa
    e.target.value = '';
  };

  // Usuwanie zdjęcia z galerii
  const handleRemoveGalleryImage = async (index: number) => {
    const image = cardGalleryImages[index];

    // Jeśli zdjęcie jest zapisane w bazie, usuń je
    if (image.id) {
      await supabase.from('card_images').delete().eq('id', image.id);
    }

    setCardGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  // Upload zdjęcia galerii do storage
  const uploadGalleryImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `cards/gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Gallery upload error:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('card-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Gallery upload failed:', err);
      return null;
    }
  };

  // Upload obrazka do Supabase Storage
  const uploadCardImage = async (file: File): Promise<string | null> => {
    setUploadingCardImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `card-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `cards/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        showError('Błąd uploadu', uploadError.message);
        return null;
      }

      // Pobierz publiczny URL
      const { data: urlData } = supabase.storage
        .from('card-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      showError('Błąd', 'Nie udało się wgrać obrazka');
      return null;
    } finally {
      setUploadingCardImage(false);
    }
  };

  const handleSaveCard = async () => {
    if (!cardForm.name.trim()) {
      showError('Błąd', 'Podaj nazwę karty');
      return;
    }
    if (!cardForm.category.trim()) {
      showError('Błąd', 'Podaj kategorię karty');
      return;
    }

    setSavingCard(true);

    // Upload obrazka jeśli wybrano plik
    let imageUrl = cardForm.image_url.trim() || null;
    if (cardImageFile) {
      const uploadedUrl = await uploadCardImage(cardImageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        setSavingCard(false);
        return; // Błąd uploadu - przerwij
      }
    }

    const cardData = {
      name: cardForm.name.trim(),
      description: cardForm.description.trim(),
      rarity: cardForm.rarity,
      card_type: cardForm.card_type,
      category: cardForm.category.trim(),
      points: cardForm.points,
      total_supply: cardForm.total_supply ? parseInt(cardForm.total_supply) : null,
      image_url: imageUrl,
      is_active: true,
      // Pola do zakupu
      is_purchasable: cardForm.is_purchasable,
      price: cardForm.price ? parseFloat(cardForm.price) : null,
      xp_reward: cardForm.xp_reward ? parseInt(cardForm.xp_reward) : null,
      // Pola dla samochodów
      car_brand: cardForm.card_type === 'car' ? cardForm.car_brand.trim() || null : null,
      car_model: cardForm.card_type === 'car' ? cardForm.car_model.trim() || null : null,
      car_horsepower: cardForm.card_type === 'car' && cardForm.car_horsepower ? parseInt(cardForm.car_horsepower) : null,
      car_torque: cardForm.card_type === 'car' && cardForm.car_torque ? parseInt(cardForm.car_torque) : null,
      car_max_speed: cardForm.card_type === 'car' && cardForm.car_max_speed ? parseInt(cardForm.car_max_speed) : null,
      car_year: cardForm.card_type === 'car' && cardForm.car_year ? parseInt(cardForm.car_year) : null,
      // Dodatkowe info o aucie
      car_engine: cardForm.card_type === 'car' ? cardForm.car_engine.trim() || null : null,
      car_cylinders: cardForm.card_type === 'car' && cardForm.car_cylinders ? parseInt(cardForm.car_cylinders) : null,
      car_acceleration: cardForm.card_type === 'car' && cardForm.car_acceleration ? parseFloat(cardForm.car_acceleration) : null,
      car_weight: cardForm.card_type === 'car' && cardForm.car_weight ? parseInt(cardForm.car_weight) : null,
      car_drivetrain: cardForm.card_type === 'car' ? cardForm.car_drivetrain.trim() || null : null,
      car_fun_fact: cardForm.card_type === 'car' ? cardForm.car_fun_fact.trim() || null : null,
      // Pola dla Heroes
      is_hero: cardForm.card_type === 'car' && cardForm.is_hero,
      hero_name: cardForm.is_hero ? cardForm.hero_name.trim() || null : null,
      hero_title: cardForm.is_hero ? cardForm.hero_title.trim() || null : null,
      // Karta Właściciela
      owner_user_id: cardForm.is_owner_card && cardForm.owner_user_id ? cardForm.owner_user_id : null,
    };

    let savedCardId: string;

    if (editingCard) {
      const { error } = await supabase
        .from('cards')
        .update(cardData)
        .eq('id', editingCard.id);

      if (error) {
        if (error.code === '42P01') {
          showError('Tabela nie istnieje', 'Utwórz tabelę "cards" w Supabase');
        } else {
          showError('Błąd', error.message);
        }
        setSavingCard(false);
        return;
      }

      savedCardId = editingCard.id;
      setCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, ...cardData } as CollectibleCard : c));
    } else {
      const { data, error } = await supabase
        .from('cards')
        .insert(cardData)
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          showError('Tabela nie istnieje', 'Utwórz tabelę "cards" w Supabase');
        } else {
          showError('Błąd', error.message);
        }
        setSavingCard(false);
        return;
      }

      savedCardId = data.id;
      setCards(prev => [...prev, data as CollectibleCard]);
    }

    // Zapisz nowe zdjęcia galerii
    if (cardForm.card_type === 'car') {
      setUploadingGalleryImage(true);
      const newImages = cardGalleryImages.filter(img => img.file);

      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i];
        if (img.file) {
          const uploadedUrl = await uploadGalleryImage(img.file);
          if (uploadedUrl) {
            await supabase.from('card_images').insert({
              card_id: savedCardId,
              image_url: uploadedUrl,
              display_order: cardGalleryImages.filter(g => !g.file).length + i,
            });
          }
        }
      }
      setUploadingGalleryImage(false);
    }

    // Auto-przydziel kartę właścicielowi
    if (cardData.owner_user_id) {
      const { data: existingAssignment } = await supabase
        .from('user_cards')
        .select('id')
        .eq('user_id', cardData.owner_user_id)
        .eq('card_id', savedCardId)
        .maybeSingle();

      if (!existingAssignment) {
        await supabase.from('user_cards').insert({
          user_id: cardData.owner_user_id,
          card_id: savedCardId,
          obtained_from: 'admin',
        });

        await sendUserNotification(
          cardData.owner_user_id,
          'Karta Właściciela!',
          `Karta "${cardData.name}" została przypisana do Twojej kolekcji jako Karta Właściciela.`,
          'card_received',
          { card_id: savedCardId, card_name: cardData.name }
        );
      }
    }

    success(editingCard ? 'Zapisano!' : 'Dodano!', editingCard ? 'Karta została zaktualizowana' : 'Nowa karta została dodana');
    setShowCardModal(false);
    setSavingCard(false);
  };

  const handleDeleteCard = async (card: CollectibleCard) => {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', card.id);

    if (error) {
      showError('Błąd', error.message);
      return;
    }

    setCards(prev => prev.filter(c => c.id !== card.id));
    success('Usunięto!', 'Karta została usunięta');
  };

  const handleToggleCard = async (card: CollectibleCard) => {
    const { error } = await supabase
      .from('cards')
      .update({ is_active: !card.is_active })
      .eq('id', card.id);

    if (error) {
      showError('Błąd', error.message);
      return;
    }

    setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_active: !c.is_active } : c));
    success('Zmieniono!', card.is_active ? 'Karta ukryta' : 'Karta aktywna');
  };

  // === ORDERS MANAGEMENT ===
  useEffect(() => {
    if (activeTab === 'orders' && !ordersLoaded) {
      loadOrders();
    }
  }, [activeTab, ordersLoaded]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('card_orders')
      .select('*, user:profiles(*), card:cards(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as CardOrder[]);
    } else {
      setOrders([]);
    }
    setOrdersLoaded(true);
  };

  const handleApproveOrder = async (order: CardOrder) => {
    if (!profile?.id) return;
    setProcessingOrder(order.id);

    try {
      // 1. Zmień status zamówienia na 'paid'
      const { error: orderError } = await supabase
        .from('card_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          reviewed_by: profile.id,
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 2. Dodaj kartę do kolekcji użytkownika
      const { error: cardError } = await supabase
        .from('user_cards')
        .insert({
          user_id: order.user_id,
          card_id: order.card_id,
          obtained_from: 'purchase',
        });

      if (cardError) throw cardError;

      // 3. Sprawdź typ karty - karty samochodowe dodają do donation_total, inne do XP
      const isCarCard = order.card?.card_type === 'car';

      if (isCarCard) {
        // Karty samochodów - dodaj do donation_total (datki)
        const { data: userData } = await supabase
          .from('users')
          .select('donation_total')
          .eq('id', order.user_id)
          .single();

        if (userData) {
          await supabase
            .from('users')
            .update({ donation_total: (userData.donation_total || 0) + order.amount })
            .eq('id', order.user_id);
        }
      } else if (order.xp_reward > 0) {
        // Inne karty - dodaj XP
        const { data: userData } = await supabase
          .from('users')
          .select('total_xp')
          .eq('id', order.user_id)
          .single();

        if (userData) {
          await supabase
            .from('users')
            .update({ total_xp: (userData.total_xp || 0) + order.xp_reward })
            .eq('id', order.user_id);
        }
      }

      // 4. Zwiększ licznik sprzedanych kart
      await supabase.rpc('increment_sold_count', { card_id: order.card_id });

      // Aktualizuj lokalny stan
      setOrders(prev => prev.map(o =>
        o.id === order.id
          ? { ...o, status: 'paid' as CardOrderStatus, paid_at: new Date().toISOString() }
          : o
      ));

      if (isCarCard) {
        success('Zatwierdzone!', `Karta przyznana, +${order.amount.toFixed(2)} zł do wsparcia`);
      } else {
        success('Zatwierdzone!', `Karta przyznana, +${order.xp_reward} XP dodane`);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Nieznany błąd';
      showError('Błąd', errorMessage);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleCancelOrder = async (order: CardOrder) => {
    setProcessingOrder(order.id);

    const { error } = await supabase
      .from('card_orders')
      .update({
        status: 'cancelled',
        reviewed_by: profile?.id,
      })
      .eq('id', order.id);

    if (error) {
      showError('Błąd', error.message);
    } else {
      setOrders(prev => prev.map(o =>
        o.id === order.id
          ? { ...o, status: 'cancelled' as CardOrderStatus }
          : o
      ));
      success('Anulowane!', 'Zamówienie zostało anulowane');
    }

    setProcessingOrder(null);
  };

  // === MYSTERY GARAGE MANAGEMENT ===
  useEffect(() => {
    if (activeTab === 'mystery' && !mysteryLoaded) {
      loadMysteryPurchases();
    }
  }, [activeTab, mysteryLoaded]);

  const loadMysteryPurchases = async () => {
    const { data, error } = await supabase
      .from('mystery_pack_purchases')
      .select('*, user:users(nick, email), pack_type:mystery_pack_types(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMysteryPurchases(data as MysteryPackPurchase[]);
    } else {
      setMysteryPurchases([]);
    }
    setMysteryLoaded(true);
  };

  const handleApproveMysteryPurchase = async (purchase: MysteryPackPurchase) => {
    if (!profile?.id) return;
    setProcessingMystery(purchase.id);

    try {
      // 1. Zmień status na 'paid'
      const { error: updateError } = await supabase
        .from('mystery_pack_purchases')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', purchase.id);

      if (updateError) throw updateError;

      // 2. Pobierz dostępne karty samochodów
      const { data: availableCards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('card_type', 'car')
        .eq('is_active', true);

      if (cardsError || !availableCards || availableCards.length === 0) {
        throw new Error('Brak dostępnych kart w systemie');
      }

      // 3. Pobierz typ pakietu
      const packType = purchase.pack_type;
      if (!packType) {
        throw new Error('Nieznany typ pakietu');
      }

      // 4. Losuj karty według szans
      const cardCount = packType.card_count || 3;
      const selectedCards: CollectibleCard[] = [];

      // Grupuj karty po rzadkości
      const cardsByRarity: Record<string, CollectibleCard[]> = {
        common: availableCards.filter((c: CollectibleCard) => c.rarity === 'common'),
        rare: availableCards.filter((c: CollectibleCard) => c.rarity === 'rare'),
        epic: availableCards.filter((c: CollectibleCard) => c.rarity === 'epic'),
        legendary: availableCards.filter((c: CollectibleCard) => c.rarity === 'legendary'),
      };

      // Funkcja losująca rzadkość
      const rollRarity = (): CardRarity => {
        const roll = Math.random() * 100;
        if (roll < (packType.legendary_chance || 3)) return 'legendary';
        if (roll < (packType.legendary_chance || 3) + (packType.epic_chance || 12)) return 'epic';
        if (roll < (packType.legendary_chance || 3) + (packType.epic_chance || 12) + (packType.rare_chance || 25)) return 'rare';
        return 'common';
      };

      // Losuj karty
      for (let i = 0; i < cardCount; i++) {
        let targetRarity = rollRarity();

        // Dla dużego pakietu - ostatnia karta gwarantowana Epic+
        if (packType.size === 'large' && i === cardCount - 1 &&
            !selectedCards.some(c => c.rarity === 'epic' || c.rarity === 'legendary')) {
          targetRarity = Math.random() < 0.3 ? 'legendary' : 'epic';
        }

        let pool = cardsByRarity[targetRarity];

        // Fallback jeśli brak kart o danej rzadkości
        if (!pool || pool.length === 0) {
          const fallbackOrder: CardRarity[] = ['epic', 'rare', 'common'];
          for (const fallback of fallbackOrder) {
            if (cardsByRarity[fallback] && cardsByRarity[fallback].length > 0) {
              pool = cardsByRarity[fallback];
              break;
            }
          }
        }

        if (pool && pool.length > 0) {
          const randomIndex = Math.floor(Math.random() * pool.length);
          selectedCards.push(pool[randomIndex]);
        }
      }

      // 5. Dodaj karty do kolekcji użytkownika
      const userCards = selectedCards.map(card => ({
        user_id: purchase.user_id,
        card_id: card.id,
        obtained_from: 'purchase' as const,
      }));

      const { error: insertError } = await supabase
        .from('user_cards')
        .insert(userCards);

      if (insertError) throw insertError;

      // 6. Zaktualizuj status na 'opened'
      await supabase
        .from('mystery_pack_purchases')
        .update({
          status: 'opened',
          cards_received: selectedCards.map(c => c.id),
          opened_at: new Date().toISOString(),
        })
        .eq('id', purchase.id);

      // 7. Dodaj do donation_total
      const { data: userData } = await supabase
        .from('users')
        .select('donation_total')
        .eq('id', purchase.user_id)
        .single();

      if (userData) {
        await supabase
          .from('users')
          .update({ donation_total: (userData.donation_total || 0) + purchase.amount })
          .eq('id', purchase.user_id);
      }

      // 8. Dodaj XP za karty (1 XP za kartę)
      const { data: userXpData } = await supabase
        .from('users')
        .select('total_xp')
        .eq('id', purchase.user_id)
        .single();

      if (userXpData) {
        await supabase
          .from('users')
          .update({ total_xp: (userXpData.total_xp || 0) + selectedCards.length })
          .eq('id', purchase.user_id);
      }

      // Aktualizuj lokalny stan
      setMysteryPurchases(prev => prev.map(p =>
        p.id === purchase.id
          ? { ...p, status: 'opened' as MysteryPackStatus, opened_at: new Date().toISOString() }
          : p
      ));

      const rarityNames: Record<CardRarity, string> = {
        common: 'zwykłych',
        rare: 'rzadkich',
        epic: 'epickich',
        legendary: 'legendarnych'
      };

      const summary = selectedCards.reduce((acc, c) => {
        acc[c.rarity] = (acc[c.rarity] || 0) + 1;
        return acc;
      }, {} as Record<CardRarity, number>);

      const summaryText = Object.entries(summary)
        .map(([rarity, count]) => `${count} ${rarityNames[rarity as CardRarity]}`)
        .join(', ');

      success('Pakiet otwarty!', `Gracz otrzymał: ${summaryText}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Nieznany błąd';
      showError('Błąd', errorMessage);
    } finally {
      setProcessingMystery(null);
    }
  };

  const handleCancelMysteryPurchase = async (purchase: MysteryPackPurchase) => {
    setProcessingMystery(purchase.id);

    const { error } = await supabase
      .from('mystery_pack_purchases')
      .update({ status: 'cancelled' })
      .eq('id', purchase.id);

    if (error) {
      showError('Błąd', error.message);
    } else {
      setMysteryPurchases(prev => prev.map(p =>
        p.id === purchase.id
          ? { ...p, status: 'cancelled' as MysteryPackStatus }
          : p
      ));
      success('Anulowane!', 'Zamówienie pakietu zostało anulowane');
    }

    setProcessingMystery(null);
  };

  // === LEVELS MANAGEMENT ===
  useEffect(() => {
    if (activeTab === 'levels' && !levelsLoaded) {
      loadLevels();
    }
  }, [activeTab, levelsLoaded]);

  const loadLevels = async () => {
    // Spróbuj załadować z bazy danych
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) {
      setEditableLevels(data as Level[]);
    } else {
      // Użyj domyślnych poziomów z kodu
      setEditableLevels(LEVELS.map(l => ({ ...l })));
    }
    setLevelsLoaded(true);
  };

  const handleLevelChange = (index: number, field: keyof Level, value: string | number) => {
    setEditableLevels(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveLevels = async () => {
    setSavingLevels(true);

    // Walidacja
    for (let i = 0; i < editableLevels.length; i++) {
      const level = editableLevels[i];
      if (!level.name.trim()) {
        showError('Błąd', `Poziom ${i + 1} musi mieć nazwę`);
        setSavingLevels(false);
        return;
      }
      if (i > 0 && level.min_xp <= editableLevels[i - 1].min_xp) {
        showError('Błąd', `Próg XP poziomu ${i + 1} musi być większy niż poprzedniego`);
        setSavingLevels(false);
        return;
      }
    }

    // Spróbuj zapisać do bazy danych
    const { error } = await supabase
      .from('levels')
      .upsert(editableLevels.map((l, i) => ({
        id: l.id,
        name: l.name,
        min_xp: l.min_xp,
        max_xp: i < editableLevels.length - 1 ? editableLevels[i + 1].min_xp - 1 : 999999,
        badge_icon: l.badge_icon,
        badge_color: l.badge_color,
        unlocks_description: l.unlocks_description || null,
      })));

    if (error) {
      // Jeśli tabela nie istnieje, pokaż instrukcję
      if (error.code === '42P01') {
        showError(
          'Tabela nie istnieje',
          'Utwórz tabelę "levels" w Supabase. Poziomy zostały zapisane lokalnie.'
        );
        // Zapisz do localStorage jako fallback
        localStorage.setItem('turbo_levels', JSON.stringify(editableLevels));
      } else {
        showError('Błąd', `Nie udało się zapisać: ${error.message}`);
      }
    } else {
      success('Zapisano!', 'Poziomy zostały zaktualizowane');
    }

    setSavingLevels(false);
  };

  const addLevel = () => {
    const lastLevel = editableLevels[editableLevels.length - 1];
    const newLevel: Level = {
      id: editableLevels.length + 1,
      name: 'Nowy Poziom',
      min_xp: lastLevel.min_xp + 1000,
      max_xp: lastLevel.min_xp + 2000,
      badge_icon: '⭐',
      badge_color: '#6b7280',
    };
    setEditableLevels(prev => [...prev, newLevel]);
  };

  const removeLevel = (index: number) => {
    if (editableLevels.length <= 1) {
      showError('Błąd', 'Musi pozostać co najmniej jeden poziom');
      return;
    }
    setEditableLevels(prev => prev.filter((_, i) => i !== index));
  };

  // === CHANGE NICK ===
  const handleChangeNick = async () => {
    if (!selectedUser || !newNick.trim()) {
      setNickError('Podaj nowy nick');
      return;
    }

    if (newNick.length < 3) {
      setNickError('Nick musi mieć co najmniej 3 znaki');
      return;
    }

    if (newNick.length > 20) {
      setNickError('Nick może mieć maksymalnie 20 znaków');
      return;
    }

    // Sprawdź czy nick nie jest już zajęty
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .ilike('nick', newNick)
      .neq('id', selectedUser.id)
      .maybeSingle();

    if (existingUser) {
      setNickError('Ten nick jest już zajęty');
      return;
    }

    // Zmień nick
    const { error } = await supabase
      .from('users')
      .update({ nick: newNick.trim() })
      .eq('id', selectedUser.id);

    if (error) {
      setNickError('Nie udało się zmienić nicku');
      return;
    }

    success('Zmieniono!', `Nick zmieniony na "${newNick}"`);

    // Aktualizuj lokalny stan
    const updatedUser = { ...selectedUser, nick: newNick.trim() };
    setSelectedUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));

    setShowChangeNickModal(false);
    setNewNick('');
    setNickError('');
  };

  if (!profile?.is_admin) {
    return null;
  }

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-dark-900 lg:flex">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-dark-800 text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-white">{currentTab?.label}</h1>
              <p className="text-xs text-dark-400">{currentTab?.description}</p>
            </div>
          </div>
          {activeTab === 'submissions' && stats.pendingSubmissions > 0 && (
            <Badge variant="danger">{stats.pendingSubmissions}</Badge>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-dark-850 border-r border-dark-800
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-dark-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-turbo-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-turbo-500" />
              </div>
              <div>
                <h1 className="font-bold text-white">Panel Admina</h1>
                <p className="text-xs text-dark-400">Turbo Challenge</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-dark-700 text-dark-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 pb-40 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge = tab.id === 'submissions' ? stats.pendingSubmissions : null;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                  ${isActive
                    ? 'bg-turbo-500 text-white shadow-lg shadow-turbo-500/20'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{tab.label}</p>
                  <p className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-dark-500'}`}>
                    {tab.description}
                  </p>
                </div>
                {badge !== null && badge > 0 && (
                  <span className={`
                    px-2 py-0.5 text-xs font-bold rounded-full
                    ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}
                  `}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-800 bg-dark-850">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2 mb-2 rounded-xl bg-accent-500/10 hover:bg-accent-500/20 text-accent-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span className="text-sm font-medium">Panel gracza</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-sm font-bold text-white">
              {profile.nick?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.nick}</p>
              <p className="text-xs text-dark-400">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Desktop Header */}
        <div className="hidden lg:block sticky top-0 z-40 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{currentTab?.label}</h1>
              <p className="text-dark-400">{currentTab?.description}</p>
            </div>
            {activeTab === 'submissions' && stats.pendingSubmissions > 0 && (
              <Badge variant="danger" size="lg">{stats.pendingSubmissions} oczekujacych</Badge>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 lg:p-8 overflow-x-hidden">
          {loading && activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="h-32 animate-pulse bg-dark-700" />
              ))}
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="text-center p-6">
                      <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                      <div className="text-dark-400">Graczy</div>
                    </Card>

                    <Card className="text-center p-6">
                      <Target className="w-10 h-10 text-turbo-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-white">
                        {stats.activeMissions}/{stats.totalMissions}
                      </div>
                      <div className="text-dark-400">Aktywnych misji</div>
                    </Card>

                    <Card className="text-center p-6">
                      <Clock className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-white">{stats.pendingSubmissions}</div>
                      <div className="text-dark-400">Do weryfikacji</div>
                    </Card>

                    <Card className="text-center p-6">
                      <BarChart3 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-white">{formatNumber(stats.totalXP)}</div>
                      <div className="text-dark-400">Laczne XP</div>
                    </Card>
                  </div>

                  {stats.pendingSubmissions > 0 && (
                    <Card className="border-yellow-500/30 bg-yellow-500/5 p-6">
                      <div className="flex items-center gap-4">
                        <Clock className="w-8 h-8 text-yellow-500" />
                        <div className="flex-1">
                          <p className="font-medium text-white text-lg">Oczekujace zgloszenia</p>
                          <p className="text-dark-400">
                            {stats.pendingSubmissions} zgloszen wymaga weryfikacji
                          </p>
                        </div>
                        <Button onClick={() => setActiveTab('submissions')}>
                          Sprawdz teraz
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-white text-lg mb-4">Szybkie akcje</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <Button variant="secondary" onClick={openCreateMission}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nowa misja
                      </Button>
                      <Button variant="secondary" onClick={() => setActiveTab('submissions')}>
                        <Clock className="w-4 h-4 mr-2" />
                        Zgloszenia
                      </Button>
                      <Button variant="secondary" onClick={() => setActiveTab('missions')}>
                        <Target className="w-4 h-4 mr-2" />
                        Misje
                      </Button>
                      <Button variant="secondary" onClick={() => setActiveTab('users')}>
                        <Users className="w-4 h-4 mr-2" />
                        Gracze
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* Submissions Tab */}
              {activeTab === 'submissions' && (
                <div className="space-y-4">
                  {pendingSubmissions.length === 0 ? (
                    <Card className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-white font-medium text-lg">Wszystko sprawdzone!</p>
                      <p className="text-dark-400">Brak oczekujacych zgloszen</p>
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
                        className="p-4"
                      >
                        <div className="flex items-center gap-4">
                          {submission.photo_url && (
                            <div className="w-20 h-20 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                              <img
                                src={submission.photo_url}
                                alt="Zgloszenie"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-lg truncate">
                              {submission.mission?.title}
                            </p>
                            <p className="text-dark-400">
                              od: <span className="text-accent-400">{submission.user?.nick}</span>
                            </p>
                            <p className="text-sm text-dark-500">
                              {formatDateTime(submission.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="warning">Oczekuje</Badge>
                            <span className="text-turbo-400 font-medium">
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
                  <Button onClick={openCreateMission}>
                    <Plus className="w-5 h-5 mr-2" />
                    Dodaj nowa misje
                  </Button>

                  {missions.length === 0 ? (
                    <Card className="text-center py-12">
                      <Target className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                      <p className="text-dark-400">Brak misji</p>
                      <p className="text-sm text-dark-500">Dodaj pierwsza misje powyzej</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {missions.map(mission => (
                        <Card key={mission.id} className="p-4">
                          <div className="flex items-center gap-3 mb-3">
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
                          </div>

                          <p className="text-sm text-dark-300 mb-4 line-clamp-2">{mission.description}</p>

                          {mission.location_name && (
                            <p className="text-xs text-dark-400 mb-3">
                              📍 {mission.location_name}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openEditMission(mission)}
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edytuj
                            </Button>

                            {mission.type === 'survey' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openSurveyResults(mission)}
                              >
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Wyniki
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleToggleMissionStatus(mission)}
                            >
                              {mission.status === 'active' ? (
                                <>
                                  <ToggleRight className="w-4 h-4 mr-1" />
                                  Wylacz
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-4 h-4 mr-1" />
                                  Wlacz
                                </>
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setMissionToDelete(mission);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Usun
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (() => {
                const q = userSearchQuery.toLowerCase().trim();
                const filteredUsers = q
                  ? users.filter(u => u.nick.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
                  : users;

                return (
                <div className="space-y-4">
                  {/* Header z przyciskiem pakietu startowego */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Gracze ({users.length})</h3>
                      <p className="text-sm text-dark-400">Zarządzaj użytkownikami i przydzielaj karty</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="danger" onClick={() => setShowResetModal(true)}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset kart
                      </Button>
                      <Button onClick={() => setShowStarterPackModal(true)}>
                        <Package className="w-4 h-4 mr-1" />
                        Pakiet startowy
                      </Button>
                    </div>
                  </div>

                  {/* Wyszukiwarka graczy */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      placeholder="Szukaj po nicku lub emailu..."
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-dark-500 focus:border-turbo-500 focus:outline-none transition-colors"
                    />
                    {userSearchQuery && (
                      <button
                        onClick={() => setUserSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {q && (
                    <p className="text-sm text-dark-400">
                      Znaleziono: {filteredUsers.length} {filteredUsers.length === 1 ? 'gracz' : filteredUsers.length < 5 ? 'graczy' : 'graczy'}
                    </p>
                  )}

                  <div className="space-y-3">
                  {filteredUsers.map((user, index) => {
                    const originalIndex = users.indexOf(user);
                    return (
                    <Card key={user.id} hover onClick={() => openUserDetails(user)} className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          originalIndex === 0 ? 'bg-yellow-500 text-black' :
                          originalIndex === 1 ? 'bg-gray-400 text-black' :
                          originalIndex === 2 ? 'bg-amber-700 text-white' :
                          'bg-dark-700 text-dark-300'
                        }`}>
                          {originalIndex + 1}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center text-white font-bold overflow-hidden">
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
                        <div className="text-right mr-3">
                          <div className="font-bold text-turbo-400 text-lg">{formatNumber(user.total_xp)}</div>
                          <div className="text-xs text-dark-500">XP</div>
                        </div>
                        <Eye className="w-5 h-5 text-dark-400" />
                      </div>
                    </Card>
                    );
                  })}
                  {q && filteredUsers.length === 0 && (
                    <Card className="text-center py-8">
                      <Search className="w-10 h-10 text-dark-600 mx-auto mb-2" />
                      <p className="text-dark-400">Nie znaleziono graczy</p>
                    </Card>
                  )}
                  </div>
                </div>
                );
              })()}

              {/* Rewards Tab */}
              {activeTab === 'rewards' && (() => {
                const rewardSections: { type: RewardType; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
                  { type: 'xp', label: 'Ranking Misji (XP)', icon: Target, color: 'text-turbo-400', bgColor: 'bg-turbo-500/20' },
                  { type: 'cards', label: 'Ranking Kart / Wsparcia', icon: Layers, color: 'text-red-400', bgColor: 'bg-red-500/20' },
                  { type: 'lottery', label: 'Losowania', icon: Sparkles, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
                ];

                const renderRewardCard = (reward: Reward) => (
                  <Card key={reward.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        reward.place === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white' :
                        reward.place === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                        reward.place === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' :
                        reward.place === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white' :
                        'bg-dark-700 text-dark-300'
                      }`}>
                        {reward.place === 0 ? <Sparkles className="w-5 h-5" /> : reward.place}
                      </div>

                      {reward.image_url ? (
                        <div className="w-14 h-14 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                          <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                        </div>
                      ) : null}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{reward.title}</p>
                        <p className="text-sm text-dark-400 truncate">{reward.description || 'Brak opisu'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {reward.value && (
                            <span className="text-xs text-turbo-400 font-medium">{reward.value}</span>
                          )}
                          {reward.sponsor && (
                            <span className="text-xs text-dark-500">Sponsor: {reward.sponsor}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button size="sm" variant="secondary" onClick={() => openRewardModal(reward)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteReward(reward)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );

                return (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Nagrody</h3>
                    <p className="text-sm text-dark-400">Zarządzaj nagrodami w 3 kategoriach — wyświetlają się na stronie Nagrody i w rankingach</p>
                  </div>

                  {!rewardsLoaded ? (
                    <div className="text-center py-8 text-dark-400">Ładowanie nagród...</div>
                  ) : (
                    <>
                      {rewardSections.map(section => {
                        const SectionIcon = section.icon;
                        const sectionRewards = rewards
                          .filter(r => (r.reward_type || 'xp') === section.type)
                          .sort((a, b) => a.place - b.place);

                        return (
                          <div key={section.type} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg ${section.bgColor} flex items-center justify-center`}>
                                  <SectionIcon className={`w-4 h-4 ${section.color}`} />
                                </div>
                                <h4 className="font-medium text-white">{section.label}</h4>
                                <Badge variant="default">{sectionRewards.length}</Badge>
                              </div>
                              <Button size="sm" onClick={() => openRewardModal(undefined, section.type)}>
                                <Plus className="w-4 h-4 mr-1" />
                                Dodaj
                              </Button>
                            </div>

                            {sectionRewards.length === 0 ? (
                              <Card variant="outlined" className="text-center py-6">
                                <Gift className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                                <p className="text-sm text-dark-500">Brak nagród w tej kategorii</p>
                              </Card>
                            ) : (
                              <div className="space-y-2">
                                {sectionRewards.map(renderRewardCard)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
                );
              })()}

              {/* Cards Tab */}
              {activeTab === 'cards' && (() => {
                const cq = cardSearchQuery.toLowerCase().trim();
                const filteredCards = cards.filter(card => {
                  if (cq && !card.name.toLowerCase().includes(cq) && !(card.car_brand && card.car_brand.toLowerCase().includes(cq))) return false;
                  if (cardFilterRarity !== 'all' && card.rarity !== cardFilterRarity) return false;
                  if (cardFilterType !== 'all' && card.card_type !== cardFilterType) return false;
                  return true;
                });

                return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Karty kolekcjonerskie ({cards.length})</h3>
                      <p className="text-sm text-dark-400">Twórz karty, które gracze mogą zbierać</p>
                    </div>
                    <Button onClick={() => openCardModal()}>
                      <Plus className="w-4 h-4 mr-1" />
                      Dodaj kartę
                    </Button>
                  </div>

                  {/* Wyszukiwarka i filtry */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input
                        type="text"
                        value={cardSearchQuery}
                        onChange={e => setCardSearchQuery(e.target.value)}
                        placeholder="Szukaj po nazwie lub marce..."
                        className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-dark-500 focus:border-turbo-500 focus:outline-none transition-colors"
                      />
                      {cardSearchQuery && (
                        <button
                          onClick={() => setCardSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {/* Filtr rzadkości */}
                      <select
                        value={cardFilterRarity}
                        onChange={e => setCardFilterRarity(e.target.value as 'all' | CardRarity)}
                        className="bg-dark-800 border border-dark-600 rounded-xl px-3 py-2 text-sm text-white focus:border-turbo-500 focus:outline-none"
                      >
                        <option value="all">Wszystkie rzadkości</option>
                        {RARITY_OPTIONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      {/* Filtr typu */}
                      <select
                        value={cardFilterType}
                        onChange={e => setCardFilterType(e.target.value as 'all' | 'car' | 'hero')}
                        className="bg-dark-800 border border-dark-600 rounded-xl px-3 py-2 text-sm text-white focus:border-turbo-500 focus:outline-none"
                      >
                        <option value="all">Wszystkie typy</option>
                        <option value="car">Samochody</option>
                        <option value="hero">Turbo Hero</option>
                      </select>
                      {(cardSearchQuery || cardFilterRarity !== 'all' || cardFilterType !== 'all') && (
                        <button
                          onClick={() => {
                            setCardSearchQuery('');
                            setCardFilterRarity('all');
                            setCardFilterType('all');
                          }}
                          className="text-sm text-dark-400 hover:text-white px-3 py-2 transition-colors"
                        >
                          Wyczyść filtry
                        </button>
                      )}
                    </div>
                  </div>

                  {(cq || cardFilterRarity !== 'all' || cardFilterType !== 'all') && (
                    <p className="text-sm text-dark-400">Znaleziono: {filteredCards.length} kart</p>
                  )}

                  {!cardsLoaded ? (
                    <div className="text-center py-8 text-dark-400">Ładowanie kart...</div>
                  ) : filteredCards.length === 0 ? (
                    <Card className="text-center py-12">
                      {cards.length === 0 ? (
                        <>
                          <Layers className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                          <p className="text-dark-400">Brak kart</p>
                          <p className="text-sm text-dark-500">Dodaj pierwszą kartę kolekcjonerską</p>
                        </>
                      ) : (
                        <>
                          <Search className="w-10 h-10 text-dark-600 mx-auto mb-2" />
                          <p className="text-dark-400">Brak kart dla wybranych filtrów</p>
                        </>
                      )}
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredCards.map(card => {
                        const rarityOpt = RARITY_OPTIONS.find(r => r.value === card.rarity);
                        return (
                          <Card key={card.id} className={`p-4 ${!card.is_active ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-4">
                              {/* Card icon */}
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                card.rarity === 'legendary' ? 'bg-yellow-500/20' :
                                card.rarity === 'epic' ? 'bg-purple-500/20' :
                                card.rarity === 'rare' ? 'bg-blue-500/20' :
                                'bg-gray-500/20'
                              }`}>
                                {card.image_url ? (
                                  <img src={card.image_url} alt={card.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  <Sparkles className={`w-6 h-6 ${rarityOpt?.color || 'text-gray-400'}`} />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{card.card_type === 'car' ? '🚗' : '🏆'}</span>
                                  <p className="font-medium text-white truncate">{card.name}</p>
                                  <Badge variant={
                                    card.rarity === 'legendary' ? 'warning' :
                                    card.rarity === 'epic' ? 'turbo' :
                                    card.rarity === 'rare' ? 'info' :
                                    'default'
                                  } size="sm">
                                    {rarityOpt?.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-dark-400">
                                  {card.card_type === 'car' && card.car_brand ? `${card.car_brand} • ` : ''}
                                  {card.category} • {card.points} pkt
                                  {card.card_type === 'car' && card.car_horsepower ? ` • ${card.car_horsepower} KM` : ''}
                                </p>
                                {card.owner_user_id && (
                                  <Badge variant="info" size="sm">Właściciel</Badge>
                                )}
                                {card.total_supply && (
                                  <p className="text-xs text-dark-500">Limit: {card.total_supply} szt.</p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openCardOwners(card)}
                                  title="Zobacz właścicieli"
                                >
                                  <Users className="w-4 h-4 text-purple-400" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleToggleCard(card)}
                                  title={card.is_active ? 'Ukryj kartę' : 'Aktywuj kartę'}
                                >
                                  {card.is_active ? (
                                    <ToggleRight className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <ToggleLeft className="w-5 h-5 text-dark-500" />
                                  )}
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => openCardModal(card)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleDeleteCard(card)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Info */}
                  <Card variant="outlined" className="border-purple-500/30 bg-purple-500/5">
                    <div className="flex items-start gap-3 p-4">
                      <HelpCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                      <div>
                        <p className="text-purple-400 font-medium">Jak przyznawać karty?</p>
                        <p className="text-sm text-dark-300 mt-1">
                          Karty można przyznawać graczom ręcznie z poziomu szczegółów gracza lub automatycznie
                          jako nagrody za misje i osiągnięcia.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
                );
              })()}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Zamówienia kart</h3>
                      <p className="text-sm text-dark-400">Weryfikuj płatności i przyznawaj karty</p>
                    </div>
                    <Button variant="secondary" onClick={loadOrders}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Odśwież
                    </Button>
                  </div>

                  {/* Statystyki zamówień */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        {orders.filter(o => o.status === 'pending').length}
                      </div>
                      <div className="text-xs text-dark-400">Oczekujące</div>
                    </Card>
                    <Card className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {orders.filter(o => o.status === 'paid').length}
                      </div>
                      <div className="text-xs text-dark-400">Opłacone</div>
                    </Card>
                    <Card className="text-center">
                      <div className="text-2xl font-bold text-turbo-400">
                        {orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0)} zł
                      </div>
                      <div className="text-xs text-dark-400">Zebrano</div>
                    </Card>
                  </div>

                  {!ordersLoaded ? (
                    <div className="text-center py-8 text-dark-400">Ładowanie zamówień...</div>
                  ) : orders.length === 0 ? (
                    <Card className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                      <p className="text-dark-400">Brak zamówień</p>
                      <p className="text-sm text-dark-500">Gdy użytkownicy zaczną kupować karty, zamówienia pojawią się tutaj</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => (
                        <Card key={order.id} className={`p-4 ${order.status !== 'pending' ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-4">
                            {/* Ikona statusu */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              order.status === 'pending' ? 'bg-yellow-500/20' :
                              order.status === 'paid' ? 'bg-green-500/20' :
                              'bg-dark-700'
                            }`}>
                              {order.status === 'pending' ? (
                                <Clock className="w-6 h-6 text-yellow-500" />
                              ) : order.status === 'paid' ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              ) : (
                                <XCircle className="w-6 h-6 text-dark-400" />
                              )}
                            </div>

                            {/* Dane zamówienia */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{order.user?.nick || 'Nieznany'}</p>
                                <span className="text-xs text-dark-500">•</span>
                                <span className="font-mono text-turbo-400 text-sm">{order.order_code}</span>
                              </div>
                              <p className="text-sm text-dark-400">
                                {order.card?.name || 'Nieznana karta'} • {order.amount} zł • +{order.xp_reward} XP
                              </p>
                              <p className="text-xs text-dark-500">
                                {new Date(order.created_at).toLocaleDateString('pl-PL', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            {/* Akcje */}
                            {order.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveOrder(order)}
                                  loading={processingOrder === order.id}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Zatwierdź
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleCancelOrder(order)}
                                  loading={processingOrder === order.id}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}

                            {order.status === 'paid' && (
                              <span className="text-green-400 text-sm flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Opłacone
                              </span>
                            )}

                            {order.status === 'cancelled' && (
                              <span className="text-dark-400 text-sm">Anulowane</span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Info */}
                  <Card variant="outlined" className="border-red-500/30 bg-red-500/5">
                    <div className="flex items-start gap-3 p-4">
                      <Heart className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-medium">Wpłaty na Turbo Pomoc</p>
                        <p className="text-sm text-dark-300 mt-1">
                          Przed zatwierdzeniem zamówienia sprawdź, czy wpłata z kodem zamówienia wpłynęła na konto Fundacji.
                          Po zatwierdzeniu karta zostanie automatycznie przypisana do gracza.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Mystery Garage Tab */}
              {activeTab === 'mystery' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Mystery Garage</h3>
                      <p className="text-sm text-dark-400">Zamówienia pakietów losowych kart</p>
                    </div>
                    <Button variant="secondary" onClick={loadMysteryPurchases}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Odśwież
                    </Button>
                  </div>

                  {/* Statystyki */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        {mysteryPurchases.filter(p => p.status === 'pending').length}
                      </div>
                      <div className="text-xs text-dark-400">Oczekujące</div>
                    </Card>
                    <Card className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {mysteryPurchases.filter(p => p.status === 'opened').length}
                      </div>
                      <div className="text-xs text-dark-400">Otwarte</div>
                    </Card>
                    <Card className="text-center">
                      <div className="text-2xl font-bold text-turbo-400">
                        {mysteryPurchases.filter(p => p.status === 'opened').reduce((sum, p) => sum + p.amount, 0).toFixed(0)} zł
                      </div>
                      <div className="text-xs text-dark-400">Zebrano</div>
                    </Card>
                  </div>

                  {!mysteryLoaded ? (
                    <div className="text-center py-8 text-dark-400">Ładowanie zamówień...</div>
                  ) : mysteryPurchases.length === 0 ? (
                    <Card className="text-center py-12">
                      <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                      <p className="text-dark-400">Brak zamówień pakietów</p>
                      <p className="text-sm text-dark-500">Gdy użytkownicy zaczną kupować pakiety Mystery Garage, zamówienia pojawią się tutaj</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {mysteryPurchases.map(purchase => (
                        <Card key={purchase.id} className={`p-4 ${purchase.status !== 'pending' ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-4">
                            {/* Ikona statusu */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              purchase.status === 'pending' ? 'bg-yellow-500/20' :
                              purchase.status === 'opened' ? 'bg-green-500/20' :
                              'bg-dark-700'
                            }`}>
                              {purchase.status === 'pending' ? (
                                <Clock className="w-6 h-6 text-yellow-500" />
                              ) : purchase.status === 'opened' ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              ) : (
                                <XCircle className="w-6 h-6 text-dark-400" />
                              )}
                            </div>

                            {/* Dane zamówienia */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{(purchase.user as { nick?: string })?.nick || 'Nieznany'}</p>
                                <span className="text-xs text-dark-500">•</span>
                                <span className="font-mono text-emerald-400 text-sm">{purchase.order_code}</span>
                              </div>
                              <p className="text-sm text-dark-400">
                                {purchase.pack_type?.name || 'Nieznany pakiet'} • {purchase.amount} zł • {purchase.pack_type?.card_count || '?'} kart
                              </p>
                              <p className="text-xs text-dark-500">
                                {new Date(purchase.created_at).toLocaleDateString('pl-PL', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            {/* Akcje */}
                            {purchase.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveMysteryPurchase(purchase)}
                                  loading={processingMystery === purchase.id}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Zatwierdź
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleCancelMysteryPurchase(purchase)}
                                  loading={processingMystery === purchase.id}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}

                            {purchase.status === 'opened' && (
                              <span className="text-green-400 text-sm flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Otwarte
                              </span>
                            )}

                            {purchase.status === 'cancelled' && (
                              <span className="text-dark-400 text-sm">Anulowane</span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Info */}
                  <Card variant="outlined" className="border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-start gap-3 p-4">
                      <Package className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-emerald-400 font-medium">Jak to działa?</p>
                        <p className="text-sm text-dark-300 mt-1">
                          Gracz kupuje pakiet → otrzymuje kod zamówienia → płaci przelewem z kodem w tytule →
                          Ty zatwierdzasz płatność → System automatycznie losuje karty i dodaje je do kolekcji gracza.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Announcements Tab */}
              {activeTab === 'announcements' && (
                <AnnouncementsAdmin />
              )}

              {/* App Content Tab */}
              {activeTab === 'content' && (
                <AppContentAdmin />
              )}

              {/* Levels Tab */}
              {activeTab === 'levels' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Konfiguracja poziomów</h3>
                      <p className="text-sm text-dark-400">Edytuj nazwy, progi XP i ikony dla każdego poziomu</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={addLevel}>
                        <Plus className="w-4 h-4 mr-1" />
                        Dodaj poziom
                      </Button>
                      <Button onClick={handleSaveLevels} loading={savingLevels}>
                        <Save className="w-4 h-4 mr-1" />
                        Zapisz zmiany
                      </Button>
                    </div>
                  </div>

                  {!levelsLoaded ? (
                    <div className="text-center py-8 text-dark-400">Ładowanie poziomów...</div>
                  ) : (
                    <div className="space-y-3">
                      {editableLevels.map((level, index) => (
                        <Card key={level.id} className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Level number */}
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
                              style={{ backgroundColor: level.badge_color + '30', color: level.badge_color }}
                            >
                              {index + 1}
                            </div>

                            {/* Emoji selector */}
                            <div className="relative">
                              <button
                                onClick={() => setShowEmojiPicker(showEmojiPicker === index ? null : index)}
                                className="w-12 h-12 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-2xl transition-colors"
                                title="Wybierz ikonę"
                              >
                                {level.badge_icon}
                              </button>
                            </div>

                            {/* Name */}
                            <div className="flex-1">
                              <label className="block text-xs text-dark-400 mb-1">Nazwa poziomu</label>
                              <input
                                type="text"
                                value={level.name}
                                onChange={e => handleLevelChange(index, 'name', e.target.value)}
                                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                                placeholder="Nazwa poziomu"
                              />
                            </div>

                            {/* Min XP */}
                            <div className="w-32">
                              <label className="block text-xs text-dark-400 mb-1">Od XP</label>
                              <input
                                type="number"
                                value={level.min_xp}
                                onChange={e => handleLevelChange(index, 'min_xp', parseInt(e.target.value) || 0)}
                                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                                min={0}
                              />
                            </div>

                            {/* Color */}
                            <div className="w-24">
                              <label className="block text-xs text-dark-400 mb-1">Kolor</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={level.badge_color}
                                  onChange={e => handleLevelChange(index, 'badge_color', e.target.value)}
                                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                                />
                              </div>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => removeLevel(index)}
                              className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Usuń poziom"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Unlocks description (optional) */}
                          <div className="mt-3 pt-3 border-t border-dark-700">
                            <label className="block text-xs text-dark-400 mb-1">Opis odblokowań (opcjonalnie)</label>
                            <input
                              type="text"
                              value={level.unlocks_description || ''}
                              onChange={e => handleLevelChange(index, 'unlocks_description', e.target.value)}
                              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="np. Specjalny bonus, dostęp do VIP..."
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Info card */}
                  <Card variant="outlined" className="border-blue-500/30 bg-blue-500/5">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-blue-400 font-medium">Jak to działa?</p>
                        <p className="text-sm text-dark-300 mt-1">
                          Każdy poziom ma próg XP (Od XP). Gracz awansuje gdy osiągnie ten próg.
                          Ikona i kolor są wyświetlane przy nicku gracza i w rankingach.
                        </p>
                        <p className="text-xs text-dark-400 mt-2">
                          Uwaga: Jeśli tabela &quot;levels&quot; nie istnieje w bazie, poziomy są zapisywane lokalnie.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Mission Modal */}
      <Modal
        isOpen={showMissionModal}
        onClose={() => {
          setShowMissionModal(false);
          resetMissionForm();
        }}
        title={isEditing ? 'Edytuj misje' : 'Nowa misja'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Tytul misji *"
            value={missionForm.title}
            onChange={e => setMissionForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="np. Selfie z maskotka"
          />

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Opis *</label>
            <textarea
              value={missionForm.description}
              onChange={e => setMissionForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Opisz co uzytkownik ma zrobic..."
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
                <option value="photo">📷 Zdjecie</option>
                <option value="qr_code">📱 Kod QR</option>
                <option value="quiz">❓ Quiz</option>
                <option value="gps">📍 Lokalizacja GPS</option>
                <option value="manual">✋ Reczna weryfikacja</option>
                <option value="survey">📊 Ankieta</option>
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
                onChange={e => setMissionForm(prev => ({ ...prev, status: e.target.value as MissionStatus }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              >
                <option value="active">Aktywna</option>
                <option value="inactive">Nieaktywna</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Wymagany poziom</label>
              <select
                value={missionForm.required_level}
                onChange={e => setMissionForm(prev => ({ ...prev, required_level: parseInt(e.target.value) }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
                  <option key={level} value={level}>
                    {level === 1 ? '1 (brak wymagania)' : `Poziom ${level}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Lokalizacja"
            value={missionForm.location_name}
            onChange={e => setMissionForm(prev => ({ ...prev, location_name: e.target.value }))}
            placeholder="np. Hala glowna"
          />

          {missionForm.type === 'qr_code' && (
            <Input
              label="Wartosc kodu QR"
              value={missionForm.qr_code_value}
              onChange={e => setMissionForm(prev => ({ ...prev, qr_code_value: e.target.value }))}
              placeholder="Zostaw puste dla autogeneracji"
              helperText="Unikalny kod ktory bedzie zakodowany w QR"
            />
          )}

          {/* Quiz Editor */}
          {missionForm.type === 'quiz' && (
            <div className="space-y-4 border-t border-dark-700 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-turbo-500" />
                  Edytor Quizu ({missionForm.quiz_questions.length} pytan)
                </h4>
                <Button size="sm" onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-1" />
                  Dodaj pytanie
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Prog zaliczenia (%)
                  </label>
                  <input
                    type="number"
                    value={missionForm.quiz_passing_score}
                    onChange={e => setMissionForm(prev => ({
                      ...prev,
                      quiz_passing_score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    }))}
                    min={0}
                    max={100}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Tryb</label>
                  <select
                    value={missionForm.quiz_mode}
                    onChange={e => setMissionForm(prev => ({ ...prev, quiz_mode: e.target.value as QuizMode }))}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  >
                    <option value="classic">Classic (z limitem czasu)</option>
                    <option value="speedrun">Speedrun (mierzy czas)</option>
                  </select>
                </div>
              </div>

              {missionForm.quiz_mode === 'classic' && (
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Limit czasu (sekundy)
                  </label>
                  <input
                    type="number"
                    value={missionForm.quiz_time_limit}
                    onChange={e => setMissionForm(prev => ({
                      ...prev,
                      quiz_time_limit: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    min={0}
                    placeholder="0 = bez limitu"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  />
                  <p className="text-xs text-dark-400 mt-1">0 = bez limitu czasowego</p>
                </div>
              )}

              {missionForm.quiz_questions.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {missionForm.quiz_questions.map((question, qIndex) => (
                    <Card key={question.id} variant="outlined" className="p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="bg-turbo-500 text-white text-xs font-bold px-2 py-1 rounded">
                          {qIndex + 1}
                        </span>
                        <input
                          type="text"
                          value={question.question}
                          onChange={e => updateQuestion(question.id, 'question', e.target.value)}
                          placeholder="Tresc pytania..."
                          className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm"
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removeQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-1 ml-8">
                        {question.answers.map((answer, aIndex) => (
                          <div key={answer.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${question.id}`}
                              checked={answer.is_correct}
                              onChange={() => setCorrectAnswer(question.id, answer.id)}
                              className="w-4 h-4 text-turbo-500"
                            />
                            <input
                              type="text"
                              value={answer.text}
                              onChange={e => updateAnswer(question.id, answer.id, 'text', e.target.value)}
                              placeholder={`Odpowiedz ${aIndex + 1}...`}
                              className={`flex-1 bg-dark-700 border rounded-lg px-3 py-1.5 text-sm ${
                                answer.is_correct ? 'border-green-500 text-green-400' : 'border-dark-600 text-white'
                              }`}
                            />
                            {question.answers.length > 2 && (
                              <button
                                onClick={() => removeAnswer(question.id, answer.id)}
                                className="text-dark-400 hover:text-red-400"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {question.answers.length < 6 && (
                          <button
                            onClick={() => addAnswer(question.id)}
                            className="text-sm text-turbo-400 hover:text-turbo-300 flex items-center gap-1 mt-1"
                          >
                            <Plus className="w-3 h-3" />
                            Dodaj odpowiedz
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Survey Editor */}
          {missionForm.type === 'survey' && (
            <div className="space-y-4 border-t border-dark-700 pt-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-teal-400" />
                <h4 className="font-medium text-white">Edytor Ankiety</h4>
              </div>

              {/* Pytanie */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  Pytanie ankiety
                </label>
                <textarea
                  value={missionForm.survey_question}
                  onChange={e => setMissionForm(prev => ({ ...prev, survey_question: e.target.value }))}
                  placeholder="Np. Kiedy najlepiej zorganizowac spotkanie?"
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white resize-none min-h-[80px]"
                />
              </div>

              {/* Opcje */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-dark-200">
                    Opcje do wyboru ({missionForm.survey_options.length})
                  </label>
                  <Button
                    size="sm"
                    onClick={() => {
                      const nextId = `opt_${missionForm.survey_options.length + 1}`;
                      setMissionForm(prev => ({
                        ...prev,
                        survey_options: [...prev.survey_options, { id: nextId, text: '' }],
                      }));
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Dodaj opcje
                  </Button>
                </div>
                <div className="space-y-2">
                  {missionForm.survey_options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="text-dark-400 text-sm w-6 text-center flex-shrink-0">{index + 1}.</span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={e => {
                          const updated = [...missionForm.survey_options];
                          updated[index] = { ...updated[index], text: e.target.value };
                          setMissionForm(prev => ({ ...prev, survey_options: updated }));
                        }}
                        placeholder={`Opcja ${index + 1}...`}
                        className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm"
                      />
                      {missionForm.survey_options.length > 2 && (
                        <button
                          onClick={() => {
                            setMissionForm(prev => ({
                              ...prev,
                              survey_options: prev.survey_options.filter((_, i) => i !== index),
                            }));
                          }}
                          className="text-dark-400 hover:text-red-400"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={missionForm.survey_allow_other}
                    onChange={e => setMissionForm(prev => ({ ...prev, survey_allow_other: e.target.checked }))}
                    className="w-4 h-4 rounded border-dark-600 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-white">Pozwol na odpowiedz &quot;Inne (jakie?)&quot;</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={missionForm.survey_show_results}
                    onChange={e => setMissionForm(prev => ({ ...prev, survey_show_results: e.target.checked }))}
                    className="w-4 h-4 rounded border-dark-600 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-white">Pokaz wyniki graczom po zaglosowaniu</span>
                </label>
              </div>
            </div>
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
              {isEditing ? 'Zapisz zmiany' : 'Utworz misje'}
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
        title="Weryfikacja zgloszenia"
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
                <p className="text-sm text-dark-400 mb-2">Przeslane zdjecie:</p>
                <img
                  src={selectedSubmission.photo_url}
                  alt="Zgloszenie"
                  className="w-full rounded-xl max-h-80 object-contain bg-dark-800"
                />
              </div>
            )}

            {selectedSubmission.quiz_score !== null && (
              <Card variant="outlined">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-400">Wynik quizu</p>
                    <p className="text-2xl font-bold text-white">{selectedSubmission.quiz_score}%</p>
                  </div>
                  {selectedSubmission.quiz_time_ms && (
                    <div className="text-right">
                      <p className="text-sm text-dark-400">Czas</p>
                      <p className="text-2xl font-bold text-turbo-400">
                        {(selectedSubmission.quiz_time_ms / 1000).toFixed(2)}s
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={() => handleRejectSubmission(selectedSubmission)}
                  className="flex-1"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Odrzuc
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleApproveSubmission(selectedSubmission)}
                  className="flex-1"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Zatwierdz
                </Button>
              </div>
              <Button
                variant="secondary"
                onClick={() => handleFailSubmission(selectedSubmission)}
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Ban className="w-5 h-5 mr-2" />
                Nieukonczone (zablokuj ponowne wykonanie)
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
        title="Usun misje"
        message={`Czy na pewno chcesz usunac misje "${missionToDelete?.title}"? Ta operacja jest nieodwracalna.`}
        confirmText="Usun"
        cancelText="Anuluj"
        variant="danger"
      />

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
          setUserSubmissions([]);
        }}
        title={`Profil: ${selectedUser?.nick || ''}`}
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Card variant="outlined">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt={selectedUser.nick} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.nick.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedUser.nick}</h3>
                    {selectedUser.is_admin && <Badge variant="turbo">Admin</Badge>}
                    <button
                      onClick={() => {
                        setNewNick(selectedUser.nick);
                        setNickError('');
                        setShowChangeNickModal(true);
                      }}
                      className="p-1 rounded hover:bg-dark-600 text-dark-400 hover:text-white transition-colors"
                      title="Zmień nick"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-turbo-400 font-semibold text-xl">
                    {formatNumber(selectedUser.total_xp)} XP • Poziom {selectedUser.level}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2 text-dark-300">
                  <Mail className="w-4 h-4" />
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-2 text-dark-300">
                    <Phone className="w-4 h-4" />
                    <span>{selectedUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-dark-300">
                  <Calendar className="w-4 h-4" />
                  <span>Dołączył: {formatDateTime(selectedUser.created_at)}</span>
                </div>
              </div>
            </Card>

            {/* XP Management Section */}
            <Card variant="outlined" className="border-turbo-500/30 bg-turbo-500/5">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-turbo-500" />
                Zarządzanie punktami XP
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => {
                    setXpOperation('add');
                    setCustomXpAmount(50);
                    setShowXpModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Dodaj XP
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setXpOperation('subtract');
                    setCustomXpAmount(50);
                    setShowXpModal(true);
                  }}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Odejmij XP
                </Button>
              </div>
              <p className="text-xs text-dark-400 mt-2">
                Ręczne dodawanie/odejmowanie punktów (np. bonus, korekta błędu)
              </p>
            </Card>

            {/* Card Assignment Section */}
            <Card variant="outlined" className="border-purple-500/30 bg-purple-500/5">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                Karty kolekcjonerskie ({userCardsForUser.length})
              </h4>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-dark-300">
                  Posiada: <span className="text-purple-400 font-bold">{userCardsForUser.length}</span> kart
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowGrantCardModal(true)}
                  className="border-purple-500/50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Przyznaj kartę
                </Button>
              </div>

              {/* Lista kart użytkownika */}
              {userCardsDetails.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userCardsDetails.map(card => {
                    const rarityOpt = RARITY_OPTIONS.find(r => r.value === card.rarity);
                    return (
                      <div
                        key={card.user_card_id}
                        className="flex items-center gap-3 p-2 bg-dark-800 rounded-lg"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          card.rarity === 'legendary' ? 'bg-yellow-500/20' :
                          card.rarity === 'epic' ? 'bg-purple-500/20' :
                          card.rarity === 'rare' ? 'bg-blue-500/20' :
                          'bg-gray-500/20'
                        }`}>
                          {card.image_url ? (
                            <img src={card.image_url} alt={card.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Sparkles className={`w-4 h-4 ${rarityOpt?.color || 'text-gray-400'}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{card.name}</p>
                          <p className="text-xs text-dark-400">
                            {card.obtained_from === 'admin' ? 'Przyznana' :
                             card.obtained_from === 'purchase' ? 'Kupiona' :
                             card.obtained_from === 'mission' ? 'Z misji' :
                             card.obtained_from === 'mystery' ? 'Mystery Garage' :
                             card.obtained_from} • {formatDateTime(card.obtained_at)}
                          </p>
                        </div>
                        <Badge variant={
                          card.rarity === 'legendary' ? 'warning' :
                          card.rarity === 'epic' ? 'turbo' :
                          card.rarity === 'rare' ? 'info' :
                          'default'
                        } size="sm">
                          {rarityOpt?.label}
                        </Badge>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveCardFromUser(card.user_card_id, selectedUser.id, card.id, card.name)}
                          disabled={removingCard === card.user_card_id}
                          title="Usuń kartę"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {loadingUserDetails ? (
              <div className="text-center py-4 text-dark-400">Ładowanie...</div>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-2">
                  <Card className="text-center py-3">
                    <div className="text-lg font-bold text-green-400">{getUserStats().approved}</div>
                    <div className="text-xs text-dark-400">Zaliczone</div>
                  </Card>
                  <Card className="text-center py-3">
                    <div className="text-lg font-bold text-yellow-400">{getUserStats().pending}</div>
                    <div className="text-xs text-dark-400">Oczekuje</div>
                  </Card>
                  <Card className="text-center py-3">
                    <div className="text-lg font-bold text-red-400">{getUserStats().rejected}</div>
                    <div className="text-xs text-dark-400">Odrzucone</div>
                  </Card>
                  <Card className="text-center py-3">
                    <div className="text-lg font-bold text-orange-400">{getUserStats().revoked}</div>
                    <div className="text-xs text-dark-400">Wycofane</div>
                  </Card>
                  <Card className="text-center py-3">
                    <div className="text-lg font-bold text-turbo-400">{getUserStats().totalXpEarned}</div>
                    <div className="text-xs text-dark-400">XP</div>
                  </Card>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-dark-300 mb-2">
                    Historia zgłoszeń ({userSubmissions.length})
                  </h4>

                  {userSubmissions.length === 0 ? (
                    <Card variant="outlined" className="text-center py-4">
                      <p className="text-dark-400">Brak zgłoszeń</p>
                    </Card>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {userSubmissions.map(submission => (
                        <Card key={submission.id} variant="outlined" padding="sm">
                          <div className="flex items-center gap-3">
                            {/* Photo thumbnail or icon */}
                            {submission.photo_url ? (
                              <button
                                onClick={() => openPhotoPreview(submission)}
                                className="w-12 h-12 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-turbo-500 transition-all"
                              >
                                <img
                                  src={submission.photo_url}
                                  alt="Zdjęcie"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center text-xl flex-shrink-0">
                                {submission.mission ? missionTypeIcons[submission.mission.type] : '?'}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {submission.mission?.title || 'Nieznana misja'}
                              </p>
                              <p className="text-xs text-dark-400">
                                {formatDateTime(submission.created_at)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {submission.status === 'approved' && (
                                <>
                                  <Badge variant="success" size="sm">Zaliczone</Badge>
                                  <span className="text-xs text-turbo-400">+{submission.xp_awarded || submission.mission?.xp_reward} XP</span>
                                  <button
                                    onClick={() => handleRevokeSubmission(submission)}
                                    className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                                    title="Wycofaj misję"
                                  >
                                    <Undo2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {submission.status === 'pending' && (
                                <Badge variant="warning" size="sm">Oczekuje</Badge>
                              )}
                              {submission.status === 'rejected' && (
                                <>
                                  <Badge variant="danger" size="sm">Odrzucone</Badge>
                                  <button
                                    onClick={() => handleResetSubmission(submission)}
                                    className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                    title="Resetuj (pozwól ponownie wykonać)"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {submission.status === 'revoked' && (
                                <>
                                  <Badge variant="default" size="sm">Wycofane</Badge>
                                  <button
                                    onClick={() => handleRestoreSubmission(submission)}
                                    className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                    title="Przywróć misję (oddaj XP)"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {submission.status === 'failed' && (
                                <>
                                  <Badge variant="danger" size="sm">Nieukończone</Badge>
                                  <button
                                    onClick={() => handleResetSubmission(submission)}
                                    className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                    title="Resetuj (pozwól ponownie wykonać)"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {submission.photo_url && (
                                <button
                                  onClick={() => openPhotoPreview(submission)}
                                  className="p-1.5 rounded-lg bg-dark-600 text-dark-300 hover:bg-dark-500 hover:text-white transition-colors"
                                  title="Zobacz zdjęcie"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Delete User Section */}
            <Card variant="outlined" className="border-red-500/30 bg-red-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Strefa niebezpieczna
                  </h4>
                  <p className="text-xs text-dark-400 mt-1">
                    Usunięcie gracza jest nieodwracalne
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setUserToDelete(selectedUser);
                    setShowDeleteUserDialog(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Usuń gracza
                </Button>
              </div>
            </Card>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowUserModal(false);
                setSelectedUser(null);
                setUserSubmissions([]);
              }}
            >
              Zamknij
            </Button>
          </div>
        )}
      </Modal>

      {/* XP Management Modal */}
      <Modal
        isOpen={showXpModal}
        onClose={() => {
          setShowXpModal(false);
          setCustomXpAmount(50);
          setXpNote('');
        }}
        title={xpOperation === 'add' ? 'Dodaj XP' : 'Odejmij XP'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-dark-400 mb-2">
              {xpOperation === 'add' ? 'Dodajesz punkty dla:' : 'Odejmujesz punkty od:'}
            </p>
            <p className="text-xl font-bold text-white">{selectedUser?.nick}</p>
            <p className="text-turbo-400">Aktualne XP: {formatNumber(selectedUser?.total_xp || 0)}</p>
          </div>

          {/* Quick amounts */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Szybki wybór</label>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 100, 200].map(amount => (
                <button
                  key={amount}
                  onClick={() => setCustomXpAmount(amount)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    customXpAmount === amount
                      ? xpOperation === 'add'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  {xpOperation === 'add' ? '+' : '-'}{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              Własna kwota XP
            </label>
            <input
              type="number"
              value={customXpAmount}
              onChange={e => setCustomXpAmount(Math.max(1, parseInt(e.target.value) || 0))}
              min={1}
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white text-center text-xl font-bold"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              Powód (opcjonalnie)
            </label>
            <input
              type="text"
              value={xpNote}
              onChange={e => setXpNote(e.target.value)}
              placeholder="np. Bonus za aktywność, korekta błędu..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
            />
          </div>

          {/* Preview */}
          <Card variant="outlined" className={xpOperation === 'add' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}>
            <div className="text-center">
              <p className="text-sm text-dark-400">Nowe XP po operacji:</p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(Math.max(0, (selectedUser?.total_xp || 0) + (xpOperation === 'add' ? customXpAmount : -customXpAmount)))}
              </p>
              <p className={`text-sm font-medium ${xpOperation === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                ({xpOperation === 'add' ? '+' : '-'}{customXpAmount} XP)
              </p>
            </div>
          </Card>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowXpModal(false);
                setCustomXpAmount(50);
                setXpNote('');
              }}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              variant={xpOperation === 'add' ? 'success' : 'danger'}
              onClick={() => handleManualXp(customXpAmount, xpNote)}
              className="flex-1"
            >
              {xpOperation === 'add' ? (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Dodaj {customXpAmount} XP
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 mr-1" />
                  Odejmij {customXpAmount} XP
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Grant Card Modal */}
      <Modal
        isOpen={showGrantCardModal}
        onClose={() => setShowGrantCardModal(false)}
        title="Przyznaj kartę"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-center py-2">
            <p className="text-dark-400">Wybierz kartę dla:</p>
            <p className="text-xl font-bold text-white">{selectedUser?.nick}</p>
          </div>

          {cards.length === 0 ? (
            <Card className="text-center py-8">
              <Layers className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Brak kart do przyznania</p>
              <p className="text-sm text-dark-500">Najpierw dodaj karty w zakładce "Karty"</p>
            </Card>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {cards.filter(c => c.is_active).map(card => {
                const alreadyOwned = userCardsForUser.includes(card.id);
                const rarityOpt = RARITY_OPTIONS.find(r => r.value === card.rarity);

                return (
                  <Card
                    key={card.id}
                    className={`p-3 ${alreadyOwned ? 'opacity-50' : 'hover:border-purple-500/50 cursor-pointer'}`}
                    onClick={() => !alreadyOwned && !grantingCard && handleGrantCard(card)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        card.rarity === 'legendary' ? 'bg-yellow-500/20' :
                        card.rarity === 'epic' ? 'bg-purple-500/20' :
                        card.rarity === 'rare' ? 'bg-blue-500/20' :
                        'bg-gray-500/20'
                      }`}>
                        {card.image_url ? (
                          <img src={card.image_url} alt={card.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Sparkles className={`w-5 h-5 ${rarityOpt?.color || 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{card.card_type === 'car' ? '🚗' : '🏆'}</span>
                          <p className="font-medium text-white truncate">{card.name}</p>
                          <Badge variant={
                            card.rarity === 'legendary' ? 'warning' :
                            card.rarity === 'epic' ? 'turbo' :
                            card.rarity === 'rare' ? 'info' :
                            'default'
                          } size="sm">
                            {rarityOpt?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-dark-400">{card.category}</p>
                      </div>
                      {alreadyOwned ? (
                        <Badge variant="success" size="sm">Ma kartę</Badge>
                      ) : (
                        <Button size="sm" variant="secondary" disabled={grantingCard}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowGrantCardModal(false)}
          >
            Zamknij
          </Button>
        </div>
      </Modal>

      {/* Photo Preview Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          setSelectedPhotoUrl(null);
          setSelectedPhotoSubmission(null);
        }}
        title={selectedPhotoSubmission?.mission?.title || 'Zdjęcie'}
        size="lg"
      >
        {selectedPhotoUrl && (
          <div className="space-y-4">
            <img
              src={selectedPhotoUrl}
              alt="Zdjęcie zgłoszenia"
              className="w-full rounded-xl max-h-[60vh] object-contain bg-dark-800"
            />
            {selectedPhotoSubmission && (
              <Card variant="outlined">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-dark-400">Misja</p>
                    <p className="font-medium text-white">{selectedPhotoSubmission.mission?.title}</p>
                  </div>
                  <div>
                    <p className="text-dark-400">Status</p>
                    <div className="mt-1">
                      {selectedPhotoSubmission.status === 'approved' && <Badge variant="success">Zaliczone</Badge>}
                      {selectedPhotoSubmission.status === 'pending' && <Badge variant="warning">Oczekuje</Badge>}
                      {selectedPhotoSubmission.status === 'rejected' && <Badge variant="danger">Odrzucone</Badge>}
                      {selectedPhotoSubmission.status === 'revoked' && <Badge variant="default">Wycofane</Badge>}
                      {selectedPhotoSubmission.status === 'failed' && <Badge variant="danger">Nieukończone</Badge>}
                    </div>
                  </div>
                  <div>
                    <p className="text-dark-400">Data zgłoszenia</p>
                    <p className="text-white">{formatDateTime(selectedPhotoSubmission.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-dark-400">XP</p>
                    <p className="text-turbo-400 font-medium">
                      {selectedPhotoSubmission.xp_awarded || selectedPhotoSubmission.mission?.xp_reward} XP
                    </p>
                  </div>
                </div>
              </Card>
            )}
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowPhotoModal(false);
                setSelectedPhotoUrl(null);
                setSelectedPhotoSubmission(null);
              }}
            >
              Zamknij
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation Dialog */}
      <Modal
        isOpen={showDeleteUserDialog}
        onClose={() => {
          setShowDeleteUserDialog(false);
          setUserToDelete(null);
          setDeleteConfirmText('');
        }}
        title="Usuń gracza"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-white font-medium text-lg">
              Czy na pewno chcesz usunąć gracza?
            </p>
            <p className="text-dark-400 mt-2">
              Ta operacja jest <span className="text-red-400 font-bold">nieodwracalna</span>.
              Wszystkie dane gracza zostaną trwale usunięte.
            </p>
          </div>

          {userToDelete && (
            <Card variant="outlined" className="border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center text-white font-bold overflow-hidden">
                  {userToDelete.avatar_url ? (
                    <img src={userToDelete.avatar_url} alt={userToDelete.nick} className="w-full h-full object-cover" />
                  ) : (
                    userToDelete.nick.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{userToDelete.nick}</p>
                  <p className="text-sm text-dark-400">{userToDelete.email}</p>
                  <p className="text-sm text-turbo-400">{formatNumber(userToDelete.total_xp)} XP</p>
                </div>
              </div>
            </Card>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              Wpisz <span className="text-red-400 font-bold">{userToDelete?.nick}</span> aby potwierdzić:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder={userToDelete?.nick}
              className="w-full bg-dark-800 border border-red-500/50 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteUserDialog(false);
                setUserToDelete(null);
                setDeleteConfirmText('');
              }}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              disabled={deleteConfirmText !== userToDelete?.nick}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Usuń na zawsze
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Nick Modal */}
      <Modal
        isOpen={showChangeNickModal}
        onClose={() => {
          setShowChangeNickModal(false);
          setNewNick('');
          setNickError('');
        }}
        title="Zmień nick gracza"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center py-2">
            <p className="text-dark-400">Zmiana nicku dla:</p>
            <p className="text-xl font-bold text-white">{selectedUser?.nick}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              Nowy nick
            </label>
            <input
              type="text"
              value={newNick}
              onChange={e => {
                setNewNick(e.target.value);
                setNickError('');
              }}
              placeholder="Wpisz nowy nick"
              className={`w-full bg-dark-800 border rounded-xl px-4 py-2.5 text-white ${
                nickError ? 'border-red-500' : 'border-dark-600'
              }`}
              maxLength={20}
            />
            {nickError && (
              <p className="text-red-400 text-sm mt-1">{nickError}</p>
            )}
            <p className="text-xs text-dark-400 mt-1">
              3-20 znaków
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowChangeNickModal(false);
                setNewNick('');
                setNickError('');
              }}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleChangeNick}
              disabled={!newNick.trim() || newNick === selectedUser?.nick}
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Zmień nick
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reward Modal */}
      <Modal
        isOpen={showRewardModal}
        onClose={() => {
          setShowRewardModal(false);
          setEditingReward(null);
        }}
        title={editingReward ? 'Edytuj nagrodę' : 'Dodaj nagrodę'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Kategoria + Miejsce/Wartość */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Kategoria *</label>
              <select
                value={rewardForm.reward_type}
                onChange={e => setRewardForm(prev => ({
                  ...prev,
                  reward_type: e.target.value as RewardType,
                  place: e.target.value === 'lottery' ? 0 : prev.place || 1,
                }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              >
                <option value="xp">🎯 Ranking Misji (XP)</option>
                <option value="cards">🃏 Ranking Kart / Wsparcia</option>
                <option value="lottery">🎲 Losowanie</option>
              </select>
            </div>

            {rewardForm.reward_type !== 'lottery' ? (
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Miejsce *</label>
                <select
                  value={rewardForm.place}
                  onChange={e => setRewardForm(prev => ({ ...prev, place: parseInt(e.target.value) }))}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n}. miejsce</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Wartość nagrody</label>
                <input
                  type="text"
                  value={rewardForm.value}
                  onChange={e => setRewardForm(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="np. 500 zł, Voucher..."
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                />
              </div>
            )}
          </div>

          {rewardForm.reward_type !== 'lottery' && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Wartość nagrody</label>
              <input
                type="text"
                value={rewardForm.value}
                onChange={e => setRewardForm(prev => ({ ...prev, value: e.target.value }))}
                placeholder="np. 500 zł, Voucher..."
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Tytuł nagrody *</label>
            <input
              type="text"
              value={rewardForm.title}
              onChange={e => setRewardForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="np. PlayStation 5, Voucher do sklepu..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Opis</label>
            <textarea
              value={rewardForm.description}
              onChange={e => setRewardForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Szczegółowy opis nagrody..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white min-h-[80px] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Sponsor (opcjonalnie)</label>
            <input
              type="text"
              value={rewardForm.sponsor}
              onChange={e => setRewardForm(prev => ({ ...prev, sponsor: e.target.value }))}
              placeholder="Nazwa sponsora nagrody..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">URL zdjęcia (opcjonalnie)</label>
            <input
              type="url"
              value={rewardForm.image_url}
              onChange={e => setRewardForm(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
            />
            {rewardForm.image_url && (
              <div className="mt-2 rounded-lg overflow-hidden w-32 h-32 bg-dark-700">
                <img
                  src={rewardForm.image_url}
                  alt="Podgląd"
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRewardModal(false);
                setEditingReward(null);
              }}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSaveReward}
              loading={savingRewards}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-1" />
              {editingReward ? 'Zapisz zmiany' : 'Dodaj nagrodę'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Card Modal */}
      <Modal
        isOpen={showCardModal}
        onClose={() => {
          setShowCardModal(false);
          setEditingCard(null);
        }}
        title={editingCard ? 'Edytuj kartę' : 'Dodaj kartę'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Typ karty */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Typ karty *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCardForm(prev => ({ ...prev, card_type: 'achievement' }))}
                className={`flex-1 py-2.5 px-4 rounded-xl border transition-colors ${
                  cardForm.card_type === 'achievement'
                    ? 'bg-turbo-500 border-turbo-500 text-white'
                    : 'bg-dark-800 border-dark-600 text-dark-300 hover:border-dark-500'
                }`}
              >
                🏆 Osiągnięcie
              </button>
              <button
                type="button"
                onClick={() => setCardForm(prev => ({ ...prev, card_type: 'car' }))}
                className={`flex-1 py-2.5 px-4 rounded-xl border transition-colors ${
                  cardForm.card_type === 'car'
                    ? 'bg-turbo-500 border-turbo-500 text-white'
                    : 'bg-dark-800 border-dark-600 text-dark-300 hover:border-dark-500'
                }`}
              >
                🚗 Samochód
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Nazwa karty *</label>
              <input
                type="text"
                value={cardForm.name}
                onChange={e => setCardForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={cardForm.card_type === 'car' ? 'np. Porsche 911 Turbo S' : 'np. Speed Demon'}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Rzadkość *</label>
              <select
                value={cardForm.rarity}
                onChange={e => setCardForm(prev => ({ ...prev, rarity: e.target.value as CardRarity }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              >
                {RARITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                {cardForm.card_type === 'car' ? 'Marka (kategoria) *' : 'Kategoria *'}
              </label>
              <input
                type="text"
                value={cardForm.category}
                onChange={e => setCardForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder={cardForm.card_type === 'car' ? 'np. Porsche, Ferrari, BMW...' : 'np. Eventy, Poziomy, Misje...'}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Punkty</label>
              <input
                type="number"
                value={cardForm.points}
                onChange={e => setCardForm(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                min={1}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              />
            </div>
          </div>

          {/* Opcje zakupu */}
          <div className="border-t border-dark-700 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-medium text-red-400">Sprzedaż charytatywna</h4>
              </div>
              <button
                type="button"
                onClick={() => setCardForm(prev => ({ ...prev, is_purchasable: !prev.is_purchasable }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  cardForm.is_purchasable ? 'bg-turbo-500' : 'bg-dark-600'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  cardForm.is_purchasable ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {cardForm.is_purchasable && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Cena (PLN) *</label>
                  <input
                    type="number"
                    value={cardForm.price}
                    onChange={e => setCardForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="np. 5"
                    min={1}
                    step="0.01"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">XP za zakup</label>
                  <input
                    type="number"
                    value={cardForm.xp_reward}
                    onChange={e => setCardForm(prev => ({ ...prev, xp_reward: e.target.value }))}
                    placeholder="np. 5"
                    min={0}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pola specyficzne dla samochodów */}
          {cardForm.card_type === 'car' && (
            <>
              <div className="border-t border-dark-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-turbo-400 mb-3">🚗 Dane samochodu</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">Marka</label>
                    <input
                      type="text"
                      value={cardForm.car_brand}
                      onChange={e => setCardForm(prev => ({ ...prev, car_brand: e.target.value }))}
                      placeholder="np. Porsche"
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">Model</label>
                    <input
                      type="text"
                      value={cardForm.car_model}
                      onChange={e => setCardForm(prev => ({ ...prev, car_model: e.target.value }))}
                      placeholder="np. 911 Turbo S"
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Moc (KM)</label>
                  <input
                    type="number"
                    value={cardForm.car_horsepower}
                    onChange={e => setCardForm(prev => ({ ...prev, car_horsepower: e.target.value }))}
                    placeholder="np. 650"
                    min={0}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Moment obrotowy (Nm)</label>
                  <input
                    type="number"
                    value={cardForm.car_torque}
                    onChange={e => setCardForm(prev => ({ ...prev, car_torque: e.target.value }))}
                    placeholder="np. 800"
                    min={0}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Prędkość max (km/h)</label>
                  <input
                    type="number"
                    value={cardForm.car_max_speed}
                    onChange={e => setCardForm(prev => ({ ...prev, car_max_speed: e.target.value }))}
                    placeholder="np. 330"
                    min={0}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Rok produkcji</label>
                  <input
                    type="number"
                    value={cardForm.car_year}
                    onChange={e => setCardForm(prev => ({ ...prev, car_year: e.target.value }))}
                    placeholder="np. 2024"
                    min={1900}
                    max={2030}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
              </div>

              {/* Dodatkowe info (widoczne po odblokowaniu) */}
              <div className="border-t border-dark-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Dodatkowe info (widoczne po odblokowaniu karty)
                </h4>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">Silnik</label>
                    <input
                      type="text"
                      value={cardForm.car_engine}
                      onChange={e => setCardForm(prev => ({ ...prev, car_engine: e.target.value }))}
                      placeholder="np. 4.0L Boxer 6"
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">Liczba cylindrów</label>
                    <input
                      type="number"
                      value={cardForm.car_cylinders}
                      onChange={e => setCardForm(prev => ({ ...prev, car_cylinders: e.target.value }))}
                      placeholder="np. 6"
                      min={1}
                      max={16}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">0-100 km/h (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cardForm.car_acceleration}
                      onChange={e => setCardForm(prev => ({ ...prev, car_acceleration: e.target.value }))}
                      placeholder="np. 3.4"
                      min={0}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">Masa (kg)</label>
                    <input
                      type="number"
                      value={cardForm.car_weight}
                      onChange={e => setCardForm(prev => ({ ...prev, car_weight: e.target.value }))}
                      placeholder="np. 1418"
                      min={0}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Napęd</label>
                  <select
                    value={cardForm.car_drivetrain}
                    onChange={e => setCardForm(prev => ({ ...prev, car_drivetrain: e.target.value }))}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                  >
                    <option value="">Wybierz napęd</option>
                    <option value="RWD">RWD (tylny)</option>
                    <option value="FWD">FWD (przedni)</option>
                    <option value="AWD">AWD (4x4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Ciekawostka</label>
                  <textarea
                    value={cardForm.car_fun_fact}
                    onChange={e => setCardForm(prev => ({ ...prev, car_fun_fact: e.target.value }))}
                    placeholder="Ciekawostka o tym samochodzie..."
                    rows={2}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white resize-none"
                  />
                </div>
              </div>

              {/* Sekcja Turbo Hero */}
              <div className="border-t border-dark-700 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Turbo Hero
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-dark-300">Karta Hero</span>
                    <div
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        cardForm.is_hero ? 'bg-yellow-500' : 'bg-dark-600'
                      }`}
                      onClick={() => setCardForm(prev => ({ ...prev, is_hero: !prev.is_hero }))}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          cardForm.is_hero ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </label>
                </div>
                <p className="text-xs text-dark-400 mb-3">
                  Karty Hero to specjalne karty przedstawiające kierowców z ich samochodami z eventów Turbo Pomoc.
                </p>
                {cardForm.is_hero && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1.5">Imię kierowcy</label>
                      <input
                        type="text"
                        value={cardForm.hero_name}
                        onChange={e => setCardForm(prev => ({ ...prev, hero_name: e.target.value }))}
                        placeholder="np. Jan Kowalski"
                        className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1.5">Tytuł / Rola</label>
                      <input
                        type="text"
                        value={cardForm.hero_title}
                        onChange={e => setCardForm(prev => ({ ...prev, hero_title: e.target.value }))}
                        placeholder="np. Ambasador Turbo Pomoc 2024"
                        className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sekcja Karta Właściciela */}
              <div className="border-t border-dark-700 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Karta Właściciela
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-dark-300">Właściciel</span>
                    <div
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        cardForm.is_owner_card ? 'bg-cyan-500' : 'bg-dark-600'
                      }`}
                      onClick={() => {
                        if (cardForm.is_owner_card) {
                          setCardForm(prev => ({ ...prev, is_owner_card: false, owner_user_id: '' }));
                          setSelectedOwnerUser(null);
                        } else {
                          setCardForm(prev => ({ ...prev, is_owner_card: true }));
                        }
                      }}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          cardForm.is_owner_card ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </label>
                </div>
                <p className="text-xs text-dark-400 mb-3">
                  Karta Właściciela to karta przypisana do prawdziwego właściciela samochodu. Jest permanentnie w jego kolekcji i nie może być wylosowana przez innych graczy.
                </p>
                {cardForm.is_owner_card && (
                  <div>
                    {selectedOwnerUser ? (
                      <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center overflow-hidden">
                          {selectedOwnerUser.avatar_url
                            ? <img src={selectedOwnerUser.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                            : <span className="text-sm font-bold text-white">{selectedOwnerUser.nick?.charAt(0) || '?'}</span>
                          }
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{selectedOwnerUser.nick}</p>
                          <p className="text-xs text-dark-400">{selectedOwnerUser.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOwnerUser(null);
                            setCardForm(prev => ({ ...prev, owner_user_id: '' }));
                          }}
                          className="p-1 hover:bg-dark-600 rounded-lg"
                        >
                          <X className="w-4 h-4 text-dark-400" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={ownerSearchQuery}
                          onChange={e => handleOwnerSearch(e.target.value)}
                          placeholder="Szukaj gracza po nicku (min. 2 znaki)..."
                          className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
                        />
                        {ownerSearchLoading && (
                          <p className="mt-2 text-sm text-dark-400">Szukam...</p>
                        )}
                        {!ownerSearchLoading && ownerSearchQuery.length >= 2 && ownerSearchResults.length === 0 && (
                          <p className="mt-2 text-sm text-dark-400">Nie znaleziono graczy</p>
                        )}
                        {ownerSearchResults.length > 0 && (
                          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border border-dark-600 rounded-xl">
                            {ownerSearchResults.map(user => (
                              <button
                                key={user.id}
                                onClick={() => {
                                  setSelectedOwnerUser(user);
                                  setCardForm(prev => ({ ...prev, owner_user_id: user.id }));
                                  setOwnerSearchQuery('');
                                  setOwnerSearchResults([]);
                                }}
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-dark-600 text-left transition-colors"
                              >
                                <div className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {user.avatar_url
                                    ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                                    : <span className="text-xs font-bold text-white">{user.nick?.charAt(0) || '?'}</span>
                                  }
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm text-white font-medium truncate">{user.nick}</p>
                                  <p className="text-xs text-dark-500 truncate">{user.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Opis</label>
            <textarea
              value={cardForm.description}
              onChange={e => setCardForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={cardForm.card_type === 'car' ? 'Opis samochodu...' : 'Opis karty...'}
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white min-h-[80px] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Limit sztuk (opcjonalnie)</label>
            <input
              type="number"
              value={cardForm.total_supply}
              onChange={e => setCardForm(prev => ({ ...prev, total_supply: e.target.value }))}
              placeholder="Brak limitu"
              min={1}
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
            />
          </div>

          {/* Upload obrazka */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              Zdjęcie karty {cardForm.card_type === 'car' ? '(16:9 poziome)' : '(3:4 pionowe)'}
            </label>

            {/* Podgląd aktualnego/wybranego obrazka */}
            {(cardImagePreview || cardForm.image_url) ? (
              <div className="flex items-start gap-4">
                <div className={`rounded-lg overflow-hidden bg-dark-700 flex-shrink-0 ${
                  cardForm.card_type === 'car' ? 'w-48 h-28' : 'w-24 h-32'
                }`}>
                  <img
                    src={cardImagePreview || cardForm.image_url}
                    alt="Podgląd"
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCardImageSelect}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-3 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg text-sm text-dark-200 transition-colors">
                      <Upload className="w-4 h-4" />
                      Zmień
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveCardImage}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Usuń
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCardImageSelect}
                  className="hidden"
                />
                <div className={`border-2 border-dashed border-dark-600 hover:border-turbo-500 rounded-xl p-6 text-center transition-colors ${
                  cardForm.card_type === 'car' ? 'aspect-video' : 'aspect-[3/4] max-w-[200px]'
                }`}>
                  <Upload className="w-8 h-8 text-dark-400 mx-auto mb-2" />
                  <p className="text-sm text-dark-300">Kliknij aby wybrać zdjęcie</p>
                  <p className="text-xs text-dark-500 mt-1">JPG, PNG lub WebP (max 5MB)</p>
                </div>
              </label>
            )}
          </div>

          {/* Galeria zdjęć (tylko dla samochodów) */}
          {cardForm.card_type === 'car' && (
            <div className="border-t border-dark-700 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Galeria zdjęć (widoczna po odblokowaniu)
                </h4>
                <span className="text-xs text-dark-500">{cardGalleryImages.length}/6</span>
              </div>
              <p className="text-xs text-dark-400 mb-3">
                Dodaj dodatkowe zdjęcia auta do galerii. Użytkownik będzie mógł je przeglądać i pobierać jako tapety.
              </p>

              {/* Istniejące zdjęcia galerii */}
              {cardGalleryImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {cardGalleryImages.map((img, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden bg-dark-700">
                      <img
                        src={img.url}
                        alt={`Galeria ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-dark-900/80 rounded text-xs text-white">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Dodaj zdjęcie do galerii */}
              {cardGalleryImages.length < 6 && (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleGalleryImageSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-dark-600 hover:border-emerald-500 rounded-xl p-4 text-center transition-colors">
                    <Plus className="w-6 h-6 text-dark-400 mx-auto mb-1" />
                    <p className="text-xs text-dark-300">Dodaj zdjęcie do galerii</p>
                  </div>
                </label>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCardModal(false);
                setEditingCard(null);
              }}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSaveCard}
              loading={savingCard || uploadingCardImage || uploadingGalleryImage}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-1" />
              {uploadingCardImage ? 'Wgrywanie zdjęcia...' : uploadingGalleryImage ? 'Wgrywanie galerii...' : editingCard ? 'Zapisz zmiany' : 'Dodaj kartę'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Emoji Picker Modal */}
      {/* Card Owners Modal */}
      <Modal
        isOpen={showCardOwnersModal}
        onClose={() => {
          setShowCardOwnersModal(false);
          setSelectedCardForOwners(null);
          setCardOwners([]);
        }}
        title={`Właściciele karty: ${selectedCardForOwners?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {selectedCardForOwners && (
            <Card variant="outlined" className="border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  selectedCardForOwners.rarity === 'legendary' ? 'bg-yellow-500/20' :
                  selectedCardForOwners.rarity === 'epic' ? 'bg-purple-500/20' :
                  selectedCardForOwners.rarity === 'rare' ? 'bg-blue-500/20' :
                  'bg-gray-500/20'
                }`}>
                  {selectedCardForOwners.image_url ? (
                    <img src={selectedCardForOwners.image_url} alt={selectedCardForOwners.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Sparkles className={`w-6 h-6 ${RARITY_OPTIONS.find(r => r.value === selectedCardForOwners.rarity)?.color || 'text-gray-400'}`} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{selectedCardForOwners.name}</p>
                  <p className="text-sm text-dark-400">{selectedCardForOwners.category}</p>
                  {selectedCardForOwners.total_supply && (
                    <p className="text-xs text-purple-400">
                      Limit: {selectedCardForOwners.total_supply} szt. | Posiadana: {cardOwners.length} szt.
                    </p>
                  )}
                </div>
                <Badge variant={
                  selectedCardForOwners.rarity === 'legendary' ? 'warning' :
                  selectedCardForOwners.rarity === 'epic' ? 'turbo' :
                  selectedCardForOwners.rarity === 'rare' ? 'info' :
                  'default'
                } className="ml-auto">
                  {RARITY_OPTIONS.find(r => r.value === selectedCardForOwners.rarity)?.label}
                </Badge>
              </div>
            </Card>
          )}

          {loadingCardOwners ? (
            <div className="text-center py-8 text-dark-400">Ładowanie właścicieli...</div>
          ) : cardOwners.length === 0 ? (
            <Card className="text-center py-8">
              <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Nikt nie posiada tej karty</p>
            </Card>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cardOwners.map(owner => (
                <Card key={owner.user_card_id} variant="outlined" padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                      {owner.user.avatar_url ? (
                        <img src={owner.user.avatar_url} alt={owner.user.nick} className="w-full h-full object-cover" />
                      ) : (
                        owner.user.nick.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{owner.user.nick}</p>
                      <p className="text-xs text-dark-400">
                        {owner.obtained_from === 'admin' ? 'Przyznana' :
                         owner.obtained_from === 'purchase' ? 'Kupiona' :
                         owner.obtained_from === 'mission' ? 'Z misji' :
                         owner.obtained_from === 'mystery' ? 'Mystery Garage' :
                         owner.obtained_from} • {formatDateTime(owner.obtained_at)}
                      </p>
                    </div>
                    <p className="text-xs text-turbo-400">{formatNumber(owner.user.total_xp)} XP</p>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveCardFromUser(owner.user_card_id, owner.user.id, selectedCardForOwners!.id, selectedCardForOwners!.name)}
                      disabled={removingCard === owner.user_card_id}
                      title="Usuń kartę od gracza"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Assign to player section */}
          {!showAssignToPlayer ? (
            <Button
              fullWidth
              onClick={() => setShowAssignToPlayer(true)}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Przydziel graczowi
            </Button>
          ) : (
            <Card className="border-turbo-500/30">
              <p className="text-sm font-medium text-turbo-400 mb-2">Przydziel kartę graczowi:</p>
              <input
                type="text"
                placeholder="Wpisz nick gracza..."
                value={assignSearchQuery}
                onChange={(e) => handleSearchPlayersForAssign(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm focus:outline-none focus:border-turbo-500 mb-2"
                autoFocus
              />
              {assignSearchResults.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {assignSearchResults.map(player => (
                    <button
                      key={player.id}
                      onClick={() => handleAssignCardToUser(player)}
                      disabled={assigningToPlayer}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-dark-600 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt={player.nick} className="w-full h-full object-cover" />
                        ) : (
                          player.nick.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{player.nick}</p>
                        <p className="text-xs text-dark-400">Poziom {player.level}</p>
                      </div>
                      {cardOwners.some(o => o.user.id === player.id) ? (
                        <span className="text-xs text-yellow-400">Już ma</span>
                      ) : (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {assignSearchQuery.length >= 2 && assignSearchResults.length === 0 && (
                <p className="text-xs text-dark-500 text-center py-2">Nie znaleziono graczy</p>
              )}
              <Button
                variant="secondary"
                fullWidth
                size="sm"
                className="mt-2"
                onClick={() => {
                  setShowAssignToPlayer(false);
                  setAssignSearchQuery('');
                  setAssignSearchResults([]);
                }}
              >
                Anuluj
              </Button>
            </Card>
          )}

          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setShowCardOwnersModal(false);
              setSelectedCardForOwners(null);
              setCardOwners([]);
              setShowAssignToPlayer(false);
              setAssignSearchQuery('');
              setAssignSearchResults([]);
            }}
          >
            Zamknij
          </Button>
        </div>
      </Modal>

      {/* Starter Pack Modal */}
      <Modal
        isOpen={showStarterPackModal}
        onClose={() => !assigningStarterPacks && setShowStarterPackModal(false)}
        title="Przydziel pakiety startowe"
        size="md"
      >
        <div className="space-y-4">
          <Card variant="outlined" className="border-turbo-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-turbo-500/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-turbo-400" />
              </div>
              <div>
                <p className="font-medium text-white">Pakiet startowy dla wszystkich</p>
                <p className="text-sm text-dark-400">
                  Każdy gracz otrzyma losowe karty samochodów
                </p>
              </div>
            </div>
          </Card>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Ilość kart na gracza
            </label>
            <div className="flex gap-2">
              {[3, 5, 7, 10].map(size => (
                <button
                  key={size}
                  onClick={() => setStarterPackSize(size)}
                  disabled={assigningStarterPacks}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                    starterPackSize === size
                      ? 'bg-turbo-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  {size} kart
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-dark-700 rounded-xl">
            <p className="text-sm text-dark-400 mb-2">Szanse na rzadkość:</p>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <span className="text-gray-400">Common</span>
                <p className="font-bold text-white">60%</p>
              </div>
              <div>
                <span className="text-blue-400">Rare</span>
                <p className="font-bold text-white">25%</p>
              </div>
              <div>
                <span className="text-purple-400">Epic</span>
                <p className="font-bold text-white">12%</p>
              </div>
              <div>
                <span className="text-yellow-400">Legendary</span>
                <p className="font-bold text-white">3%</p>
              </div>
            </div>
          </div>

          {assigningStarterPacks && (
            <div className="p-4 bg-dark-700 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-300">Postęp:</span>
                <span className="text-white font-medium">
                  {starterPackProgress.current}/{starterPackProgress.total} graczy
                </span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2 mb-2">
                <div
                  className="bg-turbo-500 h-2 rounded-full transition-all"
                  style={{ width: `${(starterPackProgress.current / Math.max(1, starterPackProgress.total)) * 100}%` }}
                />
              </div>
              <p className="text-sm text-turbo-400">
                Przydzielono: {starterPackProgress.assigned} kart
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowStarterPackModal(false)}
              disabled={assigningStarterPacks}
            >
              Anuluj
            </Button>
            <Button
              fullWidth
              onClick={handleAssignStarterPacks}
              disabled={assigningStarterPacks}
            >
              {assigningStarterPacks ? (
                <>Przydzielanie...</>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-1" />
                  Przydziel wszystkim
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset & Redistribute Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => !resettingCards && setShowResetModal(false)}
        title="Reset i redystrybucja kart"
        size="md"
      >
        <div className="space-y-4">
          <Card variant="outlined" className="border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="font-medium text-red-400">Uwaga! Operacja nieodwracalna</p>
                <p className="text-sm text-dark-400">
                  Wszystkie karty graczy zostaną usunięte (z wyjątkiem Kart Właścicieli), a następnie każdy gracz otrzyma nowy losowy zestaw kart.
                </p>
              </div>
            </div>
          </Card>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Ilość kart na gracza
            </label>
            <div className="flex gap-2">
              {[20, 30, 40, 50].map(size => (
                <button
                  key={size}
                  onClick={() => setResetPackSize(size)}
                  disabled={resettingCards}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                    resetPackSize === size
                      ? 'bg-red-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-dark-700 rounded-xl">
            <p className="text-sm text-dark-400 mb-2">Szanse na rzadkość:</p>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <span className="text-gray-400">Common</span>
                <p className="font-bold text-white">60%</p>
              </div>
              <div>
                <span className="text-blue-400">Rare</span>
                <p className="font-bold text-white">25%</p>
              </div>
              <div>
                <span className="text-purple-400">Epic</span>
                <p className="font-bold text-white">12%</p>
              </div>
              <div>
                <span className="text-yellow-400">Legendary</span>
                <p className="font-bold text-white">3%</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-cyan-500/10 rounded-xl space-y-1">
            <p className="text-sm text-cyan-400 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Karty Właścicieli będą chronione — nie zostaną usunięte.
            </p>
            <p className="text-xs text-cyan-400/70 ml-6">
              Właściciel auta z kartą przypisaną jako swoje auto zachowa ją. Np. przy wyborze 20 kart, taki gracz będzie miał łącznie 21 (1 właścicielska + 20 nowych).
            </p>
          </div>

          {!resettingCards && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Wpisz RESETUJ aby potwierdzić
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={e => setResetConfirmText(e.target.value)}
                placeholder="RESETUJ"
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              />
            </div>
          )}

          {resettingCards && (
            <div className="p-4 bg-dark-700 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-300">
                  {resetProgress.phase === 'deleting' ? 'Usuwanie kart...' : 'Przydzielanie kart...'}
                </span>
                <span className="text-white font-medium">
                  {resetProgress.current}/{resetProgress.total}
                </span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${resetProgress.phase === 'deleting' ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${(resetProgress.current / Math.max(1, resetProgress.total)) * 100}%` }}
                />
              </div>
              {resetProgress.phase === 'assigning' && (
                <p className="text-sm text-green-400">
                  Przydzielono: {resetProgress.assigned} kart
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setShowResetModal(false); setResetConfirmText(''); }}
              disabled={resettingCards}
            >
              Anuluj
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleBulkResetAndRedistribute}
              disabled={resettingCards || resetConfirmText !== 'RESETUJ'}
            >
              {resettingCards ? (
                <>Resetowanie...</>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Resetuj i przydziel
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Survey Results Modal */}
      <Modal
        isOpen={showSurveyResultsModal && surveyResultsMission !== null}
        onClose={() => {
          setShowSurveyResultsModal(false);
          setSurveyResultsMission(null);
          setSurveyResults(null);
        }}
        title="Wyniki ankiety"
        size="lg"
      >
        {surveyResultsMission && (
          <div className="space-y-4">
            <Card variant="outlined">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="w-5 h-5 text-teal-400" />
                <h4 className="font-medium text-white">{surveyResultsMission.title}</h4>
              </div>
              <p className="text-sm text-dark-300">
                {((surveyResultsMission.survey_data || surveyResultsMission.quiz_data) as SurveyData | undefined)?.question || 'Brak pytania'}
              </p>
            </Card>

            {loadingSurveyResults ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-dark-400 text-sm">Ladowanie wynikow...</p>
              </div>
            ) : surveyResults ? (
              <>
                <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
                  <span className="text-sm text-dark-300">Laczna liczba glosow</span>
                  <span className="text-lg font-bold text-white">{surveyResults.total_votes}</span>
                </div>

                {surveyResults.total_votes === 0 ? (
                  <Card variant="outlined" className="text-center py-8">
                    <BarChart3 className="w-10 h-10 text-dark-600 mx-auto mb-2" />
                    <p className="text-dark-400">Brak glosow</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const sd = (surveyResultsMission.survey_data || surveyResultsMission.quiz_data) as SurveyData | undefined;
                      const options = sd?.options || [];
                      const sortedEntries = [...options]
                        .map(opt => ({
                          id: opt.id,
                          text: opt.text,
                          count: surveyResults.votes[opt.id] || 0,
                        }))
                        .sort((a, b) => b.count - a.count);

                      return sortedEntries.map(entry => {
                        const pct = surveyResults.total_votes > 0
                          ? Math.round((entry.count / surveyResults.total_votes) * 100)
                          : 0;
                        return (
                          <div key={entry.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white">{entry.text}</span>
                              <span className="text-dark-400 font-medium">{pct}% ({entry.count})</span>
                            </div>
                            <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {surveyResults.other_answers && surveyResults.other_answers.length > 0 && (
                      <div className="border-t border-dark-700 pt-3 mt-3">
                        <p className="text-sm font-medium text-white mb-2">
                          Odpowiedzi &quot;Inne&quot; ({surveyResults.other_answers.length})
                        </p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {surveyResults.other_answers.map((answer, i) => (
                            <div key={i} className="text-sm text-dark-300 bg-dark-700/50 rounded-lg px-3 py-2">
                              {answer}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Card variant="outlined" className="text-center py-8">
                <p className="text-dark-400">Nie udalo sie zaladowac wynikow</p>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {showEmojiPicker !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          onClick={() => setShowEmojiPicker(null)}
        >
          <div
            className="bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl p-4 max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Wybierz ikonę poziomu</h3>
              <button
                onClick={() => setShowEmojiPicker(null)}
                className="p-1 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-10 gap-1 max-h-64 overflow-y-auto">
              {commonEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleLevelChange(showEmojiPicker, 'badge_icon', emoji);
                    setShowEmojiPicker(null);
                  }}
                  className="w-9 h-9 rounded-lg hover:bg-dark-600 flex items-center justify-center text-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
