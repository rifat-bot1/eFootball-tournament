import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  ExternalLink, 
  Settings, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { TelegramConfigSettings } from '../types/tournament';
import { 
  getStoredTelegramConfig, 
  saveStoredTelegramConfig, 
  sendTelegramNotification,
  formatTelegramMessageHtml
} from '../services/telegramService';

interface TelegramPhpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramPhpModal: React.FC<TelegramPhpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tester' | 'code' | 'guide'>('tester');
  const [config, setConfig] = useState<TelegramConfigSettings>(getStoredTelegramConfig());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  
  // Test Dispatch state
  const [testEvent, setTestEvent] = useState<'match_result_approved' | 'tournament_created' | 'champion_crowned' | 'test_ping'>('match_result_approved');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveStoredTelegramConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRunTest = async () => {
    setIsSending(true);
    setTestResult(null);

    let samplePayload: any = { event: testEvent };

    if (testEvent === 'match_result_approved') {
      samplePayload = {
        event: 'match_result_approved',
        tournament_name: 'eFootball 2026 Continental Mobile Cup',
        round: 'Quarter-Final 1',
        player1_name: 'Kylian Striker',
        player1_efootball_id: '982-412-104',
        score1: 3,
        score2: 1,
        player2_name: 'Neymar Dribble',
        player2_efootball_id: '701-849-221',
        approved_by: 'Coach Ferguson (Admin)',
        screenshot_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'
      };
    } else if (testEvent === 'tournament_created') {
      samplePayload = {
        event: 'tournament_created',
        title: 'Neon Division 1 Premier League',
        format: 'League',
        max_players: 16,
        prize_pool: '5,000 eFootball Coins',
        rules: '10 Mins, Extra Time OFF, Penalties ON',
        app_url: window.location.href
      };
    } else if (testEvent === 'champion_crowned') {
      samplePayload = {
        event: 'champion_crowned',
        tournament_name: 'eFootball Continental Cup',
        champion_name: 'Kylian Striker',
        champion_efootball_id: '982-412-104',
        runner_up: 'Neymar Dribble'
      };
    }

    try {
      const result = await sendTelegramNotification(samplePayload);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message,
        source: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  const phpScriptContent = `<?php
/**
 * =========================================================================
 * eFootball Tournament Arena - Telegram Notification Webhook Script
 * =========================================================================
 * 
 * Tech Stack: PHP 7.4+ / 8.x
 * Description:
 * Receives JSON webhook requests from the eFootball Tournament Management
 * Web App when tournaments are created or match results are approved by admins,
 * then dispatches styled notifications to your Telegram Group or Channel.
 *
 * HOW TO SET UP YOUR TELEGRAM BOT:
 * 1. Open Telegram and search for "@BotFather".
 * 2. Send "/newbot" and follow prompts to choose a bot name and username.
 * 3. Copy the HTTP API token provided by BotFather and paste into $BOT_TOKEN below.
 * 4. Create your eFootball Telegram Group / Channel and add your bot as an Administrator.
 * 5. To get your Group Chat ID:
 *    - Add "@RawDataBot" or "@userinfobot" to your group, OR
 *    - Send a message in the group, then open in your browser:
 *      https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
 *    - Look for "chat":{"id": -100xxxxxxxxxx}. That negative number is your $CHAT_ID.
 * 6. Upload this script to any PHP host (e.g., https://yourdomain.com/telegram-notify.php).
 * =========================================================================
 */

// -------------------------------------------------------------
// 1. CONFIGURATION - REPLACE WITH YOUR TELEGRAM CREDENTIALS
// -------------------------------------------------------------
define('TELEGRAM_BOT_TOKEN', '${config.botToken || 'YOUR_TELEGRAM_BOT_TOKEN_HERE'}'); // e.g. '7123456789:AAFlm39K...'
define('TELEGRAM_CHAT_ID', '${config.chatId || '-1001234567890'}');                 // e.g. '-1001928374650'
define('WEBHOOK_SECRET_KEY', '${config.secretKey || ''}');                               // Optional secret key

// -------------------------------------------------------------
// 2. CORS & HTTP HEADERS (Allows requests from PWA / Web App)
// -------------------------------------------------------------
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Webhook-Secret");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// -------------------------------------------------------------
// 3. READ & VALIDATE INCOMING PAYLOAD
// -------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid or empty JSON payload.']);
    exit();
}

// Allow overriding token/chat from body for testing
$botToken = !empty($data['bot_token']) ? $data['bot_token'] : TELEGRAM_BOT_TOKEN;
$chatId = !empty($data['chat_id']) ? $data['chat_id'] : TELEGRAM_CHAT_ID;

$eventType = $data['event'] ?? 'match_result_approved';
$messageText = '';

switch ($eventType) {
    case 'match_result_approved':
        $tournament = htmlspecialchars($data['tournament_name'] ?? 'eFootball Championship');
        $round = htmlspecialchars($data['round'] ?? 'Regular Round');
        $player1 = htmlspecialchars($data['player1_name'] ?? 'Player 1');
        $player1Id = htmlspecialchars($data['player1_efootball_id'] ?? 'N/A');
        $score1 = intval($data['score1'] ?? 0);
        $score2 = intval($data['score2'] ?? 0);
        $player2 = htmlspecialchars($data['player2_name'] ?? 'Player 2');
        $player2Id = htmlspecialchars($data['player2_efootball_id'] ?? 'N/A');
        $verifiedBy = htmlspecialchars($data['approved_by'] ?? 'Admin Desk');
        $screenshotUrl = $data['screenshot_url'] ?? '';

        $winner = ($score1 > $score2) ? "🏆 <b>Winner:</b> {$player1}" : (($score2 > $score1) ? "🏆 <b>Winner:</b> {$player2}" : "🤝 <b>Match Drawn</b>");

        $messageText = "⚽ <b>eFootball MATCH RESULT VERIFIED</b> ⚽\\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\\n";
        $messageText .= "🏆 <b>Tournament:</b> {$tournament}\\n";
        $messageText .= "📍 <b>Stage:</b> {$round}\\n\\n";
        $messageText .= "<b>{$player1}</b> [ <b>{$score1} - {$score2}</b> ] <b>{$player2}</b>\\n\\n";
        $messageText .= "🎮 <i>{$player1} (ID: <code>{$player1Id}</code>)</i>\\n";
        $messageText .= "🎮 <i>{$player2} (ID: <code>{$player2Id}</code>)</i>\\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\\n";
        $messageText .= "{$winner}\\n";
        $messageText .= "✅ Verified by: {$verifiedBy}\\n";
        $messageText .= "📊 Leaderboard has been updated automatically!\\n";
        if (!empty($screenshotUrl)) {
            $messageText .= "\\n📸 <a href=\\"{$screenshotUrl}\\">View Verified Match Screenshot</a>";
        }
        break;

    case 'tournament_created':
        $title = htmlspecialchars($data['title'] ?? 'New eFootball Tournament');
        $format = htmlspecialchars($data['format'] ?? 'Knockout');
        $slots = htmlspecialchars($data['max_players'] ?? '16');
        $prize = htmlspecialchars($data['prize_pool'] ?? 'Bragging Rights');
        $rules = htmlspecialchars($data['rules'] ?? '10 Mins, Extra Time OFF, PK ON');

        $messageText = "🔥 <b>NEW eFOOTBALL TOURNAMENT ANNOUNCED!</b> 🔥\\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\\n";
        $messageText .= "🏆 <b>{$title}</b>\\n\\n";
        $messageText .= "⚙️ <b>Format:</b> {$format}\\n";
        $messageText .= "👥 <b>Max Slots:</b> {$slots} Players\\n";
        $messageText .= "🎁 <b>Prize:</b> {$prize}\\n";
        $messageText .= "📋 <b>Rules:</b> {$rules}\\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\\n";
        $messageText .= "⚡ Registration is now OPEN in the eFootball Tournament Web App!";
        break;

    default:
        $messageText = "🤖 <b>eFootball Arena Telegram Webhook Active!</b>\\n\\nConnection test successful.";
        break;
}

// Dispatch to Telegram API
$telegramApiUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";
$postFields = [
    'chat_id' => $chatId,
    'text' => $messageText,
    'parse_mode' => 'HTML',
    'disable_web_page_preview' => false
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $telegramApiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
if ($response && isset($result['ok']) && $result['ok'] === true) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Dispatched to Telegram successfully!']);
} else {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Telegram API error', 'response' => $result]);
}
?>`;

  const copyPhpScript = () => {
    navigator.clipboard.writeText(phpScriptContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadPhpFile = () => {
    const blob = new Blob([phpScriptContent], { type: 'application/x-php' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telegram-notify.php';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-sky-500/30 bg-slate-900 shadow-2xl text-slate-100 my-auto flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/20 p-2 text-sky-400 border border-sky-500/40">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Telegram Bot Integration &amp; PHP Script</span>
                <span className="rounded bg-sky-500/20 border border-sky-500/40 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  PHP 7.4 / 8.x
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated match scores and tournament broadcast engine for Telegram groups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('tester')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'tester'
                ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Webhook Tester &amp; Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'code'
                ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>telegram-notify.php Source</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'guide'
                ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Setup Instructions</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: Tester & Config */}
          {activeTab === 'tester' && (
            <div className="space-y-6">
              
              {/* Connected Telegram Network Card */}
              <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-r from-sky-950/40 via-slate-900 to-sky-950/40 p-4 sm:p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-sky-500/20 p-2.5 text-sky-400 border border-sky-500/30">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">eFootball Tournament Official Channel</span>
                        <span className="rounded-full bg-emerald-500/20 text-[#00ff87] text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                          Active &amp; Configured
                        </span>
                      </div>
                      <p className="text-xs text-sky-300 font-mono">
                        Channel: <strong>@eFootballTournamentBD</strong> • Bot: <strong>@eFootballTournamentBDBot</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="https://t.me/eFootballTournamentBD"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-bold text-white transition shadow-sm"
                    >
                      <span>Join Channel</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="https://t.me/eFootballTournamentBDBot"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition"
                    >
                      <span>Open Bot</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  <span>👑 Admin: <strong className="text-white">Mohammad Rifat</strong> (@MohammadRifat10)</span>
                  <span>💬 Admin Chat ID: <code>6595302089</code></span>
                  <span>📢 Channel ID: <code>-1003711089928</code></span>
                </div>
              </div>

              {/* Configuration Inputs */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-sky-400" />
                    <span>Telegram Bot Credentials &amp; Webhook Target</span>
                  </h3>
                  {saveSuccess && (
                    <span className="flex items-center gap-1 text-xs text-[#00ff87] font-bold">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Webhook PHP URL */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      PHP Webhook URL
                    </label>
                    <input
                      type="text"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                      placeholder="https://yourdomain.com/telegram-notify.php"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Where you host <code>telegram-notify.php</code>. Default uses internal endpoint.
                    </p>
                  </div>

                  {/* Bot Token */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Telegram Bot Token (from @BotFather)
                    </label>
                    <input
                      type="text"
                      value={config.botToken}
                      onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                      placeholder="7123456789:AAFlm39K1L90..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Chat ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Group or Channel Chat ID
                    </label>
                    <input
                      type="text"
                      value={config.chatId}
                      onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
                      placeholder="-1001928374650"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Telegram Supergroups start with <code>-100</code>
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveConfig}
                    className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Configuration</span>
                  </button>
                </div>
              </div>

              {/* Live Webhook Tester */}
              <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-[#00ff87]" />
                      <span>Live Notification Dispatch Simulator</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Send formatted test payloads directly to verify message formatting
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={testEvent}
                      onChange={(e: any) => setTestEvent(e.target.value)}
                      className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                    >
                      <option value="match_result_approved">⚽ Match Result Verified (3 - 1)</option>
                      <option value="tournament_created">🔥 Tournament Announced</option>
                      <option value="champion_crowned">👑 Champion Crowned</option>
                      <option value="test_ping">🤖 Ping Connection Test</option>
                    </select>

                    <button
                      onClick={handleRunTest}
                      disabled={isSending}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-4 py-2 text-xs font-black uppercase text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Response Visualizer */}
                {testResult && (
                  <div className={`rounded-xl border p-4 text-xs font-mono space-y-2 ${
                    testResult.success
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {testResult.success ? <CheckCircle2 className="w-4 h-4 text-[#00ff87]" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                        <span>{testResult.message}</span>
                      </span>
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-black/40 border border-current">
                        Via: {testResult.source}
                      </span>
                    </div>

                    {testResult.details?.renderedText && (
                      <div className="mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap font-sans text-xs">
                        <strong className="text-[10px] uppercase text-slate-500 block font-mono mb-1">Telegram HTML Message Preview:</strong>
                        <div dangerouslySetInnerHTML={{ __html: testResult.details.renderedText.replace(/\n/g, '<br/>') }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Full PHP Source Code */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>telegram-notify.php</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Host on any server (cPanel, Apache, Nginx, or Cloud Run). No dependencies required.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyPhpScript}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-[#00ff87]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy PHP Code'}</span>
                  </button>
                  <button
                    onClick={downloadPhpFile}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-4 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto max-h-96">
                <pre>{phpScriptContent}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: Setup Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 rounded-full bg-sky-500 text-slate-950 font-black text-xs items-center justify-center">1</span>
                  Create Your Telegram Bot
                </h4>
                <p>
                  1. Open the Telegram app and search for <code>@BotFather</code>.<br />
                  2. Send the message <code>/newbot</code>.<br />
                  3. Enter a friendly name (e.g. <em>eFootball Arena Bot</em>) and a username ending with <code>bot</code>.<br />
                  4. BotFather will provide an HTTP API token (e.g. <code>7123456789:AAFlm39K...</code>). Copy this token!
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 rounded-full bg-sky-500 text-slate-950 font-black text-xs items-center justify-center">2</span>
                  Add Bot to Your Telegram Group &amp; Get Group Chat ID
                </h4>
                <p>
                  1. Create your eFootball Tournament Group or Channel in Telegram.<br />
                  2. Add your new bot into the group and grant it <strong>Administrator</strong> privileges (Send Messages &amp; Pin Messages).<br />
                  3. To find your Group Chat ID, add <code>@RawDataBot</code> to the group or send a test message and visit:<br />
                  <code className="text-[#00ff87]">https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/getUpdates</code><br />
                  4. Find <code>&quot;chat&quot;: &#123;&quot;id&quot;: -100xxxxxxxxxx&#125;</code>. That negative number is your <strong>Chat ID</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 rounded-full bg-sky-500 text-slate-950 font-black text-xs items-center justify-center">3</span>
                  Deploy telegram-notify.php
                </h4>
                <p>
                  1. Download or copy <code>telegram-notify.php</code> using the button in the "Source" tab.<br />
                  2. Open the file in any text editor and replace <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_CHAT_ID</code> with your credentials.<br />
                  3. Upload the file to your PHP hosting public directory (e.g., <code>https://yourdomain.com/telegram-notify.php</code>).<br />
                  4. Enter your URL into this app's "Webhook Target" settings!
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
