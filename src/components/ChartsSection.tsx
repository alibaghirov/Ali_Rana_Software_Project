import React from 'react';
import { BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import { formatAZN } from '../utils/finance.ts';

interface ChartsSectionProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  language: Language;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  monthlyIncome,
  monthlyExpenses,
  categoryBreakdown,
  language,
}) => {
  const t = (key: any) => getTranslation(key, language);

  const maxIncomeExpense = Math.max(monthlyIncome, monthlyExpenses, 1);
  const incomeBarPct = Math.round((monthlyIncome / maxIncomeExpense) * 100);
  const expenseBarPct = Math.round((monthlyExpenses / maxIncomeExpense) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Income vs Expenses Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-100 text-sm">
              Aylıq Gəlir və Xərc Müqayisəsi
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Bu ay</span>
        </div>

        <div className="space-y-4 pt-2">
          {/* Income Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                {t('income')}
              </span>
              <span className="font-bold text-blue-400">{formatAZN(monthlyIncome)}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.max(5, incomeBarPct)}%` }}
              />
            </div>
          </div>

          {/* Expense Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                {t('expense')}
              </span>
              <span className="font-bold text-rose-400">{formatAZN(monthlyExpenses)}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                style={{ width: `${Math.max(5, expenseBarPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cash Flow Summary Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Xalis pul axını (Net Cash Flow):</span>
          <span
            className={`font-black text-sm ${
              monthlyIncome >= monthlyExpenses ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {monthlyIncome >= monthlyExpenses ? '+' : ''}
            {formatAZN(monthlyIncome - monthlyExpenses)}
          </span>
        </div>
      </div>

      {/* Spending Breakdown by Category */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <PieChart className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-100 text-sm">
              Kateqoriyalar üzrə Xərclər
            </h3>
          </div>
          <span className="text-xs text-slate-400">Ən böyük xərclər</span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Bu ay üzrə xərc qeydə alınmayıb.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {categoryBreakdown.slice(0, 4).map((item) => (
              <div key={item.category}>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium">
                    {t(item.category) || item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">{item.percentage}%</span>
                    <span className="font-semibold text-slate-200">{formatAZN(item.amount)}</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-500"
                    style={{ width: `${Math.max(4, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
