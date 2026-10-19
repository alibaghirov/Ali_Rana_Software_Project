import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Zap,
  TrendingDown,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Brain,
  FileText,
  RotateCw,
} from 'lucide-react';
import type { Language } from '../i18n/translations.ts';
import { formatAZN } from '../utils/finance.ts';
import confetti from 'canvas-confetti';

interface AiAdvisorTabProps {
  language: Language;
  getHeaders: () => Record<string, string>;
  onTransactionAdded?: () => void;
  userBalance?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
}

export const AiAdvisorTab: React.FC<AiAdvisorTabProps> = ({
  language,
  getHeaders,
  onTransactionAdded,
  userBalance = 0,
  monthlyIncome = 0,
  monthlyExpenses = 0,
}) => {
  // Advisory state
  const [adviceText, setAdviceText] = useState<string>('');
  const [insights, setInsights] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(true);

  // Quick NL transaction parser state
  const [nlInput, setNlInput] = useState<string>('');
  const [isParsingNl, setIsParsingNl] = useState<boolean>(false);
  const [parsedTx, setParsedTx] = useState<any>(null);
  const [nlSuccessMessage, setNlSuccessMessage] = useState<string>('');
  const [nlError, setNlError] = useState<string>('');

  // Fetch initial AI advice
  const fetchAdvice = async (question?: string) => {
    setIsLoadingAdvice(true);
    try {
      const res = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error('AI məsləhətçidən cavab alına bilmədi.');
      const data = await res.json();
      setAdviceText(data.advice || '');
      setIsAiGenerated(Boolean(data.isAiGenerated));
      if (Array.isArray(data.insights)) setInsights(data.insights);
      if (Array.isArray(data.suggestedActions)) setActions(data.suggestedActions);
    } catch (err: any) {
      console.error(err);
      setAdviceText(
        'Süni intellekt serveri ilə əlaqə qurularkən müvəqqəti nasazlıq baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.'
      );
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isLoadingAdvice) return;
    fetchAdvice(customQuestion.trim());
    setCustomQuestion('');
  };

  // Quick natural language parse
  const handleParseNl = async () => {
    if (!nlInput.trim() || isParsingNl) return;
    setIsParsingNl(true);
    setNlError('');
    setNlSuccessMessage('');
    try {
      const res = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text: nlInput.trim() }),
      });
      if (!res.ok) throw new Error('Mətn təhlil edilə bilmədi.');
      const data = await res.json();
      setParsedTx(data.transaction);
    } catch (err: any) {
      setNlError(err.message || 'Xəta baş verdi');
    } finally {
      setIsParsingNl(false);
    }
  };

  // Quick log to database
  const handleQuickLog = async () => {
    if (!nlInput.trim() || isParsingNl) return;
    setIsParsingNl(true);
    setNlError('');
    setNlSuccessMessage('');
    try {
      const res = await fetch('/api/ai/quick-log', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text: nlInput.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Əməliyyatı daxil etmək mümkün olmadı.');
      }
      const data = await res.json();
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
      setNlSuccessMessage(
        `Uğurla qeyd edildi: ${data.transaction.description} (${formatAZN(data.transaction.amount)}) • +1 Streak!`
      );
      setNlInput('');
      setParsedTx(null);
      if (onTransactionAdded) onTransactionAdded();
    } catch (err: any) {
      setNlError(err.message || 'Xəta baş verdi.');
    } finally {
      setIsParsingNl(false);
    }
  };

  const quickQuestions = [
    'Bu ay necə 150 AZN qənaət edə bilərəm?',
    'Ən böyük xərclərimi necə optimallaşdıra bilərəm?',
    'Hədəflərimə vaxtında çatmaq üçün gündəlik büdcəm nə qədər olmalıdır?',
    'Büdcəmin 50/30/20 qaydasına uyğunluğunu yoxla',
  ];

  const quickSamples = [
    'Dünən Bravo marketdə 38.50 AZN kartla bazarlıq etdim',
    'Bolt taksiyə 4.80 AZN nağd ödədim',
    'Maaş kartıma 1250 AZN köçürüldü',
    'Trendyol-dan 65 AZN-lik geyim aldım',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 3.8 Flash • AI Məsləhətçi
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {isAiGenerated ? 'Süni İntellekt Aktivdir' : 'Ağıllı Analiz Mühərriki'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-3">
              Ağıllı Şəxsi Maliyyə & Yığım Analitikası
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Google Gemini süni intellekti sizin cari gəlir, xərc, kateqoriya vərdişləri və yığım
              hədəflərinizi fərdi şəkildə təhlil edərək praktiki qənaət yolları təklif edir.
            </p>
          </div>

          <button
            onClick={() => fetchAdvice()}
            disabled={isLoadingAdvice}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            <RotateCw className={`w-4 h-4 ${isLoadingAdvice ? 'animate-spin' : ''}`} />
            <span>{isLoadingAdvice ? 'Təhlil edilir...' : 'Yenidən Təhlil Et'}</span>
          </button>
        </div>

        {/* Financial Metrics Pill bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-500/20">
          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400">Ümumi Balans</span>
            <div className="text-lg font-black text-white mt-0.5">{formatAZN(userBalance)}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3 border border-slate-800">
            <span className="text-[11px] font-semibold text-emerald-400">Aylıq Gəlir</span>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{formatAZN(monthlyIncome)}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3 border border-slate-800">
            <span className="text-[11px] font-semibold text-rose-400">Aylıq Xərc</span>
            <div className="text-lg font-black text-rose-400 mt-0.5">{formatAZN(monthlyExpenses)}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3 border border-slate-800">
            <span className="text-[11px] font-semibold text-indigo-400">Xalis Saldo</span>
            <div className="text-lg font-black text-indigo-300 mt-0.5">
              {formatAZN(monthlyIncome - monthlyExpenses)}
            </div>
          </div>
        </div>
      </div>

      {/* Natural Language Transaction Input (AI Smart Quick-Add) */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Təbii Dildə Əməliyyat Qeydi (AI Quick Add)
            </h2>
            <p className="text-xs text-slate-400">
              Sərbəst cümlə yazın — Gemini məbləği, kateqoriyanı, ödəniş üsulunu və növü avtomatik
              təyin edəcək.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickLog();
              }}
              placeholder="məs: Dünən Bravo-da 45 AZN kartla bazarlıq etdim"
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
            <button
              onClick={handleQuickLog}
              disabled={isParsingNl || !nlInput.trim()}
              className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all shrink-0 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isParsingNl ? 'Təhlil edilir...' : 'AI ilə Qeyd Et'}</span>
            </button>
          </div>

          {/* Quick sample chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500 font-medium">Nümunələr:</span>
            {quickSamples.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNlInput(sample)}
                className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-700/60 transition-all"
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Messages */}
          {nlSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{nlSuccessMessage}</span>
            </div>
          )}
          {nlError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{nlError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Advisory Content & Q&A Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Financial Advice Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Süni İntellekt Maliyyə Təhlili</h3>
                  <p className="text-xs text-slate-400">
                    Büdcənizə əsaslanan xüsusi tövsiyələr və fəaliyyət planı
                  </p>
                </div>
              </div>
            </div>

            {isLoadingAdvice ? (
              <div className="py-16 text-center space-y-4">
                <div className="inline-block p-4 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-spin">
                  <RotateCw className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  Gemini AI gəlir, xərc və hədəflərinizi təhlil edir...
                </p>
                <p className="text-xs text-slate-500">
                  Azərbaycan bazarı və manat parametrləri nəzərə alınır
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Advice Body formatted nicely */}
                <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4 font-normal">
                  {adviceText.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h4
                          key={pIdx}
                          className="text-base font-black text-indigo-300 mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-2"
                        >
                          {paragraph.replace('### ', '')}
                        </h4>
                      );
                    }
                    if (paragraph.startsWith('* ')) {
                      const items = paragraph.split('\n');
                      return (
                        <ul key={pIdx} className="space-y-2 my-2">
                          {items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2 text-slate-300">
                              <span className="text-indigo-400 mt-1">•</span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: item.replace('* ', '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>'),
                                }}
                              />
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p
                        key={pIdx}
                        className="text-slate-300"
                        dangerouslySetInnerHTML={{
                          __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>'),
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Ask a Custom Financial Question */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI-a Xüsusi Sual Verin</h3>
            </div>

            <form onSubmit={handleAskQuestion} className="space-y-3">
              <textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Məsələn: Bu ay kirayə xərcimdən sonra 200 AZN necə artıq saxlaya bilərəm?"
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none"
              />
              <button
                type="submit"
                disabled={!customQuestion.trim() || isLoadingAdvice}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Sualı Göndər</span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Hazır suallar:
              </span>
              <div className="space-y-1.5">
                {quickQuestions.map((q, qIdx) => (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => fetchAdvice(q)}
                    className="w-full text-left text-xs bg-slate-950/60 hover:bg-indigo-950/50 hover:text-indigo-300 text-slate-300 p-2.5 rounded-xl border border-slate-800/80 transition-all flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{q}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Insights & Action Checklist */}
          {actions.length > 0 && (
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Tövsiyə Olunan Addımlar
                </h4>
              </div>
              <div className="space-y-2">
                {actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
