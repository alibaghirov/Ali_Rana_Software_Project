import express, { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import {
  readDb,
  saveDb,
  hashPassword,
  seedDefaultData,
  UserRecord,
} from './src/server/db.ts';
import {
  calculateTotals,
  calculateTotalBalance,
  calculateNetCashFlow,
  filterTransactionsByMonth,
  filterTransactionsByDay,
  deduplicateBankTransactions,
  checkMilestoneAchievements,
  calculateSavingsRecommendation,
  calculateUserLevel,
  roundToCents,
  STREAK_MILESTONES,
  type RawBankTx,
} from './src/utils/finance.ts';
import type {
  Transaction,
  SavingsGoal,
  GoalContribution,
  BankConnection,
  Category,
} from './src/types/finance.ts';

const app = express();
app.use(express.json());

// Initialize / seed database
seedDefaultData();

// Helper to extract authenticated user
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const db = readDb();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const session = db.sessions.find(
      (s) => s.token === token && new Date(s.expiresAt) > new Date()
    );
    if (session) {
      const user = db.users.find((u) => u.id === session.userId);
      if (user) {
        (req as any).user = user;
        return next();
      }
    }
  }

  // Check demo user header for easy switching/dev access
  const demoUserId = req.headers['x-user-id'] as string;
  if (demoUserId) {
    const user = db.users.find((u) => u.id === demoUserId);
    if (user) {
      (req as any).user = user;
      return next();
    }
  }

  // Fallback to default demo user if available
  const defaultUser = db.users[0];
  if (defaultUser) {
    (req as any).user = defaultUser;
    return next();
  }

  res.status(401).json({ error: 'İstifadəçi autentifikasiyadan keçməyib.' });
};

// Update streak on qualifying activity
const recordUserActivity = (
  userId: string,
  activityType: 'transaction' | 'savings_contribution' | 'financial_review',
  db = readDb()
) => {
  let streak = db.streaks.find((s) => s.userId === userId);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (!streak) {
    streak = {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: todayStr,
      history: [{ date: todayStr, activityType }],
    };
    db.streaks.push(streak);
  } else {
    const lastDate = streak.lastActiveDate;
    if (lastDate === todayStr) {
      // Already active today, just record history
      streak.history.push({ date: todayStr, activityType });
    } else {
      // Check if yesterday
      const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
      if (lastDate === yesterday) {
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
      } else {
        // Reset streak to 1
        streak.currentStreak = 1;
      }
      streak.lastActiveDate = todayStr;
      streak.history.push({ date: todayStr, activityType });
    }
  }

  // Check milestone achievements
  const existingUnlocked = db.user_achievements
    .filter((a) => a.userId === userId)
    .map((a) => a.achievementId);
  const newlyUnlocked = checkMilestoneAchievements(streak.currentStreak, existingUnlocked);

  for (const m of newlyUnlocked) {
    db.user_achievements.push({
      id: 'ach_' + crypto.randomUUID(),
      userId,
      achievementId: m.id,
      unlockedAt: new Date().toISOString(),
    });
  }

  saveDb(db);
  return { streak, newlyUnlocked };
};

// ==========================================
// AUTH & PROFILE ENDPOINTS
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, displayName, preferredCurrency, openingBalance } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, şifrə və ad tələb olunur.' });
  }

  const db = readDb();
  if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Bu email ilə qeydiyyatdan keçmiş istifadəçi artıq mövcuddur.' });
  }

  const userId = 'user_' + crypto.randomUUID();
  const newUser: UserRecord = {
    id: userId,
    email: email.toLowerCase(),
    displayName,
    passwordHash: hashPassword(password),
    preferredCurrency: preferredCurrency || 'AZN',
    timeZone: 'Asia/Baku',
    openingBalance: Number(openingBalance) || 0,
    notificationPreferences: {
      dailyReminders: true,
      reminderTime: '20:00',
      milestoneAlerts: true,
      weeklySummary: true,
    },
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Initialize streak
  db.streaks.push({
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    history: [],
  });

  // Create session
  const token = 'tok_' + crypto.randomUUID();
  db.sessions.push({
    token,
    userId,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  });

  saveDb(db);

  const { passwordHash: _, ...userProfile } = newUser;
  res.json({ token, user: userProfile });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email və şifrə daxil edilməlidir.' });
  }

  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Yanlış email və ya şifrə.' });
  }

  const token = 'tok_' + crypto.randomUUID();
  db.sessions.push({
    token,
    userId: user.id,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  });
  saveDb(db);

  const { passwordHash: _, ...userProfile } = user;
  res.json({ token, user: userProfile });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { passwordHash: _, ...userProfile } = user;
  res.json({ user: userProfile });
});

app.post('/api/auth/logout', authenticate, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const db = readDb();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDb(db);
  }
  res.json({ success: true });
});

app.post('/api/auth/recover', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email və yeni şifrə tələb olunur.' });
  }
  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Bu email ilə istifadəçi tapılmadı.' });
  }
  user.passwordHash = hashPassword(newPassword);
  saveDb(db);
  res.json({ success: true, message: 'Şifrə uğurla yeniləndi.' });
});

// Switch user or reset demo (for testing multi-user isolation)
app.get('/api/auth/users-list', (req: Request, res: Response) => {
  const db = readDb();
  const list = db.users.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    openingBalance: u.openingBalance,
  }));
  res.json({ users: list });
});

app.put('/api/profile', authenticate, (req: Request, res: Response) => {
  const currentUser = (req as any).user as UserRecord;
  const db = readDb();
  const user = db.users.find((u) => u.id === currentUser.id);

  if (!user) {
    return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
  }

  const { displayName, preferredCurrency, timeZone, openingBalance, notificationPreferences } =
    req.body;

  if (displayName) user.displayName = displayName;
  if (preferredCurrency) user.preferredCurrency = preferredCurrency;
  if (timeZone) user.timeZone = timeZone;
  if (typeof openingBalance === 'number') user.openingBalance = roundToCents(openingBalance);
  if (notificationPreferences) user.notificationPreferences = notificationPreferences;

  saveDb(db);
  const { passwordHash: _, ...profile } = user;
  res.json({ user: profile });
});

// ==========================================
// TRANSACTIONS MANAGEMENT
// ==========================================

app.get('/api/transactions', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();

  let userTxs = db.transactions.filter((tx) => tx.userId === user.id);

  const { search, type, category, paymentMethod, isImported, startDate, endDate, month } = req.query;

  if (month && typeof month === 'string') {
    userTxs = userTxs.filter((tx) => tx.date.startsWith(month));
  }
  if (startDate && typeof startDate === 'string') {
    userTxs = userTxs.filter((tx) => tx.date.slice(0, 10) >= startDate);
  }
  if (endDate && typeof endDate === 'string') {
    userTxs = userTxs.filter((tx) => tx.date.slice(0, 10) <= endDate);
  }
  if (type && typeof type === 'string') {
    userTxs = userTxs.filter((tx) => tx.type === type);
  }
  if (category && typeof category === 'string') {
    userTxs = userTxs.filter((tx) => tx.category === category);
  }
  if (paymentMethod && typeof paymentMethod === 'string') {
    userTxs = userTxs.filter((tx) => tx.paymentMethod === paymentMethod);
  }
  if (isImported !== undefined) {
    const boolVal = isImported === 'true';
    userTxs = userTxs.filter((tx) => Boolean(tx.isImported) === boolVal);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    userTxs = userTxs.filter(
      (tx) =>
        tx.description.toLowerCase().includes(q) ||
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        tx.category.toLowerCase().includes(q)
    );
  }

  // Sort descending by date
  userTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({ transactions: userTxs });
});

app.post('/api/transactions', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { type, amount, date, category, description, paymentMethod, note, isRecurring, recurringInterval } =
    req.body;

  if (!type || !amount || !date || !category || !description) {
    return res.status(400).json({ error: 'Növ, məbləğ, tarix, kateqoriya və təsvir məcburidir.' });
  }

  const numAmount = roundToCents(Number(amount));
  if (numAmount <= 0) {
    return res.status(400).json({ error: 'Məbləğ müsbət ədəd olmalıdır.' });
  }

  const db = readDb();
  const newTx: Transaction = {
    id: 'tx_' + crypto.randomUUID(),
    userId: user.id,
    type,
    amount: numAmount,
    date: new Date(date).toISOString(),
    category,
    description: description.trim(),
    paymentMethod: paymentMethod || 'cash',
    note: note ? note.trim() : undefined,
    isRecurring: Boolean(isRecurring),
    recurringInterval: recurringInterval || 'monthly',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.transactions.push(newTx);
  saveDb(db);

  // Trigger streak qualifying activity
  const { streak, newlyUnlocked } = recordUserActivity(user.id, 'transaction', db);

  res.status(201).json({ transaction: newTx, streak, newlyUnlocked });
});

app.put('/api/transactions/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDb();

  const tx = db.transactions.find((t) => t.id === id && t.userId === user.id);
  if (!tx) {
    return res.status(404).json({ error: 'Əməliyyat tapılmadı və ya sizə aid deyil.' });
  }

  const { type, amount, date, category, description, paymentMethod, note, isRecurring, recurringInterval } =
    req.body;

  if (type) tx.type = type;
  if (amount) {
    const num = roundToCents(Number(amount));
    if (num <= 0) return res.status(400).json({ error: 'Məbləğ müsbət ədəd olmalıdır.' });
    tx.amount = num;
  }
  if (date) tx.date = new Date(date).toISOString();
  if (category) tx.category = category;
  if (description) tx.description = description.trim();
  if (paymentMethod) tx.paymentMethod = paymentMethod;
  if (note !== undefined) tx.note = note.trim();
  if (isRecurring !== undefined) tx.isRecurring = Boolean(isRecurring);
  if (recurringInterval) tx.recurringInterval = recurringInterval;
  tx.updatedAt = new Date().toISOString();

  saveDb(db);
  res.json({ transaction: tx });
});

app.delete('/api/transactions/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDb();

  const index = db.transactions.findIndex((t) => t.id === id && t.userId === user.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Əməliyyat tapılmadı və ya sizə aid deyil.' });
  }

  db.transactions.splice(index, 1);
  saveDb(db);
  res.json({ success: true });
});

// ==========================================
// SAVINGS GOALS & DYNAMIC RECOMMENDATIONS
// ==========================================

app.get('/api/goals', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();

  const userGoals = db.goals.filter((g) => g.userId === user.id);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Augment goals with dynamic daily recommendation and contribution status
  const enrichedGoals = userGoals.map((g) => {
    // Check if contributed today
    const contributionsToday = db.goal_contributions.filter(
      (gc) =>
        gc.goalId === g.id &&
        gc.userId === user.id &&
        gc.type === 'contribution' &&
        gc.date.startsWith(todayStr)
    );
    const hasContributedToday = contributionsToday.length > 0;

    const recommendation = calculateSavingsRecommendation(
      g.targetAmount,
      g.savedAmount,
      g.deadline,
      todayStr,
      hasContributedToday
    );

    // Auto-update status to completed if saved >= target
    if (g.savedAmount >= g.targetAmount && g.status === 'active') {
      g.status = 'completed';
    }

    return {
      ...g,
      hasContributedToday,
      recommendation,
    };
  });

  saveDb(db);
  res.json({ goals: enrichedGoals });
});

app.post('/api/goals', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const {
    name,
    targetAmount,
    deadline,
    preferredDailyMinimum,
    category,
    icon,
    priority,
    startingContribution,
    isLocked,
    coolingOffMinutes,
  } = req.body;

  if (!name || !targetAmount) {
    return res.status(400).json({ error: 'Hədəf adı və məqsəd məbləği məcburidir.' });
  }

  const numTarget = roundToCents(Number(targetAmount));
  const numStarting = startingContribution ? roundToCents(Number(startingContribution)) : 0;

  if (numTarget <= 0) {
    return res.status(400).json({ error: 'Məqsəd məbləği müsbət ədəd olmalıdır.' });
  }

  const db = readDb();
  const goalId = 'goal_' + crypto.randomUUID();
  const now = new Date();

  const newGoal: SavingsGoal = {
    id: goalId,
    userId: user.id,
    name: name.trim(),
    targetAmount: numTarget,
    savedAmount: numStarting,
    deadline: deadline || undefined,
    preferredDailyMinimum: preferredDailyMinimum ? roundToCents(Number(preferredDailyMinimum)) : undefined,
    category: category || 'Ümumi',
    icon: icon || 'Target',
    priority: priority || 'medium',
    status: numStarting >= numTarget ? 'completed' : 'active',
    isLocked: Boolean(isLocked),
    coolingOffMinutes: Number(coolingOffMinutes) || 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  db.goals.push(newGoal);

  // If there was a starting contribution, record it in history (internal earmark)
  if (numStarting > 0) {
    db.goal_contributions.push({
      id: 'gc_' + crypto.randomUUID(),
      goalId,
      userId: user.id,
      type: 'contribution',
      amount: numStarting,
      date: now.toISOString(),
      note: 'İlkin yığım ayırması',
      createdAt: now.toISOString(),
    });
    recordUserActivity(user.id, 'savings_contribution', db);
  }

  saveDb(db);
  res.status(201).json({ goal: newGoal });
});

app.put('/api/goals/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDb();

  const goal = db.goals.find((g) => g.id === id && g.userId === user.id);
  if (!goal) {
    return res.status(404).json({ error: 'Yığım hədəfi tapılmadı və ya sizə aid deyil.' });
  }

  const { name, targetAmount, deadline, preferredDailyMinimum, category, icon, priority, status, isLocked, coolingOffMinutes } =
    req.body;

  if (name) goal.name = name.trim();
  if (targetAmount) goal.targetAmount = roundToCents(Number(targetAmount));
  if (deadline !== undefined) goal.deadline = deadline || undefined;
  if (preferredDailyMinimum !== undefined)
    goal.preferredDailyMinimum = preferredDailyMinimum ? roundToCents(Number(preferredDailyMinimum)) : undefined;
  if (category) goal.category = category;
  if (icon) goal.icon = icon;
  if (priority) goal.priority = priority;
  if (status) goal.status = status;
  if (isLocked !== undefined) goal.isLocked = Boolean(isLocked);
  if (coolingOffMinutes !== undefined) goal.coolingOffMinutes = Number(coolingOffMinutes);
  goal.updatedAt = new Date().toISOString();

  saveDb(db);
  res.json({ goal });
});

// Contribute to a goal (Internal earmarking: does not inflate total income/expenses)
app.post('/api/goals/:id/contribute', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const { amount, note } = req.body;

  const numAmount = roundToCents(Number(amount));
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Məbləğ müsbət ədəd olmalıdır.' });
  }

  const db = readDb();
  const goal = db.goals.find((g) => g.id === id && g.userId === user.id);
  if (!goal) {
    return res.status(404).json({ error: 'Yığım hədəfi tapılmadı.' });
  }

  const now = new Date();
  goal.savedAmount = roundToCents(goal.savedAmount + numAmount);
  if (goal.savedAmount >= goal.targetAmount) {
    goal.status = 'completed';
  }
  goal.updatedAt = now.toISOString();

  const contribution: GoalContribution = {
    id: 'gc_' + crypto.randomUUID(),
    goalId: goal.id,
    userId: user.id,
    type: 'contribution',
    amount: numAmount,
    date: now.toISOString(),
    note: note ? note.trim() : 'Yığım töhfəsi',
    createdAt: now.toISOString(),
  };

  db.goal_contributions.push(contribution);

  // Trigger streak qualifying activity
  const { streak, newlyUnlocked } = recordUserActivity(user.id, 'savings_contribution', db);

  saveDb(db);
  res.json({ goal, contribution, streak, newlyUnlocked });
});

// Withdraw from a goal
app.post('/api/goals/:id/withdraw', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const { amount, note, bypassLock } = req.body;

  const numAmount = roundToCents(Number(amount));
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Məbləğ müsbət ədəd olmalıdır.' });
  }

  const db = readDb();
  const goal = db.goals.find((g) => g.id === id && g.userId === user.id);
  if (!goal) {
    return res.status(404).json({ error: 'Yığım hədəfi tapılmadı.' });
  }

  if (numAmount > goal.savedAmount) {
    return res.status(400).json({ error: `Yığımda cəmi ${goal.savedAmount.toFixed(2)} AZN var. Artıq məbləğ çıxarıla bilməz.` });
  }

  // Check goal lock & cooling-off
  if (goal.isLocked && !bypassLock) {
    if (goal.coolingOffMinutes && goal.coolingOffMinutes > 0) {
      if (!goal.unlockRequestedAt) {
        return res.status(403).json({
          error: `Bu hədəf kilidlənib (${goal.coolingOffMinutes} dəqiqə soyuma müddəti). Əvvəlcə kilidin açılmasını tələb etməlisiniz.`,
          requiresUnlockRequest: true,
          coolingOffMinutes: goal.coolingOffMinutes,
        });
      }
      const unlockTime = new Date(goal.unlockRequestedAt).getTime() + goal.coolingOffMinutes * 60000;
      if (Date.now() < unlockTime) {
        const remainingMinutes = Math.ceil((unlockTime - Date.now()) / 60000);
        return res.status(403).json({
          error: `Soyuma müddəti aktivdir. Çıxarış üçün daha ${remainingMinutes} dəqiqə gözləməlisiniz.`,
          remainingMinutes,
        });
      }
    }
  }

  const now = new Date();
  goal.savedAmount = roundToCents(goal.savedAmount - numAmount);
  if (goal.savedAmount < goal.targetAmount && goal.status === 'completed') {
    goal.status = 'active';
  }
  goal.updatedAt = now.toISOString();

  const withdrawal: GoalContribution = {
    id: 'gc_' + crypto.randomUUID(),
    goalId: goal.id,
    userId: user.id,
    type: 'withdrawal',
    amount: numAmount,
    date: now.toISOString(),
    note: note ? note.trim() : 'Yığımdan çıxarış',
    createdAt: now.toISOString(),
  };

  db.goal_contributions.push(withdrawal);
  saveDb(db);

  res.json({ goal, withdrawal });
});

// Request unlock for locked goal
app.post('/api/goals/:id/request-unlock', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDb();

  const goal = db.goals.find((g) => g.id === id && g.userId === user.id);
  if (!goal) return res.status(404).json({ error: 'Hədəf tapılmadı.' });

  goal.unlockRequestedAt = new Date().toISOString();
  saveDb(db);
  res.json({ goal, message: `${goal.coolingOffMinutes || 15} dəqiqəlik soyuma müddəti başladı.` });
});

// Goal contributions history
app.get('/api/goals/:id/history', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDb();

  const history = db.goal_contributions
    .filter((gc) => gc.goalId === id && gc.userId === user.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({ history });
});

app.delete('/api/goals/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDb();

  const idx = db.goals.findIndex((g) => g.id === id && g.userId === user.id);
  if (idx === -1) return res.status(404).json({ error: 'Hədəf tapılmadı.' });

  db.goals.splice(idx, 1);
  db.goal_contributions = db.goal_contributions.filter((gc) => gc.goalId !== id);
  saveDb(db);
  res.json({ success: true });
});

// ==========================================
// GAMIFICATION, STREAKS & ACHIEVEMENTS
// ==========================================

app.get('/api/gamification', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();

  let streak = db.streaks.find((s) => s.userId === user.id);
  if (!streak) {
    streak = {
      userId: user.id,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      history: [],
    };
  }

  const userAchievements = db.user_achievements.filter((a) => a.userId === user.id);
  const completedGoalsCount = db.goals.filter((g) => g.userId === user.id && g.status === 'completed').length;

  const milestonesWithStatus = STREAK_MILESTONES.map((m) => {
    const found = userAchievements.find((ua) => ua.achievementId === m.id);
    return {
      ...m,
      isUnlocked: Boolean(found),
      unlockedAt: found ? found.unlockedAt : null,
      progress: Math.min(100, Math.round((streak.currentStreak / m.milestoneDays) * 100)),
      daysRemaining: Math.max(0, m.milestoneDays - streak.currentStreak),
    };
  });

  const nextMilestone = milestonesWithStatus.find((m) => !m.isUnlocked) || null;
  const levelInfo = calculateUserLevel(streak.currentStreak, completedGoalsCount);

  res.json({
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    milestones: milestonesWithStatus,
    nextMilestone,
    levelInfo,
  });
});

app.post('/api/gamification/record-activity', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { activityType } = req.body;
  const valid = ['transaction', 'savings_contribution', 'financial_review'];
  if (!valid.includes(activityType)) {
    return res.status(400).json({ error: 'Yanlış fəaliyyət növü.' });
  }

  const { streak, newlyUnlocked } = recordUserActivity(user.id, activityType);
  res.json({ streak, newlyUnlocked });
});

// ==========================================
// BANK INTEGRATION LAYER & OPEN BANKING DEMO
// ==========================================

export const SUPPORTED_BANKS = [
  {
    code: 'abb',
    name: 'ABB (Azərbaycan Beynəlxalq Bankı)',
    logo: '🏦',
    apiType: 'CBAR Open Banking PSD2 REST API',
    sandboxSupported: true,
  },
  {
    code: 'kapital',
    name: 'Kapital Bank (Birbank API)',
    logo: '🔴',
    apiType: 'Birbank Open Banking Protocol',
    sandboxSupported: true,
  },
  {
    code: 'pasha',
    name: 'PAŞA Bank (Pasha Open Banking)',
    logo: '🔵',
    apiType: 'Pasha Open API Gateway',
    sandboxSupported: true,
  },
  {
    code: 'leobank',
    name: 'Leobank / Unibank Open API',
    logo: '🦁',
    apiType: 'Leo Direct Account Connector',
    sandboxSupported: true,
  },
  {
    code: 'cbar_sandbox',
    name: 'Azərbaycan Mərkəzi Bankı (CBAR) Test Sandboksu',
    logo: '🇦🇿',
    apiType: 'CBAR National Open Banking Standard',
    sandboxSupported: true,
  },
];

app.get('/api/banks/providers', (req: Request, res: Response) => {
  res.json({ providers: SUPPORTED_BANKS });
});

app.get('/api/banks', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  const connections = db.bank_connections.filter((b) => b.userId === user.id);
  res.json({ connections });
});

app.post('/api/banks/connect', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { bankCode } = req.body;

  const provider = SUPPORTED_BANKS.find((p) => p.code === bankCode);
  if (!provider) {
    return res.status(400).json({ error: 'Dəstəklənməyən bank kodu.' });
  }

  const db = readDb();
  // Check if already connected
  const existing = db.bank_connections.find((b) => b.userId === user.id && b.bankCode === bankCode);
  if (existing) {
    return res.status(400).json({ error: 'Bu bank hesabı artıq qoşulub.' });
  }

  const newConn: BankConnection = {
    id: 'bank_' + crypto.randomUUID(),
    userId: user.id,
    bankCode: provider.code as any,
    bankName: provider.name,
    accountNumberMasked: `*${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'connected',
    lastSyncedAt: new Date().toISOString(),
    autoSync: true,
    importedCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.bank_connections.push(newConn);
  saveDb(db);
  res.status(201).json({ connection: newConn });
});

// Bank Synchronization with Deduplication & Auto-Classification
app.post('/api/banks/:id/sync', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDb();

  const conn = db.bank_connections.find((b) => b.id === id && b.userId === user.id);
  if (!conn) {
    return res.status(404).json({ error: 'Bank bağlantısı tapılmadı.' });
  }

  // Pre-generated mock incoming transactions from bank API
  const now = new Date();
  const sampleBankFeed: RawBankTx[] = [
    {
      providerTransactionId: `${conn.bankCode}_tx_auto_${now.getFullYear()}_01`,
      amount: 32.8,
      date: new Date(now.getTime() - 2 * 3600000).toISOString(),
      description: 'Bravo Supermarket Əhmədli',
      category: 'food',
      paymentMethod: 'card',
    },
    {
      providerTransactionId: `${conn.bankCode}_tx_auto_${now.getFullYear()}_02`,
      amount: 6.5,
      date: new Date(now.getTime() - 5 * 3600000).toISOString(),
      description: 'Bolt Taxi Bakı',
      category: 'transport',
      paymentMethod: 'card',
    },
    {
      providerTransactionId: `${conn.bankCode}_tx_auto_${now.getFullYear()}_03`,
      amount: 14.0,
      date: new Date(now.getTime() - 12 * 3600000).toISOString(),
      description: 'Wolt Kofe və Şirniyyat',
      category: 'food',
      paymentMethod: 'card',
    },
    {
      providerTransactionId: `${conn.bankCode}_tx_auto_${now.getFullYear()}_04`,
      amount: 50.0,
      date: new Date(now.getTime() - 24 * 3600000).toISOString(),
      description: 'SOCAR Yanacaqdoldurma',
      category: 'transport',
      paymentMethod: 'card',
    },
  ];

  // Fetch all existing transactions for this user
  const userTransactions = db.transactions.filter((tx) => tx.userId === user.id);

  // Run pure deduplication logic
  const freshTransactions = deduplicateBankTransactions(userTransactions, sampleBankFeed);

  const importedList: Transaction[] = [];

  for (const raw of freshTransactions) {
    const tx: Transaction = {
      id: 'tx_' + crypto.randomUUID(),
      userId: user.id,
      type: 'expense',
      amount: raw.amount,
      date: raw.date,
      category: (raw.category as Category) || 'other_expense',
      description: raw.description,
      paymentMethod: 'card',
      isImported: true,
      bankId: conn.id,
      bankName: conn.bankName.split(' ')[0],
      providerTransactionId: raw.providerTransactionId,
      note: `Avtomatik idxal edildi (${conn.bankName})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.transactions.push(tx);
    importedList.push(tx);
  }

  conn.lastSyncedAt = new Date().toISOString();
  conn.importedCount += importedList.length;

  if (importedList.length > 0) {
    recordUserActivity(user.id, 'transaction', db);
  }

  saveDb(db);

  res.json({
    synced: true,
    newImportedCount: importedList.length,
    importedTransactions: importedList,
    connection: conn,
  });
});

app.delete('/api/banks/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDb();

  const idx = db.bank_connections.findIndex((b) => b.id === id && b.userId === user.id);
  if (idx === -1) return res.status(404).json({ error: 'Bank bağlantısı tapılmadı.' });

  db.bank_connections.splice(idx, 1);
  saveDb(db);
  res.json({ success: true });
});

// ==========================================
// FINANCIAL SUMMARIES & REPORTS
// ==========================================

app.get('/api/summary', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();

  const userTxs = db.transactions.filter((tx) => tx.userId === user.id);
  const userGoals = db.goals.filter((g) => g.userId === user.id);
  const streak = db.streaks.find((s) => s.userId === user.id);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  // All time totals for total balance calculation
  const allTimeTotals = calculateTotals(userTxs);
  const totalBalance = calculateTotalBalance(user.openingBalance, allTimeTotals.income, allTimeTotals.expenses);

  // Earmarked savings inside active goals
  const earmarkedSavings = roundToCents(
    userGoals.filter((g) => g.status === 'active').reduce((acc, g) => acc + g.savedAmount, 0)
  );

  // Available unallocated cash
  const unallocatedCash = roundToCents(totalBalance - earmarkedSavings);

  // Current month totals
  const monthlyTxs = filterTransactionsByMonth(userTxs, currentMonthStr);
  const monthlyTotals = calculateTotals(monthlyTxs);

  // Today totals
  const todayTxs = filterTransactionsByDay(userTxs, todayStr);
  const todayTotals = calculateTotals(todayTxs);

  // Active goals recommendations sum
  const activeGoals = userGoals.filter((g) => g.status === 'active');
  const todayRecommendedSavings = roundToCents(
    activeGoals.reduce((sum, g) => {
      const rec = calculateSavingsRecommendation(g.targetAmount, g.savedAmount, g.deadline, todayStr);
      return sum + rec.requiredDailyContribution;
    }, 0)
  );

  // On-track indicator: positive monthly net cash flow and savings progress
  const isOnTrack = monthlyTotals.netCashFlow >= 0;

  res.json({
    currency: user.preferredCurrency || 'AZN',
    openingBalance: user.openingBalance,
    totalBalance,
    earmarkedSavings,
    unallocatedCash,
    dailyIncome: todayTotals.income,
    dailyExpenses: todayTotals.expenses,
    dailyNetCashFlow: todayTotals.netCashFlow,
    monthlyIncome: monthlyTotals.income,
    monthlyExpenses: monthlyTotals.expenses,
    monthlyNetCashFlow: monthlyTotals.netCashFlow,
    todayRecommendedSavings,
    activeGoalsCount: activeGoals.length,
    currentStreak: streak ? streak.currentStreak : 0,
    isOnTrack,
  });
});

app.get('/api/reports/monthly', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  const userTxs = db.transactions.filter((tx) => tx.userId === user.id);

  const queryMonth = (req.query.month as string) || new Date().toISOString().slice(0, 7);

  // Current selected month
  const currentMonthTxs = filterTransactionsByMonth(userTxs, queryMonth);
  const currentTotals = calculateTotals(currentMonthTxs);

  // Previous month calculation for comparison
  const [yearStr, monthStr] = queryMonth.split('-');
  const prevDate = new Date(Number(yearStr), Number(monthStr) - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthTxs = filterTransactionsByMonth(userTxs, prevMonthStr);
  const prevTotals = calculateTotals(prevMonthTxs);

  // Expense categories breakdown
  const categoryMap: Record<string, number> = {};
  for (const tx of currentMonthTxs) {
    if (tx.type === 'expense') {
      categoryMap[tx.category] = roundToCents((categoryMap[tx.category] || 0) + tx.amount);
    }
  }

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: currentTotals.expenses > 0 ? Math.round((amount / currentTotals.expenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Savings contributions in this month
  const monthContributions = db.goal_contributions.filter(
    (gc) => gc.userId === user.id && gc.date.startsWith(queryMonth) && gc.type === 'contribution'
  );
  const totalGoalSavingsThisMonth = roundToCents(
    monthContributions.reduce((sum, gc) => sum + gc.amount, 0)
  );

  res.json({
    month: queryMonth,
    totals: currentTotals,
    previousMonth: {
      month: prevMonthStr,
      totals: prevTotals,
    },
    difference: {
      incomeChange: roundToCents(currentTotals.income - prevTotals.income),
      expenseChange: roundToCents(currentTotals.expenses - prevTotals.expenses),
      netCashFlowChange: roundToCents(currentTotals.netCashFlow - prevTotals.netCashFlow),
    },
    categoryBreakdown,
    totalGoalSavingsThisMonth,
  });
});

app.get('/api/reports/export-csv', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  const userTxs = db.transactions.filter((tx) => tx.userId === user.id);

  let csv = 'ID,Tarix,Nov,Mebleg,Valyuta,Kateqoriya,Tesvir,Odenis_Metodu,Avtomatik_Idxal,Qeyd\n';
  for (const tx of userTxs) {
    csv += `"${tx.id}","${tx.date}","${tx.type}","${tx.amount}","AZN","${tx.category}","${tx.description.replace(/"/g, '""')}","${tx.paymentMethod}","${tx.isImported ? 'Bəli' : 'Xeyr'}","${(tx.note || '').replace(/"/g, '""')}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="qenaet_emeliyyatlar.csv"');
  res.send(csv);
});

// Reset database demo state
app.post('/api/reset-demo', (req: Request, res: Response) => {
  const dbFile = path.resolve(process.cwd(), 'data', 'finance_db.json');
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
  }
  seedDefaultData();
  res.json({ success: true, message: 'Nümunə məlumatlar ilkin vəziyyətinə qaytarıldı.' });
});

// ==========================================
// VITE DEV SERVER / STATIC ASSETS
// ==========================================

const startServer = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Finance app server running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
