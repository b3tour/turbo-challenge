'use client';

import { Mission, Submission } from '@/types';
import { Card, Badge, Button } from '@/components/ui';
import { missionTypeNames, missionTypeStyles, formatNumber } from '@/lib/utils';
import { MapPin, Clock, Zap, CheckCircle, Loader2, XCircle, Ban, Camera, QrCode, HelpCircle, ListTodo } from 'lucide-react';

const missionIconMap: Record<string, React.ElementType> = {
  qr_code: QrCode,
  photo: Camera,
  quiz: HelpCircle,
  gps: MapPin,
  manual: ListTodo,
};

interface MissionCardProps {
  mission: Mission;
  userSubmission?: Submission | null;
  onClick?: () => void;
  compact?: boolean;
}

export function MissionCard({
  mission,
  userSubmission,
  onClick,
  compact = false,
}: MissionCardProps) {
  const isCompleted = userSubmission?.status === 'approved';
  const isPending = userSubmission?.status === 'pending';
  const isRejected = userSubmission?.status === 'rejected';
  const isFailed = userSubmission?.status === 'failed';

  // Czy misja jest zablokowana (nie można wykonać)
  const isBlocked = isCompleted || isPending || isFailed;

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
          Nieukończono
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
    return null;
  };

  if (compact) {
    return (
      <Card
        hover={!isBlocked}
        onClick={!isBlocked ? onClick : undefined}
        className={isBlocked ? 'opacity-60' : ''}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${(missionTypeStyles[mission.type] || missionTypeStyles.manual).bgColor} flex items-center justify-center`}>
            {(() => { const Icon = missionIconMap[mission.type] || ListTodo; const style = missionTypeStyles[mission.type] || missionTypeStyles.manual; return <Icon className={`w-4 h-4 ${style.color}`} />; })()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate">{mission.title}</h4>
            <p className="text-sm text-dark-400">{missionTypeNames[mission.type]}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <div className="text-right">
              <div className="flex items-center font-bold text-pink-500">
                <Zap className="w-4 h-4 mr-1" />
                {formatNumber(mission.xp_reward)} XP
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      hover={!isBlocked}
      onClick={!isBlocked ? onClick : undefined}
      className={isBlocked ? 'opacity-70' : ''}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${(missionTypeStyles[mission.type] || missionTypeStyles.manual).bgColor} flex items-center justify-center`}>
            {(() => { const Icon = missionIconMap[mission.type] || ListTodo; const style = missionTypeStyles[mission.type] || missionTypeStyles.manual; return <Icon className={`w-6 h-6 ${style.color}`} />; })()}
          </div>
          <div>
            <Badge variant="default" size="sm">
              {missionTypeNames[mission.type]}
            </Badge>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-2">{mission.title}</h3>
      <p className="text-dark-300 text-sm mb-4 line-clamp-2">{mission.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
        {mission.location_name && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{mission.location_name}</span>
          </div>
        )}
        {mission.end_date && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>
              Do {new Date(mission.end_date).toLocaleDateString('pl-PL')}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-dark-700">
        <div className="flex items-center gap-1">
          <Zap className="w-5 h-5 text-pink-500" />
          <span className="text-xl font-bold text-pink-500">
            {formatNumber(mission.xp_reward)} XP
          </span>
        </div>

        {!isBlocked && (
          <Button size="sm" onClick={onClick}>
            Wykonaj misję
          </Button>
        )}

        {isCompleted && (
          <span className="text-sm text-green-400 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            +{formatNumber(userSubmission?.xp_awarded || mission.xp_reward)} XP
          </span>
        )}

        {isPending && (
          <span className="text-sm text-yellow-400">
            Czeka na weryfikację
          </span>
        )}

        {isFailed && (
          <span className="text-sm text-red-400 flex items-center gap-1">
            <Ban className="w-4 h-4" />
            Zablokowane
          </span>
        )}
      </div>
    </Card>
  );
}
