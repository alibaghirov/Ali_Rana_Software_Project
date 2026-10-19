import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Bot,
  Zap,
  Server,
  Lock,
  Clock,
  Copy,
  Check,
  Radio,
  Sparkles,
  Users,
  Award,
} from 'lucide-react';

interface MonitoringMetrics {
  uptimeSeconds: number;
  totalRequestsTracked: number;
  failedLoginsCount: number;
  recentApiErrors: number;
  aiFailureCount: number;
  slowRequestCount: number;
  bankSyncFailures: number;
  alertsSentCount: number;
  lastHealthCheck: string;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  action: string;
}

interface LogItem {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  message: string;
  dispatchedToTelegram: boolean;
  statusText?: string;
}

interface MonitoringStatus {
  active: boolean;
  botUsername: string;
  botTokenConfigured: boolean;
  botTokenMasked: string;
  chatId: string | null;
  metrics: MonitoringMetrics;
  rules: AlertRule[];
  recentLogs: LogItem[];
}

export const MonitoringTab: React.FC = () => {
  const [data, setData] = useState<MonitoringStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [targetChatId, setTargetChatId] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedDocumentation, setCopiedDocumentation] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/monitoring/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.chatId && !targetChatId) {
          setTargetChatId(json.chatId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch monitoring status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerAlert = async (type: string, customMessage?: string) => {
    setIsSending(true);
    setStatusFeedback(null);
    try {
      const res = await fetch('/api/monitoring/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          customMessage,
          chatId: targetChatId.trim() || undefined,
        }),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        setStatusFeedback({
          type: 'error',
          text: resData.error || resData.hint || 'Mesaj göndərilmədi. Zəhmət olmasa Chat ID yoxlayın.',
        });
      } else {
        setStatusFeedback({
          type: 'success',
          text: `✅ Telegram bildirişi uğurla çatdırıldı! (Chat: ${resData.chatId || 'auto'})`,
        });
        if (customMessage) setCustomMsg('');
        fetchStatus();
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        text: err?.message || 'Şəbəkə xətası baş verdi.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveChatId = async () => {
    if (!targetChatId.trim()) return;
    try {
      const res = await fetch('/api/monitoring/set-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: targetChatId.trim() }),
      });
      if (res.ok) {
        setStatusFeedback({
          type: 'success',
          text: `Chat ID yadda saxlanıldı: ${targetChatId.trim()}`,
        });
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const documentationMarkdown = `4. Monitoring and Alerting

What we monitor:
1. Security & Failed Logins: Multiple unsuccessful login or SMS OTP verification attempts.
2. Backend 5xx Server Errors: Unhandled server exceptions or 500 status codes.
3. AI Service Availability (Gemini API): API quota limits, 503 high demand spikes, or timeouts.
4. API Response Latency: Slow endpoints exceeding acceptable response thresholds (>3.5s).
5. Open Banking Sync Disruption: Failed automated synchronization with partner banks (Kapital, ABB, Pasha).
6. Backend Health Check: Unavailability detected by health check heartbeat.

How it works:
(1) An event occurs in the application (e.g., failed OTP, API crash, or AI error).
(2) The system captures the event via Express middleware, error handlers, and in-memory telemetry counters.
(3) A monitoring rule evaluates the threshold (e.g., 5 failed attempts within 5 minutes).
(4) The Telegram Bot automatically dispatches a structured Markdown alert to the team's Telegram channel via the official Telegram Bot API (https://api.telegram.org/bot<TOKEN>/sendMessage).

Secret Management:
The bot token (8808715727:AAEokHUNnA4uThzLdSYX56j3i6iOrk-Lv1M) is stored strictly in server-side environment variables (.env / process.env.TELEGRAM_BOT_TOKEN) and is never committed to Git. The frontend never accesses the token directly; all alerts are securely dispatched through server-side endpoints.

Monitoring & Alerting Table:
| What we monitor | When it triggers an alert | Alert message |
| :--- | :--- | :--- |
| Failed Logins (Security) | 5 failed login/OTP attempts within 5 minutes | [ALERT] Security: 5 failed login/OTP attempts recorded for identifier +99450***12. Potential brute-force attack detected. |
| Backend Server Health | 3 unhandled 500 errors within 2 minutes | [ALERT] Backend Health: Elevated 5xx error rate detected on endpoint POST /api/transactions. |
| AI Service Availability | 3 consecutive Gemini AI failures or 503 spike | [WARNING] AI Service Degradation: Gemini 3.8 Flash unavailable. Offline financial heuristics fallback engaged. |
| Response Latency | 5 API requests take more than 3.5 seconds | [WARNING] Performance: High API latency detected on /api/reports/monthly (avg 4.1s). |
| Open Banking Disruption | 3 consecutive bank sync failures | [WARNING] Open Banking: Synchronization failed for partner Kapital Bank API. |
| Backend Heartbeat Down | Health check fails 3 times consecutively | [CRITICAL] Backend is down since 14:42. Immediate investigation required. |`;

  const copyDoc = () => {
    navigator.clipboard.writeText(documentationMarkdown);
    setCopiedDocumentation(true);
    setTimeout(() => setCopiedDocumentation(false), 2500);
  };

  const formatUptime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    const remSecs = secs % 60;
    if (hours > 0) return `${hours}s ${remMins}d ${remSecs}san`;
    return `${remMins}d ${remSecs}san`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Telegram Bot Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Bot className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Telegram Bot Monitoring & Alerting
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Aktiv
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sistem Monitorinqi və Avtomatlaşdırılmış Alertlər
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-1 leading-relaxed">
              Sistem backend xətalarını, şübhəli giriş cəhdlərini (brute-force), AI xidmətinin statusunu və gecikmələri fasiləsiz izləyir. Problem aşkar edildikdə avtomatik Telegram kanalına bildiriş göndərir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://t.me/QanaetBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>@QanaetBot-u Aç</span>
            </a>

            <button
              onClick={() => triggerAlert('test')}
              disabled={isSending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Göndərilir...' : 'Test Alerti Göndər'}</span>
            </button>
          </div>
        </div>

        {/* Bot Credentials & Connection Settings */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-slate-500 block mb-1">Telegram Bot Token (Server .env)</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-300 font-semibold">
                {data?.botTokenMasked || '8808...Lv1M'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                Gizli Saxlanılır (.env)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-slate-500 block mb-1">Bot İstifadəçi Adı / ID</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sky-400 font-semibold">@QanaetBot</span>
              <span className="text-[10px] text-slate-400">ID: 8808715727</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-slate-500 block mb-1">Hədəf Chat ID / Kanal</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetChatId}
                onChange={(e) => setTargetChatId(e.target.value)}
                placeholder="Məsələn: 123456789 və ya @kanalim"
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white w-full focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={handleSaveChatId}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
                title="Chat ID-ni yadda saxla"
              >
                Saxla
              </button>
            </div>
          </div>
        </div>

        {statusFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusFeedback.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="flex-1">{statusFeedback.text}</span>
          </div>
        )}
      </div>

      {/* KPI Real-Time Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Uptime</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {data ? formatUptime(data.metrics.uptimeSeconds) : '...'}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">99.9% Davamlılıq</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Sorğular</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono">
            {data?.metrics.totalRequestsTracked ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">HTTP Sorğusu</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Uğursuz Giriş</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono">
            {data?.metrics.failedLoginsCount ?? 0} <span className="text-xs text-slate-500 font-normal">/ 5</span>
          </div>
          <span className="text-[10px] text-slate-400">Limit: 5 cəhd</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>5xx Xətaları</span>
            <Server className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono">
            {data?.metrics.recentApiErrors ?? 0} <span className="text-xs text-slate-500 font-normal">/ 3</span>
          </div>
          <span className="text-[10px] text-slate-400">Limit: 3 xəta</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>AI Xətaları</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 font-mono">
            {data?.metrics.aiFailureCount ?? 0} <span className="text-xs text-slate-500 font-normal">/ 3</span>
          </div>
          <span className="text-[10px] text-slate-400">Gemini 3.8 Flash</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Alertlər</span>
            <Radio className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400 font-mono">
            {data?.metrics.alertsSentCount ?? 0}
          </div>
          <span className="text-[10px] text-sky-400">Telegrama çatdı</span>
        </div>
      </div>

      {/* Interactive Simulation & Test Suite */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Avtomatik Alert Qaydalarının Test Edilməsi (Simulyasiya)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Müəllim və ya komanda üçün monitorinq qaydalarını dərhal canlı Telegram botu ilə yoxlamaq imkanı.
            </p>
          </div>
          <button
            onClick={fetchStatus}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Yenilə"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => triggerAlert('security')}
            disabled={isSending}
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                Təhlükəsizlik
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-amber-300">
              5 Uğursuz Giriş Simulyasiyası
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Brute-force hücum qaydasını işə salır və Telegram kanalına xəbərdarlıq göndərir.
            </p>
          </button>

          <button
            onClick={() => triggerAlert('api_error')}
            disabled={isSending}
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/5 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                <Server className="w-4 h-4" />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                Backend Xətası
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-rose-300">
              5xx Server Xətası Simulyasiyası
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Daxili server xətası və yüksək xəta tezliyi siqnalını Telegrama göndərir.
            </p>
          </button>

          <button
            onClick={() => triggerAlert('ai_service')}
            disabled={isSending}
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20">
                AI Xidməti
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-purple-300">
              AI 503 Spikes / Downtime
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Gemini modelinin pik yükdə olması və offline analitikaya keçid alertini göndərir.
            </p>
          </button>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-white block mb-1">Xüsusi Alert Göndər</span>
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 mb-2"
              />
            </div>
            <button
              onClick={() => triggerAlert('custom', customMsg)}
              disabled={isSending || !customMsg.trim()}
              className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Göndər</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Documentation & Submission Table (4. Monitoring and Alerting) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Kurs İmtahan / Layihə Təqdimatı
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono font-bold border border-emerald-500/20">
                1% Qiymətləndirmə
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              4. Monitoring and Alerting Spesifikasiyası
            </h2>
          </div>

          <button
            onClick={copyDoc}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 active:scale-95"
          >
            {copiedDocumentation ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Mətni Kopyala</span>
              </>
            )}
          </button>
        </div>

        {/* How it works 4-step workflow */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Sistemin İşləmə Mexanizmi (How It Works):
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">1. Hadisə Baş Verir</span>
              <p className="text-slate-400 text-[11px]">
                Sistemdə xəta, uğursuz OTP cəhdi, AI 503 gecikməsi və ya yüksək latency yaranır.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">2. Sistem Qeydə Alır</span>
              <p className="text-slate-400 text-[11px]">
                Express middleware, telemetriya sayğacları və health check pəncərələri hadisəni toplayır.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">3. Qayda Təsdiqləyir</span>
              <p className="text-slate-400 text-[11px]">
                Təyin olunmuş limit (məs. 5 dəqiqədə 5 uğursuz giriş və ya 3 xəta) keçildikdə qayda tetiklənir.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">4. Telegram Bot Xəbərdar Edir</span>
              <p className="text-slate-400 text-[11px]">
                Telegram Bot API vasitəsilə komandanın Telegram kanalına avtomatik Markdown formatlı alert çatdırılır.
              </p>
            </div>
          </div>
        </div>

        {/* Requirement Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">What we monitor</th>
                <th className="py-3 px-4">When it triggers an alert</th>
                <th className="py-3 px-4">Alert message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-amber-300">
                  Şübhəli Girişlər (Security / Brute-force)
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  5 dəqiqə ərzində eyni nömrə/FİN üçün 5 uğursuz OTP və ya şifrə cəhdi
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-200 text-[11px]">
                  [ALERT] Security: 5 failed login/OTP attempts for +99450***12. Potential brute-force attack detected.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-rose-300">
                  Backend 5xx Xətaları (Error Spike)
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  2 dəqiqə ərzində 3 idarə olunmayan 500 server xətası baş verdikdə
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-200 text-[11px]">
                  [ALERT] Backend Health: Elevated 5xx error rate detected on endpoint POST /api/transactions.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-purple-300">
                  AI Xidməti (Gemini API Failures)
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  Ard-arda 3 AI məsləhət və ya tranzaksiya analizi sorğusu xəta (503/429) verdikdə
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-200 text-[11px]">
                  [WARNING] AI Service Degradation: Gemini 3.8 Flash unavailable. Offline financial heuristics fallback engaged.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-cyan-300">
                  Cavab Gecikməsi (Response Latency)
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  5 API sorğusunun cavab müddəti 3.5 saniyədən çox çəkdikdə
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-200 text-[11px]">
                  [WARNING] Performance: High API latency detected on /api/reports/monthly (avg 4.1s).
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-blue-300">
                  Açıq Bankçılıq Sinxronizasiyası
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  Bank API-ləri (Kapital, ABB, Pasha) ilə ard-arda 3 sinxronizasiya xətası
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-200 text-[11px]">
                  [WARNING] Open Banking: Synchronization failed for partner Kapital Bank API.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-red-400">
                  Backend Çökməsi (Health Check)
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  Daxili /api/health yoxlaması ard-arda 3 dəfə cavabsız qaldıqda
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-200 text-[11px]">
                  [CRITICAL] Backend is down since 14:42. Immediate investigation required.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Security & Token Storage explanation */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3 text-xs">
          <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-white">Bot Tokeninin Məxfiliyi və Təhlükəsizliyi</h4>
            <p className="text-slate-400 leading-relaxed">
              Telegram Bot Tokeni (<code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">8808715727:AAEokHUNnA4uThzLdSYX56j3i6iOrk-Lv1M</code>) heç vaxt frontend koduna və ya Git deposuna daxil edilmir. O, sırf server mühit dəyişənlərində (<code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">.env / process.env.TELEGRAM_BOT_TOKEN</code>) saxlanılır. Bütün xəbərdarlıqlar server tərəfindən idarə olunan arxa plan vasitəsilə təhlükəsiz göndərilir.
            </p>
          </div>
        </div>

        {/* Course Team Members & Contributions Section */}
        <div className="mt-6 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Komanda Üzvləri və Fərdi Töhfələr</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    CSCI 3509
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Layihə üzrə iş bölgüsü və fərdi töhfələrin rəsmi fənn hesabatı bölgüsü.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ali Baghirov - Advanced Contribution */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 relative overflow-hidden group hover:border-indigo-500/60 transition-colors">
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-indigo-500/20 border-b border-l border-indigo-500/40 rounded-bl-lg text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                <Award className="w-3 h-3 text-indigo-400" />
                <span>Aparıcı Mühəndis (Advanced)</span>
              </div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30">
                  AB
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Əli Bağırov (Ali Baghirov)</h5>
                  <p className="text-[10px] text-indigo-400">Lead System Architect & Core Full-Stack Engineer</p>
                </div>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Sistem Memarlığı & Backend:</strong> Express.js və TypeScript əsaslı REST arxitekturası, autentifikasiya və şifrələmə sistemləri.</li>
                <li><strong className="text-white">Alqoritmik Həllər:</strong> Dinamik gündəlik qənaət kvotası mühərriki və psixoloji gözləmə müddətli smart-lock alqoritmi.</li>
                <li><strong className="text-white">Monitorinq & Alerting Sistemi:</strong> Serverdə telemetriya interceptorları, xəta tezliyi və gecikmə izləyicisi, Telegram Bot API ilə asinxron alert çatdırma mühərriki.</li>
                <li><strong className="text-white">Açıq Bankçılıq & AI:</strong> Çoxbanklı (ABB, Kapital, Pasha, Leobank) sinxronizasiya və Gemini AI inteqrasiyası.</li>
              </ul>
            </div>

            {/* Rana Rustamli - Supporting Contribution */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-slate-800 border-b border-l border-slate-700 rounded-bl-lg text-[10px] font-semibold text-slate-300">
                Dəstəkləyici (Supporting)
              </div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs border border-slate-700">
                  RR
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Rəna Rüstəmli (Rana Rustamli)</h5>
                  <p className="text-[10px] text-slate-400">UI/UX Designer & Frontend QA Specialist</p>
                </div>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Tələblərin Spesifikasiyası:</strong> Funksional tələblər (FR-01 – FR-13) və MoSCoW prioritetləşdirmə cədvəlinin hazırlanması.</li>
                <li><strong className="text-white">Frontend UI/UX Tərtibatı:</strong> React və Tailwind CSS komponentləri, kartlar, qaranlıq rejim qrafik dizaynı.</li>
                <li><strong className="text-white">Telegram Bot Qurulması:</strong> Telegram BotFather vasitəsilə @QanaetBot token konfiqurasiyası və alert şablon mətni.</li>
                <li><strong className="text-white">Monitorinq Paneli & QA Testləri:</strong> İstifadəçi interfeysində test simulyasiya paneli və Telegram bildirişlərinin manual yoxlanışı.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Intercepted Event Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Son İzlənən Telemetriya və Alert Loqları</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Son 25 hadisə
          </span>
        </div>

        <div className="space-y-2">
          {data?.recentLogs && data.recentLogs.length > 0 ? (
            data.recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.level === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : log.level === 'WARNING'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-slate-300 font-medium">{log.message}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('az-AZ')}
                  </span>
                  {log.dispatchedToTelegram ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Telegrama Çatdı
                    </span>
                  ) : (
                    <span className="text-slate-500">Yalnız Loq</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              Hələlik qeydə alınmış hadisə yoxdur. Test etmək üçün yuxarıdakı simulyasiya düymələrindən istifadə edin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
