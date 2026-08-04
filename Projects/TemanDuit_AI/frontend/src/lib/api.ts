import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('td_token') : null;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('td_token');
            localStorage.removeItem('td_user');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.get<T>(url, config);
    return res.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.post<T>(url, data, config);
    return res.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.put<T>(url, data, config);
    return res.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.delete<T>(url, config);
    return res.data;
  }
}

export const api = new ApiClient();

// ---- Auth API ----
export const authApi = {
  validateToken: (token: string) =>
    api.get<ApiResponse<{ telegramId: string; expiresAt: string }>>(`/auth/validate-token/${token}`),
  register: (data: RegisterData) =>
    api.post<ApiResponse<{ user: User; token: string; loginCode: string }>>('/auth/register', data),
  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),
  updateProfile: (data: Partial<User>) => api.put<ApiResponse<User>>('/auth/profile', data),
  // Login dengan kode unik
  loginWithCode: (code: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login-code', { code }),
  // Regenerate kode (user sudah login)
  regenerateLoginCode: () =>
    api.post<ApiResponse<{ loginCode: string }>>('/auth/login-code/regenerate'),
  markCodeShown: () => api.post<ApiResponse<null>>('/auth/login-code/shown'),
};

export const transactionApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get<PaginatedApiResponse<TransactionWithCategory>>('/transactions', { params }),
  getById: (id: string) =>
    api.get<ApiResponse<TransactionWithCategory>>(`/transactions/${id}`),
  createExpense: (data: CreateTransactionData) =>
    api.post<ApiResponse<Transaction>>('/transactions/expense', data),
  createIncome: (data: CreateIncomeData) =>
    api.post<ApiResponse<Transaction>>('/transactions/income', data),
  updateExpense: (id: string, data: Partial<CreateTransactionData>) =>
    api.put<ApiResponse<Transaction>>(`/transactions/expense/${id}`, data),
  updateIncome: (id: string, data: Partial<CreateIncomeData>) =>
    api.put<ApiResponse<Transaction>>(`/transactions/income/${id}`, data),
  deleteExpense: (id: string) => api.delete<ApiResponse<null>>(`/transactions/expense/${id}`),
  deleteIncome: (id: string) => api.delete<ApiResponse<null>>(`/transactions/income/${id}`),
};

export const budgetApi = {
  getAll: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<BudgetWithMeta[]>>('/budgets', { params }),
  getHistory: (months?: number) =>
    api.get<ApiResponse<Budget[]>>('/budgets/history', { params: { months } }),
  create: (data: CreateBudgetData) => api.post<ApiResponse<Budget>>('/budgets', data),
  update: (id: string, data: Partial<CreateBudgetData>) =>
    api.put<ApiResponse<Budget>>(`/budgets/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/budgets/${id}`),
};

export const debtApi = {
  getAll: (params?: { status?: string; type?: string }) =>
    api.get<ApiResponse<Debt[]>>('/debts', { params }),
  getById: (id: string) => api.get<ApiResponse<DebtWithPayments>>(`/debts/${id}`),
  getSummary: () => api.get<ApiResponse<DebtSummary>>('/debts/summary'),
  create: (data: CreateDebtData) => api.post<ApiResponse<Debt>>('/debts', data),
  update: (id: string, data: Partial<CreateDebtData>) =>
    api.put<ApiResponse<Debt>>(`/debts/${id}`, data),
  recordPayment: (id: string, data: { amount: number; note?: string }) =>
    api.post<ApiResponse<{ debt: Debt; payment: DebtPayment }>>(`/debts/${id}/payment`, data),
  cancel: (id: string) => api.post<ApiResponse<Debt>>(`/debts/${id}/cancel`),
};

export const reminderApi = {
  getAll: (params?: { active?: boolean }) =>
    api.get<ApiResponse<Reminder[]>>('/reminders', { params }),
  getUpcoming: (days?: number) =>
    api.get<ApiResponse<Reminder[]>>('/reminders/upcoming', { params: { days } }),
  create: (data: CreateReminderData) => api.post<ApiResponse<Reminder>>('/reminders', data),
  update: (id: string, data: Partial<CreateReminderData>) =>
    api.put<ApiResponse<Reminder>>(`/reminders/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/reminders/${id}`),
};

export const savingApi = {
  getGoals: () => api.get<ApiResponse<SavingGoal[]>>('/savings/goals'),
  getSummary: () => api.get<ApiResponse<SavingSummary>>('/savings/summary'),
  getTransactions: (limit?: number) =>
    api.get<ApiResponse<SavingTransaction[]>>('/savings/transactions', { params: { limit } }),
  createGoal: (data: CreateSavingGoalData) =>
    api.post<ApiResponse<SavingGoal>>('/savings/goals', data),
  updateGoal: (id: string, data: Partial<CreateSavingGoalData>) =>
    api.put<ApiResponse<SavingGoal>>(`/savings/goals/${id}`, data),
  deleteGoal: (id: string) => api.delete<ApiResponse<null>>(`/savings/goals/${id}`),
  createTransaction: (data: CreateSavingTransactionData) =>
    api.post<ApiResponse<SavingTransaction>>('/savings/transactions', data),
};

export const analyticsApi = {
  getFull: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<AnalyticsData>>('/analytics', { params }),
  getSummary: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<FinancialSummary>>('/analytics/summary', { params }),
  getTrends: (months?: number) =>
    api.get<ApiResponse<TrendsData>>('/analytics/trends', { params: { months } }),
  getDailySpending: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<DailySpending[]>>('/analytics/daily', { params }),
  getCategoryBreakdown: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<CategoryBreakdown[]>>('/analytics/categories', { params }),
};

export const notificationApi = {
  getAll: (unread?: boolean) =>
    api.get<ApiResponse<Notification[]> & { unreadCount: number }>('/notifications', {
      params: { unread },
    }),
  getCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/count'),
  markRead: (id: string) => api.put<ApiResponse<null>>(`/notifications/${id}/read`),
  markAllRead: () => api.put<ApiResponse<null>>('/notifications/read-all'),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/notifications/${id}`),
};

export const aiApi = {
  getInsights: () => api.get<ApiResponse<AIInsight[]>>('/ai/insights'),
  generateInsight: () => api.post<ApiResponse<AIInsight>>('/ai/insights/generate'),
  ask: (question: string) =>
    api.post<ApiResponse<{ question: string; answer: string }>>('/ai/ask', { question }),
  getBudgetAdvisor: () => api.get<ApiResponse<{ advice: string }>>('/ai/budget-advisor'),
  getForecast: () => api.get<ApiResponse<{ forecast: string }>>('/ai/forecast'),
};

export const categoryApi = {
  getAll: () => api.get<ApiResponse<Category[]>>('/categories'),
  create: (data: { name: string; icon?: string; color?: string }) =>
    api.post<ApiResponse<Category>>('/categories', data),
  update: (id: string, data: { name?: string; icon?: string; color?: string }) =>
    api.put<ApiResponse<Category>>(`/categories/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/categories/${id}`),
};

export const dashboardApi = {
  get: () => api.get<ApiResponse<DashboardData>>('/dashboard'),
};

export const searchApi = {
  search: (q: string) => api.get<ApiResponse<SearchResult[]>>('/search', { params: { q } }),
};

// ============================================================
// Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  telegramId: string;
  name: string;
  age: number;
  timezone: 'WIB' | 'WITA' | 'WIT';
  occupation: string;
  incomeSource: string;
  financialGoal?: string;
  balance: number;
  savingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  token: string;
  name: string;
  age: number;
  timezone: 'WIB' | 'WITA' | 'WIT';
  occupation: string;
  incomeSource: string;
  financialGoal?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  categoryId: string;
  description: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  source?: string;
  aiParsed?: boolean;
}
export interface TransactionWithCategory extends Transaction {
  categoryName?: string;
  categoryIcon?: string;
}
export interface CreateTransactionData {
  amount: number;
  categoryId: string;
  description: string;
  note?: string;
  date?: string;
}
export interface CreateIncomeData {
  amount: number;
  source: string;
  description: string;
  note?: string;
  date?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
  rollover: boolean;
  rolledAmount: number;
  createdAt: string;
  updatedAt: string;
}
export interface BudgetWithMeta extends Budget {
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  remaining: number;
  usagePercent: number;
  isWarning: boolean;
  isExceeded: boolean;
}
export interface CreateBudgetData {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  rollover?: boolean;
}

export interface Debt {
  id: string;
  userId: string;
  type: 'debt' | 'receivable' | 'installment';
  counterpartyName: string;
  amount: number;
  remainingAmount: number;
  paidAmount: number;
  description: string;
  dueDate?: string;
  status: 'ACTIVE' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  installmentAmount?: number;
  installmentFrequency?: string;
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
export interface DebtWithPayments extends Debt {
  payments: DebtPayment[];
}
export interface DebtSummary {
  totalDebt: number;
  totalReceivable: number;
  activeCount: number;
  overdueCount: number;
}
export interface CreateDebtData {
  type: 'debt' | 'receivable' | 'installment';
  counterpartyName: string;
  amount: number;
  description: string;
  dueDate?: string;
  installmentAmount?: number;
  installmentFrequency?: string;
}

export interface Reminder {
  id: string;
  userId: string;
  type: string;
  title: string;
  description?: string;
  amount?: number;
  frequency: string;
  dueDate: string;
  nextTrigger: string;
  isActive: boolean;
  lastTriggered?: string;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface CreateReminderData {
  type: string;
  title: string;
  description?: string;
  amount?: number;
  frequency: string;
  dueDate: string;
  relatedId?: string;
}

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
export interface SavingTransaction {
  id: string;
  userId: string;
  goalId?: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  createdAt: string;
}
export interface SavingSummary {
  totalSaving: number;
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
}
export interface CreateSavingGoalData {
  name: string;
  targetAmount: number;
  deadline?: string;
}
export interface CreateSavingTransactionData {
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  goalId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentToTelegram: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  userId: string;
  title: string;
  content: string;
  recommendations: string[];
  period: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
}

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
export interface TrendsData {
  income: TrendData[];
  expense: TrendData[];
  saving: TrendData[];
  budget: TrendData[];
}
export interface DailySpending {
  date: string;
  amount: number;
  transactions: number;
}
export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  count: number;
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

export interface DashboardData {
  user: User;
  summary: FinancialSummary;
  recentTransactions: TransactionWithCategory[];
  budgets: BudgetWithMeta[];
  notifications: Notification[];
  upcomingReminders: Reminder[];
  savingGoals: SavingGoal[];
  categoryBreakdown: CategoryBreakdown[];
  cashFlowTrend: { income: TrendData[]; expense: TrendData[] };
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  amount?: number;
  date?: string;
}
