import React from 'react';
import { Sparkles, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import { formatAZN } from '../utils/finance.ts';
import type { SavingsGoal } from '../types/finance.ts';

interface DailyRecommendationBannerProps {
  goals: (SavingsGoal & { hasContributedToday?: boolean; recommendation?: any })[];
  onOpenContributeModal: (goal: SavingsGoal) => void;
  language: Language;
}

export const DailyRecommendationBanner: React.FC<DailyRecommendationBannerProps> = ({
  goals,
  onOpenContributeModal,
  language,
}) => {
  const t = (key: any) => getTranslation(key, language);

  const activeGoals = goals.filter((g) => g.status === 'active');
  if (activeGoals.length === 0) return null;

  // Find goal that needs contribution today or highest priority
  const pendingGoal =
    activeGoals.find((g) => !g.hasContributedToday && g.recommendation?.requiredDailyContribution > 0) ||
    activeGoals[0];

  const hasContributedToday = pendingGoal.hasContributedToday;
  const rec = pendingGoal.recommendation;
  const requiredAmount = rec?.requiredDailyContribution || 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 p-5 shadow-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            {hasContributedToday ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {t('dailyRecommendation')}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {pendingGoal.name}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-200 mt-1">
              {language === 'az' ? rec?.messageAz : rec?.messageEn}
            </p>
            {rec?.daysRemaining > 0 && (
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {rec.daysRemaining} {t('daysLeft')}
                </span>
                <span>•</span>
                <span>
                  {t('targetAmount')}: {formatAZN(pendingGoal.targetAmount)}
                </span>
                <span>•</span>
                <span>
                  {t('savedAmount')}: {formatAZN(pendingGoal.savedAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          <button
            onClick={() => onOpenContributeModal(pendingGoal)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 ${
              hasContributedToday
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
            }`}
          >
            <span>
              {hasContributedToday
                ? '+ Əlavə yığım et'
                : `Bugünkü yığımı köçür (${formatAZN(requiredAmount)})`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
