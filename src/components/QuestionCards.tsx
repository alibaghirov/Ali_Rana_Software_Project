import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
} from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import { formatAZN } from '../utils/finance.ts';

interface QuestionCardsProps {
  totalBalance: number;
  unallocatedCash: number;
  earmarkedSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNetCashFlow: number;
  dailyIncome: number;
  dailyExpenses: number;
  isOnTrack: boolean;
  language: Language;
}

export const QuestionCards: React.FC<QuestionCardsProps> = ({
  totalBalance,
  unallocatedCash,
  earmarkedSavings,
  monthlyIncome,
  monthlyExpenses,
  monthlyNetCashFlow,
  dailyIncome,
  dailyExpenses,
  isOnTrack,
  language,
}) => {
  const t = (key: any) => getTranslation(key, language);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. How much money do I currently have? */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">{t('q1_title')}</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-white mt-1">
            {formatAZN(totalBalance)}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>{t('unallocated')}:</span>
          <span className="font-semibold text-emerald-400">{formatAZN(unallocatedCash)}</span>
        </div>
      </div>

      {/* 2. How much did I earn this month? */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">{t('q2_title')}</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-blue-400 mt-1">
            +{formatAZN(monthlyIncome)}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Bugünkü gəlir:</span>
          <span className="font-medium text-slate-300">+{formatAZN(dailyIncome)}</span>
        </div>
      </div>

      {/* 3. How much did I spend this month? */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">{t('q3_title')}</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-rose-400 mt-1">
            -{formatAZN(monthlyExpenses)}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Bugünkü xərc:</span>
          <span className="font-medium text-slate-300">-{formatAZN(dailyExpenses)}</span>
        </div>
      </div>

      {/* 4. How much money am I saving toward my goals? */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">{t('q4_title')}</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-amber-400 mt-1">
            {formatAZN(earmarkedSavings)}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-500" />
            {t('earmarked')}:
          </span>
          <span className="font-medium text-slate-300">
            {totalBalance > 0 ? `${Math.round((earmarkedSavings / totalBalance) * 100)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* 5. Am I on track with my financial plans? */}
      <div className={`rounded-2xl p-4 shadow-md flex flex-col justify-between relative overflow-hidden border transition-colors ${
        isOnTrack
          ? 'bg-slate-900 border-emerald-500/30'
          : 'bg-slate-900 border-rose-500/30'
      }`}>
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">{t('q5_title')}</span>
            <span className={`p-1.5 rounded-lg ${
              isOnTrack ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {isOnTrack ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-2xl font-black tracking-tight ${
              monthlyNetCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {monthlyNetCashFlow >= 0 ? '+' : ''}
              {formatAZN(monthlyNetCashFlow)}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
          <span className={isOnTrack ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
            {isOnTrack ? t('onTrack') : t('needsAttention')}
          </span>
        </div>
      </div>
    </div>
  );
};
