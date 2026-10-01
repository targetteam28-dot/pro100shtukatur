exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let d = {};
  try {
    d = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Bad JSON' };
  }

  const text = [
    '🔔 Нова заявка з квізу PRO100 Штукатур',
    '',
    "👤 Ім'я: " + (d.name || '—'),
    '📞 Телефон: ' + (d.phone || '—'),
    "🏠 Об'єкт: " + (d.object || '—'),
    '📐 Площа по підлозі: ' + (d.floorArea || '—'),
    '🧱 Площа по стінах: ' + (d.wallArea || '—'),
    '📍 Місто: ' + (d.city || '—'),
    '⏰ Терміни: ' + (d.timing || '—')
  ].join('\n');

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = String(process.env.TELEGRAM_CHAT_ID || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let ok = true;
  for (const chatId of chats) {
    const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
    if (!res.ok) {
      ok = false;
      console.error('Telegram error', chatId, await res.text());
    }
  }

  return { statusCode: ok ? 200 : 502, body: ok ? 'ok' : 'telegram error' };
};
