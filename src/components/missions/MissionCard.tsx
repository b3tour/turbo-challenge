'use client';

import { Mission, Submission } from '@/types';
import { Badge } from '@/components/ui';
import { missionTypeNames, missionTypeStyles, formatNumber } from '@/lib/utils';
import { Zap, CheckCircle, Loader2, XCircle, Ban, Camera, QrCode, HelpCircle, MapPin, ListTodo, ClipboardList, Lock, ChevronRight, Circle, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const missionIconMap: Record<string, React.ElementType> = {
  qr_code: QrCode,
  photo: Camera,
  quiz: HelpCircle,
  gps: MapPin,
  manual: ListTodo,
  survey: ClipboardList,
};

interface MissionCardProps {
  mission: Mission;
  userSubmission?: Submission | null;
  onClick?: () => void;
  isLevelLocked?: boolean;
  requiredLevel?: number;
  isNew?: boolean;
  isExpiringSoon?: boolean;
}

export function MissionCard({
  mission,
  userSubmission,
  onClick,
  isLevelLocked = false,
  requiredLevel,
  isNew = false,
  isExpiringSoon = false,
}: MissionCardProps) {
  const isCompleted = userSubmission?.status === 'approved';
  const isPending = userSubmission?.status === 'pending';
  const isRejected = userSubmission?.status === 'rejected';
  const isFailed = userSubmission?.status === 'failed';

  const style = missionTypeStyles[mission.type] || missionTypeStyles.manual;
  const Icon = missionIconMap[mission.type] || ListTodo;

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge variant="success" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ukończono
        </Badge>
      );
    }
    if (isPending) {
      return (
        <Badge variant="warning" size="sm">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Oczekuje
        </Badge>
      );
    }
    if (isFailed) {
      return (
        <Badge variant="danger" size="sm">
          <Ban className="w-3 h-3 mr-1" />
          Niezaliczona
        </Badge>
      );
    }
    if (isRejected) {
      return (
        <Badge variant="danger" size="sm">
          <XCircle className="w-3 h-3 mr-1" />
          Odrzucono
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm">
        <Circle className="w-3 h-3 mr-1" />
        Do zrobienia
      </Badge>
    );
  };

  const statusBadge = getStatusBadge();
  const isBlocked = isCompleted || isPending || isFailed;
  const xpColor = isCompleted ? 'text-dark-400' : 'text-pink-500';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl bg-surface-1 border border-dark-700/50 transition-all',
        !isBlocked && !isLevelLocked && 'hover:bg-surface-2 hover:border-dark-600 cursor-pointer',
        isLevelLocked && 'opacity-50',
        isBlocked && !isLevelLocked && 'cursor-pointer',
      )}
    >
      {/* Mission type icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
        isLevelLocked ? 'bg-dark-700' : style.bgColor,
      )}>
        {isLevelLocked ? (
          <Lock className="w-5 h-5 text-dark-500" />
        ) : (
          <Icon className={`w-5 h-5 ${style.color}`} />
        )}
      </div>

      {/* Title + description + status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="font-medium text-white text-sm truncate">{mission.title}</h4>
          {isNew && !isCompleted && (
            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" />
              Nowa
            </span>
          )}
          {isExpiringSoon && !isCompleted && !isNew && (
            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
              <Clock className="w-2.5 h-2.5" />
              Kończy się
            </span>
          )}
        </div>
        <p className="text-xs text-dark-400 line-clamp-1 mt-0.5">{mission.description}</p>
        <div className="mt-1">{statusBadge}</div>
      </div>

      {/* Right side: XP + arrow or lock info */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isLevelLocked ? (
          <span className="text-xs text-dark-500 font-medium whitespace-nowrap">
            Poz. {requiredLevel}
          </span>
        ) : (
          <>
            <div className={`flex items-center gap-0.5 ${xpColor} font-bold text-sm whitespace-nowrap`}>
              <Zap className="w-3.5 h-3.5" />
              {formatNumber(mission.xp_reward)} XP
            </div>
            <ChevronRight className="w-4 h-4 text-dark-500 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </div>
    </div>
  );
}
