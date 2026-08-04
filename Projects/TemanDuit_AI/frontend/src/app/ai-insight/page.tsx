'use client';
import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Send, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { aiApi, type AIInsight } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AIInsightPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [forecast, setForecast] = useState<string>('');
  const [budgetAdvice, setBudgetAdvice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [askLoading, setAskLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [activeInsight, setActiveInsight] = useState<AIInsight | null>(null);

  const fetchData = async () => {
    try {
      const res = await aiApi.getInsights();
      setInsights(res.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await aiApi.generateInsight();
      if (res.data) {
        setInsights((prev) => [res.data!, ...prev]);
        setActiveInsight(res.data!);
        toast.success('Insight berhasil dibuat!');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat insight');
    } finally {
      setGenerating(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAskLoading(true);
    try {
      const res = await aiApi.ask(question);
      setAnswer(res.data?.answer || '');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mendapatkan jawaban');
    } finally {
      setAskLoading(false);
    }
  };

  const handleForecast = async () => {
    setForecastLoading(true);
    try {
      const [forecastRes, adviceRes] = await Promise.all([
        aiApi.getForecast(),
        aiApi.getBudgetAdvisor(),
      ]);
      setForecast(forecastRes.data?.forecast || '');
      setBudgetAdvice(adviceRes.data?.advice || '');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat forecast');
    } finally {
      setForecastLoading(false);
    }
  };

  if (loading) return <AppLayout><PageLoading /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="AI Insight"
        description="Analisis keuangan dan rekomendasi berbasis AI"
        action={
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Menganalisis...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Generate Insight</>
            )}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Insight List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Riwayat Insight</h3>
          {insights.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-8 w-8 text-muted-foreground" />}
              title="Belum Ada Insight"
              description="Klik Generate untuk mendapatkan analisis AI"
            />
          ) : (
            insights.map((ins) => (
              <motion.div key={ins.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card
                  className={`cursor-pointer hover:shadow-md transition-all ${activeInsight?.id === ins.id ? 'border-primary shadow-md' : ''}`}
                  onClick={() => setActiveInsight(ins)}
                >
                  <CardContent className="p-4">
                    <p className="font-medium text-sm line-clamp-2">{ins.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ins.period} • {formatDate(ins.createdAt)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Right: Detail + Q&A + Forecast */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Insight Detail */}
          {activeInsight ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={activeInsight.id}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{activeInsight.title}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">{activeInsight.period} • {formatDate(activeInsight.createdAt)}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeInsight.content}</p>
                  {activeInsight.recommendations.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" /> Rekomendasi
                      </h4>
                      <ul className="space-y-2">
                        {activeInsight.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Pilih insight dari daftar atau generate yang baru</p>
              </CardContent>
            </Card>
          )}

          {/* Ask AI */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span>🤔</span> Tanya AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Bulan ini aku boros gak? Saldo cukup sampai gajian?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  disabled={askLoading}
                />
                <Button onClick={handleAsk} disabled={askLoading || !question.trim()} size="icon">
                  {askLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {/* Quick questions */}
              <div className="flex flex-wrap gap-2">
                {['Bulan ini aku boros gak?', 'Pengeluaran terbesar apa?', 'Saldo cukup sampai gajian?'].map((q) => (
                  <button key={q} onClick={() => setQuestion(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent transition-colors">
                    {q}
                  </button>
                ))}
              </div>
              {answer && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap">
                  <p className="font-medium mb-2 text-primary">🤖 AI menjawab:</p>
                  {answer}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Forecast & Budget Advisor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Forecast & Budget Advisor
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleForecast} disabled={forecastLoading}>
                  {forecastLoading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!forecast && !budgetAdvice && (
                <p className="text-sm text-muted-foreground text-center py-4">Klik Refresh untuk mendapatkan forecast keuangan</p>
              )}
              {forecast && (
                <div>
                  <Badge variant="secondary" className="mb-2">📈 Forecast Bulan Depan</Badge>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{forecast}</p>
                </div>
              )}
              {budgetAdvice && (
                <div>
                  <Separator className="my-3" />
                  <Badge variant="secondary" className="mb-2">💡 Budget Advisor</Badge>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{budgetAdvice}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
