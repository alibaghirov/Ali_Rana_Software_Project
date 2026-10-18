import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  Transaction,
  SavingsGoal,
  GoalContribution,
  BankConnection,
  UserProfile,
  UserStreak,
  Achievement,
} from '../types/finance.ts';
import { STREAK_MILESTONES, checkMilestoneAchievements } from '../utils/finance.ts';

const DB_FILE = path.resolve(process.cwd(), 'data', 'finance_db.json');

export interface UserRecord extends UserProfile {
  passwordHash: string;
}

export interface UserAchievementRecord {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  sessions: { token: string; userId: string; expiresAt: string }[];
  otps: import('../types/finance.ts').OtpVerificationRecord[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  goal_contributions: GoalContribution[];
  bank_connections: BankConnection[];
  streaks: UserStreak[];
  user_achievements: UserAchievementRecord[];
}

const defaultDb: DatabaseSchema = {
  users: [],
  sessions: [],
  otps: [],
  transactions: [],
  goals: [],
  goal_contributions: [],
  bank_connections: [],
  streaks: [],
  user_achievements: [],
};

// Ensure data folder exists
const ensureDataDir = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Read Database
export const readDb = (): DatabaseSchema => {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    saveDb(defaultDb);
    seedDefaultData();
    return readDb();
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (err) {
    console.error('Error reading DB file, returning fallback:', err);
    return defaultDb;
  }
};

// Atomic Save Database
export const saveDb = (db: DatabaseSchema) => {
  ensureDataDir();
  const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
};

export const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password + '_salt_qenaet_az_2026').digest('hex');
};

// Seed initial realistic demo data for the first launch
export const seedDefaultData = () => {
  const db = !fs.existsSync(DB_FILE) ? { ...defaultDb } : JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  
  if (db.users.length > 0) return; // already seeded

  const demoUserId = 'user_demo_1';
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Demo user
  const demoUser: UserRecord = {
    id: demoUserId,
    email: 'alibaghirov51@gmail.com',
    phoneNumber: '+994501234567',
    finCode: '5ABC123',
    displayName: 'Əli Bağırov',
    passwordHash: hashPassword('qenaet2026'),
    preferredCurrency: 'AZN',
    timeZone: 'Asia/Baku',
    openingBalance: 1250.0,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isPhoneVerified: true,
    notificationPreferences: {
      dailyReminders: true,
      reminderTime: '20:00',
      milestoneAlerts: true,
      weeklySummary: true,
    },
    createdAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
  };

  // 24-day streak for demo user
  const streak: UserStreak = {
    userId: demoUserId,
    currentStreak: 24,
    longestStreak: 24,
    lastActiveDate: todayStr,
    history: Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now.getTime() - (23 - i) * 86400000);
      return {
        date: d.toISOString().slice(0, 10),
        activityType: i % 2 === 0 ? 'transaction' : 'savings_contribution',
      };
    }),
  };

  // Achievements already unlocked (10 days, 20 days)
  const achievements: UserAchievementRecord[] = [
    {
      id: 'ach_1',
      userId: demoUserId,
      achievementId: 'streak_10',
      unlockedAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
    },
    {
      id: 'ach_2',
      userId: demoUserId,
      achievementId: 'streak_20',
      unlockedAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
    },
  ];

  // Bank connection (ABB - International Bank of Azerbaijan)
  const bankConn: BankConnection = {
    id: 'bank_conn_1',
    userId: demoUserId,
    bankCode: 'abb',
    bankName: 'ABB (Azərbaycan Beynəlxalq Bankı)',
    accountNumberMasked: '*4821',
    status: 'connected',
    lastSyncedAt: new Date(now.getTime() - 3600000).toISOString(),
    autoSync: true,
    importedCount: 6,
    createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
  };

  // Initial transactions
  const transactions: Transaction[] = [
    {
      id: 'tx_1',
      userId: demoUserId,
      type: 'income',
      amount: 2800.0,
      date: `${todayStr.slice(0, 7)}-01T10:00:00Z`,
      category: 'salary',
      description: 'Aylıq Əməkhaqqı',
      paymentMethod: 'bank_transfer',
      note: 'Maaş kartına köçürmə',
      createdAt: `${todayStr.slice(0, 7)}-01T10:00:00Z`,
      updatedAt: `${todayStr.slice(0, 7)}-01T10:00:00Z`,
    },
    {
      id: 'tx_2',
      userId: demoUserId,
      type: 'income',
      amount: 450.0,
      date: `${todayStr.slice(0, 7)}-08T15:30:00Z`,
      category: 'freelance',
      description: 'UI/UX Dizayn layihəsi',
      paymentMethod: 'bank_transfer',
      createdAt: `${todayStr.slice(0, 7)}-08T15:30:00Z`,
      updatedAt: `${todayStr.slice(0, 7)}-08T15:30:00Z`,
    },
    {
      id: 'tx_3',
      userId: demoUserId,
      type: 'expense',
      amount: 600.0,
      date: `${todayStr.slice(0, 7)}-02T12:00:00Z`,
      category: 'rent',
      description: 'Mənzil kirayəsi',
      paymentMethod: 'bank_transfer',
      createdAt: `${todayStr.slice(0, 7)}-02T12:00:00Z`,
      updatedAt: `${todayStr.slice(0, 7)}-02T12:00:00Z`,
    },
    {
      id: 'tx_4',
      userId: demoUserId,
      type: 'expense',
      amount: 145.5,
      date: `${todayStr.slice(0, 7)}-05T18:20:00Z`,
      category: 'food',
      description: 'Bravo Supermarket həftəlik alış-veriş',
      paymentMethod: 'card',
      isImported: true,
      bankId: 'bank_conn_1',
      bankName: 'ABB',
      providerTransactionId: 'abb_tx_101',
      createdAt: `${todayStr.slice(0, 7)}-05T18:20:00Z`,
      updatedAt: `${todayStr.slice(0, 7)}-05T18:20:00Z`,
    },
    {
      id: 'tx_5',
      userId: demoUserId,
      type: 'expense',
      amount: 65.0,
      date: `${todayStr.slice(0, 7)}-10T14:10:00Z`,
      category: 'utilities',
      description: 'Azərişıq və Azəriqaz kommunal',
      paymentMethod: 'card',
      createdAt: `${todayStr.slice(0, 7)}-10T14:10:00Z`,
      updatedAt: `${todayStr.slice(0, 7)}-10T14:10:00Z`,
    },
    {
      id: 'tx_6',
      userId: demoUserId,
      type: 'expense',
      amount: 40.0,
      date: `${todayStr.slice(0, 7)}-12T09:45:00Z`,
      category: 'transport',
      description: 'BakıKart və Bolt Taxi xərcləri',
      paymentMethod: 'card',
      isImported: true,
      bankId: 'bank_conn_1',
      bankName: 'ABB',
      providerTransactionId: 'abb_tx_102',
      createdAt: `${todayStr.slice(0, 7)}-12T09:45:00Z`,
      updatedAt: `${todayStr.slice(0, 7)}-12T09:45:00Z`,
    },
    {
      id: 'tx_7',
      userId: demoUserId,
      type: 'expense',
      amount: 85.0,
      date: `${todayStr}T11:00:00Z`,
      category: 'food',
      description: 'Restoran və nahar',
      paymentMethod: 'card',
      createdAt: `${todayStr}T11:00:00Z`,
      updatedAt: `${todayStr}T11:00:00Z`,
    },
  ];

  db.users.push(demoUser);
  db.streaks.push(streak);
  db.user_achievements.push(...achievements);
  db.bank_connections.push(bankConn);
  db.transactions.push(...transactions);
  // Default goals are empty so user adds and deletes their own goals freely
  db.goals = [];
  db.goal_contributions = [];

  saveDb(db);
  console.log('Database initialized with user, clean goals state.');
};
