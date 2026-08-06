const USER_ID = "2514b76d-288e-4108-b120-404cb0b4fe5c";
const TELEGRAM_ID = "8084800390";

db.users = db.users.filter(u => u.id !== USER_ID);

db.registrationTokens = db.registrationTokens.filter(
  t => t.telegramId !== TELEGRAM_ID
);

db.loginCodes = db.loginCodes.filter(
  c => c.userId !== USER_ID
);

db.categories = db.categories.filter(
  c => c.userId !== USER_ID
);

db.transactions = db.transactions.filter(
  t => t.userId !== USER_ID
);

db.budgets = db.budgets.filter(
  b => b.userId !== USER_ID
);

db.debts = db.debts.filter(
  d => d.userId !== USER_ID
);

db.debtPayments = db.debtPayments.filter(
  d => d.userId !== USER_ID
);

db.reminders = db.reminders.filter(
  r => r.userId !== USER_ID
);

db.savingGoals = db.savingGoals.filter(
  s => s.userId !== USER_ID
);

db.savingTransactions = db.savingTransactions.filter(
  s => s.userId !== USER_ID
);

db.notifications = db.notifications.filter(
  n => n.userId !== USER_ID
);

db.aiInsights = db.aiInsights.filter(
  a => a.userId !== USER_ID
);
