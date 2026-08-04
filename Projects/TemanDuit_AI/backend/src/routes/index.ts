import { Router } from 'express';
import { DatabaseManager } from '../database/DatabaseManager';
import { config } from '../config';
import { authenticate } from '../middlewares/auth';
import { validate, schemas } from '../middlewares/validate';

// Services
import { AuthService } from '../services/AuthService';
import { ContextService } from '../services/ContextService';
import { SearchService } from '../services/SearchService';

// Engines
import { ExpenseEngine } from '../engines/ExpenseEngine';
import { IncomeEngine } from '../engines/IncomeEngine';
import { BudgetEngine } from '../engines/BudgetEngine';
import { DebtEngine } from '../engines/DebtEngine';
import { ReminderEngine } from '../engines/ReminderEngine';
import { SavingEngine } from '../engines/SavingEngine';
import { AnalyticsEngine } from '../engines/AnalyticsEngine';
import { NotificationEngine } from '../engines/NotificationEngine';
import { AIEngine } from '../engines/AIEngine';

// Controllers
import { AuthController } from '../controllers/AuthController';
import { TransactionController } from '../controllers/TransactionController';
import { BudgetController } from '../controllers/BudgetController';
import { DebtController } from '../controllers/DebtController';
import { ReminderController } from '../controllers/ReminderController';
import { SavingController } from '../controllers/SavingController';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { NotificationController } from '../controllers/NotificationController';
import { AIController } from '../controllers/AIController';
import { CategoryController } from '../controllers/CategoryController';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// Initialize singletons
const db = DatabaseManager.getInstance(config.database.path);

const authService = new AuthService(db);
const contextService = new ContextService(db);
const expenseEngine = new ExpenseEngine(db);
const incomeEngine = new IncomeEngine(db);
const budgetEngine = new BudgetEngine(db);
const debtEngine = new DebtEngine(db);
const reminderEngine = new ReminderEngine(db);
const savingEngine = new SavingEngine(db);
const analyticsEngine = new AnalyticsEngine(db);
const notificationEngine = new NotificationEngine(db);
const aiEngine = new AIEngine();
const searchService = new SearchService(db);

const authCtrl = new AuthController(authService);
const txCtrl = new TransactionController(expenseEngine, incomeEngine, db);
const budgetCtrl = new BudgetController(budgetEngine, db);
const debtCtrl = new DebtController(debtEngine);
const reminderCtrl = new ReminderController(reminderEngine);
const savingCtrl = new SavingController(savingEngine, db);
const analyticsCtrl = new AnalyticsController(analyticsEngine);
const notifCtrl = new NotificationController(notificationEngine);
const aiCtrl = new AIController(aiEngine, contextService, db);
const catCtrl = new CategoryController(db);

// ---- Auth Routes ----
router.post('/auth/register', validate(schemas.register), authCtrl.register);
router.get('/auth/validate-token/:token', authCtrl.validateToken);
router.get('/auth/profile', authenticate, authCtrl.getProfile);
router.put('/auth/profile', authenticate, validate(schemas.updateUser), authCtrl.updateProfile);

// Login dengan kode unik
router.post('/auth/login-code', authCtrl.loginWithCode);
// Regenerate kode (untuk user yang sudah login / via bot internal)
router.post('/auth/login-code/regenerate', authenticate, authCtrl.regenerateLoginCode);
// Tandai kode sudah dilihat
router.post('/auth/login-code/shown', authenticate, authCtrl.markCodeShown);

// ---- Transaction Routes ----
router.get('/transactions', authenticate, txCtrl.getAll);
router.get('/transactions/:id', authenticate, txCtrl.getById);
router.post('/transactions/expense', authenticate, validate(schemas.createTransaction), txCtrl.createExpense);
router.post('/transactions/income', authenticate, validate(schemas.createIncome), txCtrl.createIncome);
router.put('/transactions/expense/:id', authenticate, txCtrl.updateExpense);
router.put('/transactions/income/:id', authenticate, txCtrl.updateIncome);
router.delete('/transactions/expense/:id', authenticate, txCtrl.deleteExpense);
router.delete('/transactions/income/:id', authenticate, txCtrl.deleteIncome);

// ---- Budget Routes ----
router.get('/budgets', authenticate, budgetCtrl.getAll);
router.get('/budgets/history', authenticate, budgetCtrl.getHistory);
router.get('/budgets/:id', authenticate, budgetCtrl.getById);
router.post('/budgets', authenticate, validate(schemas.createBudget), budgetCtrl.create);
router.put('/budgets/:id', authenticate, budgetCtrl.update);
router.delete('/budgets/:id', authenticate, budgetCtrl.delete);

// ---- Debt Routes ----
router.get('/debts', authenticate, debtCtrl.getAll);
router.get('/debts/summary', authenticate, debtCtrl.getSummary);
router.get('/debts/:id', authenticate, debtCtrl.getById);
router.post('/debts', authenticate, validate(schemas.createDebt), debtCtrl.create);
router.put('/debts/:id', authenticate, debtCtrl.update);
router.post('/debts/:id/payment', authenticate, validate(schemas.debtPayment), debtCtrl.recordPayment);
router.post('/debts/:id/cancel', authenticate, debtCtrl.cancel);

// ---- Reminder Routes ----
router.get('/reminders', authenticate, reminderCtrl.getAll);
router.get('/reminders/upcoming', authenticate, reminderCtrl.getUpcoming);
router.get('/reminders/:id', authenticate, reminderCtrl.getById);
router.post('/reminders', authenticate, validate(schemas.createReminder), reminderCtrl.create);
router.put('/reminders/:id', authenticate, reminderCtrl.update);
router.delete('/reminders/:id', authenticate, reminderCtrl.delete);

// ---- Saving Routes ----
router.get('/savings/goals', authenticate, savingCtrl.getGoals);
router.get('/savings/summary', authenticate, savingCtrl.getSummary);
router.get('/savings/transactions', authenticate, savingCtrl.getTransactions);
router.get('/savings/goals/:id', authenticate, savingCtrl.getGoalById);
router.post('/savings/goals', authenticate, validate(schemas.createSavingGoal), savingCtrl.createGoal);
router.put('/savings/goals/:id', authenticate, savingCtrl.updateGoal);
router.delete('/savings/goals/:id', authenticate, savingCtrl.deleteGoal);
router.post('/savings/transactions', authenticate, validate(schemas.savingTransaction), savingCtrl.createTransaction);

// ---- Analytics Routes ----
router.get('/analytics', authenticate, analyticsCtrl.getFull);
router.get('/analytics/summary', authenticate, analyticsCtrl.getSummary);
router.get('/analytics/trends', authenticate, analyticsCtrl.getTrends);
router.get('/analytics/daily', authenticate, analyticsCtrl.getDailySpending);
router.get('/analytics/categories', authenticate, analyticsCtrl.getCategoryBreakdown);

// ---- Notification Routes ----
router.get('/notifications', authenticate, notifCtrl.getAll);
router.get('/notifications/count', authenticate, notifCtrl.getUnreadCount);
router.put('/notifications/:id/read', authenticate, notifCtrl.markRead);
router.put('/notifications/read-all', authenticate, notifCtrl.markAllRead);
router.delete('/notifications/:id', authenticate, notifCtrl.delete);

// ---- AI Routes ----
router.get('/ai/insights', authenticate, aiCtrl.getInsights);
router.post('/ai/insights/generate', authenticate, aiCtrl.generateInsight);
router.post('/ai/ask', authenticate, aiCtrl.askQuestion);
router.get('/ai/budget-advisor', authenticate, aiCtrl.getBudgetAdvisor);
router.get('/ai/forecast', authenticate, aiCtrl.getForecast);

// ---- Category Routes ----
router.get('/categories', authenticate, catCtrl.getAll);
router.post('/categories', authenticate, validate(schemas.createCategory), catCtrl.create);
router.put('/categories/:id', authenticate, catCtrl.update);
router.delete('/categories/:id', authenticate, catCtrl.delete);

// ---- Search Route ----
router.get('/search', authenticate, asyncHandler(async (req, res) => {
  const { q } = req.query as { q?: string };
  if (!q) {
    res.json({ success: true, data: [] });
    return;
  }
  const authReq = req as import('../middlewares/auth').AuthRequest;
  const results = searchService.search(authReq.userId!, q);
  res.json({ success: true, data: results });
}));

// ---- Dashboard Route ----
router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  const authReq = req as import('../middlewares/auth').AuthRequest;
  const userId = authReq.userId!;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const user = authService.getUserById(userId);
  const summary = analyticsEngine.getFinancialSummary(userId, month, year);
  const recentTxs = expenseEngine.getExpenses(userId, { limit: 5 });
  const budgets = budgetEngine.getCurrentMonthBudgets(userId);
  const notifications = notificationEngine.getNotifications(userId, true).slice(0, 5);
  const upcomingReminders = reminderEngine.getUpcomingReminders(userId, 7);
  const savingGoals = savingEngine.getGoals(userId).filter((g) => !g.isCompleted).slice(0, 3);
  const categoryBreakdown = analyticsEngine.getCategoryBreakdown(userId, month, year);
  const cashFlowTrend = {
    income: analyticsEngine.getIncomeTrend(userId, 6),
    expense: analyticsEngine.getExpenseTrend(userId, 6),
  };

  const enrichedTxs = recentTxs.map((t) => {
    const cat = db.findById('categories', t.categoryId);
    return { ...t, categoryName: cat?.name, categoryIcon: cat?.icon };
  });

  const enrichedBudgets = budgets.map((b) => {
    const cat = db.findById('categories', b.categoryId);
    const progress = budgetEngine.getBudgetProgress(b);
    return { ...b, categoryName: cat?.name, categoryIcon: cat?.icon, ...progress };
  });

  res.json({
    success: true,
    data: {
      user,
      summary,
      recentTransactions: enrichedTxs,
      budgets: enrichedBudgets,
      notifications,
      upcomingReminders,
      savingGoals,
      categoryBreakdown: categoryBreakdown.slice(0, 5),
      cashFlowTrend,
    },
  });
}));

export default router;
export { db, authService, expenseEngine, incomeEngine, budgetEngine, debtEngine, reminderEngine, savingEngine, notificationEngine, aiEngine, contextService };

// Bot instance — di-set dari index.ts setelah bot diinisialisasi
let _botInstance: import('../bot/TelegramBot').TelegramBot | null = null;
export function setBotInstance(bot: import('../bot/TelegramBot').TelegramBot) {
  _botInstance = bot;
}
export function getBotInstance() {
  return _botInstance;
}
