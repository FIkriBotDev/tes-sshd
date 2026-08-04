import type { Response } from 'express';
import { AIEngine } from '../engines/AIEngine';
import { ContextService } from '../services/ContextService';
import { DatabaseManager } from '../database/DatabaseManager';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';
import { generateId, nowISO, getPeriodString } from '../utils/helpers';
import type { AIInsight } from '../types';

export class AIController {
  constructor(
    private aiEngine: AIEngine,
    private contextService: ContextService,
    private db: DatabaseManager,
  ) {}

  getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
    const insights = this.db.findWhere('aiInsights', (i) => i.userId === req.userId!)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: insights });
  });

  generateInsight = asyncHandler(async (req: AuthRequest, res: Response) => {
    const context = this.contextService.buildAIContext(req.userId!);
    const result = await this.aiEngine.generateInsight(context);

    const insight: AIInsight = {
      id: generateId(),
      userId: req.userId!,
      title: result.title,
      content: result.content,
      recommendations: result.recommendations,
      period: getPeriodString(),
      createdAt: nowISO(),
    };

    await this.db.create('aiInsights', insight);

    res.json({ success: true, data: insight });
  });

  askQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { question } = req.body;
    if (!question) {
      res.status(400).json({ success: false, error: 'Pertanyaan tidak boleh kosong' });
      return;
    }

    const context = this.contextService.buildAIContext(req.userId!);
    const answer = await this.aiEngine.answerQuestion(question, context);

    res.json({ success: true, data: { question, answer } });
  });

  getBudgetAdvisor = asyncHandler(async (req: AuthRequest, res: Response) => {
    const context = this.contextService.buildAIContext(req.userId!);
    const advice = await this.aiEngine.generateBudgetAdvisor(context);

    res.json({ success: true, data: { advice } });
  });

  getForecast = asyncHandler(async (req: AuthRequest, res: Response) => {
    const context = this.contextService.buildAIContext(req.userId!);
    const forecast = await this.aiEngine.generateForecast(context);

    res.json({ success: true, data: { forecast } });
  });
}
