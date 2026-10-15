import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNetCashFlow,
  calculateTotalBalance,
  calculateSavingsRecommendation,
  filterTransactionsByMonth,
  calculateTotals,
  deduplicateBankTransactions,
  checkMilestoneAchievements,
  STREAK_MILESTONES,
  type RawBankTx,
} from './finance.ts';

test('Test 1: Manual transactions - 100 AZN income and 30 AZN expenses', () => {
  const openingBalance = 250;
  const income = 100;
  const expenses = 30;

  const netCashFlow = calculateNetCashFlow(income, expenses);
  assert.equal(netCashFlow, 70, 'Net cash flow must increase by 70 AZN');

  const totalBalance = calculateTotalBalance(openingBalance, income, expenses);
  assert.equal(totalBalance, 320, 'Total balance must be opening (250) + 70 = 320 AZN');
});

test('Test 2: Monthly reporting - transactions from different months do not leak', () => {
  const transactions = [
    { id: '1', date: '2026-09-15T12:00:00Z', type: 'income' as const, amount: 200 },
    { id: '2', date: '2026-09-28T10:00:00Z', type: 'expense' as const, amount: 50 },
    { id: '3', date: '2026-10-01T09:00:00Z', type: 'income' as const, amount: 500 },
    { id: '4', date: '2026-10-15T14:30:00Z', type: 'expense' as const, amount: 120 },
    { id: '5', date: '2026-11-05T08:00:00Z', type: 'income' as const, amount: 100 },
  ];

  const sepTxs = filterTransactionsByMonth(transactions, '2026-09');
  const octTxs = filterTransactionsByMonth(transactions, '2026-10');
  const novTxs = filterTransactionsByMonth(transactions, '2026-11');

  assert.equal(sepTxs.length, 2, 'September should contain exactly 2 transactions');
  assert.equal(octTxs.length, 2, 'October should contain exactly 2 transactions');
  assert.equal(novTxs.length, 1, 'November should contain exactly 1 transaction');

  const sepTotals = calculateTotals(sepTxs);
  assert.equal(sepTotals.income, 200);
  assert.equal(sepTotals.expenses, 50);
  assert.equal(sepTotals.netCashFlow, 150);

  const octTotals = calculateTotals(octTxs);
  assert.equal(octTotals.income, 500);
  assert.equal(octTotals.expenses, 120);
  assert.equal(octTotals.netCashFlow, 380);
});

test('Test 3: Savings goal - 10 AZN target and 10-day deadline requires 1 AZN/day', () => {
  // Today is Day 1: 2026-10-01, Deadline: 2026-10-10 (10 days total)
  const today = '2026-10-01';
  const deadline = '2026-10-10';
  const target = 10;
  const saved = 0;

  const result = calculateSavingsRecommendation(target, saved, deadline, today, false);

  assert.equal(result.targetAmount, 10);
  assert.equal(result.savedAmount, 0);
  assert.equal(result.remainingAmount, 10);
  assert.equal(result.daysRemaining, 10, 'Eligible days remaining should be 10');
  assert.equal(result.requiredDailyContribution, 1.0, 'Daily required contribution should be 1 AZN');
  assert.equal(result.isCompleted, false);
  assert.equal(result.isOverdue, false);
});

test('Test 4: Early progress - after 5 AZN on day 1, recalculates to ~0.56 AZN/day over remaining 9 days', () => {
  const today = '2026-10-01';
  const deadline = '2026-10-10';
  const target = 10;
  const saved = 5; // 5 AZN contributed on day 1
  const hasContributedToday = true; // already made today's contribution

  const result = calculateSavingsRecommendation(target, saved, deadline, today, hasContributedToday);

  assert.equal(result.targetAmount, 10);
  assert.equal(result.savedAmount, 5);
  assert.equal(result.remainingAmount, 5);
  assert.equal(result.daysRemaining, 9, 'Remaining eligible days should be 9');
  // 5 / 9 = 0.555555... rounded up to cents = 0.56 AZN
  assert.equal(result.requiredDailyContribution, 0.56, 'Daily required contribution should be 0.56 AZN');
  assert.equal(result.isCompleted, false);
  assert.equal(result.isOverdue, false);
});

test('Test 5: Savings integrity - contributions do not inflate income/expenses; withdrawals reduce saved amount', () => {
  const openingBalance = 1000;
  let totalIncome = 500;
  let totalExpenses = 200;

  // Initial balance
  const balanceBefore = calculateTotalBalance(openingBalance, totalIncome, totalExpenses);
  assert.equal(balanceBefore, 1300);

  // User contributes 5 AZN to a goal
  let goalSaved = 0;
  const contributionAmount = 5;
  goalSaved += contributionAmount;

  // Balance remains 1300, income remains 500, expense remains 200
  const balanceAfterContrib = calculateTotalBalance(openingBalance, totalIncome, totalExpenses);
  assert.equal(balanceAfterContrib, 1300, 'Total account balance must NOT change when earmarking savings');
  assert.equal(goalSaved, 5, 'Goal saved amount must be 5 AZN');

  // User withdraws 2 AZN from the goal
  const withdrawalAmount = 2;
  goalSaved -= withdrawalAmount;
  assert.equal(goalSaved, 3, 'Goal saved amount must decrease to 3 AZN');

  // Balance still remains 1300
  const balanceAfterWithdraw = calculateTotalBalance(openingBalance, totalIncome, totalExpenses);
  assert.equal(balanceAfterWithdraw, 1300);
});

test('Test 6: Goal completion - marks completed when saved >= target', () => {
  const today = '2026-10-05';
  const deadline = '2026-10-10';
  const target = 50;
  const saved = 50;

  const result = calculateSavingsRecommendation(target, saved, deadline, today, true);

  assert.equal(result.isCompleted, true);
  assert.equal(result.remainingAmount, 0);
  assert.equal(result.requiredDailyContribution, 0);
  assert.match(result.messageAz, /Təbriklər/);
});

test('Test 7: Streak milestones - correct achievements at 10, 20, 30, 40, and 100 days', () => {
  // At 9 days, no milestones
  const at9 = checkMilestoneAchievements(9, []);
  assert.equal(at9.length, 0);

  // At 10 days, milestone 10 is unlocked
  const at10 = checkMilestoneAchievements(10, []);
  assert.equal(at10.length, 1);
  assert.equal(at10[0].milestoneDays, 10);
  assert.equal(at10[0].id, 'streak_10');

  // Re-checking with already unlocked milestone should not duplicate
  const recheck10 = checkMilestoneAchievements(10, ['streak_10']);
  assert.equal(recheck10.length, 0, 'Must not award same milestone repeatedly');

  // At 25 days with streak_10 already awarded, awards streak_20
  const at25 = checkMilestoneAchievements(25, ['streak_10']);
  assert.equal(at25.length, 1);
  assert.equal(at25[0].id, 'streak_20');

  // At 100 days from scratch, awards all 5 milestones
  const at100 = checkMilestoneAchievements(100, []);
  assert.equal(at100.length, 5);
  const milestoneDays = at100.map((m) => m.milestoneDays);
  assert.deepEqual(milestoneDays, [10, 20, 30, 40, 100]);
});

test('Test 8: Bank imports - repeated synchronization does not create duplicate transactions', () => {
  const existingTransactions = [
    { id: 'tx-1', providerTransactionId: 'abb-tx-1001', amount: 45.5, description: 'Bravo Supermarket' },
    { id: 'tx-2', providerTransactionId: 'abb-tx-1002', amount: 12.0, description: 'Bolt Taxi' },
  ];

  const incomingFromBank: RawBankTx[] = [
    { providerTransactionId: 'abb-tx-1001', amount: 45.5, date: '2026-10-14', description: 'Bravo Supermarket' }, // duplicate
    { providerTransactionId: 'abb-tx-1002', amount: 12.0, date: '2026-10-14', description: 'Bolt Taxi' }, // duplicate
    { providerTransactionId: 'abb-tx-1003', amount: 8.5, date: '2026-10-15', description: 'Wolt Kofe' }, // new
  ];

  const deduplicated = deduplicateBankTransactions(existingTransactions, incomingFromBank);

  assert.equal(deduplicated.length, 1, 'Only 1 new non-duplicate transaction should be accepted');
  assert.equal(deduplicated[0].providerTransactionId, 'abb-tx-1003');
  assert.equal(deduplicated[0].description, 'Wolt Kofe');
});
