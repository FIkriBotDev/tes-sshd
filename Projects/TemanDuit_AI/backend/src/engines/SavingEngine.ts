import { DatabaseManager } from '../database/DatabaseManager';
import { generateId, nowISO } from '../utils/helpers';
import { logger } from '../utils/logger';
import type { SavingGoal, SavingTransaction, AIParsedSaving } from '../types';

export class SavingEngine {
  constructor(private db: DatabaseManager) {}

  async recordSaving(userId: string, data: AIParsedSaving): Promise<SavingTransaction> {
    const user = this.db.findById('users', userId);
    if (!user) throw new Error('User not found');

    // Find goal if provided
    let goalId: string | undefined;
    if (data.goalName) {
      const goals = this.db.findWhere(
        'savingGoals',
        (g) => g.userId === userId && g.name.toLowerCase().includes(data.goalName!.toLowerCase()),
      ) as SavingGoal[];
      goalId = goals[0]?.id;
    }

    if (data.type === 'deposit') {
      if (user.balance < data.amount) throw new Error('Saldo tidak cukup');
      await this.db.update('users', userId, {
        balance: user.balance - data.amount,
        savingBalance: user.savingBalance + data.amount,
        updatedAt: nowISO(),
      });
    } else {
      if (user.savingBalance < data.amount) throw new Error('Saldo tabungan tidak cukup');
      await this.db.update('users', userId, {
        balance: user.balance + data.amount,
        savingBalance: user.savingBalance - data.amount,
        updatedAt: nowISO(),
      });
    }

    const savingTx: SavingTransaction = {
      id: generateId(),
      userId,
      goalId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      createdAt: nowISO(),
    };

    await this.db.create('savingTransactions', savingTx);

    // Update goal if linked
    if (goalId && data.type === 'deposit') {
      const goal = this.db.findById('savingGoals', goalId) as SavingGoal | undefined;
      if (goal) {
        const newAmount = goal.currentAmount + data.amount;
        const isCompleted = newAmount >= goal.targetAmount;
        await this.db.update('savingGoals', goalId, {
          currentAmount: newAmount,
          isCompleted,
          updatedAt: nowISO(),
        });
      }
    }

    logger.info('[Saving] Recorded', { userId, type: data.type, amount: data.amount });
    return savingTx;
  }

  async createGoal(
    userId: string,
    data: { name: string; targetAmount: number; deadline?: string },
  ): Promise<SavingGoal> {
    const goal: SavingGoal = {
      id: generateId(),
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      deadline: data.deadline,
      isCompleted: false,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    await this.db.create('savingGoals', goal);
    return goal;
  }

  async updateGoal(
    userId: string,
    goalId: string,
    updates: Partial<Pick<SavingGoal, 'name' | 'targetAmount' | 'deadline'>>,
  ): Promise<SavingGoal | null> {
    const goal = this.db.findById('savingGoals', goalId) as SavingGoal | undefined;
    if (!goal || goal.userId !== userId) return null;

    return this.db.update('savingGoals', goalId, { ...updates, updatedAt: nowISO() }) as Promise<SavingGoal | null>;
  }

  async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    const goal = this.db.findById('savingGoals', goalId) as SavingGoal | undefined;
    if (!goal || goal.userId !== userId) return false;
    return this.db.delete('savingGoals', goalId);
  }

  getGoals(userId: string): SavingGoal[] {
    return this.db.findWhere('savingGoals', (g) => g.userId === userId) as SavingGoal[];
  }

  getGoalById(userId: string, goalId: string): SavingGoal | null {
    const goal = this.db.findById('savingGoals', goalId) as SavingGoal | undefined;
    if (!goal || goal.userId !== userId) return null;
    return goal;
  }

  getSavingTransactions(userId: string, limit?: number): SavingTransaction[] {
    let txs = this.db.findWhere(
      'savingTransactions',
      (t) => t.userId === userId,
    ) as SavingTransaction[];

    txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (limit) txs = txs.slice(0, limit);
    return txs;
  }

  getTotalSaved(userId: string): number {
    return (this.db.findById('users', userId))?.savingBalance || 0;
  }
}
