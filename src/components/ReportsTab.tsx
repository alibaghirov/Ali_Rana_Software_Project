import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart,
  PiggyBank,
  ArrowRight,
  Minus,
} from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import { formatAZN } from '../utils/finance.ts';

interface ReportsTabProps {
  onExportCsv: () => void;
  language: Language;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ onExportCsv, language }) => {
  const t = (key: any) => getTranslation(key, language);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (month: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error('Error fetching monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Header and Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            {t('reports')} və Aylıq Maliyyə Təhlili
          </h2>
          <p className="text-xs text-slate-400">
            Aylıq maliyyə dövriyyəsi, xərclərin strukturu və əvvəlki ayla müqayisə
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none"
            />
          </div>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>CSV Yüklə</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Hesabat yüklənir...</div>
      ) : !reportData ? (
        <div className="p-12 text-center text-xs text-rose-400">Hesabatı yükləmək mümkün olmadı.</div>
      ) : (
        <>
          {/* Main Month KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{t('income')}</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                +{formatAZN(reportData.totals.income)}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Əvvəlki ayla müqayisə:</span>
                <span
                  className={`font-semibold ${
                    reportData.difference.incomeChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {reportData.difference.incomeChange >= 0 ? '+' : ''}
                  {formatAZN(reportData.difference.incomeChange)}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{t('expense')}</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">
                -{formatAZN(reportData.totals.expenses)}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Əvvəlki ayla müqayisə:</span>
                <span
                  className={`font-semibold ${
                    reportData.difference.expenseChange <= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {reportData.difference.expenseChange >= 0 ? '+' : ''}
                  {formatAZN(reportData.difference.expenseChange)}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Xalis Pul Axını</span>
                <PiggyBank className="w-4 h-4 text-blue-400" />
              </div>
              <div
                className={`text-2xl font-black ${
                  reportData.totals.netCashFlow >= 0 ? 'text-blue-400' : 'text-rose-400'
                }`}
              >
                {reportData.totals.netCashFlow >= 0 ? '+' : ''}
                {formatAZN(reportData.totals.netCashFlow)}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Bu ay yığılan vəsait:</span>
                <span className="font-semibold text-amber-400">
                  {formatAZN(reportData.totalGoalSavingsThisMonth || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Month vs Prior Month Comparison & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Month-over-Month Comparison Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>Əvvəlki Ay ilə Müqayisə ({reportData.previousMonth.month})</span>
              </h3>

              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Əvvəlki Ayın Gəliri</span>
                    <span className="font-bold text-slate-200">
                      {formatAZN(reportData.previousMonth.totals.income)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Bu Ayın Gəliri</span>
                    <span className="font-bold text-emerald-400">
                      {formatAZN(reportData.totals.income)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Əvvəlki Ayın Xərci</span>
                    <span className="font-bold text-slate-200">
                      {formatAZN(reportData.previousMonth.totals.expenses)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Bu Ayın Xərci</span>
                    <span className="font-bold text-rose-400">
                      {formatAZN(reportData.totals.expenses)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Əvvəlki Xalis Axın</span>
                    <span className="font-bold text-slate-200">
                      {formatAZN(reportData.previousMonth.totals.netCashFlow)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Bu Ayın Xalis Axını</span>
                    <span className="font-bold text-blue-400">
                      {formatAZN(reportData.totals.netCashFlow)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Largest Expense Categories */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-400" />
                <span>Bu Ayın Ən Böyük Xərc Maddələri</span>
              </h3>

              {reportData.categoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Bu ay üzrə xərc qeydə alınmayıb.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {reportData.categoryBreakdown.map((item: any) => (
                    <div key={item.category}>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-300 font-medium">{t(item.category)}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400 text-[11px]">{item.percentage}%</span>
                          <span className="font-bold text-slate-200">
                            {formatAZN(item.amount)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-500"
                          style={{ width: `${Math.max(4, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
