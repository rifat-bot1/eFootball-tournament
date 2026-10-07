<?php
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
define('TELEGRAM_BOT_TOKEN', '8987455572:AAFoQqyXCFg4s2FbJmi5hC5pYnNuJo5f7Cw'); // @eFootballTournamentBDBot
define('TELEGRAM_CHAT_ID', '-1003711089928');                                     // @eFootballTournamentBD Channel
define('WEBHOOK_SECRET_KEY', '');                                                 // Optional security token. Leave empty to allow all requests.

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

// Allow simple GET check in browser
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'online',
        'service' => 'eFootball Tournament Telegram Webhook',
        'bot_configured' => (TELEGRAM_BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE' && !empty(TELEGRAM_BOT_TOKEN)),
        'chat_configured' => (TELEGRAM_CHAT_ID !== '-1001234567890' && !empty(TELEGRAM_CHAT_ID)),
        'timestamp' => date('Y-m-d H:i:s T')
    ]);
    exit();
}

// -------------------------------------------------------------
// 3. READ & VALIDATE INCOMING PAYLOAD
// -------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid or empty JSON payload received.'
    ]);
    exit();
}

// Optional Secret Token Check
if (!empty(WEBHOOK_SECRET_KEY)) {
    $providedSecret = $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? ($data['secret'] ?? '');
    if ($providedSecret !== WEBHOOK_SECRET_KEY) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized: Invalid webhook secret token.']);
        exit();
    }
}

// Allow overriding token/chat from test requests if provided in request body
$botToken = !empty($data['bot_token']) ? $data['bot_token'] : TELEGRAM_BOT_TOKEN;
$chatId = !empty($data['chat_id']) ? $data['chat_id'] : TELEGRAM_CHAT_ID;

if (empty($botToken) || $botToken === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Telegram Bot Token is not configured. Please edit TELEGRAM_BOT_TOKEN in telegram-notify.php or pass bot_token in payload.'
    ]);
    exit();
}

if (empty($chatId) || $chatId === '-1001234567890') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Telegram Chat ID is not configured. Please edit TELEGRAM_CHAT_ID in telegram-notify.php or pass chat_id in payload.'
    ]);
    exit();
}

// -------------------------------------------------------------
// 4. FORMAT MESSAGE BASED ON EVENT TYPE
// -------------------------------------------------------------
$eventType = $data['event'] ?? 'match_result_approved';
$messageText = '';

switch ($eventType) {

    // A. Match Result Approved by Admin
    case 'match_result_approved':
    case 'match_result':
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

        // Determine outcome badge
        if ($score1 > $score2) {
            $outcome = "🏆 <b>Winner:</b> {$player1}";
        } elseif ($score2 > $score1) {
            $outcome = "🏆 <b>Winner:</b> {$player2}";
        } else {
            $outcome = "🤝 <b>Match Drawn</b>";
        }

        $messageText = "⚽ <b>eFootball MATCH RESULT VERIFIED</b> ⚽\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $messageText .= "🏆 <b>Tournament:</b> {$tournament}\n";
        $messageText .= "📍 <b>Stage:</b> {$round}\n\n";
        $messageText .= "<b>{$player1}</b> [ <b>{$score1} - {$score2}</b> ] <b>{$player2}</b>\n\n";
        $messageText .= "🎮 <i>{$player1} (ID: <code>{$player1Id}</code>)</i>\n";
        $messageText .= "🎮 <i>{$player2} (ID: <code>{$player2Id}</code>)</i>\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $messageText .= "{$outcome}\n";
        $messageText .= "✅ Verified by: {$verifiedBy}\n";
        $messageText .= "📊 Leaderboard has been updated automatically!\n";
        if (!empty($screenshotUrl)) {
            $messageText .= "\n📸 <a href=\"{$screenshotUrl}\">View Verified Match Screenshot</a>";
        }
        break;

    // B. New Tournament Created
    case 'tournament_created':
        $title = htmlspecialchars($data['title'] ?? 'New eFootball Tournament');
        $format = htmlspecialchars($data['format'] ?? 'Knockout');
        $slots = htmlspecialchars($data['max_players'] ?? '16');
        $prize = htmlspecialchars($data['prize_pool'] ?? 'Bragging Rights & ePoints');
        $rules = htmlspecialchars($data['rules'] ?? '10 Mins, Extra Time OFF, PK ON');
        $joinUrl = htmlspecialchars($data['app_url'] ?? 'Open Web App');

        $messageText = "🔥 <b>NEW eFOOTBALL TOURNAMENT ANNOUNCED!</b> 🔥\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $messageText .= "🏆 <b>{$title}</b>\n\n";
        $messageText .= "⚙️ <b>Format:</b> {$format}\n";
        $messageText .= "👥 <b>Max Slots:</b> {$slots} Players\n";
        $messageText .= "🎁 <b>Prize / Reward:</b> {$prize}\n";
        $messageText .= "📋 <b>Match Rules:</b> {$rules}\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $messageText .= "⚡ Registration is now OPEN! Join via the tournament web app:\n";
        $messageText .= "👉 {$joinUrl}";
        break;

    // D. Player Joined Tournament
    case 'player_joined_tournament':
        $tourTitle = htmlspecialchars($data['tournament_title'] ?? 'eFootball Tournament');
        $pName = htmlspecialchars($data['player_name'] ?? 'Player');
        $efootballId = htmlspecialchars($data['efootball_id'] ?? 'N/A');
        $pEmail = htmlspecialchars($data['player_email'] ?? '');
        $club = htmlspecialchars($data['favorite_club'] ?? '');
        $division = htmlspecialchars($data['division'] ?? '');
        $slots = htmlspecialchars(($data['current_players'] ?? '1') . '/' . ($data['max_players'] ?? '16'));
        $fee = htmlspecialchars($data['entry_fee'] ?? '0');
        $prize = htmlspecialchars($data['prize_pool'] ?? 'TBD');
        $joinedAt = htmlspecialchars($data['joined_at'] ?? date('Y-m-d H:i:s'));

        $messageText = "🎮 <b>NEW PLAYER JOINED TOURNAMENT!</b> 🎮\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $messageText .= "🏆 <b>Tournament:</b> {$tourTitle}\n";
        $messageText .= "👤 <b>Player Name:</b> {$pName}\n";
        $messageText .= "🆔 <b>eFootball ID:</b> <code>{$efootballId}</code>\n";
        if (!empty($pEmail)) {
            $messageText .= "📧 <b>Email:</b> {$pEmail}\n";
        }
        if (!empty($club)) {
            $messageText .= "⚽ <b>Club:</b> {$club}\n";
        }
        if (!empty($division)) {
            $messageText .= "🎖️ <b>Division:</b> {$division}\n";
        }
        $messageText .= "📊 <b>Slots:</b> {$slots} Players\n";
        $messageText .= "💰 <b>Entry Fee:</b> ৳{$fee} | <b>Prize:</b> {$prize}\n";
        $messageText .= "⏰ <b>Joined At:</b> {$joinedAt}\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $messageText .= "⚡ Match fixtures will be scheduled soon in @eFootballTournamentBD!";
        break;

    // C. Tournament Champion Crowned
    case 'champion_crowned':
        $champion = htmlspecialchars($data['champion_name'] ?? 'Champion');
        $championId = htmlspecialchars($data['champion_efootball_id'] ?? 'N/A');
        $tournament = htmlspecialchars($data['tournament_name'] ?? 'eFootball Championship');
        $runnerUp = htmlspecialchars($data['runner_up'] ?? 'Contender');

        $messageText = "👑👑 <b>WE HAVE A CHAMPION!</b> 👑👑\n";
        $messageText .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $messageText .= "🏆 <b>{$tournament}</b>\n\n";
        $messageText .= "🥇 <b>CHAMPION:</b> {$champion} (ID: <code>{$championId}</code>)\n";
        $messageText .= "🥈 <b>RUNNER-UP:</b> {$runnerUp}\n\n";
        $messageText .= "Congratulations to all participants for a magnificent tournament! 🎉🔥";
        break;

    // D. Test Ping
    case 'test_ping':
    default:
        $sender = htmlspecialchars($data['sender'] ?? 'Admin');
        $timestamp = date('Y-m-d H:i:s T');
        $messageText = "🤖 <b>eFootball Telegram Webhook Connected!</b>\n\n";
        $messageText .= "✅ Connection test successful from: {$sender}\n";
        $messageText .= "⏰ Timestamp: <code>{$timestamp}</code>\n";
        $messageText .= "🚀 Real-time match results and tournament notifications are ready to broadcast!";
        break;
}

// -------------------------------------------------------------
// 5. DISPATCH TO TELEGRAM BOT API
// -------------------------------------------------------------
$telegramApiUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";

$postFields = [
    'chat_id' => $chatId,
    'text' => $messageText,
    'parse_mode' => 'HTML',
    'disable_web_page_preview' => false
];

// Execute using cURL (preferred) or file_get_contents fallback
$response = false;
$httpCode = 0;
$curlError = '';

if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $telegramApiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
} else {
    // Fallback using stream context
    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($postFields),
            'timeout' => 10
        ]
    ];
    $context  = stream_context_create($options);
    $response = @file_get_contents($telegramApiUrl, false, $context);
    $httpCode = $response ? 200 : 500;
}

// -------------------------------------------------------------
// 6. RETURN API RESPONSE
// -------------------------------------------------------------
$telegramResult = json_decode($response, true);

if ($response && isset($telegramResult['ok']) && $telegramResult['ok'] === true) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Notification dispatched to Telegram successfully!',
        'event' => $eventType,
        'telegram_message_id' => $telegramResult['result']['message_id'] ?? null
    ]);
} else {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to dispatch message to Telegram API.',
        'http_code' => $httpCode,
        'curl_error' => $curlError,
        'telegram_response' => $telegramResult ?? $response
    ]);
}
?>
