// ============================================================
// TemanDuit - Core TypeScript Types & Interfaces
// ============================================================

export type Timezone = 'WIB' | 'WITA' | 'WIT';

export type TransactionType = 'expense' | 'income';

export type DebtStatus = 'ACTIVE' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ReminderType = 'bill' | 'debt' | 'installment' | 'budget' | 'saving' | 'custom';

export type NotificationType =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'reminder_due'
  | 'new_insight'
  | 'large_expense'
  | 'saving_goal_reached';

export type IncomeSource =
  | 'salary'
  | 'bonus'
  | 'freelance'
  | 'thr'
  | 'refund'
  | 'gift'
  | 'business'
  | 'other';

export type DebtType = 'debt' | 'receivable' | 'installment';

// ============================================================
// User
// ============================================================

export interface User {
  id: string;
  telegramId: string;
  name: string;
  age: number;
  timezone: Timezone;
  occupation: string;
  incomeSource: string;
  financialGoal?: string;
  balance: number;
  savingBalance: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Registration Token
// ============================================================

export interface RegistrationToken {
  token: string;
  telegramId: string;
  expiresAt: string;
  used: boolean;
}

// ============================================================
// Category
// ============================================================

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
}

// ============================================================
// Transaction
// ============================================================

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  source?: IncomeSource;
  aiParsed?: boolean;
  rawInput?: string;
}

// ============================================================
// Budget
// ============================================================

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  spent: number;
  month: number; // 1-12
  year: number;
  rollover: boolean;
  rolledAmount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Debt
// ============================================================

export interface Debt {
  id: string;
  userId: string;
  type: DebtType;
  counterpartyName: string;
  amount: number;
  remainingAmount: number;
  paidAmount: number;
  description: string;
  dueDate?: string;
  status: DebtStatus;
  installmentAmount?: number;
  installmentFrequency?: ReminderFrequency;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  userId: string;
  amount: number;
  note?: string;
  paidAt: string;
}

// ============================================================
// Reminder
// ============================================================

export interface Reminder {
  id: string;
  userId: string;
  type: ReminderType;
  title: string;
  description?: string;
  amount?: number;
  frequency: ReminderFrequency;
  dueDate: string;
  nextTrigger: string;
  isActive: boolean;
  lastTriggered?: string;
  relatedId?: string; // debtId, budgetId, etc.
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Saving Goal
// ============================================================

export interface SavingGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Saving Transaction
// ============================================================

export interface SavingTransaction {
  id: string;
  userId: string;
  goalId?: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  createdAt: string;
}

// ============================================================
// Notification
// ============================================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  sentToTelegram: boolean;
  relatedId?: string;
  createdAt: string;
}

// ============================================================
// AI Insight
// ============================================================

export interface AIInsight {
  id: string;
  userId: string;
  title: string;
  content: string;
  recommendations: string[];
  period: string; // e.g. "2024-01"
  createdAt: string;
}

// ============================================================
// Database Schema
// ============================================================

export interface DatabaseSchema {
  users: User[];
  registrationTokens: RegistrationToken[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  reminders: Reminder[];
  savingGoals: SavingGoal[];
  savingTransactions: SavingTransaction[];
  notifications: Notification[];
  aiInsights: AIInsight[];
}

// ============================================================
// AI Parsed Data
// ============================================================

export interface AIParsedExpense {
  action: 'expense';
  amount: number;
  category: string;
  description: string;
  note?: string;
  date?: string;
}

export interface AIParsedIncome {
  action: 'income';
  amount: number;
  source: IncomeSource;
  description: string;
  note?: string;
  date?: string;
}

export interface AIParsedDebt {
  action: 'debt' | 'receivable' | 'installment';
  counterpartyName: string;
  amount: number;
  description: string;
  dueDate?: string;
}

export interface AIParsedReminder {
  action: 'reminder';
  title: string;
  description?: string;
  amount?: number;
  frequency: ReminderFrequency;
  dueDate: string;
  type: ReminderType;
}

export interface AIParsedSaving {
  action: 'saving';
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  goalName?: string;
}

export interface AIQuestion {
  action: 'question';
  question: string;
}

export type AIParsedData =
  | AIParsedExpense
  | AIParsedIncome
  | AIParsedDebt
  | AIParsedReminder
  | AIParsedSaving
  | AIQuestion;

// ============================================================
// API Request/Response
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JWTPayload {
  userId: string;
  telegramId: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// Analytics
// ============================================================

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingRate: number;
  budgetUsage: number;
  averageDailySpending: number;
  mostExpensiveCategory: string;
  mostFrequentCategory: string;
  balance: number;
  savingBalance: number;
}

export interface TrendData {
  period: string;
  amount: number;
  count: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface DailySpending {
  date: string;
  amount: number;
  transactions: number;
}

export interface AnalyticsData {
  summary: FinancialSummary;
  incomeTrend: TrendData[];
  expenseTrend: TrendData[];
  savingTrend: TrendData[];
  budgetTrend: TrendData[];
  dailySpending: DailySpending[];
  categoryBreakdown: CategoryBreakdown[];
}

// ============================================================
// AI Context for insights
// ============================================================

export interface AIContext {
  user: Omit<User, 'id' | 'telegramId'>;
  summary: FinancialSummary;
  recentTransactions: Array<{
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
  activeBudgets: Array<{
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
  }>;
  activeDebts: Array<{
    type: DebtType;
    counterparty: string;
    remaining: number;
    dueDate?: string;
    status: DebtStatus;
  }>;
  savingGoals: Array<{
    name: string;
    target: number;
    current: number;
    deadline?: string;
  }>;
  upcomingReminders: Array<{
    title: string;
    dueDate: string;
    amount?: number;
  }>;
}
