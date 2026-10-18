export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other';

export type IncomeCategory = 
  | 'salary'
  | 'freelance'
  | 'gifts'
  | 'business'
  | 'allowance'
  | 'investments'
  | 'other_income';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'education'
  | 'rent'
  | 'shopping'
  | 'entertainment'
  | 'subscriptions'
  | 'utilities'
  | 'health'
  | 'other_expense';

export type Category = IncomeCategory | ExpenseCategory;

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // in AZN (two decimal places)
  date: string; // ISO string YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  category: Category;
  description: string;
  paymentMethod: PaymentMethod;
  note?: string;
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  isImported?: boolean;
  bankId?: string;
  bankName?: string;
  providerTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  type: 'contribution' | 'withdrawal';
  amount: number; // in AZN
  date: string;
  note?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string; // YYYY-MM-DD
  preferredDailyMinimum?: number;
  category: string;
  icon?: string;
  priority: GoalPriority;
  status: GoalStatus;
  isLocked?: boolean;
  coolingOffMinutes?: number;
  unlockRequestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankConnection {
  id: string;
  userId: string;
  bankCode: 'abb' | 'kapital' | 'pasha' | 'leobank' | 'cbar_sandbox';
  bankName: string;
  accountNumberMasked: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSyncedAt?: string;
  autoSync: boolean;
  importedCount: number;
  createdAt: string;
}

export interface Achievement {
  id: string;
  milestoneDays: number;
  titleAz: string;
  titleEn: string;
  descriptionAz: string;
  descriptionEn: string;
  icon: string;
  badgeColor: string;
  unlockedAt?: string;
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  history: { date: string; activityType: string }[];
}

export interface UserProfile {
  id: string;
  email: string;
  phoneNumber: string; // Azərbaycan mobil nömrəsi (+994)
  finCode: string; // 7 simvollu şəxsiyyət vəsiqəsi FİN kodu
  displayName: string;
  preferredCurrency: string;
  timeZone: string;
  openingBalance: number;
  avatarUrl?: string;
  isPhoneVerified: boolean;
  notificationPreferences: {
    dailyReminders: boolean;
    reminderTime: string; // HH:mm
    milestoneAlerts: boolean;
    weeklySummary: boolean;
  };
  createdAt: string;
}

export interface OtpVerificationRecord {
  id: string;
  phoneNumber: string;
  code: string;
  expiresAt: string; // 5 dəqiqə keçərlilik
  verified: boolean;
  createdAt: string;
}

export interface DailyRecommendation {
  targetAmount: number;
  savedAmount: number;
  remainingAmount: number;
  daysRemaining: number;
  requiredDailyContribution: number;
  isOverdue: boolean;
  isCompleted: boolean;
  messageAz: string;
  messageEn: string;
  statusTone: 'success' | 'info' | 'warning' | 'alert';
}

export interface FinancialSummary {
  totalBalance: number;
  earmarkedSavings: number;
  unallocatedCash: number;
  dailyIncome: number;
  dailyExpenses: number;
  dailyNetCashFlow: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNetCashFlow: number;
  isOnTrack: boolean;
}
