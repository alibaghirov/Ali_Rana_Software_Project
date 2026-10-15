export type Language = 'az' | 'en';

export const translations = {
  az: {
    appName: 'Qənaət',
    appTagline: 'Şəxsi Maliyyə və Ağıllı Yığım',
    dashboard: 'İcmal',
    transactions: 'Əməliyyatlar',
    goals: 'Yığım Hədəfləri',
    banks: 'Bank İnteqrasiyası',
    reports: 'Hesabatlar',
    settings: 'Profil və Tənzimləmələr',

    // 5 Key Questions
    q1_title: 'Nə qədər pulum var?',
    q1_subtitle: 'Ümumi Balans',
    unallocated: 'Sərbəst qalıq',
    earmarked: 'Hədəflərdə yığılan',
    
    q2_title: 'Bu ay nə qədər qazandım?',
    q2_subtitle: 'Aylıq Gəlir',

    q3_title: 'Bu ay nə qədər xərclədim?',
    q3_subtitle: 'Aylıq Xərc',

    q4_title: 'Hədəflər üçün nə qədər yığıram?',
    q4_subtitle: 'Aktiv Yığımlar',

    q5_title: 'Maliyyə planım düzgün gedir?',
    q5_subtitle: 'Xalis Pul Axını',
    onTrack: 'Müsbət axın (Hər şey qaydasındadır)',
    needsAttention: 'Mənfi axın (Xərclərə diqqət yetirin)',

    // Actions
    addIncome: 'Gəlir əlavə et',
    addExpense: 'Xərc əlavə et',
    newGoal: 'Yeni Hədəf',
    contribute: 'Yığım et',
    withdraw: 'Çıxarış et',
    syncBank: 'Bankı yenilə',
    exportCsv: 'CSV İxrac et',
    filters: 'Filtrlər',
    searchPlaceholder: 'Axtarış (təsvir, kateqoriya, qeyd)...',

    // Transaction terms
    income: 'Gəlir',
    expense: 'Xərc',
    all: 'Hamısı',
    amount: 'Məbləğ',
    date: 'Tarix',
    category: 'Kateqoriya',
    description: 'Təsvir',
    paymentMethod: 'Ödəniş üsulu',
    note: 'Qeyd',
    recurring: 'Təkrarlanan əməliyyat',
    importedFrom: 'Mənbə',
    manual: 'Manual qeydiyyat',
    bankImport: 'Bankdan idxal',

    // Categories
    salary: 'Əməkhaqqı',
    freelance: 'Frilans / Əlavə iş',
    gifts: 'Hədiyyələr',
    business: 'Biznes gəliri',
    allowance: 'Müavinət / Təqaüd',
    investments: 'İnvestisiya',
    other_income: 'Digər gəlir',

    food: 'Qida və Ərzaq',
    transport: 'Nəqliyyat və Yanacaq',
    education: 'Təhsil və Kurslar',
    rent: 'Kirayə və Mənzil',
    shopping: 'Geyim və Alış-veriş',
    entertainment: 'Əyləncə və İstirahət',
    subscriptions: 'Abunəliklər və Xidmətlər',
    utilities: 'Kommunal ödənişlər',
    health: 'Sağlamlıq və Aptek',
    other_expense: 'Digər xərc',

    // Payment methods
    cash: 'Nağd',
    card: 'Bank kartı',
    bank_transfer: 'Bank köçürməsi',
    other: 'Digər',

    // Goals
    targetAmount: 'Hədəf məbləğ',
    savedAmount: 'Yığılan məbləğ',
    deadline: 'Son tarix',
    daysLeft: 'gün qalıb',
    dailyRecommendation: 'Gündəlik tövsiyə olunan yığım',
    requiredDaily: 'Gündəlik yığım',
    completed: 'Tamamlandı',
    active: 'Aktiv',
    overdue: 'Gecikir',
    lockedGoal: 'Kilidli Hədəf',
    lockExplanation: 'Xərcləmə vərdişinin qarşısını almaq üçün bu hədəf kilidlənib.',
    coolingOff: 'Soyuma müddəti',
    requestUnlock: 'Kilidin açılmasını tələb et',

    // Gamification
    streak: 'Fəaliyyət Zənciri',
    daysStreak: 'gün ardıcıl',
    longestStreak: 'Ən uzun zəncir',
    nextMilestone: 'Növbəti Nailiyyət',
    achievements: 'Nailiyyətlər və Medallar',
    level: 'Səviyyə',
    xpPoints: 'Xal',

    // Bank
    openBankingTitle: 'Açıq Bankçılıq və Avtomatlaşdırma',
    openBankingDesc: 'Azərbaycan Mərkəzi Bankının (CBAR) Açıq Bankçılıq standartları əsasında inteqrasiya.',
    connectedAccounts: 'Qoşulmuş Bank Hesabları',
    connectBank: 'Bank Hesabı Qoş',
    lastSync: 'Son yenilənmə',
    syncSuccess: 'Əməliyyatlar uğurla sinxronlaşdırıldı və təkrar qeydlər aradan qaldırıldı.',
  },
  en: {
    appName: 'Qənaət',
    appTagline: 'Personal Finance & Smart Savings',
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    goals: 'Savings Goals',
    banks: 'Bank Integration',
    reports: 'Reports',
    settings: 'Profile & Settings',

    // 5 Key Questions
    q1_title: 'How much money do I currently have?',
    q1_subtitle: 'Total Balance',
    unallocated: 'Unallocated Cash',
    earmarked: 'Earmarked in Goals',
    
    q2_title: 'How much did I earn this month?',
    q2_subtitle: 'Monthly Income',

    q3_title: 'How much did I spend this month?',
    q3_subtitle: 'Monthly Expenses',

    q4_title: 'How much money am I saving toward my goals?',
    q4_subtitle: 'Active Savings',

    q5_title: 'Am I on track with my financial plans?',
    q5_subtitle: 'Net Cash Flow',
    onTrack: 'Positive Cash Flow (Healthy)',
    needsAttention: 'Negative Cash Flow (Monitor spending)',

    // Actions
    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    newGoal: 'New Goal',
    contribute: 'Contribute',
    withdraw: 'Withdraw',
    syncBank: 'Sync Bank',
    exportCsv: 'Export CSV',
    filters: 'Filters',
    searchPlaceholder: 'Search (description, category, note)...',

    // Transaction terms
    income: 'Income',
    expense: 'Expense',
    all: 'All',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    description: 'Description',
    paymentMethod: 'Payment Method',
    note: 'Note',
    recurring: 'Recurring transaction',
    importedFrom: 'Source',
    manual: 'Manual entry',
    bankImport: 'Bank import',

    // Categories
    salary: 'Salary',
    freelance: 'Freelance / Side Gig',
    gifts: 'Gifts',
    business: 'Business Income',
    allowance: 'Allowance / Scholarship',
    investments: 'Investments',
    other_income: 'Other Income',

    food: 'Food & Groceries',
    transport: 'Transport & Fuel',
    education: 'Education & Courses',
    rent: 'Rent & Housing',
    shopping: 'Shopping & Clothes',
    entertainment: 'Entertainment & Leisure',
    subscriptions: 'Subscriptions & Services',
    utilities: 'Utilities',
    health: 'Health & Pharmacy',
    other_expense: 'Other Expense',

    // Payment methods
    cash: 'Cash',
    card: 'Bank Card',
    bank_transfer: 'Bank Transfer',
    other: 'Other',

    // Goals
    targetAmount: 'Target Amount',
    savedAmount: 'Saved Amount',
    deadline: 'Deadline',
    daysLeft: 'days left',
    dailyRecommendation: 'Daily Recommended Contribution',
    requiredDaily: 'Required Daily',
    completed: 'Completed',
    active: 'Active',
    overdue: 'Overdue',
    lockedGoal: 'Locked Goal',
    lockExplanation: 'This goal is locked to prevent impulsive spending.',
    coolingOff: 'Cooling-off period',
    requestUnlock: 'Request Unlock',

    // Gamification
    streak: 'Activity Streak',
    daysStreak: 'days streak',
    longestStreak: 'Longest streak',
    nextMilestone: 'Next Milestone',
    achievements: 'Achievements & Badges',
    level: 'Level',
    xpPoints: 'Points',

    // Bank
    openBankingTitle: 'Open Banking & Automation',
    openBankingDesc: 'Integration based on Central Bank of Azerbaijan (CBAR) Open Banking standards.',
    connectedAccounts: 'Connected Bank Accounts',
    connectBank: 'Connect Bank Account',
    lastSync: 'Last synced',
    syncSuccess: 'Transactions synchronized successfully with automatic deduplication.',
  },
};

export const getTranslation = (key: keyof typeof translations['az'], lang: Language = 'az'): string => {
  return translations[lang]?.[key] || translations['az'][key] || key;
};
