import axios from 'axios';
import { z } from 'zod';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { AIParsedData, AIContext } from '../types';

// ============================================================
// AIEngine - Pollinations AI Integration
// Menggunakan axios langsung ke https://gen.pollinations.ai/v1/chat/completions
// ============================================================

const API_URL = 'https://gen.pollinations.ai/v1/chat/completions';

async function pollinationsChat(
  messages: Array<{ role: string; content: string }>,
  maxTokens = 600,
): Promise<string> {
  const payload = {
    model: 'openai',
    messages,
  };

  const response = await axios.post(API_URL, payload, {
    headers: {
      Authorization: `Bearer ${config.pollinations.apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  return response.data?.choices?.[0]?.message?.content || '';
}

// ---- Zod Schemas untuk validasi output AI ----

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
- Hanya parse intent dan return JSON valid

KATEGORI VALID untuk expense:
makanan, minuman, transport, belanja, tagihan, internet, pulsa, kesehatan, pendidikan, hiburan, bisnis, investasi, donasi, pajak, lainnya

FORMAT RESPONSE: Hanya JSON valid, tidak ada teks lain.

Contoh:
"beli bakso 15 ribu" → {"action":"expense","amount":15000,"category":"makanan","description":"bakso"}
"isi bensin 50rb" → {"action":"expense","amount":50000,"category":"transport","description":"bensin"}
"gajian 5 juta" → {"action":"income","amount":5000000,"source":"salary","description":"gaji bulanan"}
"bayar listrik 200 ribu" → {"action":"expense","amount":200000,"category":"tagihan","description":"tagihan listrik"}
"hutang ke budi 100k" → {"action":"debt","counterpartyName":"budi","amount":100000,"description":"hutang ke budi"}
"tabung 500 ribu" → {"action":"saving","type":"deposit","amount":500000,"description":"menabung"}
"bulan ini aku boros gak?" → {"action":"question","question":"bulan ini aku boros gak?"}

Jika tidak yakin, gunakan action "question".`;

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
- Maksimal 300 kata per insight`;

export class AIEngine {
  private static readonly MAX_RETRIES = 2;

  async parseUserMessage(message: string): Promise<AIParsedData> {
    for (let attempt = 1; attempt <= AIEngine.MAX_RETRIES; attempt++) {
      try {
        const raw = await pollinationsChat([
          { role: 'system', content: PARSE_SYSTEM_PROMPT },
          { role: 'user', content: message },
        ]);

        logger.debug('[AI] Raw response', { raw });

        // Ekstrak JSON dari response (handle markdown code block)
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();

        const parsed = JSON.parse(jsonStr);
        const validated = AIParsedDataSchema.parse(parsed);
        return validated;
      } catch (err) {
        logger.warn(`[AI] Parse attempt ${attempt} failed ai nya belum bisa`, { error: err });
        if (attempt === AIEngine.MAX_RETRIES) {
          return { action: 'question', question: message };
        }
      }
    }
    return { action: 'question', question: message };
  }

  async generateInsight(
    context: AIContext,
  ): Promise<{ title: string; content: string; recommendations: string[] }> {
    try {
      const raw = await pollinationsChat([
        { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Berikan insight keuangan untuk user ini berdasarkan data berikut:\n\n` +
            `${JSON.stringify(context, null, 2)}\n\n` +
            `Return dalam format JSON:\n{"title":"...","content":"...","recommendations":["...","...","..."]}`,
        },
      ]);

      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
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
      const raw = await pollinationsChat([
        { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Data keuangan user:\n${JSON.stringify(context, null, 2)}\n\n` +
            `Pertanyaan user: "${question}"\n\n` +
            `Jawab dengan bahasa yang ramah dan informatif dalam Bahasa Indonesia.`,
        },
      ]);

      return raw.trim() || 'Maaf, tidak bisa menjawab saat ini.';
    } catch (err) {
      logger.error('[AI] answerQuestion failed', { error: err });
      return 'Maaf, AI sedang tidak tersedia. Coba lagi nanti ya! 🙏';
    }
  }

  async generateBudgetAdvisor(context: AIContext): Promise<string> {
    try {
      const raw = await pollinationsChat([
        { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Data keuangan:\n${JSON.stringify(context, null, 2)}\n\n` +
            `Berikan saran budget yang optimal untuk bulan depan berdasarkan pola pengeluaran user. Gunakan aturan 50/30/20 atau yang lebih sesuai.`,
        },
      ]);
      return raw.trim() || 'Tidak bisa menghasilkan saran budget.';
    } catch (err) {
      logger.error('[AI] generateBudgetAdvisor failed', { error: err });
      return 'Maaf, saran budget tidak tersedia saat ini.';
    }
  }

  async generateForecast(context: AIContext): Promise<string> {
    try {
      const raw = await pollinationsChat([
        { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Data keuangan:\n${JSON.stringify(context, null, 2)}\n\n` +
            `Berikan perkiraan pengeluaran bulan depan berdasarkan tren saat ini. Sertakan potensi risiko dan rekomendasi.`,
        },
      ]);
      return raw.trim() || 'Tidak bisa menghasilkan forecast.';
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
    const fmt = (n: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(n);

    let emoji = '💸';
    let actionText = 'Pengeluaran';
    if (action === 'income') { emoji = '💰'; actionText = 'Pemasukan'; }
    if (action === 'saving') { emoji = '🏦'; actionText = 'Tabungan'; }
    if (action === 'debt')   { emoji = '📋'; actionText = 'Hutang'; }

    let msg = `${emoji} *${actionText} Tercatat!*\n\n`;
    msg += `📝 ${description}\n`;
    msg += `💵 ${fmt(amount)}\n`;
    msg += `💳 Saldo: ${fmt(balanceAfter)}\n`;
    if (insight) msg += `\n💡 _${insight}_`;

    return msg;
  }
}

export const aiEngine = new AIEngine();
