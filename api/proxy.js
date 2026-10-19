const BACKEND = 'https://vanta-stas-college-two.foggyfig16.chatgpt.site';
const routes = new Set(['me', 'login', 'register', 'logout', 'requests']);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const route = req.query?.route;
  if (typeof route !== 'string' || !routes.has(route)) return res.status(404).json({ error: 'Не найдено' });
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Метод не поддерживается' });
  if (req.method === 'POST') {
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({ error: 'Запрос с другого сайта запрещён' });
      } catch { return res.status(403).json({ error: 'Некорректный источник запроса' }); }
    }
    if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).json({ error: 'Ожидается JSON' });
  }
  const body = req.method === 'POST' ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})) : undefined;
  if (body && Buffer.byteLength(body) > 16384) return res.status(413).json({ error: 'Слишком большой запрос' });
  try {
    const response = await fetch(`${BACKEND}/api/${route}`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json', Origin: BACKEND, ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}) },
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(12000)
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return res.status(502).json({ error: 'Сервис временно недоступен' });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader('Set-Cookie', cookies);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(response.status).send(await response.text());
  } catch { return res.status(502).json({ error: 'Не удалось связаться с сервером. Повторите позже.' }); }
};

