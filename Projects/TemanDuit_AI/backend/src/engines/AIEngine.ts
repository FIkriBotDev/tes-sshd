import OpenAI from 'openai';
import { z } from 'zod';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { AIParsedData, AIContext } from '../types';

// ============================================================
// AIEngine - Pollinations AI Integration
// ONLY responsible for: NL understanding, JSON parsing, insights
// All business logic stays in backend engines
// ============================================================

const client = new OpenAI({
  apiKey: config.pollinations.apiKey,
  baseURL: 'https://text.pollinations.ai/openai',
});

// ---- Zod Schemas for AI output validation ----

const ExpenseSchema = z.object({
  action: z.literal('expense'),
  amount: z.number().positive(),
  category: z.string(),
  description: z.string(),
  note: z.string().optional(),
  date: z.string().optional(),
});

const IncomeSchema = z.object({
  action: z.literal('income'),
  amount: z.number().positive(),
  source: z.enum(['salary', 'bonus', 'freelance', 'thr', 'refund', 'gift', 'business', 'other']),
  description: z.string(),
  note: z.string().optional(),
  date: z.string().optional(),
});

const DebtSchema = z.object({
  action: z.enum(['debt', 'receivable', 'installment']),
  counterpartyName: z.string(),
  amount: z.number().positive(),
  description: z.string(),
  dueDate: z.string().optional(),
});

const ReminderSchema = z.object({
  action: z.literal('reminder'),
  title: z.string(),
  description: z.string().optional(),
  amount: z.number().optional(),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']),
  dueDate: z.string(),
  type: z.enum(['bill', 'debt', 'installment', 'budget', 'saving', 'custom']),
});

const SavingSchema = z.object({
  action: z.literal('saving'),
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.number().positive(),
  description: z.string(),
  goalName: z.string().optional(),
});

const QuestionSchema = z.object({
  action: z.literal('question'),
  question: z.string(),
});

const AIParsedDataSchema = z.discriminatedUnion('action', [
  ExpenseSchema,
  IncomeSchema,
  DebtSchema,
  ReminderSchema,
  SavingSchema,
  QuestionSchema,
]);

// ---- System prompts ----

const PARSE_SYSTEM_PROMPT = `Kamu adalah AI assistant untuk aplikasi keuangan bernama TemanDuit.

Tugasmu HANYA:
1. Memahami pesan bahasa alami pengguna (Bahasa Indonesia/Inggris/campur)
2. Mengubah pesan menjadi JSON terstruktur

ATURAN PENTING:
- Jangan pernah melakukan perhitungan saldo
- Jangan pernah mengakses database
- Jangan pernah menjalankan business logic
- Hanya parse intent dan return JSON

KATEGORI VALID untuk expense:
makanan, minuman, transport, belanja, tagihan, internet, pulsa, kesehatan, pendidikan, hiburan, bisnis, investasi, donasi, pajak, lainnya

FORMAT RESPONSE:
Selalu return JSON valid, tidak ada teks lain.

Contoh input → output:

"gw habis beli bakso 15 ribu" →
{"action":"expense","amount":15000,"category":"makanan","description":"bakso"}

"isi bensin 50rb" →
{"action":"expense","amount":50000,"category":"transport","description":"bensin"}

"gajian 5 juta" →
{"action":"income","amount":5000000,"source":"salary","description":"gaji bulanan"}

"bayar listrik 200 ribu" →
{"action":"expense","amount":200000,"category":"tagihan","description":"tagihan listrik"}

"hutang ke budi 100k" →
{"action":"debt","counterpartyName":"budi","amount":100000,"description":"hutang ke budi"}

"tabung 500 ribu" →
{"action":"saving","type":"deposit","amount":500000,"description":"menabung"}

"bulan ini aku boros gak?" →
{"action":"question","question":"bulan ini aku boros gak?"}

Jika tidak yakin, gunakan action "question".
`;

const INSIGHT_SYSTEM_PROMPT = `Kamu adalah AI Financial Advisor untuk TemanDuit.

Tugasmu:
1. Analisis kondisi keuangan user berdasarkan data yang diberikan
2. Berikan insight yang personal, actionable, dan motivatif
3. Gunakan bahasa Indonesia yang ramah dan mudah dipahami
4. Fokus pada pola pengeluaran, peluang hemat, dan saran praktis

ATURAN:
- Jangan melakukan perhitungan sendiri, gunakan data yang sudah diberikan
- Selalu berikan minimal 3 rekomendasi konkret
- Gunakan emoji untuk membuat response lebih menarik
- Maksimal 300 kata per insight
`;

export class AIEngine {
  private static readonly MAX_RETRIES = 2;

  async parseUserMessage(message: string): Promise<AIParsedData> {
    for (let attempt = 0; attempt <= AIEngine.MAX_RETRIES; attempt++) {
      try {
        const response = await client.chat.completions.create({
          model: config.pollinations.model,
          messages: [
            { role: 'system', content: PARSE_SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
          temperature: 0.1,
          max_tokens: 500,
        });

        const raw = response.choices[0]?.message?.content?.trim() || '';
        logger.debug('[AI] Raw response', { raw });

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        const jsonStr = jsonMatch[1]?.trim() || raw;

        const parsed = JSON.parse(jsonStr);
        const validated = AIParsedDataSchema.parse(parsed);
        return validated;
      } catch (err) {
        logger.warn(`[AI] Parse attempt ${attempt + 1} failed`, { error: err, message });
        if (attempt === AIEngine.MAX_RETRIES) {
          // Fallback: treat as question
          return { action: 'question', question: message };
        }
      }
    }
    return { action: 'question', question: message };
  }

  async generateInsight(context: AIContext): Promise<{ title: string; content: string; recommendations: string[] }> {
    try {
      const contextStr = JSON.stringify(context, null, 2);
      const response = await client.chat.completions.create({
        model: config.pollinations.model,
        messages: [
          { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Berikan insight keuangan untuk user ini berdasarkan data berikut:\n\n${contextStr}\n\nReturn dalam format JSON:\n{"title":"...","content":"...","recommendations":["...","...","..."]}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const raw = response.choices[0]?.message?.content?.trim() || '';
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      const jsonStr = jsonMatch[1]?.trim() || raw;
      const parsed = JSON.parse(jsonStr);

      return {
        title: parsed.title || 'Insight Keuangan',
        content: parsed.content || '',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    } catch (err) {
      logger.error('[AI] generateInsight failed', { error: err });
      return {
        title: 'Insight Keuangan',
        content: 'Maaf, tidak bisa menghasilkan insight saat ini.',
        recommendations: [],
      };
    }
  }

  async answerQuestion(question: string, context: AIContext): Promise<string> {
    try {
      const contextStr = JSON.stringify(context, null, 2);
      const response = await client.chat.completions.create({
        model: config.pollinations.model,
        messages: [
          { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Data keuangan user:\n${contextStr}\n\nPertanyaan user: "${question}"\n\nJawab dengan bahasa yang ramah dan informatif dalam Bahasa Indonesia.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      });

      return response.choices[0]?.message?.content?.trim() || 'Maaf, tidak bisa menjawab saat ini.';
    } catch (err) {
      logger.error('[AI] answerQuestion failed', { error: err });
      return 'Maaf, AI sedang tidak tersedia. Coba lagi nanti ya! 🙏';
    }
  }

  async generateBudgetAdvisor(context: AIContext): Promise<string> {
    try {
      const response = await client.chat.completions.create({
        model: config.pollinations.model,
        messages: [
          { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Data keuangan:\n${JSON.stringify(context, null, 2)}\n\nBerikan saran budget yang optimal untuk bulan depan berdasarkan pola pengeluaran user. Gunakan aturan 50/30/20 atau yang lebih sesuai.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      });

      return response.choices[0]?.message?.content?.trim() || 'Tidak bisa menghasilkan saran budget.';
    } catch (err) {
      logger.error('[AI] generateBudgetAdvisor failed', { error: err });
      return 'Maaf, saran budget tidak tersedia saat ini.';
    }
  }

  async generateForecast(context: AIContext): Promise<string> {
    try {
      const response = await client.chat.completions.create({
        model: config.pollinations.model,
        messages: [
          { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Data keuangan:\n${JSON.stringify(context, null, 2)}\n\nBerikan perkiraan pengeluaran bulan depan berdasarkan tren saat ini. Sertakan potensi risiko dan rekomendasi.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 600,
      });

      return response.choices[0]?.message?.content?.trim() || 'Tidak bisa menghasilkan forecast.';
    } catch (err) {
      logger.error('[AI] generateForecast failed', { error: err });
      return 'Maaf, forecast tidak tersedia saat ini.';
    }
  }

  async formatTransactionReply(
    action: string,
    amount: number,
    description: string,
    balanceAfter: number,
    insight?: string,
  ): Promise<string> {
    const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const balance = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(balanceAfter);

    let emoji = '💸';
    let actionText = 'Pengeluaran';
    if (action === 'income') { emoji = '💰'; actionText = 'Pemasukan'; }
    if (action === 'saving') { emoji = '🏦'; actionText = 'Tabungan'; }
    if (action === 'debt') { emoji = '📋'; actionText = 'Hutang'; }

    let msg = `${emoji} *${actionText} Tercatat!*\n\n`;
    msg += `📝 ${description}\n`;
    msg += `💵 ${formatted}\n`;
    msg += `💳 Saldo: ${balance}\n`;
    if (insight) msg += `\n💡 _${insight}_`;

    return msg;
  }
}

export const aiEngine = new AIEngine();
