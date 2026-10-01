const APIX_URL = 'https://s6.apix-drive.com/web-hooks/61497/zrsuerr6';
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx8BmURu43xIQuv8ZX4zuIVDekLGG13_eBLTOtTL0BmvwisUJ6bgfXdMZq-k_ySu99MJA/exec';

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

  const lead = {
    name: d.name || '—',
    phone: d.phone || '—',
    object: d.object || '—',
    floorArea: d.floorArea || '—',
    wallArea: d.wallArea || '—',
    city: d.city || '—',
    timing: d.timing || '—'
  };

  const text = [
    '🔔 Нова заявка з квізу PRO100 Штукатур',
    '',
    "👤 Ім'я: " + lead.name,
    '📞 Телефон: ' + lead.phone,
    "🏠 Об'єкт: " + lead.object,
    '📐 Площа по підлозі: ' + lead.floorArea,
    '🧱 Площа по стінах: ' + lead.wallArea,
    '📍 Місто: ' + lead.city,
    '⏰ Терміни: ' + lead.timing
  ].join('\n');

  const token = String(process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  const chats = String(process.env.TELEGRAM_CHAT_ID || '')
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);

  const json = { 'Content-Type': 'application/json' };
  const jobs = [];

  for (const chatId of chats) {
    jobs.push(['telegram ' + chatId, fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST', headers: json, body: JSON.stringify({ chat_id: chatId, text: text })
    })]);
  }
  jobs.push(['apix', fetch(APIX_URL, { method: 'POST', headers: json, body: JSON.stringify(lead) })]);
  jobs.push(['sheets', fetch(SHEETS_URL, { method: 'POST', headers: json, body: JSON.stringify(lead) })]);

  const results = await Promise.allSettled(jobs.map((j) => j[1]));
  const report = {};
  for (let i = 0; i < results.length; i++) {
    const name = jobs[i][0];
    const r = results[i];
    if (r.status === 'fulfilled' && r.value.ok) {
      report[name] = 'ok';
    } else {
      const why = r.status === 'fulfilled' ? r.value.status + ' ' + (await r.value.text()).slice(0, 300) : String(r.reason);
      report[name] = 'ERROR ' + why;
      console.error(name, why);
    }
  }

  return { statusCode: 200, headers: json, body: JSON.stringify(report) };
};
