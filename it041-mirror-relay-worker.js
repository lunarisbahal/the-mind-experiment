/* IT-041 AYNA HATTI — Cloudflare Worker
   Görevi: oyunculardan gelen sohbet isteklerini, Groq anahtarını GİZLİ tutarak
   Groq API'ye iletmek. Böylece oyuncular hiçbir anahtar kurmadan 70B kalitesinde
   diyalog alır. Anahtar yalnızca Cloudflare'da "Secret" olarak durur (GROQ_KEY).

   Korumalar:
   - CORS: yalnızca oyunun yayınlandığı alan adları istek atabilir
   - Model kilitli (llama-3.3-70b-versatile) — başka model istenemez
   - max_tokens tavanı 400 — kota korunur
   - mesaj geçmişi en çok son 16 tur
*/
export default {
  async fetch(req, env) {
    const ALLOW = [
      'https://lunarisbahal.github.io',
      'http://localhost:8000', // yerel test için (istersen sil)
    ];
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOW.includes(origin) ? origin : ALLOW[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST')
      return new Response('IT-041 mirror relay — alive', { headers: cors });

    let body;
    try { body = await req.json(); }
    catch (e) { return new Response('{"error":"bad json"}', { status: 400, headers: cors }); }

    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: (Array.isArray(body.messages) ? body.messages : []).slice(-16),
      max_tokens: Math.min(Number(body.max_tokens) || 280, 400),
      temperature: Math.min(Math.max(Number(body.temperature ?? 0.7), 0), 1.2),
    };
    if (!payload.messages.length)
      return new Response('{"error":"no messages"}', { status: 400, headers: cors });

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.GROQ_KEY,
      },
      body: JSON.stringify(payload),
    });
    const txt = await r.text();
    return new Response(txt, {
      status: r.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
