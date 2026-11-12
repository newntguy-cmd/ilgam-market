// 일감마켓 결제 확인 서버 (Cloudflare Workers, 무료)
// 환경변수: TOSS_SECRET (토스 시크릿 키), ADMIN_SECRET (연락처 적재용 비밀값)
// 저장소: KV 바인딩 PRO (프로 기간·결제), D1 바인딩 DB (사용자 첫 접속일·법인 연락처·하루 열람 기록)
const TRIAL_DAYS = 0;    // 맛보기 없음: 연락처는 결제한 일감 마스터에게만 공개
const FREE_DAILY = 0;    // 무료 회원 연락처 열람 건수(0 = 전부 잠금)
const PLANS = { '30': { amount: 49900, days: 30 }, '90': { amount: 129900, days: 90 } };
const ORIGINS = ['https://ilgammarket.co.kr', 'https://www.ilgammarket.co.kr', 'http://localhost:8077', 'capacitor://localhost', 'https://localhost'];

function cors(req) {
  const o = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Admin',
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

// ---- D1: 계정 상태·연락처 -------------------------------------------------
let READY = false;
async function init(env) {
  if (READY) return;
  await env.DB.batch([
    env.DB.prepare('CREATE TABLE IF NOT EXISTS users(uid TEXT PRIMARY KEY, first_seen INTEGER NOT NULL)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS contacts(biz TEXT PRIMARY KEY, tel TEXT, addr TEXT)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS buyreq(id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, ip TEXT, kind TEXT, cat TEXT, item TEXT, state TEXT, area TEXT, name TEXT, tel TEXT, memo TEXT, sent INTEGER NOT NULL DEFAULT 0)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS opens(uid TEXT NOT NULL, day TEXT NOT NULL, biz TEXT NOT NULL, PRIMARY KEY(uid, day, biz))')
  ]);
  READY = true;
}
const today = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); // 한국 날짜
const qs = (n) => Array(n).fill('?').join(',');

// 이 계정이 지금 어떤 상태인지: pro(일감 마스터) · trial(일감 맛보기) · free(무료)
async function account(env, me) {
  const now = Date.now();
  await env.DB.prepare('INSERT OR IGNORE INTO users(uid, first_seen) VALUES(?, ?)').bind(me.uid, now).run();
  const u = await env.DB.prepare('SELECT first_seen FROM users WHERE uid = ?').bind(me.uid).first();
  const st = await status(env, me.uid);
  const trialUntil = u.first_seen + TRIAL_DAYS * 86400000;
  const trial = !st.pro && now < trialUntil;
  const day = today();
  const used = (await env.DB.prepare('SELECT COUNT(*) n FROM opens WHERE uid = ? AND day = ?').bind(me.uid, day).first()).n;
  return { ...st, trial, trialUntil, tier: st.pro ? 'pro' : trial ? 'trial' : 'free', limit: FREE_DAILY, used };
}

// 연락처 요청. open=false 는 "이미 열린 것만 보여 달라"(열람 건수를 쓰지 않음), open=true 는 "열어 달라".
async function contacts(env, me, bizs, open) {
  const A = await account(env, me);
  const day = today();
  const got = await env.DB.prepare('SELECT biz, tel, addr FROM contacts WHERE biz IN (' + qs(bizs.length) + ')').bind(...bizs).all();
  const have = {}; for (const r of got.results) have[r.biz] = r;
  const out = {};
  if (A.tier !== 'free') {                       // 프로·체험: 전부 공개
    const ins = [];
    for (const b of bizs) if (have[b]) { out[b] = { t: have[b].tel || '', a: have[b].addr || '' }; if (open) ins.push(env.DB.prepare('INSERT OR IGNORE INTO opens(uid, day, biz) VALUES(?, ?, ?)').bind(me.uid, day, b)); }
    if (ins.length) await env.DB.batch(ins);
  } else {                                       // 무료: 하루 FREE_DAILY 건
    const prev = await env.DB.prepare('SELECT biz FROM opens WHERE uid = ? AND day = ? AND biz IN (' + qs(bizs.length) + ')').bind(me.uid, day, ...bizs).all();
    const was = new Set(prev.results.map((r) => r.biz));
    let used = A.used; const ins = [];
    for (const b of bizs) {
      if (!have[b]) continue;
      if (was.has(b)) out[b] = { t: have[b].tel || '', a: have[b].addr || '' };
      else if (open && used < FREE_DAILY) { used++; ins.push(env.DB.prepare('INSERT OR IGNORE INTO opens(uid, day, biz) VALUES(?, ?, ?)').bind(me.uid, day, b)); out[b] = { t: have[b].tel || '', a: have[b].addr || '' }; }
    }
    if (ins.length) await env.DB.batch(ins);
  }
  const fresh = await account(env, me);
  return { ok: true, tier: fresh.tier, used: fresh.used, limit: FREE_DAILY, trialUntil: fresh.trialUntil, contacts: out, locked: bizs.filter((b) => have[b] && !out[b]) };
}

// 관리자 전용: 매일 최신 연락처를 채워 넣습니다.
async function admin(req, env, url) {
  const key = req.headers.get('X-Admin') || '';
  if (!env.ADMIN_SECRET || key.length !== env.ADMIN_SECRET.length) return J(req, { ok: false, message: 'forbidden' }, 403);
  let diff = 0; for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ env.ADMIN_SECRET.charCodeAt(i);
  if (diff) return J(req, { ok: false, message: 'forbidden' }, 403);
  await init(env);
  if (url.pathname === '/admin/contacts' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch (e) { return J(req, { ok: false, message: 'bad json' }, 400); }
    const rows = (b.rows || []).filter((r) => /^\d{10}$/.test(r[0])).slice(0, 500);
    const st = env.DB.prepare('INSERT INTO contacts(biz, tel, addr) VALUES(?, ?, ?) ON CONFLICT(biz) DO UPDATE SET tel = excluded.tel, addr = excluded.addr WHERE tel IS NOT excluded.tel OR addr IS NOT excluded.addr');
    if (rows.length) await env.DB.batch(rows.map((r) => st.bind(r[0], String(r[1] || '').slice(0, 40), String(r[2] || '').slice(0, 200))));
    return J(req, { ok: true, n: rows.length });
  }
  if (url.pathname === '/admin/buy-pending') {
    const r = await env.DB.prepare('SELECT id, ts, kind, cat, item, state, area, name, tel, memo FROM buyreq WHERE sent = 0 ORDER BY id LIMIT 50').all();
    return J(req, { ok: true, rows: r.results || [] });
  }
  if (url.pathname === '/admin/buy-sent' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch (e) { return J(req, { ok: false, message: 'bad json' }, 400); }
    const ids = (b.ids || []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50);
    if (ids.length) await env.DB.prepare('UPDATE buyreq SET sent = 1 WHERE id IN (' + ids.map(() => '?').join(',') + ')').bind(...ids).run();
    return J(req, { ok: true, n: ids.length });
  }
  if (url.pathname === '/admin/count') {
    const c = await env.DB.prepare('SELECT COUNT(*) n FROM contacts').first();
    const u = await env.DB.prepare('SELECT COUNT(*) n FROM users').first();
    return J(req, { ok: true, contacts: c.n, users: u.n });
  }
  return J(req, { ok: false, message: 'not found' }, 404);
}

// 매입문의 접수(로그인 불필요). 같은 IP는 1시간에 5건까지, 입력값은 길이를 제한해 저장합니다.
async function buy(req, env) {
  if (!env.DB) return J(req, { ok: false, message: '지금은 접수할 수 없어요. 잠시 뒤 다시 시도해 주세요.' }, 500);
  let b; try { b = await req.json(); } catch (e) { return J(req, { ok: false, message: '입력을 확인해 주세요.' }, 400); }
  if (b.hp) return J(req, { ok: true }); // 자동 입력 방지용 숨은 칸이 채워지면 조용히 무시
  const t = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const item = t(b.item, 120), name = t(b.name, 30), tel = String(b.tel || '').replace(/[^0-9]/g, '');
  if (!item || !name || tel.length < 9 || tel.length > 11) return J(req, { ok: false, message: '입력을 확인해 주세요.' }, 400);
  await init(env);
  const ip = (req.headers.get('CF-Connecting-IP') || '').slice(0, 64), now = Date.now();
  const c = await env.DB.prepare('SELECT COUNT(*) n FROM buyreq WHERE ip = ? AND ts > ?').bind(ip, now - 3600000).first();
  if (c && c.n >= 5) return J(req, { ok: false, message: '잠시 뒤에 다시 보내 주세요.' }, 429);
  await env.DB.prepare('INSERT INTO buyreq(ts, ip, kind, cat, item, state, area, name, tel, memo) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(now, ip, b.kind === 'ask' ? 'ask' : 'buy', t(b.cat, 20),item, t(b.state, 120), t(b.area, 40), name, tel, t(b.memo, 600)).run();
  return J(req, { ok: true });
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    env = { ...env, PRO: env.PRO || env.PR0 }; // 이름 철자(O/0) 어느 쪽이든 동작
    const url = new URL(req.url);
    if (url.pathname.startsWith('/admin/')) { if (!env.DB) return J(req, { ok: false, message: 'DB 연결이 없습니다.' }, 500); return admin(req, env, url); }
    if (url.pathname === '/buy' && req.method === 'POST') return buy(req, env);
    const me = await whoami(req);
    if (!me) return J(req, { ok: false, message: '로그인이 필요합니다.' }, 401);

    if (url.pathname === '/status') return J(req, { ok: true, ...(await status(env, me.uid)) });

    if (url.pathname === '/me' || url.pathname === '/contacts') {
      if (!env.DB) return J(req, { ok: false, message: 'DB 연결이 없습니다.' }, 500);
      await init(env);
      if (url.pathname === '/me') return J(req, { ok: true, ...(await account(env, me)) });
      let b; try { b = await req.json(); } catch (e) { return J(req, { ok: false, message: '요청이 올바르지 않습니다.' }, 400); }
      const bizs = [...new Set((b.bizs || []).filter((x) => /^\d{10}$/.test(x)))].slice(0, 60);
      if (!bizs.length) return J(req, { ok: true, contacts: {}, locked: [] });
      return J(req, await contacts(env, me, bizs, !!b.open));
    }

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
