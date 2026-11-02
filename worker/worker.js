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

const PROJECT = 'sanup-jangter';
const b64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
let JWKS = null, JWKS_AT = 0;
async function keys() {
  if (JWKS && Date.now() - JWKS_AT < 3600000) return JWKS;
  const r = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  JWKS = (await r.json()).keys; JWKS_AT = Date.now(); return JWKS;
}
// 로그인 토큰을 서버에서 직접 검증 (서명·발급처·만료)
async function whoami(req) {
  try {
    const t = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
    const p = t.split('.'); if (p.length !== 3) return null;
    const head = JSON.parse(new TextDecoder().decode(b64(p[0])));
    const pay = JSON.parse(new TextDecoder().decode(b64(p[1])));
    const jwk = (await keys()).find((k) => k.kid === head.kid); if (!jwk || head.alg !== 'RS256') return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64(p[2]), new TextEncoder().encode(p[0] + '.' + p[1]));
    const now = Date.now() / 1000;
    if (!ok || pay.aud !== PROJECT || pay.iss !== 'https://securetoken.google.com/' + PROJECT || pay.exp < now || !pay.sub) return null;
    return { uid: pay.sub, email: pay.email || '' };
  } catch (e) { return null; }
}

async function status(env, uid) {
  const v = await env.PRO.get('pro:' + uid);
  const until = v ? Number(v) : 0;
  return { pro: until > Date.now(), until };
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    env = { ...env, PRO: env.PRO || env.PR0 }; // 이름 철자(O/0) 어느 쪽이든 동작
    const url = new URL(req.url);
    const me = await whoami(req);
    if (!me) return J(req, { ok: false, message: '로그인이 필요합니다.' }, 401);

    if (url.pathname === '/status') return J(req, { ok: true, ...(await status(env, me.uid)) });

    if (url.pathname === '/orders') {
      const l = await env.PRO.list({ prefix: 'ord:' + me.uid + ':', limit: 50 });
      const rows = [];
      for (const k of l.keys) { const v = await env.PRO.get(k.name); if (v) { const o = JSON.parse(v); rows.push({ orderId: o.orderId, plan: o.plan, amount: o.amount, at: o.at, receipt: o.receipt, method: o.method, approvedAt: o.approvedAt, card: o.card ? { last4: String(o.card.number || '').slice(-4), approveNo: o.card.approveNo, months: o.card.months } : null }); } }
      return J(req, { ok: true, orders: rows.reverse() });
    }

    if (url.pathname === '/confirm' && req.method === 'POST') {
      let b; try { b = await req.json(); } catch (e) { return J(req, { ok: false, message: '요청이 올바르지 않습니다.' }, 400); }
      const { paymentKey, orderId } = b; const amount = Number(b.amount);
      // orderId 형식: ig_{플랜}_{uid 앞 8자}_{시각}
      const m = /^ig_(30|90)_([A-Za-z0-9]{1,8})_(\d{10,14})$/.exec(orderId || '');
      if (!paymentKey || !m) return J(req, { ok: false, message: '주문 정보가 올바르지 않습니다.' }, 400);
      const plan = PLANS[m[1]];
      if (amount !== plan.amount || m[2] !== me.uid.slice(0, 8))
        return J(req, { ok: false, message: '주문 금액이나 계정이 맞지 않습니다.' }, 400);
      const prev = await env.PRO.get('order:' + orderId);
      if (prev) { let o = {}; try { o = JSON.parse(prev); } catch (e) {} return J(req, { ok: true, again: true, receipt: o.receipt || '', ...(await status(env, me.uid)) }); }

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
      const receipt = (d.receipt && d.receipt.url) || '';
      const card = d.card ? { number: d.card.number || '', approveNo: d.card.approveNo || '', months: d.card.installmentPlanMonths || 0 } : null;
      const rec = { uid: me.uid, email: me.email, orderId, paymentKey, amount, plan: m[1], method: d.method || '', receipt, card, approvedAt: d.approvedAt || '', at: Date.now() };
      await env.PRO.put('order:' + orderId, JSON.stringify(rec));
      await env.PRO.put('ord:' + me.uid + ':' + String(rec.at).padStart(14, '0'), JSON.stringify(rec));
      return J(req, { ok: true, pro: true, until, receipt });
    }
    return J(req, { ok: false, message: 'not found' }, 404);
  }
};
