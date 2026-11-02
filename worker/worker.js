// 일감마켓 결제 확인 서버 (Cloudflare Workers, 무료)
// 환경변수: TOSS_SECRET (토스 시크릿 키), 저장소: KV 바인딩 PRO
const FB_KEY = 'AIzaSyC7txkoe-zROxqJ5rrbHsdDTuHrFrAy450'; // Firebase 웹 키(공개용)
const PLANS = { '30': { amount: 49900, days: 30 }, '90': { amount: 129900, days: 90 } };
const ORIGINS = ['https://ilgammarket.co.kr', 'https://www.ilgammarket.co.kr', 'http://localhost:8077', 'capacitor://localhost', 'https://localhost'];

function cors(req) {
  const o = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin'
  };
}
const J = (req, obj, st = 200) => new Response(JSON.stringify(obj), { status: st, headers: { 'Content-Type': 'application/json', ...cors(req) } });

async function whoami(req) {
  const t = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
  if (!t) return null;
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FB_KEY, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: t })
  });
  if (!r.ok) return null;
  const d = await r.json();
  const u = d.users && d.users[0];
  return u ? { uid: u.localId, email: u.email } : null;
}

async function status(env, uid) {
  const v = await env.PRO.get('pro:' + uid);
  const until = v ? Number(v) : 0;
  return { pro: until > Date.now(), until };
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    const me = await whoami(req);
    if (!me) return J(req, { ok: false, message: '로그인이 필요합니다.' }, 401);

    if (url.pathname === '/status') return J(req, { ok: true, ...(await status(env, me.uid)) });

    if (url.pathname === '/confirm' && req.method === 'POST') {
      let b; try { b = await req.json(); } catch (e) { return J(req, { ok: false, message: '요청이 올바르지 않습니다.' }, 400); }
      const { paymentKey, orderId } = b; const amount = Number(b.amount);
      // orderId 형식: ig_{플랜}_{uid 앞 8자}_{시각}
      const m = /^ig_(30|90)_([A-Za-z0-9]{1,8})_(\d{10,14})$/.exec(orderId || '');
      if (!paymentKey || !m) return J(req, { ok: false, message: '주문 정보가 올바르지 않습니다.' }, 400);
      const plan = PLANS[m[1]];
      if (amount !== plan.amount || m[2] !== me.uid.slice(0, 8))
        return J(req, { ok: false, message: '주문 금액이나 계정이 맞지 않습니다.' }, 400);
      if (await env.PRO.get('order:' + orderId)) return J(req, { ok: true, again: true, ...(await status(env, me.uid)) });

      const r = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + btoa(env.TOSS_SECRET + ':'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount })
      });
      const d = await r.json();
      if (!r.ok || d.status !== 'DONE' || d.totalAmount !== plan.amount)
        return J(req, { ok: false, message: d.message || '결제를 확인하지 못했습니다.' }, 400);

      const cur = (await status(env, me.uid)).until;
      const until = Math.max(Date.now(), cur) + plan.days * 86400000;
      await env.PRO.put('pro:' + me.uid, String(until));
      await env.PRO.put('order:' + orderId, JSON.stringify({ uid: me.uid, email: me.email, paymentKey, amount, plan: m[1], at: Date.now() }));
      return J(req, { ok: true, pro: true, until });
    }
    return J(req, { ok: false, message: 'not found' }, 404);
  }
};
