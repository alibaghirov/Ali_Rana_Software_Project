import React, { useState } from 'react';
import {
  Target,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  ShieldCheck,
  Laptop,
  Plane,
  Car,
  Home,
  GraduationCap,
  Gift,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import { formatAZN } from '../utils/finance.ts';
import type { SavingsGoal, GoalContribution } from '../types/finance.ts';

interface GoalsSectionProps {
  goals: (SavingsGoal & { hasContributedToday?: boolean; recommendation?: any })[];
  onAddGoal: (goalData: any) => Promise<void>;
  onContribute: (goalId: string, amount: number, note?: string) => Promise<void>;
  onWithdraw: (goalId: string, amount: number, note?: string) => Promise<void>;
  onRequestUnlock: (goalId: string) => Promise<void>;
  language: Language;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Target: <Target className="w-5 h-5" />,
  Laptop: <Laptop className="w-5 h-5" />,
  Plane: <Plane className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  GraduationCap: <GraduationCap className="w-5 h-5" />,
  Gift: <Gift className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
};

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  onAddGoal,
  onContribute,
  onWithdraw,
  onRequestUnlock,
  language,
}) => {
  const t = (key: any) => getTranslation(key, language);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGoalForAction, setSelectedGoalForAction] = useState<SavingsGoal | null>(null);
  const [actionType, setActionType] = useState<'contribute' | 'withdraw' | 'history' | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [historyList, setHistoryList] = useState<GoalContribution[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // New goal form state
  const [newGoalName, setNewGoalName] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPreferredDaily, setNewPreferredDaily] = useState('');
  const [newCategory, setNewCategory] = useState('Texnologiya');
  const [newIcon, setNewIcon] = useState('Target');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newStartingContrib, setNewStartingContrib] = useState('');
  const [newIsLocked, setNewIsLocked] = useState(false);
  const [newCoolingOff, setNewCoolingOff] = useState('30');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenContribute = (goal: SavingsGoal) => {
    setSelectedGoalForAction(goal);
    setActionType('contribute');
    setActionAmount('');
    setActionNote('');
    setActionError(null);
  };

  const handleOpenWithdraw = (goal: SavingsGoal) => {
    setSelectedGoalForAction(goal);
    setActionType('withdraw');
    setActionAmount('');
    setActionNote('');
    setActionError(null);
  };

  const handleOpenHistory = async (goal: SavingsGoal) => {
    setSelectedGoalForAction(goal);
    setActionType('history');
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}/history`);
      const data = await res.json();
      setHistoryList(data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForAction) return;

    const num = Number(actionAmount);
    if (!num || num <= 0) {
      setActionError('Zəhmət olmasa düzgün məbləğ daxil edin.');
      return;
    }

    setActionSubmitting(true);
    setActionError(null);

    try {
      if (actionType === 'contribute') {
        await onContribute(selectedGoalForAction.id, num, actionNote);
        // Check if goal reached target
        if (selectedGoalForAction.savedAmount + num >= selectedGoalForAction.targetAmount) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }
        setActionType(null);
      } else if (actionType === 'withdraw') {
        await onWithdraw(selectedGoalForAction.id, num, actionNote);
        setActionType(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Xəta baş verdi');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim() || !newTargetAmount) {
      setFormError('Hədəf adı və məbləğ məcburidir.');
      return;
    }
    const target = Number(newTargetAmount);
    if (target <= 0) {
      setFormError('Məqsəd məbləği 0-dan böyük olmalıdır.');
      return;
    }

    try {
      await onAddGoal({
        name: newGoalName.trim(),
        targetAmount: target,
        deadline: newDeadline || undefined,
        preferredDailyMinimum: newPreferredDaily ? Number(newPreferredDaily) : undefined,
        category: newCategory,
        icon: newIcon,
        priority: newPriority,
        startingContribution: newStartingContrib ? Number(newStartingContrib) : 0,
        isLocked: newIsLocked,
        coolingOffMinutes: newIsLocked ? Number(newCoolingOff) : 0,
      });

      // Reset form
      setNewGoalName('');
      setNewTargetAmount('');
      setNewDeadline('');
      setNewPreferredDaily('');
      setNewStartingContrib('');
      setNewIsLocked(false);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Xəta baş verdi.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            {t('goals')}
          </h2>
          <p className="text-xs text-slate-400">
            Dinamik gündəlik tövsiyə alqoritmi və qənaət təhlükəsizlik kilidi ilə
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newGoal')}</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const rec = goal.recommendation;
          const percentage = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
          const isCompleted = goal.status === 'completed' || percentage >= 100;

          return (
            <div
              key={goal.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-md flex flex-col justify-between transition-all ${
                isCompleted
                  ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/20'
                  : goal.isLocked
                  ? 'border-amber-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Top: Icon, Name, Lock status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700 shrink-0">
                      {ICON_MAP[goal.icon || 'Target'] || <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm leading-tight line-clamp-1">
                        {goal.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">{goal.category}</span>
                        {goal.priority === 'high' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold">
                            Yüksək Prioritet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {goal.isLocked && (
                    <span
                      title="Qənaət Kilidi Aktivdir (Spontan xərcləmənin qarşısını alır)"
                      className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Progress Numbers */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-black text-white">
                      {formatAZN(goal.savedAmount)}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">
                      / {formatAZN(goal.targetAmount)}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-emerald-500 to-blue-500'
                    }`}
                    style={{ width: `${Math.max(2, percentage)}%` }}
                  />
                </div>

                {/* Dynamic Recommendation Box */}
                {!isCompleted && rec && (
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('requiredDaily')}:
                      </span>
                      <span className="font-black text-white">
                        {rec.requiredDailyContribution > 0
                          ? `${formatAZN(rec.requiredDailyContribution)} / gün`
                          : 'Tamamlandı'}
                      </span>
                    </div>

                    {goal.deadline && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {goal.deadline}
                        </span>
                        <span>
                          {rec.daysRemaining > 0 ? `${rec.daysRemaining} gün qalıb` : 'Gecikmə'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">Hədəf tamamlandı! Təbriklər!</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleOpenContribute(goal)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{t('contribute')}</span>
                </button>
                <button
                  onClick={() => handleOpenWithdraw(goal)}
                  disabled={goal.savedAmount <= 0}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>{t('withdraw')}</span>
                </button>
                <button
                  onClick={() => handleOpenHistory(goal)}
                  title="Yığım Tarixçəsi"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contribute / Withdraw Modal */}
      {selectedGoalForAction && (actionType === 'contribute' || actionType === 'withdraw') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              {actionType === 'contribute' ? (
                <>
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  {t('contribute')}: {selectedGoalForAction.name}
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-5 h-5 text-rose-400" />
                  {t('withdraw')}: {selectedGoalForAction.name}
                </>
              )}
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              {actionType === 'contribute'
                ? 'Qənaət töhfəsi balansınızdan ayrılır və hədəf üçün ehtiyatda saxlanılır.'
                : 'Yığımdan məbləği çıxararaq sərbəst nağd qalığınıza qaytarın.'}
            </p>

            {actionError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAction} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Məbləğ (AZN) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={actionAmount}
                    onChange={(e) => setActionAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                    AZN
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Qeyd (İstəyə bağlı)
                </label>
                <input
                  type="text"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Məsələn: Bu günün qənaəti"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all ${
                    actionType === 'contribute'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {actionSubmitting ? 'İcra edilir...' : 'Təsdiq et'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal History Modal */}
      {selectedGoalForAction && actionType === 'history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              Yığım Tarixçəsi: {selectedGoalForAction.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Bütün töhfə və çıxarış əməliyyatlarının dəqiq auditi
            </p>

            <div className="mt-4 max-h-64 overflow-y-auto space-y-2 pr-1">
              {isLoadingHistory ? (
                <div className="py-6 text-center text-xs text-slate-400">Yüklənir...</div>
              ) : historyList.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Hələ heç bir əməliyyat qeydə alınmayıb.
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span
                        className={`font-bold ${
                          item.type === 'contribution' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.type === 'contribution' ? '+ Yığım' : '- Çıxarış'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.note || item.date.slice(0, 10)}</p>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {formatAZN(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              {t('newGoal')}
            </h3>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hədəf Adı *
                </label>
                <input
                  type="text"
                  required
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="Məsələn: Təcili Ehtiyat Fondu və ya Yeni Avtomobil"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('targetAmount')} (AZN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newTargetAmount}
                    onChange={(e) => setNewTargetAmount(e.target.value)}
                    placeholder="1000.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    İlkin Yığım (AZN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newStartingContrib}
                    onChange={(e) => setNewStartingContrib(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('deadline')} (İstəyə bağlı)
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prioritet
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="low">Aşağı</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksək</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kateqoriya
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Məs: Texnologiya, Təhsil, Səyahət"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    İkon
                  </label>
                  <select
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Target">Hədəf (Target)</option>
                    <option value="Laptop">Noutbuk / Kompüter</option>
                    <option value="Plane">Səyahət / Təyyarə</option>
                    <option value="Car">Avtomobil</option>
                    <option value="Home">Ev / Təmir</option>
                    <option value="GraduationCap">Təhsil</option>
                    <option value="Gift">Hədiyyə</option>
                    <option value="ShieldCheck">Təhlükəsizlik Fondu</option>
                  </select>
                </div>
              </div>

              {/* Goal Locking Feature */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Qənaət Kilidi (Goal Lock)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newIsLocked}
                    onChange={(e) => setNewIsLocked(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-700 border-slate-600"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('lockExplanation')} Çıxarış zamanı soyuma müddəti və təsdiq tələb edir.
                </p>

                {newIsLocked && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Soyuma Müddəti (dəqiqə ilə)
                    </label>
                    <select
                      value={newCoolingOff}
                      onChange={(e) => setNewCoolingOff(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    >
                      <option value="15">15 dəqiqə</option>
                      <option value="30">30 dəqiqə</option>
                      <option value="60">60 dəqiqə</option>
                      <option value="1440">24 saat (1 gün)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                >
                  Hədəfi Yarat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
