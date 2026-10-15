/**
 * Pure financial calculations and business logic for Personal Finance App.
 * Uses exact decimal math (in cents or rounded to two decimals) to avoid floating-point errors.
 */

export const roundToCents = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const ceilToCents = (num: number): number => {
  return Math.ceil(num * 100) / 100;
};

/**
 * Calculates net cash flow = income - expenses
 */
export const calculateNetCashFlow = (totalIncome: number, totalExpenses: number): number => {
  return roundToCents(totalIncome - totalExpenses);
};

/**
 * Calculates total account balance:
 * Total Balance = Opening Balance + All Incomes - All Expenses
 * Note: Savings goals are internal earmarks of this balance, so they do not reduce total balance,
 * but they reduce "unallocated available cash".
 */
export const calculateTotalBalance = (
  openingBalance: number,
  totalIncome: number,
  totalExpenses: number
): number => {
  return roundToCents(openingBalance + totalIncome - totalExpenses);
};

/**
 * Helper to calculate days between two dates (YYYY-MM-DD)
 */
export const getDaysRemaining = (
  deadlineStr: string,
  todayStr: string,
  hasContributedToday: boolean = false
): number => {
  const d1 = new Date(todayStr + 'T00:00:00Z');
  const d2 = new Date(deadlineStr + 'T00:00:00Z');
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 0; // Overdue
  }

  // If today hasn't had a contribution yet, today is included as an eligible saving day
  // For example, if today is Day 1 of a 10-day period (days remaining from day 1 to day 10 is 9 days diff + 1 = 10 eligible days).
  const eligibleDays = hasContributedToday ? Math.max(0, diffDays) : Math.max(1, diffDays + 1);
  return eligibleDays;
};

/**
 * Dynamic Daily Savings Recommendation Algorithm
 * T = target amount
 * S = saved amount
 * R = max(0, T - S)
 * D = number of eligible saving days remaining
 * Required Daily Contribution = R / D
 */
export interface SavingsRecommendationResult {
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

export const calculateSavingsRecommendation = (
  targetAmount: number,
  savedAmount: number,
  deadlineStr?: string,
  todayStr: string = new Date().toISOString().slice(0, 10),
  hasContributedToday: boolean = false
): SavingsRecommendationResult => {
  const T = roundToCents(targetAmount);
  const S = roundToCents(savedAmount);
  const R = roundToCents(Math.max(0, T - S));

  // Goal already reached
  if (R <= 0 || S >= T) {
    return {
      targetAmount: T,
      savedAmount: S,
      remainingAmount: 0,
      daysRemaining: 0,
      requiredDailyContribution: 0,
      isOverdue: false,
      isCompleted: true,
      messageAz: 'Təbriklər! Siz yığım hədəfinizə tam çatdınız.',
      messageEn: 'Congratulations! You have reached your savings goal.',
      statusTone: 'success',
    };
  }

  // Goal with no deadline
  if (!deadlineStr) {
    return {
      targetAmount: T,
      savedAmount: S,
      remainingAmount: R,
      daysRemaining: 0,
      requiredDailyContribution: 0,
      isOverdue: false,
      isCompleted: false,
      messageAz: `Hədəfinizə çatmaq üçün hələ ${R.toFixed(2)} AZN yığmaq lazımdır.`,
      messageEn: `You need to save ${R.toFixed(2)} AZN more to reach your goal.`,
      statusTone: 'info',
    };
  }

  const daysRemaining = getDaysRemaining(deadlineStr, todayStr, hasContributedToday);

  // Overdue
  if (daysRemaining <= 0) {
    return {
      targetAmount: T,
      savedAmount: S,
      remainingAmount: R,
      daysRemaining: 0,
      requiredDailyContribution: R,
      isOverdue: true,
      isCompleted: false,
      messageAz: `Hədəf müddəti bitib. Qalan ${R.toFixed(2)} AZN üçün yeni plan təyin edək.`,
      messageEn: `The deadline has passed. Let's set a revised plan for the remaining ${R.toFixed(2)} AZN.`,
      statusTone: 'alert',
    };
  }

  // Calculate required daily contribution: R / D
  // Displayed recommendation is rounded up to the nearest qəpik (0.01 AZN)
  const rawDaily = R / daysRemaining;
  const requiredDaily = ceilToCents(rawDaily);

  let messageAz = `Hədəfə çatmaq üçün gündəlik cəmi ${requiredDaily.toFixed(2)} AZN yığmaq kifayətdir.`;
  let messageEn = `You only need to save ${requiredDaily.toFixed(2)} AZN per day to stay on track.`;
  let statusTone: 'success' | 'info' | 'warning' | 'alert' = 'info';

  if (hasContributedToday) {
    messageAz = `Əla! Bu gün üçün yığım tamamlandı. Hədəfə bir addım daha yaxınsınız!`;
    messageEn = `Great! Today's contribution is complete. You are one step closer to your goal!`;
    statusTone = 'success';
  }

  return {
    targetAmount: T,
    savedAmount: S,
    remainingAmount: R,
    daysRemaining,
    requiredDailyContribution: requiredDaily,
    isOverdue: false,
    isCompleted: false,
    messageAz,
    messageEn,
    statusTone,
  };
};

/**
 * Filter transactions by month (YYYY-MM) in ISO string
 */
export const filterTransactionsByMonth = <T extends { date: string }>(
  transactions: T[],
  yearMonth: string // e.g. "2026-10"
): T[] => {
  return transactions.filter((tx) => tx.date.startsWith(yearMonth));
};

/**
 * Filter transactions by exact day (YYYY-MM-DD)
 */
export const filterTransactionsByDay = <T extends { date: string }>(
  transactions: T[],
  dayStr: string // e.g. "2026-10-15"
): T[] => {
  return transactions.filter((tx) => tx.date.startsWith(dayStr));
};

/**
 * Calculate totals for a given list of transactions
 */
export const calculateTotals = (
  transactions: Array<{ type: 'income' | 'expense'; amount: number }>
) => {
  let income = 0;
  let expenses = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      income += tx.amount;
    } else if (tx.type === 'expense') {
      expenses += tx.amount;
    }
  }

  return {
    income: roundToCents(income),
    expenses: roundToCents(expenses),
    netCashFlow: roundToCents(income - expenses),
  };
};

/**
 * Bank Transaction Deduplication:
 * Prevents importing duplicate transactions based on provider transaction IDs
 */
export interface RawBankTx {
  providerTransactionId: string;
  amount: number;
  date: string;
  description: string;
  category?: string;
  paymentMethod?: string;
}

export const deduplicateBankTransactions = <T extends { providerTransactionId?: string }>(
  existingTransactions: T[],
  incomingTransactions: RawBankTx[]
): RawBankTx[] => {
  const existingIdSet = new Set(
    existingTransactions
      .map((tx) => tx.providerTransactionId)
      .filter((id): id is string => Boolean(id))
  );

  return incomingTransactions.filter((incoming) => {
    if (!incoming.providerTransactionId) return true;
    return !existingIdSet.has(incoming.providerTransactionId);
  });
};

/**
 * Streak milestone definitions and achievement checker
 */
export interface MilestoneDef {
  milestoneDays: number;
  id: string;
  titleAz: string;
  titleEn: string;
  descriptionAz: string;
  descriptionEn: string;
  icon: string;
  badgeColor: string;
}

export const STREAK_MILESTONES: MilestoneDef[] = [
  {
    milestoneDays: 10,
    id: 'streak_10',
    titleAz: 'Maliyyə Başlanğıcı',
    titleEn: 'Financial Beginner',
    descriptionAz: '10 gün ardıcıl maliyyə intizamı nümayiş etdirdiniz.',
    descriptionEn: 'Maintained financial discipline for 10 consecutive days.',
    icon: 'Sparkles',
    badgeColor: 'emerald',
  },
  {
    milestoneDays: 20,
    id: 'streak_20',
    titleAz: 'Müntəzəm İzləyici',
    titleEn: 'Consistent Tracker',
    descriptionAz: '20 gün ardıcıl gəlir və xərclərinizi qeyd etdiniz.',
    descriptionEn: 'Tracked your income and expenses for 20 consecutive days.',
    icon: 'Flame',
    badgeColor: 'amber',
  },
  {
    milestoneDays: 30,
    id: 'streak_30',
    titleAz: 'Vərdiş Qurucusu',
    titleEn: 'Money Habit Builder',
    descriptionAz: '30 gün ardıcıl maliyyə vərdişi formalaşdırdınız.',
    descriptionEn: 'Built a sustainable financial habit over 30 consecutive days.',
    icon: 'Award',
    badgeColor: 'blue',
  },
  {
    milestoneDays: 40,
    id: 'streak_40',
    titleAz: 'Yığım Strateqi',
    titleEn: 'Savings Strategist',
    descriptionAz: '40 gün boyunca qənaət və maliyyə hədəflərinizi izlədiniz.',
    descriptionEn: 'Strategized your savings goals for 40 consecutive days.',
    icon: 'Target',
    badgeColor: 'purple',
  },
  {
    milestoneDays: 100,
    id: 'streak_100',
    titleAz: 'Maliyyə İntizamı Ustası',
    titleEn: 'Financial Discipline Master',
    descriptionAz: '100 gün! Siz əsl maliyyə müstəqilliyi və intizam ustasısınız.',
    descriptionEn: '100 days! You are a true master of financial discipline.',
    icon: 'Crown',
    badgeColor: 'rose',
  },
];

/**
 * Returns any newly unlocked milestone achievements for a streak count
 */
export const checkMilestoneAchievements = (
  streakCount: number,
  alreadyUnlockedIds: string[] = []
): MilestoneDef[] => {
  const unlockedSet = new Set(alreadyUnlockedIds);
  return STREAK_MILESTONES.filter(
    (milestone) => streakCount >= milestone.milestoneDays && !unlockedSet.has(milestone.id)
  );
};

/**
 * Calculate user level based on streak days and achievements
 */
export const calculateUserLevel = (streak: number, completedGoalsCount: number = 0) => {
  const points = streak * 10 + completedGoalsCount * 50;
  const level = Math.floor(points / 100) + 1;
  const currentLevelProgress = points % 100;
  return { level, points, currentLevelProgress };
};

/**
 * Format currency with AZN symbol and standard Azerbaijani representation
 */
export const formatAZN = (amount: number, locale: string = 'az-AZ'): string => {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} AZN`;
};
