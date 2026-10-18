/**
 * CSCI 3509: Intro to Software Engineering
 * System Monitoring & Telegram Alerting Service
 */

interface AlertConfig {
  botToken?: string;
  chatId?: string;
}

const config: AlertConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  chatId: process.env.TELEGRAM_CHAT_ID,
};

// Counter to track consecutive error rates and failed logins
export const metrics = {
  failedLoginsCount: 0,
  recentApiErrors: 0,
  lastHealthCheck: new Date().toISOString(),
  startTime: Date.now(),
};

/**
 * Sends an automated alert to the team's Telegram channel via Telegram Bot API
 */
export const sendTelegramAlert = async (message: string): Promise<boolean> => {
  const token = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = config.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(`[MONITORING LOG] (Telegram credentials not set in .env): ${message}`);
    return false;
  }

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

    if (!res.ok) {
      console.error('Failed to dispatch Telegram alert:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error dispatching Telegram alert:', err);
    return false;
  }
};

/**
 * Record a security failure event (e.g. invalid OTP or login)
 */
export const recordFailedLogin = (identifier: string) => {
  metrics.failedLoginsCount += 1;
  if (metrics.failedLoginsCount >= 5) {
    sendTelegramAlert(
      `🚨 *[ALERT] Security:* 5 failed login/OTP attempts recorded for identifier \`${identifier.slice(0, 4)}***\`. Potential brute-force attack detected.`
    );
    // Reset counter after alert
    metrics.failedLoginsCount = 0;
  }
};

/**
 * Record an unhandled 5xx API error
 */
export const recordApiError = (route: string, errorMsg: string) => {
  metrics.recentApiErrors += 1;
  if (metrics.recentApiErrors >= 3) {
    sendTelegramAlert(
      `⚠️ *[WARNING] High Error Rate:* 3 backend API errors detected on route \`${route}\`. Error: ${errorMsg}`
    );
    metrics.recentApiErrors = 0;
  }
};
