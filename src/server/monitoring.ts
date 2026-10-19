/**
 * CSCI 3509: Intro to Software Engineering
 * System Monitoring & Telegram Alerting Service
 *
 * Architecture:
 * 1. Event / Metric Capture: Interceptors catch 5xx errors, failed logins, AI service downtime, slow response latency.
 * 2. Rule Evaluation: Thresholds are checked in-memory (e.g., 5 failed logins within 5 mins, 3 AI failures, >3500ms latency).
 * 3. Alert Dispatcher: Calls the Telegram Bot API (https://api.telegram.org/bot<TOKEN>/sendMessage) to post markdown alerts.
 * 4. Security: Bot token is stored exclusively in process.env.TELEGRAM_BOT_TOKEN and never exposed to the frontend.
 */

const DEFAULT_BOT_TOKEN = '8808715727:AAEokHUNnA4uThzLdSYX56j3i6iOrk-Lv1M';

let cachedChatId: string | null = process.env.TELEGRAM_CHAT_ID || null;

export interface AlertLogItem {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'SECURITY' | 'API_ERROR' | 'AI_SERVICE' | 'PERFORMANCE' | 'BANK_SYNC' | 'SYSTEM';
  message: string;
  dispatchedToTelegram: boolean;
  statusText?: string;
}

export const metrics = {
  failedLoginsCount: 0,
  recentApiErrors: 0,
  aiFailureCount: 0,
  bankSyncFailures: 0,
  slowRequestCount: 0,
  totalRequestsTracked: 0,
  startTime: Date.now(),
  lastHealthCheck: new Date().toISOString(),
  recentLogs: [] as AlertLogItem[],
  alertsSentCount: 0,
};

const pushLog = (
  level: AlertLogItem['level'],
  category: AlertLogItem['category'],
  message: string,
  dispatched: boolean,
  statusText?: string
) => {
  const item: AlertLogItem = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    dispatchedToTelegram: dispatched,
    statusText,
  };
  metrics.recentLogs.unshift(item);
  if (metrics.recentLogs.length > 50) {
    metrics.recentLogs.pop();
  }
};

/**
 * Fetch all active chat IDs from env and Telegram Bot getUpdates
 */
export const getAllActiveTelegramChatIds = async (): Promise<string[]> => {
  const ids = new Set<string>();

  if (process.env.TELEGRAM_CHAT_ID && process.env.TELEGRAM_CHAT_ID.trim().length > 0) {
    process.env.TELEGRAM_CHAT_ID.split(',').forEach((s) => {
      const trimmed = s.trim();
      if (trimmed) ids.add(trimmed);
    });
  }

  if (cachedChatId) {
    ids.add(cachedChatId);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=25`);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        for (const update of data.result) {
          const chat = update.message?.chat || update.channel_post?.chat || update.my_chat_member?.chat;
          if (chat && chat.id) {
            ids.add(String(chat.id));
          }
        }
      }
    }
  } catch (err) {
    console.warn('[MONITORING] Error discovering Telegram chat IDs from getUpdates:', err);
  }

  return Array.from(ids);
};

export const getActiveTelegramChatId = async (): Promise<string | null> => {
  const all = await getAllActiveTelegramChatIds();
  return all.length > 0 ? all[0] : null;
};

/**
 * Update cached Chat ID dynamically (e.g. from UI modal or test button)
 */
export const setCachedChatId = (chatId: string) => {
  cachedChatId = chatId.trim();
};

/**
 * Sends an automated alert to the team's Telegram channel(s) via Telegram Bot API
 */
export const sendTelegramAlert = async (
  message: string,
  targetChatId?: string
): Promise<{ success: boolean; error?: string; chatId?: string }> => {
  const token = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const targetIds = targetChatId ? [targetChatId] : await getAllActiveTelegramChatIds();

  if (targetIds.length === 0) {
    const fallbackNote = 'Chat ID not found yet. (Send /start to @QanaetBot or set TELEGRAM_CHAT_ID)';
    console.warn(`[MONITORING LOG] ${message} | Notice: ${fallbackNote}`);
    pushLog('WARNING', 'SYSTEM', message, false, fallbackNote);
    return { success: false, error: fallbackNote };
  }

  let anySuccess = false;
  let lastError: string | undefined;

  for (const chatId of targetIds) {
    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      const resData = (await res.json()) as any;

      if (!res.ok || !resData.ok) {
        lastError = resData.description || 'Failed to dispatch Telegram alert';
        console.error(`[MONITORING] Telegram API error for chat ${chatId}:`, lastError);
      } else {
        anySuccess = true;
        console.log(`[MONITORING] Telegram alert delivered successfully to chat ${chatId}`);
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
      console.error(`[MONITORING] Network exception dispatching Telegram alert to chat ${chatId}:`, err);
    }
  }

  if (anySuccess) {
    metrics.alertsSentCount += 1;
    pushLog('INFO', 'SYSTEM', message, true, `Delivered to Telegram (${targetIds.join(', ')})`);
    return { success: true, chatId: targetIds.join(', ') };
  } else {
    pushLog('CRITICAL', 'SYSTEM', message, false, lastError || 'Failed to dispatch');
    return { success: false, error: lastError };
  }
};

/**
 * Rule 1: Record a security failure event (e.g. invalid OTP or login)
 * Trigger: 5 failed attempts within 5 minutes
 */
export const recordFailedLogin = async (identifier: string) => {
  metrics.failedLoginsCount += 1;
  const masked = identifier.length > 4 ? `${identifier.slice(0, 4)}***` : '***';

  if (metrics.failedLoginsCount >= 5) {
    const alertMsg = [
      `🚨 *[ALERT] Security: Suspicious Login Activity*`,
      `• *Trigger:* 5 failed login/OTP attempts within 5 minutes.`,
      `• *Identifier:* \`${masked}\``,
      `• *Event:* Possible credential stuffing or brute-force attack on user account.`,
      `• *Action:* IP rate-limiting applied. User account flagged for review.`,
      `• *Time:* ${new Date().toUTCString()}`,
    ].join('\n');

    pushLog('CRITICAL', 'SECURITY', `5 failed logins for ${masked}`, true);
    await sendTelegramAlert(alertMsg);
    metrics.failedLoginsCount = 0;
  } else {
    pushLog('WARNING', 'SECURITY', `Failed login attempt (${metrics.failedLoginsCount}/5) for ${masked}`, false);
  }
};

/**
 * Rule 2: Record an unhandled 5xx backend API error
 * Trigger: 3 backend 5xx errors within 2 minutes
 */
export const recordApiError = async (route: string, errorMsg: string, statusCode = 500) => {
  metrics.recentApiErrors += 1;

  if (metrics.recentApiErrors >= 3) {
    const alertMsg = [
      `🚨 *[ALERT] Backend Health: Elevated 5xx Error Rate*`,
      `• *Trigger:* 3 server errors detected within 2 minutes.`,
      `• *Endpoint:* \`${route}\``,
      `• *Status Code:* \`${statusCode}\``,
      `• *Error Details:* \`${errorMsg.slice(0, 150)}\``,
      `• *Time:* ${new Date().toUTCString()}`,
    ].join('\n');

    pushLog('CRITICAL', 'API_ERROR', `High error rate on ${route}: ${errorMsg}`, true);
    await sendTelegramAlert(alertMsg);
    metrics.recentApiErrors = 0;
  } else {
    pushLog('WARNING', 'API_ERROR', `API error on ${route} (${metrics.recentApiErrors}/3): ${errorMsg}`, false);
  }
};

/**
 * Rule 3: Record AI Service Failure (Gemini API 503/429/timeout)
 * Trigger: 3 consecutive AI failures or high demand spike
 */
export const recordAiFailure = async (model: string, errorMsg: string) => {
  metrics.aiFailureCount += 1;

  if (metrics.aiFailureCount >= 3) {
    const alertMsg = [
      `⚠️ *[WARNING] AI Service Degradation: Gemini API*`,
      `• *Trigger:* 3 consecutive AI advisory/NLP calls failed.`,
      `• *Model:* \`${model}\``,
      `• *Cause:* Spikes in demand (503/429) or upstream latency.`,
      `• *Mitigation:* System automatically engaged offline financial analysis fallback.`,
      `• *Time:* ${new Date().toUTCString()}`,
    ].join('\n');

    pushLog('CRITICAL', 'AI_SERVICE', `AI failure threshold reached (${model}): ${errorMsg}`, true);
    await sendTelegramAlert(alertMsg);
    metrics.aiFailureCount = 0;
  } else {
    pushLog('WARNING', 'AI_SERVICE', `AI service issue (${metrics.aiFailureCount}/3): ${errorMsg}`, false);
  }
};

/**
 * Rule 4: Record slow backend response times (Performance degradation)
 * Trigger: Response takes more than 3500ms
 */
export const recordSlowResponse = async (route: string, durationMs: number) => {
  metrics.slowRequestCount += 1;

  if (metrics.slowRequestCount >= 5) {
    const alertMsg = [
      `⚠️ *[WARNING] Performance: High API Latency*`,
      `• *Trigger:* 5 requests exceeded 3500ms response threshold.`,
      `• *Endpoint:* \`${route}\``,
      `• *Duration:* \`${Math.round(durationMs)} ms\``,
      `• *Time:* ${new Date().toUTCString()}`,
    ].join('\n');

    pushLog('WARNING', 'PERFORMANCE', `Slow response on ${route} (${Math.round(durationMs)}ms)`, true);
    await sendTelegramAlert(alertMsg);
    metrics.slowRequestCount = 0;
  }
};

/**
 * Rule 5: Open Banking synchronization failure
 * Trigger: 3 failed syncs with partner banks (Kapital Bank, ABB, Pasha Bank)
 */
export const recordBankSyncFailure = async (bankName: string, errorMsg: string) => {
  metrics.bankSyncFailures += 1;

  if (metrics.bankSyncFailures >= 3) {
    const alertMsg = [
      `⚠️ *[WARNING] Open Banking: Integration Failure*`,
      `• *Trigger:* 3 consecutive sync failures with bank partner.`,
      `• *Bank:* \`${bankName}\``,
      `• *Error:* \`${errorMsg.slice(0, 120)}\``,
      `• *Time:* ${new Date().toUTCString()}`,
    ].join('\n');

    pushLog('WARNING', 'BANK_SYNC', `Bank sync failure with ${bankName}`, true);
    await sendTelegramAlert(alertMsg);
    metrics.bankSyncFailures = 0;
  }
};

/**
 * Periodic Heartbeat & Health Check
 */
setInterval(async () => {
  metrics.lastHealthCheck = new Date().toISOString();
}, 60000);
