/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Target,
  Building2,
  FileBarChart,
  PlusCircle,
  MinusCircle,
  PiggyBank,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header.tsx';
import { QuestionCards } from './components/QuestionCards.tsx';
import { DailyRecommendationBanner } from './components/DailyRecommendationBanner.tsx';
import { ChartsSection } from './components/ChartsSection.tsx';
import { GoalsSection } from './components/GoalsSection.tsx';
import { GamificationCard } from './components/GamificationCard.tsx';
import { TransactionsTab } from './components/TransactionsTab.tsx';
import { BankIntegrationTab } from './components/BankIntegrationTab.tsx';
import { ReportsTab } from './components/ReportsTab.tsx';
import { AiAdvisorTab } from './components/AiAdvisorTab.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import type { Language } from './i18n/translations.ts';
import { getTranslation } from './i18n/translations.ts';
import type {
  UserProfile,
  Transaction,
  SavingsGoal,
  BankConnection,
  FinancialSummary,
} from './types/finance.ts';

type ActiveTab = 'dashboard' | 'transactions' | 'goals' | 'banks' | 'reports' | 'ai';

export default function App() {
  const [language, setLanguage] = useState<Language>('az');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('qenaet_auth_token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // App state
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([]);
  const [bankProviders, setBankProviders] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const t = (key: any) => getTranslation(key, language);

  // Headers helper with authorization token
  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  // Load all app data for authenticated user
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const headers = getHeaders();

      // Parallel data fetching
      const [userRes, summaryRes, txsRes, goalsRes, banksRes, providersRes, gamRes, reportRes] =
        await Promise.all([
          fetch('/api/auth/me', { headers }),
          fetch('/api/summary', { headers }),
          fetch('/api/transactions', { headers }),
          fetch('/api/goals', { headers }),
          fetch('/api/banks', { headers }),
          fetch('/api/banks/providers'),
          fetch('/api/gamification', { headers }),
          fetch('/api/reports/monthly', { headers }),
        ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      } else {
        // Token invalid or expired
        localStorage.removeItem('qenaet_auth_token');
        setToken(null);
        setUser(null);
        return;
      }

      if (summaryRes.ok) {
        const s = await summaryRes.json();
        setSummary(s);
      }
      if (txsRes.ok) {
        const t = await txsRes.json();
        setTransactions(t.transactions || []);
      }
      if (goalsRes.ok) {
        const g = await goalsRes.json();
        setGoals(g.goals || []);
      }
      if (banksRes.ok) {
        const b = await banksRes.json();
        setBankConnections(b.connections || []);
      }
      if (providersRes.ok) {
        const p = await providersRes.json();
        setBankProviders(p.providers || []);
      }
      if (gamRes.ok) {
        const gm = await gamRes.json();
        setGamification(gm);
      }
      if (reportRes.ok) {
        const r = await reportRes.json();
        setCategoryBreakdown(r.categoryBreakdown || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
      setIsCheckingAuth(false);
    }
  }, [getHeaders, token]);

  // Initial check on mount
  useEffect(() => {
    if (token) {
      loadData();
    } else {
      setIsCheckingAuth(false);
    }
  }, [token, loadData]);

  const handleLoginSuccess = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem('qenaet_auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getHeaders(),
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('qenaet_auth_token');
    setToken(null);
    setUser(null);
  };

  // Transactions Handlers
  const handleAddTransaction = async (txData: any) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(txData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Xəta baş verdi');
    }
    await loadData();
  };

  const handleUpdateTransaction = async (id: string, updates: any) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Düzəliş edilə bilmədi');
    }
    await loadData();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Bu əməliyyatı silmək istədiyinizə əminsiniz?')) return;
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Silinmədi');
      return;
    }
    await loadData();
  };

  // Goals Handlers
  const handleAddGoal = async (goalData: any) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(goalData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Hədəf yaradıla bilmədi');
    }
    await loadData();
  };

  const handleContributeGoal = async (goalId: string, amount: number, note?: string) => {
    const res = await fetch(`/api/goals/${goalId}/contribute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, note }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Töhfə qeydə alınmadı');
    }
    await loadData();
  };

  const handleWithdrawGoal = async (goalId: string, amount: number, note?: string) => {
    const res = await fetch(`/api/goals/${goalId}/withdraw`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, note }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Çıxarış icra olunmadı');
    }
    await loadData();
  };

  const handleRequestUnlock = async (goalId: string) => {
    const res = await fetch(`/api/goals/${goalId}/request-unlock`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Kilid açılışı tələb edilə bilmədi');
      return;
    }
    await loadData();
  };

  const handleDeleteGoal = async (goalId: string) => {
    const res = await fetch(`/api/goals/${goalId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Hədəf silinmədi');
    }
    await loadData();
  };

  // Bank Handlers
  const handleConnectBank = async (bankCode: string) => {
    const res = await fetch('/api/banks/connect', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bankCode }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Bank hesabı qoşula bilmədi');
    }
    await loadData();
  };

  const handleSyncBank = async (bankId: string) => {
    const res = await fetch(`/api/banks/${bankId}/sync`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Sinxronizasiya xətası');
    }
    const data = await res.json();
    await loadData();
    return data;
  };

  const handleDisconnectBank = async (bankId: string) => {
    if (!confirm('Bank bağlantısını kəsmək istədiyinizə əminsiniz?')) return;
    const res = await fetch(`/api/banks/${bankId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await loadData();
    }
  };

  const handleQuickSync = async () => {
    if (bankConnections.length === 0) {
      setActiveTab('banks');
      return;
    }
    setIsSyncing(true);
    try {
      for (const conn of bankConnections) {
        await handleSyncBank(conn.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Gamification: Record Financial Review
  const handleRecordReview = async () => {
    try {
      const res = await fetch('/api/gamification/record-activity', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ activityType: 'financial_review' }),
      });
      if (res.ok) {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Profile & User workspace switching (Test 9)
  const handleUpdateProfile = async (updates: any) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await loadData();
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('qenaet_auth_token', data.token);
        setIsProfileOpen(false);
      }
    } catch (err) {
      console.error('Error switching user:', err);
    }
  };

  const handleResetDemo = async () => {
    try {
      await fetch('/api/reset-demo', { method: 'POST', headers: getHeaders() });
      setIsProfileOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error resetting demo:', err);
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/reports/export-csv', {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('CSV yüklənə bilmədi');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qenaet_emeliyyatlar_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

  // 1. Initial Auth verification loading screen
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-semibold text-slate-300">Təhlükəsiz maliyyə profili yoxlanılır...</p>
      </div>
    );
  }

  // 2. Authentication Gate: Must log in / register first before accessing the full app
  if (!token || !user) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        language={language}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Sticky Header */}
      <Header
        user={user}
        currentStreak={gamification?.currentStreak || 0}
        language={language}
        onLanguageChange={setLanguage}
        onOpenAddIncome={() => {
          setActiveTab('transactions');
        }}
        onOpenAddExpense={() => {
          setActiveTab('transactions');
        }}
        onOpenAddGoal={() => {
          setActiveTab('goals');
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onQuickSync={handleQuickSync}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />

      {/* Navigation Tabs Bar */}
      <nav aria-label="Main Navigation" className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto py-2 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('dashboard')}</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'transactions'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>{t('transactions')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                {transactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('goals')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'goals'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>{t('goals')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                {goals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('banks')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'banks'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t('banks')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold font-mono">
                {bankConnections.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'reports'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              <span>{t('reports')}</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                  : 'text-indigo-400/90 hover:text-indigo-200 hover:bg-indigo-950/40 border border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>AI Məsləhətçi</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-bold font-mono">
                Gemini
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-500 mb-3" />
            <p className="text-xs text-slate-400 font-medium">Məlumatlar yüklənir...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'dashboard' && (
              <>
                {/* 5-Question Immediate Answer Cards */}
                {summary && (
                  <QuestionCards
                    totalBalance={summary.totalBalance}
                    unallocatedCash={summary.unallocatedCash}
                    earmarkedSavings={summary.earmarkedSavings}
                    monthlyIncome={summary.monthlyIncome}
                    monthlyExpenses={summary.monthlyExpenses}
                    monthlyNetCashFlow={summary.monthlyNetCashFlow}
                    dailyIncome={summary.dailyIncome}
                    dailyExpenses={summary.dailyExpenses}
                    isOnTrack={summary.isOnTrack}
                    language={language}
                  />
                )}

                {/* Smart Daily Recommendation Alert Banner */}
                <DailyRecommendationBanner
                  goals={goals}
                  onOpenContributeModal={(goal) => {
                    setActiveTab('goals');
                  }}
                  onOpenAiAdvisor={() => setActiveTab('ai')}
                  language={language}
                />

                {/* Gamification Streak & Milestones */}
                {gamification && (
                  <GamificationCard
                    currentStreak={gamification.currentStreak}
                    longestStreak={gamification.longestStreak}
                    lastActiveDate={gamification.lastActiveDate}
                    milestones={gamification.milestones}
                    nextMilestone={gamification.nextMilestone}
                    levelInfo={gamification.levelInfo}
                    onRecordReview={handleRecordReview}
                    language={language}
                  />
                )}

                {/* Charts and Visual Spending Breakdown */}
                {summary && (
                  <ChartsSection
                    monthlyIncome={summary.monthlyIncome}
                    monthlyExpenses={summary.monthlyExpenses}
                    categoryBreakdown={categoryBreakdown}
                    language={language}
                  />
                )}

                {/* Active Goals Preview */}
                <GoalsSection
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onContribute={handleContributeGoal}
                  onWithdraw={handleWithdrawGoal}
                  onRequestUnlock={handleRequestUnlock}
                  onDeleteGoal={handleDeleteGoal}
                  language={language}
                />
              </>
            )}

            {activeTab === 'transactions' && (
              <TransactionsTab
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onExportCsv={handleExportCsv}
                language={language}
                getHeaders={getHeaders}
              />
            )}

            {activeTab === 'goals' && (
              <GoalsSection
                goals={goals}
                onAddGoal={handleAddGoal}
                onContribute={handleContributeGoal}
                onWithdraw={handleWithdrawGoal}
                onRequestUnlock={handleRequestUnlock}
                onDeleteGoal={handleDeleteGoal}
                language={language}
              />
            )}

            {activeTab === 'banks' && (
              <BankIntegrationTab
                connections={bankConnections}
                providers={bankProviders}
                onConnectBank={handleConnectBank}
                onSyncBank={handleSyncBank}
                onDisconnectBank={handleDisconnectBank}
                language={language}
              />
            )}

            {activeTab === 'reports' && (
              <ErrorBoundary fallbackMessage="Hesabatlar bölməsində xəta baş verdi">
                <ReportsTab onExportCsv={handleExportCsv} language={language} getHeaders={getHeaders} />
              </ErrorBoundary>
            )}

            {activeTab === 'ai' && (
              <ErrorBoundary fallbackMessage="AI Məsləhətçi bölməsində xəta baş verdi">
                <AiAdvisorTab
                  language={language}
                  getHeaders={getHeaders}
                  onTransactionAdded={loadData}
                  userBalance={summary?.totalBalance}
                  monthlyIncome={summary?.monthlyIncome}
                  monthlyExpenses={summary?.monthlyExpenses}
                />
              </ErrorBoundary>
            )}
          </div>
        )}
      </main>

      {/* Profile & Multi-User Switcher Modal */}
      <ProfileModal
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        onSwitchUser={handleSwitchUser}
        onResetDemo={handleResetDemo}
        onLogout={handleLogout}
        language={language}
      />
    </div>
  );
}
