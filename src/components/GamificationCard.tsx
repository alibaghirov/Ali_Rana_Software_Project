import React from 'react';
import {
  Flame,
  Award,
  Sparkles,
  Target,
  Crown,
  CheckCircle,
  Lock,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';

interface GamificationCardProps {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  milestones: Array<{
    id: string;
    milestoneDays: number;
    titleAz: string;
    titleEn: string;
    descriptionAz: string;
    descriptionEn: string;
    icon: string;
    badgeColor: string;
    isUnlocked: boolean;
    unlockedAt?: string | null;
    progress: number;
    daysRemaining: number;
  }>;
  nextMilestone: any;
  levelInfo: { level: number; points: number; currentLevelProgress: number } | null;
  onRecordReview: () => Promise<void>;
  language: Language;
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Award: <Award className="w-5 h-5" />,
  Target: <Target className="w-5 h-5" />,
  Crown: <Crown className="w-5 h-5" />,
};

export const GamificationCard: React.FC<GamificationCardProps> = ({
  currentStreak,
  longestStreak,
  lastActiveDate,
  milestones,
  nextMilestone,
  levelInfo,
  onRecordReview,
  language,
}) => {
  const t = (key: any) => getTranslation(key, language);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isReviewedToday = lastActiveDate === todayStr;

  const handleCelebrateBadge = (badgeTitle: string) => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        {/* Streak & Level summary */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
            <Flame className="w-8 h-8 fill-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">{currentStreak}</span>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {t('daysStreak')}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {t('longestStreak')}: {longestStreak} gün
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-slate-300">
                {t('level')} {levelInfo?.level || 1} • {levelInfo?.points || 0} {t('xpPoints')}
              </span>
            </div>
          </div>
        </div>

        {/* Free Qualifying Activity: Financial Review button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRecordReview}
            disabled={isReviewedToday}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isReviewedToday
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 active:scale-95'
            }`}
          >
            {isReviewedToday ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Bugünkü zəncir aktivdir</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Günün Maliyyəsini Təsdiqlə (+10 XP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Next Milestone Banner */}
      {nextMilestone && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              <span>
                {t('nextMilestone')}: {language === 'az' ? nextMilestone.titleAz : nextMilestone.titleEn} (
                {nextMilestone.milestoneDays} gün)
              </span>
            </span>
            <span className="text-amber-400 font-bold">{nextMilestone.daysRemaining} gün qalıb</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
              style={{ width: `${Math.max(4, nextMilestone.progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* 5 Milestone Badges Grid */}
      <div className="mt-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          {t('achievements')} (10, 20, 30, 40, 100 gün)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {milestones.map((m) => {
            const isUnlocked = m.isUnlocked;
            const title = language === 'az' ? m.titleAz : m.titleEn;
            const desc = language === 'az' ? m.descriptionAz : m.descriptionEn;

            return (
              <div
                key={m.id}
                onClick={() => isUnlocked && handleCelebrateBadge(title)}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                  isUnlocked
                    ? 'bg-slate-800/90 border-amber-500/40 hover:border-amber-400 hover:scale-105'
                    : 'bg-slate-900/50 border-slate-800 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-sm ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isUnlocked ? (
                    BADGE_ICONS[m.icon] || <Award className="w-5 h-5" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>

                <span className="text-xs font-bold text-slate-200 leading-tight line-clamp-1">
                  {title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {m.milestoneDays} gün
                </span>

                {isUnlocked ? (
                  <span className="text-[9px] text-emerald-400 font-semibold mt-1">Açıldı</span>
                ) : (
                  <span className="text-[9px] text-slate-500 mt-1">
                    {m.daysRemaining} gün qaldı
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
