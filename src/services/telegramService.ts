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

export function cleanChatId(chatId?: string): string {
  if (!chatId) return '-1003711089928';
  const trimmed = chatId.trim();
  if (trimmed.startsWith('@') || trimmed.startsWith('-')) {
    return trimmed;
  }
  if (/^\d+$/.test(trimmed)) {
    if (trimmed.startsWith('100')) {
      return `-${trimmed}`;
    }
  }
  return trimmed;
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
 * Send notification to the server proxy, PHP script, or directly to Telegram
 */
export async function sendTelegramNotification(
  eventData: {
    event: 'match_result_approved' | 'tournament_created' | 'champion_crowned' | 'player_joined_tournament' | 'fixtures_published' | 'single_fixture_announced' | 'test_ping';
    [key: string]: any;
  }
): Promise<TelegramDispatchResult> {
  const config = getStoredTelegramConfig();
  const effectiveChatId = cleanChatId(config.chatId);
  const effectiveBotToken = config.botToken || '8987455572:AAFoQqyXCFg4s2FbJmi5hC5pYnNuJo5f7Cw';

  // 1. Primary: Full-Stack Server Proxy (/api/telegram-notify)
  // Executes on Node.js server with ZERO CORS restrictions!
  try {
    const proxyRes = await fetch('/api/telegram-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...eventData,
        bot_token: effectiveBotToken,
        chat_id: effectiveChatId
      })
    });

    if (proxyRes.ok) {
      const json = await proxyRes.json();
      return {
        success: true,
        message: json.message || `Delivered to Telegram channel (${effectiveChatId})!`,
        source: 'direct_telegram_api',
        payload: eventData,
        details: json
      };
    } else {
      console.warn('Server proxy /api/telegram-notify returned status:', proxyRes.status, 'Attempting direct Telegram Bot API fallback...');
    }
  } catch (proxyErr: any) {
    console.warn('Server proxy /api/telegram-notify fetch error, attempting direct fallbacks:', proxyErr.message);
  }

  // 2. If user configured an external hosted PHP Webhook URL
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
          bot_token: effectiveBotToken,
          chat_id: effectiveChatId
        })
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const json = await response.json();
        return {
          success: true,
          message: json.message || 'Notification sent via external PHP Telegram Webhook!',
          source: 'php_webhook',
          payload: eventData,
          details: json
        };
      }
    } catch (e: any) {
      console.warn('Could not reach external PHP webhook URL:', e.message);
    }
  }

  // 3. Fallback: Direct Client-Side Telegram Bot API Dispatch
  if (effectiveBotToken && effectiveChatId) {
    try {
      const formattedText = formatTelegramMessageHtml(eventData);
      const apiUrl = `https://api.telegram.org/bot${effectiveBotToken}/sendMessage`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: effectiveChatId,
          text: formattedText,
          parse_mode: 'HTML'
        })
      });
      const data = await res.json();
      if (data.ok) {
        return {
          success: true,
          message: `Delivered to Telegram channel (${effectiveChatId})!`,
          source: 'direct_telegram_api',
          payload: eventData,
          details: data
        };
      } else {
        let helpTip = '';
        if (data.description?.includes('chat not found') || data.description?.includes('bot is not a member')) {
          helpTip = ' (Tip: Please ensure @eFootballTournamentBDBot is added to the channel as an Administrator with "Post Messages" permission!)';
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
        message: 'Could not connect to Telegram API: ' + err.message + '. Tip: Ensure bot is added as admin to @eFootballTournamentBD.',
        source: 'direct_telegram_api',
        error: err.message
      };
    }
  }

  // Simulation fallback
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
    case 'player_joined_tournament': {
      return `🎮 <b>NEW PLAYER JOINED TOURNAMENT!</b> 🎮\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `🏆 <b>Tournament:</b> ${data.tournament_title || 'eFootball Tournament'}\n` +
             `👤 <b>Player Name:</b> ${data.player_name}\n` +
             `🆔 <b>eFootball ID:</b> <code>${data.efootball_id}</code>\n` +
             (data.player_email ? `📧 <b>Email:</b> ${data.player_email}\n` : '') +
             (data.phone ? `📱 <b>Phone:</b> ${data.phone}\n` : '') +
             (data.favorite_club ? `⚽ <b>Club:</b> ${data.favorite_club}\n` : '') +
             (data.division ? `🎖️ <b>Division:</b> ${data.division}\n` : '') +
             `📊 <b>Registered Slots:</b> ${data.current_players}/${data.max_players} Players\n` +
             `💰 <b>Entry Fee:</b> ৳${data.entry_fee || 0} | <b>Prize:</b> ${data.prize_pool || 'TBD'}\n` +
             `⏰ <b>Joined At:</b> ${data.joined_at || new Date().toLocaleString()}\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `⚡ Match fixtures will be scheduled soon in @eFootballTournamentBD!`;
    }
    case 'champion_crowned': {
      return `👑👑 <b>WE HAVE A CHAMPION!</b> 👑👑\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `🏆 <b>${data.tournament_name}</b>\n\n` +
             `🥇 <b>CHAMPION:</b> ${data.champion_name} (ID: <code>${data.champion_efootball_id}</code>)\n` +
             `🥈 <b>RUNNER-UP:</b> ${data.runner_up}\n\n` +
             `Congratulations to all eFootball competitors! 🎉🔥`;
    }
    case 'fixtures_published': {
      const tourTitle = data.tournament_title || 'eFootball Tournament';
      const tourFormat = String(data.format || 'Knockout').toUpperCase();
      const fixtureList = Array.isArray(data.fixtures) ? data.fixtures : [];

      let matchesText = '';
      if (fixtureList.length > 0) {
        matchesText = fixtureList.map((f: any, idx: number) => {
          const num = idx + 1;
          const round = f.round || `Match ${num}`;
          const p1 = f.player1_name || 'Player 1';
          const p1Id = f.player1_efootball_id || 'N/A';
          const p1Club = f.player1_club ? ` (${f.player1_club})` : '';
          const p2 = f.player2_name || 'Player 2';
          const p2Id = f.player2_efootball_id || 'N/A';
          const p2Club = f.player2_club ? ` (${f.player2_club})` : '';
          const time = f.scheduled_time || 'TBD';

          return `⚽ <b>[${round}]</b>\n` +
                 `🔴 <b>${p1}</b>${p1Club}\n` +
                 `   🆔 ID: <code>${p1Id}</code>\n` +
                 `       ⚔️ VS ⚔️\n` +
                 `🔵 <b>${p2}</b>${p2Club}\n` +
                 `   🆔 ID: <code>${p2Id}</code>\n` +
                 `⏰ <i>Schedule: ${time}</i>\n`;
        }).join('\n');
      } else {
        matchesText = data.fixtures_summary || 'No matches scheduled yet.';
      }

      return `📅 <b>OFFICIAL MATCH FIXTURES RELEASED</b> 📅\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `🏆 <b>Tournament:</b> ${tourTitle}\n` +
             `⚙️ <b>Format:</b> ${tourFormat}\n` +
             `👥 <b>Total Fixtures:</b> ${fixtureList.length} Matches\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `⚔️ <b>MATCH SCHEDULE & OPPONENTS:</b>\n\n` +
             `${matchesText}\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `📢 <b>Players Notice:</b>\n` +
             `1. Copy your opponent's eFootball ID above\n` +
             `2. Send Friend Match request in eFootball mobile\n` +
             `3. Play the match within time and submit screenshot in web app!\n\n` +
             `⚡ Official Channel: @eFootballTournamentBD`;
    }
    case 'single_fixture_announced': {
      const tourTitle = data.tournament_title || 'eFootball Tournament';
      const round = data.round || 'Tournament Match';
      const p1 = data.player1_name || 'Player 1';
      const p1Id = data.player1_efootball_id || 'N/A';
      const p1Club = data.player1_club ? ` (${data.player1_club})` : '';
      const p2 = data.player2_name || 'Player 2';
      const p2Id = data.player2_efootball_id || 'N/A';
      const p2Club = data.player2_club ? ` (${data.player2_club})` : '';
      const time = data.scheduled_time || 'TBD';

      return `⚔️ <b>UPCOMING MATCH FIXTURE</b> ⚔️\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `🏆 <b>Tournament:</b> ${tourTitle}\n` +
             `📍 <b>Round:</b> ${round}\n` +
             `⏰ <b>Scheduled Time:</b> ${time}\n\n` +
             `🔴 <b>${p1}</b>${p1Club}\n` +
             `   🆔 eFootball ID: <code>${p1Id}</code>\n\n` +
             `       ⚡ VS ⚡\n\n` +
             `🔵 <b>${p2}</b>${p2Club}\n` +
             `   🆔 eFootball ID: <code>${p2Id}</code>\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `🎮 Add opponent ID in eFootball and play within scheduled time!\n` +
             `📢 Official Channel: @eFootballTournamentBD`;
    }
    default: {
      return `🤖 <b>eFootball Arena Telegram Webhook Active!</b>\n\n` +
             `✅ Connection test successful!\n` +
             `⏰ <code>${new Date().toISOString()}</code>\n` +
             `🚀 Ready to broadcast live match results and tournament updates.`;
    }
  }
}
