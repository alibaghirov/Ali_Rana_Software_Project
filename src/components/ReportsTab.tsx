import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart,
  PiggyBank,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { getTranslation } from '../i18n/translations.ts';
import { formatAZN } from '../utils/finance.ts';

interface ReportsTabProps {
  onExportCsv: () => void;
  language: Language;
  getHeaders?: () => Record<string, string>;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ onExportCsv, language, getHeaders }) => {
  const t = (key: any) => getTranslation(key, language);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = getHeaders ? getHeaders() : {};
      const token = localStorage.getItem('qenaet_auth_token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/reports/monthly?month=${month}`, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Server xətası: ${res.status}`);
      }

      const data = await res.json();
      if (!data || !data.totals) {
        throw new Error('Hesabat məlumatları tam deyil.');
      }

      setReportData(data);
    } catch (err: any) {
      console.error('Error fetching monthly report:', err);
      setError(err?.message || 'Hesabatı yükləmək mümkün olmadı.');
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchReport(selectedMonth);
  }, [fetchReport, selectedMonth]);

  const income = reportData?.totals?.income ?? 0;
  const expenses = reportData?.totals?.expenses ?? 0;
  const netCashFlow = reportData?.totals?.netCashFlow ?? 0;
  const incomeChange = reportData?.difference?.incomeChange ?? 0;
  const expenseChange = reportData?.difference?.expenseChange ?? 0;
  const prevMonthName = reportData?.previousMonth?.month || 'Əvvəlki Ay';
  const prevIncome = reportData?.previousMonth?.totals?.income ?? 0;
  const prevExpenses = reportData?.previousMonth?.totals?.expenses ?? 0;
  const prevNetCashFlow = reportData?.previousMonth?.totals?.netCashFlow ?? 0;
  const categoryBreakdown: any[] = reportData?.categoryBreakdown || [];
  const goalSavings = reportData?.totalGoalSavingsThisMonth ?? 0;

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
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
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
        <div className="p-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-400 mb-3" />
          <p className="text-xs text-slate-400 font-medium">Hesabat məlumatları hesablanır...</p>
        </div>
      ) : error || !reportData ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-rose-500/20 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-rose-400" />
          <h3 className="text-sm font-bold text-slate-200">Hesabat yüklənərkən xəta baş verdi</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{error || 'Məlumatlar əldə edilə bilmədi.'}</p>
          <button
            onClick={() => fetchReport(selectedMonth)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yenidən yoxla</span>
          </button>
        </div>
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
                +{formatAZN(income)}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Əvvəlki ayla müqayisə:</span>
                <span
                  className={`font-semibold ${
                    incomeChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {incomeChange >= 0 ? '+' : ''}
                  {formatAZN(incomeChange)}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{t('expense')}</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">
                -{formatAZN(expenses)}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Əvvəlki ayla müqayisə:</span>
                <span
                  className={`font-semibold ${
                    expenseChange <= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {expenseChange >= 0 ? '+' : ''}
                  {formatAZN(expenseChange)}
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
                  netCashFlow >= 0 ? 'text-blue-400' : 'text-rose-400'
                }`}
              >
                {netCashFlow >= 0 ? '+' : ''}
                {formatAZN(netCashFlow)}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Bu ay yığılan vəsait:</span>
                <span className="font-semibold text-amber-400">
                  {formatAZN(goalSavings)}
                </span>
              </div>
            </div>
          </div>

          {/* Month vs Prior Month Comparison & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Month-over-Month Comparison Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>Əvvəlki Ay ilə Müqayisə ({prevMonthName})</span>
              </h3>

              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Əvvəlki Ayın Gəliri</span>
                    <span className="font-bold text-slate-200">
                      {formatAZN(prevIncome)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Bu Ayın Gəliri</span>
                    <span className="font-bold text-emerald-400">
                      {formatAZN(income)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Əvvəlki Ayın Xərci</span>
                    <span className="font-bold text-slate-200">
                      {formatAZN(prevExpenses)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Bu Ayın Xərci</span>
                    <span className="font-bold text-rose-400">
                      {formatAZN(expenses)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Əvvəlki Xalis Axın</span>
                    <span className="font-bold text-slate-200">
                      {formatAZN(prevNetCashFlow)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Bu Ayın Xalis Axını</span>
                    <span className="font-bold text-blue-400">
                      {formatAZN(netCashFlow)}
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

              {categoryBreakdown.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Bu ay üzrə xərc qeydə alınmayıb.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {categoryBreakdown.map((item: any) => (
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
