import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_BOT_TOKEN = '8987455572:AAFoQqyXCFg4s2FbJmi5hC5pYnNuJo5f7Cw';
const DEFAULT_CHAT_ID = '-1003711089928';

/**
 * Normalizes Telegram Chat ID.
 * If user inputs 1003711089928 (missing minus), converts to -1003711089928.
 */
function normalizeChatId(rawChatId?: string): string {
  if (!rawChatId) return DEFAULT_CHAT_ID;
  const trimmed = String(rawChatId).trim();
  if (trimmed.startsWith('@') || trimmed.startsWith('-')) {
    return trimmed;
  }
  // If it's all digits and starts with 100...
  if (/^\d+$/.test(trimmed)) {
    if (trimmed.startsWith('100')) {
      return `-${trimmed}`;
    }
    // If it's a private user id (e.g. 6595302089), keep as is
    if (trimmed === '6595302089') {
      return trimmed;
    }
  }
  return trimmed;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // Telegram notification proxy route (eliminates browser CORS restrictions)
  app.post('/api/telegram-notify', async (req, res) => {
    try {
      const data = req.body || {};
      const botToken = data.bot_token || DEFAULT_BOT_TOKEN;
      const chatId = normalizeChatId(data.chat_id || DEFAULT_CHAT_ID);

      const eventType = data.event || 'test_ping';
      let messageText = data.text || '';

      if (!messageText) {
        switch (eventType) {
          case 'match_result_approved': {
            const p1 = data.player1_name || 'Player 1';
            const p2 = data.player2_name || 'Player 2';
            const s1 = data.score1 ?? 0;
            const s2 = data.score2 ?? 0;
            const winner = s1 > s2 ? `🏆 <b>Winner:</b> ${p1}` : s2 > s1 ? `🏆 <b>Winner:</b> ${p2}` : '🤝 <b>Match Drawn</b>';
            messageText = `⚽ <b>eFootball MATCH RESULT VERIFIED</b> ⚽\n` +
                          `━━━━━━━━━━━━━━━━━━━━━\n` +
                          `🏆 <b>Tournament:</b> ${data.tournament_name || 'eFootball Championship'}\n` +
                          `📍 <b>Stage:</b> ${data.round || 'Quarter-Final'}\n\n` +
                          `<b>${p1}</b> [ <b>${s1} - ${s2}</b> ] <b>${p2}</b>\n\n` +
                          `🎮 <i>${p1} (ID: <code>${data.player1_efootball_id || 'N/A'}</code>)</i>\n` +
                          `🎮 <i>${p2} (ID: <code>${data.player2_efootball_id || 'N/A'}</code>)</i>\n` +
                          `━━━━━━━━━━━━━━━━━━━━━\n` +
                          `${winner}\n` +
                          `✅ <b>Admin Verification:</b> Approved by ${data.approved_by || 'Mohammad Rifat (Admin)'}\n` +
                          `📊 Standings have been updated automatically!`;
            if (data.screenshot_url && data.screenshot_url.startsWith('http')) {
              messageText += `\n\n📸 <a href="${data.screenshot_url}">View Result Screenshot</a>`;
            }
            break;
          }
          case 'tournament_created': {
            messageText = `🔥 <b>NEW eFOOTBALL TOURNAMENT ANNOUNCED!</b> 🔥\n` +
                          `━━━━━━━━━━━━━━━━━━━━━\n` +
                          `🏆 <b>${data.title || 'eFootball Cup'}</b>\n\n` +
                          `⚙️ <b>Format:</b> ${String(data.format || 'Knockout').toUpperCase()}\n` +
                          `👥 <b>Player Slots:</b> ${data.max_players || 16} Players\n` +
                          `🎁 <b>Prize:</b> ${data.prize_pool || 'Coins & Champion Role'}\n` +
                          `📋 <b>Rules:</b> ${data.rules || '10 Mins, Extra Time OFF, PK ON'}\n` +
                          `━━━━━━━━━━━━━━━━━━━━━\n` +
                          `⚡ Registration is now OPEN in the eFootball Tournament Web App!`;
            break;
          }
          case 'champion_crowned': {
            messageText = `👑👑 <b>WE HAVE A CHAMPION!</b> 👑👑\n` +
                          `━━━━━━━━━━━━━━━━━━━━━\n` +
                          `🏆 <b>${data.tournament_name || 'eFootball Championship'}</b>\n\n` +
                          `🥇 <b>CHAMPION:</b> ${data.champion_name || 'Champion'} (ID: <code>${data.champion_efootball_id || 'N/A'}</code>)\n` +
                          `🥈 <b>RUNNER-UP:</b> ${data.runner_up || 'Runner-Up'}\n\n` +
                          `Congratulations to all eFootball competitors! 🎉🔥\n` +
                          `Channel: @eFootballTournamentBD`;
            break;
          }
          case 'test_ping':
          default: {
            messageText = `🤖 <b>eFootball Arena Telegram Webhook Active!</b>\n\n` +
                          `✅ Connection test successful from Admin desk!\n` +
                          `📢 Target Channel: @eFootballTournamentBD\n` +
                          `⏰ Timestamp: <code>${new Date().toISOString()}</code>\n` +
                          `🚀 Real-time match notifications and tournament updates are ready!`;
            break;
          }
        }
      }

      // Call Telegram API from Node.js
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        })
      });

      const result = await response.json() as any;

      if (response.ok && result.ok) {
        return res.json({
          success: true,
          message: `Successfully delivered to Telegram (${chatId})!`,
          event: eventType,
          telegram_message_id: result.result?.message_id,
          chat_id: chatId,
          renderedText: messageText,
          result
        });
      }

      // Telegram API returned an error (e.g., bot not admin or chat not found)
      let suggestion = '';
      if (result.description?.includes('chat not found')) {
        suggestion = ' Make sure the channel ID is correct (e.g., -1003711089928) or use channel handle @eFootballTournamentBD.';
      } else if (result.description?.includes('bot is not a member') || result.description?.includes('administrator')) {
        suggestion = ' Please add @eFootballTournamentBDBot as an Administrator in @eFootballTournamentBD with "Post Messages" permission.';
      }

      return res.status(400).json({
        success: false,
        message: `${result.description || 'Telegram API rejected message'}.${suggestion}`,
        error: result.description,
        chat_id: chatId,
        renderedText: messageText,
        result
      });
    } catch (err: any) {
      console.error('Telegram proxy error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to contact Telegram API: ' + err.message,
        error: err.message
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚽ eFootball Tournament Arena server listening on port ${PORT}`);
  });
}

startServer();
