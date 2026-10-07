/**
 * =========================================================================
 * eFootball Tournament Arena - Telegram Notification Service
 * =========================================================================
 * 
 * Tech Stack: Integration with PHP Telegram Webhook & Telegram Bot API
 * 
 * FEATURES:
 * 1. Dispatches webhook requests to your hosted `telegram-notify.php`
 * 2. Alternatively tests direct Telegram Bot API calls from browser for instant validation
 * 3. Formats match results, brackets, and announcements
 * =========================================================================
 */

import { TelegramConfigSettings, MatchFixture, Tournament } from '../types/tournament';

const STORAGE_KEY_TELEGRAM = 'efootball_telegram_config';

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfigSettings = {
  webhookUrl: window.location.origin + '/telegram-notify.php',
  botToken: '8987455572:AAFoQqyXCFg4s2FbJmi5hC5pYnNuJo5f7Cw',
  chatId: '-1003711089928', // @eFootballTournamentBD channel
  secretKey: '',
  autoNotifyOnApproval: true,
  autoNotifyOnCreate: true
};

export function getStoredTelegramConfig(): TelegramConfigSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TELEGRAM);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_TELEGRAM_CONFIG,
        ...parsed,
        // Ensure real default token/chat are preserved if stored values are empty
        botToken: parsed.botToken || DEFAULT_TELEGRAM_CONFIG.botToken,
        chatId: parsed.chatId || DEFAULT_TELEGRAM_CONFIG.chatId,
        webhookUrl: parsed.webhookUrl || DEFAULT_TELEGRAM_CONFIG.webhookUrl
      };
    }
  } catch (e) {
    console.error('Failed reading telegram config', e);
  }
  return DEFAULT_TELEGRAM_CONFIG;
}

export function saveStoredTelegramConfig(config: TelegramConfigSettings): void {
  localStorage.setItem(STORAGE_KEY_TELEGRAM, JSON.stringify(config));
}

export interface TelegramDispatchResult {
  success: boolean;
  message: string;
  source: 'php_webhook' | 'direct_telegram_api' | 'simulation';
  payload?: any;
  error?: string;
  details?: any;
}

/**
 * Send notification to the PHP script or directly to Telegram
 */
export async function sendTelegramNotification(
  eventData: {
    event: 'match_result_approved' | 'tournament_created' | 'champion_crowned' | 'test_ping';
    [key: string]: any;
  }
): Promise<TelegramDispatchResult> {
  const config = getStoredTelegramConfig();

  // If webhook is external (not the local dev server serving static files), call PHP webhook
  const isExternalPhpHost = Boolean(
    config.webhookUrl && 
    !config.webhookUrl.includes(window.location.host) &&
    (config.webhookUrl.startsWith('http://') || config.webhookUrl.startsWith('https://'))
  );

  if (isExternalPhpHost) {
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.secretKey ? { 'X-Webhook-Secret': config.secretKey } : {})
        },
        body: JSON.stringify({
          ...eventData,
          bot_token: config.botToken || undefined,
          chat_id: config.chatId || undefined
        })
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const json = await response.json();
        return {
          success: true,
          message: json.message || 'Notification sent via PHP Telegram Webhook!',
          source: 'php_webhook',
          payload: eventData,
          details: json
        };
      }
    } catch (e: any) {
      console.warn('Could not reach PHP webhook URL, attempting direct Telegram API:', e.message);
    }
  }

  // Direct Telegram Bot API Dispatch (Works natively from browser!)
  if (config.botToken && config.chatId) {
    try {
      const formattedText = formatTelegramMessageHtml(eventData);
      const apiUrl = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: formattedText,
          parse_mode: 'HTML'
        })
      });
      const data = await res.json();
      if (data.ok) {
        return {
          success: true,
          message: 'Notification successfully delivered to Telegram channel!',
          source: 'direct_telegram_api',
          payload: eventData,
          details: data
        };
      } else {
        let helpTip = '';
        if (data.description?.includes('chat not found') || data.description?.includes('bot is not a member')) {
          helpTip = ' (Tip: Please add @eFootballTournamentBDBot to your Telegram channel as an Administrator with "Post Messages" permission!)';
        }
        return {
          success: false,
          message: `${data.description}${helpTip}`,
          source: 'direct_telegram_api',
          error: data.description,
          details: data
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: 'Network error calling Telegram API: ' + err.message,
        source: 'direct_telegram_api',
        error: err.message
      };
    }
  }

  // Simulation fallback: records formatted message for previewing
  return {
    success: true,
    message: 'Simulation: Notification formatted (Bot token or Chat ID missing)',
    source: 'simulation',
    payload: eventData,
    details: {
      renderedText: formatTelegramMessageHtml(eventData)
    }
  };
}

/**
 * Format HTML message for Telegram
 */
export function formatTelegramMessageHtml(data: any): string {
  switch (data.event) {
    case 'match_result_approved': {
      const p1Score = data.score1 ?? 0;
      const p2Score = data.score2 ?? 0;
      const winnerText = p1Score > p2Score 
        ? `🏆 <b>Winner:</b> ${data.player1_name}` 
        : p2Score > p1Score 
        ? `🏆 <b>Winner:</b> ${data.player2_name}` 
        : `🤝 <b>Match Drawn</b>`;

      return `⚽ <b>eFootball MATCH RESULT VERIFIED</b> ⚽\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `🏆 <b>Tournament:</b> ${data.tournament_name || 'eFootball Cup'}\n` +
             `📍 <b>Stage:</b> ${data.round || 'Knockout'}\n\n` +
             `<b>${data.player1_name}</b> [ <b>${p1Score} - ${p2Score}</b> ] <b>${data.player2_name}</b>\n\n` +
             `🎮 <i>${data.player1_name} (eFootball ID: <code>${data.player1_efootball_id}</code>)</i>\n` +
             `🎮 <i>${data.player2_name} (eFootball ID: <code>${data.player2_efootball_id}</code>)</i>\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `${winnerText}\n` +
             `✅ <b>Admin Verification:</b> Approved & Points Updated\n` +
             (data.screenshot_url ? `\n📸 <a href="${data.screenshot_url}">View Match Result Screenshot</a>` : '');
    }
    case 'tournament_created': {
      return `🔥 <b>NEW eFOOTBALL TOURNAMENT ANNOUNCED!</b> 🔥\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `🏆 <b>${data.title}</b>\n\n` +
             `⚙️ <b>Format:</b> ${data.format?.toUpperCase()}\n` +
             `👥 <b>Player Slots:</b> ${data.max_players} Players\n` +
             `🎁 <b>Prize:</b> ${data.prize_pool || 'Bragging Rights'}\n` +
             `📋 <b>Rules:</b> ${data.rules || '10 Mins, Extra Time OFF, PK ON'}\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `⚡ Register now in the eFootball Tournament Web App!`;
    }
    case 'champion_crowned': {
      return `👑👑 <b>WE HAVE A CHAMPION!</b> 👑👑\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `🏆 <b>${data.tournament_name}</b>\n\n` +
             `🥇 <b>CHAMPION:</b> ${data.champion_name} (ID: <code>${data.champion_efootball_id}</code>)\n` +
             `🥈 <b>RUNNER-UP:</b> ${data.runner_up}\n\n` +
             `Congratulations to all eFootball competitors! 🎉🔥`;
    }
    default: {
      return `🤖 <b>eFootball Arena Telegram Webhook Active!</b>\n\n` +
             `✅ Connection test successful!\n` +
             `⏰ <code>${new Date().toISOString()}</code>\n` +
             `🚀 Ready to broadcast live match results and tournament updates.`;
    }
  }
}
