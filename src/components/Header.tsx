import React from 'react';
import {
  Wallet,
  Flame,
  PlusCircle,
  MinusCircle,
  PiggyBank,
  Globe,
  User,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import type { UserProfile } from '../types/finance.ts';

interface HeaderProps {
  user: UserProfile | null;
  currentStreak: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAddIncome: () => void;
  onOpenAddExpense: () => void;
  onOpenAddGoal: () => void;
  onOpenProfile: () => void;
  onQuickSync: () => void;
  onLogout: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentStreak,
  language,
  onLanguageChange,
  onOpenAddIncome,
  onOpenAddExpense,
  onOpenAddGoal,
  onOpenProfile,
  onQuickSync,
  onLogout,
  isSyncing,
}) => {
  const t = (key: any) => getTranslation(key, language);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">Qənaət</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AZN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t('appTagline')}
              </p>
            </div>
          </div>

          {/* Quick Actions (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onOpenAddIncome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('addIncome')}</span>
            </button>
            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <MinusCircle className="w-4 h-4" />
              <span>{t('addExpense')}</span>
            </button>
            <button
              onClick={onOpenAddGoal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <PiggyBank className="w-4 h-4" />
              <span>{t('newGoal')}</span>
            </button>
          </div>

          {/* Streak, Sync, Language & Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak flame badge */}
            <div
              title={`${currentStreak} ${t('daysStreak')}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold"
            >
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{currentStreak}d</span>
            </div>

            {/* Quick Bank Sync */}
            <button
              onClick={onQuickSync}
              disabled={isSyncing}
              title={t('syncBank')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Language toggle AZ / EN */}
            <button
              onClick={() => onLanguageChange(language === 'az' ? 'en' : 'az')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              title="Dili dəyiş / Change language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Profile Avatar / Trigger */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden ring-2 ring-emerald-500/40 flex items-center justify-center text-xs font-bold text-white">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-slate-200 leading-none">
                  {user?.displayName || 'İstifadəçi'}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {user?.preferredCurrency || 'AZN'}
                </p>
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Çıxış (Hesabdan çıx)"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
