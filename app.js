(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TABS = [
    { id: 'win', label: '새 일감', desc: '방금 낙찰된 현장과 업체', ready: true },
    { id: 'co', label: '업체', ready: true, hidden: true },
    { id: 'st', label: '통계', desc: '지역·공종별 낙찰 현황', ready: true },
    { id: 'wl', label: '관심', desc: '담아 둔 업체의 새 낙찰 알림', ready: true },
    { id: 'bid', label: '입찰', ready: false, hidden: true },
    { id: 'con', label: '계약', ready: false, hidden: true },
    { id: 'sell', label: '내 물건 팔기', desc: '팔고 싶은 물건 올리기', href: 'market/?c=sell' },
    { id: 'need', label: '필요한 물품 구해요', desc: '필요한 물품 올리고 제안 받기', href: 'market/?c=need' },
    { id: 'about', label: '회사 소개', desc: '일감마켓이 시작된 이야기', href: 'about.html' }
  ];
  var PAGE = 30;
  var S = { corp: {}, openCo: '', openWin: '', band: 0, tab: 'win', region: '전체', kind: '전체', q: '', sort: 'd', period: 'd3', shown: PAGE, items: [], sample: false, maxD: '' };

  var HT = (location.hash || '').slice(1);
  if (['win', 'co', 'st', 'wl', 'bid', 'con'].indexOf(HT) > -1) S.tab = HT;

  // 관심 업체: 이 기기에 저장합니다. { 업체명: { b: 사업자번호, seen: 마지막으로 확인한 낙찰일 } }
  var WL = {};
  try { WL = JSON.parse(localStorage.getItem('ilgam_wl') || '{}') || {}; } catch (e) { WL = {}; }
  function wlSave() { try { localStorage.setItem('ilgam_wl', JSON.stringify(WL)); } catch (e) {} }
  var RG = [];                  // 지역 알림: 고른 지역 이름들
  try { RG = JSON.parse(localStorage.getItem('ilgam_rg') || '[]') || []; } catch (e) { RG = []; }
  function rgSave() { try { localStorage.setItem('ilgam_rg', JSON.stringify(RG)); } catch (e) {} }
  function cloudList() { return Object.keys(WL).concat(RG.map(function (r) { return '@지역:' + r; })); }
  var NOTIFY = true;            // 이메일 알림 켜짐 여부(로그인 시 클라우드와 동기화)
  var syncT = 0;
  function cloudPush() {
    if (!window.IGAUTH || !window.IGAUTH.user) return;
    clearTimeout(syncT);
    syncT = setTimeout(function () { window.IGAUTH.push(cloudList(), NOTIFY).catch(function () {}); }, 400);
  }
  function cloudSync() {
    var A = window.IGAUTH; if (!A || !A.user) return;
    A.pull().then(function (r) {
      if (r) {
        (r.cos || []).forEach(function (k) {
          if (k.indexOf('@지역:') === 0) { var g = k.slice(4); if (RG.indexOf(g) < 0) RG.push(g); }
          else if (!WL[k]) WL[k] = { b: bizOf(k), seen: S.maxD };
        });
        NOTIFY = r.notify !== false;
      }
      wlSave(); rgSave(); render(); return A.push(cloudList(), NOTIFY);
    }).catch(function () {});
  }
  function bizOf(name) { for (var i = 0; i < S.items.length; i++) if (S.items[i].co === name && S.items[i].b) return S.items[i].b; return ''; }
  var joinShown = false;
  (function () { var j = document.getElementById('hjoin'); if (!j) return; j.addEventListener('click', function () { openLogin('signup'); }); var it = document.getElementById('intro'), ij = document.getElementById('introjoin'); if (ij) ij.addEventListener('click', function () { openLogin('signup'); }); function sync() { var m = !!(window.IGAUTH && window.IGAUTH.user); j.hidden = m; if (it) it.hidden = m; } window.addEventListener('ig-auth', sync); sync(); })();
  window.addEventListener('ig-auth', function () {
    if (window.IGAUTH.user) loadMe(); else { ME = null; CT = {}; CTLOCK = {}; CTNONE = {}; paintTier(); }
    render(); if (window.IGAUTH.user && S.items.length) cloudSync();
    if (!window.IGAUTH.user && !joinShown && /[?&]join=1/.test(location.search)) { joinShown = true; openLogin('signup'); }
  });
  function wlCount() { return Object.keys(WL).length; }
  function starBtn(name, biz, cls) {
    var b = el('button', 'star' + (cls ? ' ' + cls : ''), WL[name] ? '★' : '☆');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(!!WL[name]));
    b.setAttribute('aria-label', name + (WL[name] ? ' 관심 업체에서 빼기' : ' 관심 업체에 담기'));
    b.title = WL[name] ? '관심 업체에서 빼기' : '관심 업체에 담기';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (WL[name]) delete WL[name]; else WL[name] = { b: biz || '', seen: S.maxD };
      wlSave(); cloudPush(); render();
      if (WL[name] && !(window.IGAUTH && window.IGAUTH.user)) hint();
    });
    return b;
  }

  var toastT = 0;
  function hint() {
    if (sessionStorage.getItem('ig_hint')) return;
    try { sessionStorage.setItem('ig_hint', '1'); } catch (e) {}
    var t = $('toast'); t.textContent = '';
    t.appendChild(el('span', null, '담았습니다. 로그인하면 새 낙찰을 메일로 받아요.'));
    var b = el('button', null, '로그인'); b.type = 'button'; b.addEventListener('click', function () { t.classList.remove('on'); openLogin(); });
    t.appendChild(b); t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 6000);
  }
  var mode = 'login';
  function openLogin(m) { setMode(m === 'signup' ? 'signup' : 'login'); $('lgErr').textContent = ''; var d = $('lg'); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); $('lgEm').focus(); }
  function setMode(m) {
    mode = m;
    $('lgTitle').textContent = m === 'login' ? '로그인' : '무료 가입';
    $('lgGo').textContent = m === 'login' ? '로그인' : '가입하고 시작';
    $('lgSwap').textContent = m === 'login' ? '처음이세요? 무료 가입' : '이미 계정이 있어요';
    $('lgPw').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('lgReset').hidden = m !== 'login';
  }
  $('lgSwap').addEventListener('click', function () { setMode(mode === 'login' ? 'signup' : 'login'); $('lgErr').textContent = ''; });
  $('lgClose').addEventListener('click', function () { $('lg').close(); });
  $('lgReset').addEventListener('click', function () {
    var em = $('lgEm').value.trim(); if (!em) { $('lgErr').textContent = '위에 이메일을 먼저 적어 주세요.'; return; }
    window.IGAUTH.reset(em).then(function () { $('lgErr').textContent = '재설정 메일을 보냈습니다. 메일함을 확인해 주세요.'; }, function (e) { $('lgErr').textContent = e.message; });
  });
  $('lgForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var A = window.IGAUTH; if (!A) { $('lgErr').textContent = '잠시 뒤 다시 시도해 주세요.'; return; }
    var btn = $('lgGo'); btn.disabled = true; $('lgErr').textContent = '';
    A[mode === 'login' ? 'login' : 'signup']($('lgEm').value.trim(), $('lgPw').value).then(function () {
      $('lg').close(); $('lgPw').value = '';
    }, function (er) { $('lgErr').textContent = er.message; }).then(function () { btn.disabled = false; });
  });

  // ---- 이용 상태·연락처: 번호는 서버가 가입 상태를 확인한 뒤에만 내려 줍니다 ----
  var API = 'https://ilgam-pay.newntguy.workers.dev';
  var ME = null, CT = {}, CTLOCK = {}, CTNONE = {};
  function srv(path, body) {
    var A = window.IGAUTH;
    if (!A || !A.user) return Promise.reject(new Error('login'));
    return A.token().then(function (t) {
      return fetch(API + path, { method: body ? 'POST' : 'GET', headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); });
    });
  }
  function loadMe() {
    return srv('/me').then(function (r) { ME = r && r.ok ? r : null; paintTier(); return ME; }, function () { ME = null; paintTier(); return null; });
  }
  // 업체 번호를 요청합니다. open=true 는 "열어 주세요"(무료는 하루 3곳까지 소진)
  function getContacts(bizs, open) {
    var need = bizs.filter(function (b) { return !CT[b] && !CTLOCK[b] && !CTNONE[b]; });
    if (!need.length) return Promise.resolve();
    return srv('/contacts', { bizs: need, open: !!open }).then(function (r) {
      if (!r || !r.ok) throw new Error('fail');
      need.forEach(function (b) {
        if (r.contacts && r.contacts[b]) CT[b] = r.contacts[b];
        else if ((r.locked || []).indexOf(b) >= 0) CTLOCK[b] = true;
        else CTNONE[b] = true;
      });
      if (ME) { ME.tier = r.tier; ME.used = r.used; ME.limit = r.limit; } paintTier();
    });
  }
  function daysLeft(ms) { return Math.max(0, Math.ceil((ms - Date.now()) / 86400000)); }
  function paintTier() {
    var t = $('tier'), dl = $('dl'), A = window.IGAUTH;
    if (dl) { var locked = !!(A && A.user && ME && ME.tier === 'free'); dl.textContent = locked ? '엑셀로 받기 · 일감 마스터' : '엑셀로 받기'; dl.classList.toggle('locked', locked); }
    if (!t) return;
    if (!A || !A.user || !ME) { t.hidden = true; return; }
    t.hidden = false; t.className = 'tier ' + ME.tier;
    if (ME.tier === 'trial') t.textContent = '일감 맛보기 ' + daysLeft(ME.trialUntil) + '일 남음';
    else if (ME.tier === 'pro') { var d = new Date(ME.until); t.textContent = '일감 마스터 · ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일까지'; }
    else t.textContent = '무료 · 오늘 연락처 ' + ME.used + '/' + ME.limit + '곳';
  }
  var LOCK_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function lockLine(box, label, why, btnText, onBtn, dots) {
    var l = el('div', 'cl lockline'); l.appendChild(el('span', 'k', label));
    var v = el('span', 'v lockv'); v.innerHTML = LOCK_SVG; v.appendChild(el('span', 'dots', dots || '031-•••-••••')); l.appendChild(v);
    l.appendChild(el('span', 'why', why));
    if (btnText) { var b = el('button', 'cp unlock', btnText); b.type = 'button'; b.addEventListener('click', function (e) { e.stopPropagation(); onBtn(); }); l.appendChild(b); }
    box.appendChild(l);
  }
  function paintContact(box, biz) {
    box.textContent = '';
    function row(k, v, extra) {
      var l = el('div', 'cl'); l.appendChild(el('span', 'k', k));
      var sp = el('span', 'v'); if (typeof v === 'string') sp.textContent = v; else sp.appendChild(v);
      l.appendChild(sp); if (extra) l.appendChild(extra); box.appendChild(l);
    }
    var A = window.IGAUTH;
    if (!A || !A.user) { lockLine(box, '주소', '가입하면 보입니다', null, null, '경기 ••••• ••• ••••'); lockLine(box, '대표 전화', '가입하면 보입니다', '무료 가입', function () { openLogin('signup'); }); return; }
    var ct = CT[biz];
    if (ct) {
      if (ct.a) { var ad = ct.a.replace(/\s*\(\s*\)\s*/g, ' ').replace(/-0(?=\s|\(|$)/g, '').replace(/\s+/g, ' ').trim(); row('주소', ad, copyBtn(ad)); }
      if (ct.t) { var ta = el('a', null, ct.t); ta.href = 'tel:' + ct.t.replace(/[^0-9+]/g, ''); row('대표 전화', ta, copyBtn(ct.t)); }
      if (!ct.a && !ct.t) row('연락처', '등록된 정보가 없습니다');
      return;
    }
    if (CTNONE[biz]) { row('연락처', '등록된 정보가 없습니다'); return; }
    if (CTLOCK[biz]) { lockLine(box, '대표 전화', '오늘 ' + (ME ? ME.limit : 3) + '곳을 모두 확인하셨습니다', '일감 마스터 보기', function () { location.href = 'pro.html'; }); return; }
    row('연락처', '불러오는 중…');
    getContacts([biz], true).then(function () { paintContact(box, biz); }, function () { box.textContent = ''; row('연락처', '불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.'); });
  }
  function renderAcc() {
    var A = window.IGAUTH, box = $('acc'); box.textContent = '';
    var fc = $('fcta'); if (fc) { fc.hidden = !!(A && A.user); if (!fc.getAttribute('data-b')) { fc.setAttribute('data-b', '1'); $('fctab').addEventListener('click', function () { openLogin('signup'); }); } }
    if (!A || !A.user) {
      var b = el('button', null, '로그인'); b.type = 'button'; b.addEventListener('click', openLogin); box.appendChild(b); return;
    }
    var b2 = el('button', null, '내 계정 ▾'); b2.type = 'button'; b2.setAttribute('aria-haspopup', 'true');
    var m = el('div', 'menu'); m.hidden = true;
    m.appendChild(el('div', 'em', A.user.email));
    var w = el('button', null, '★ 내 관심 업체'); w.type = 'button';
    w.addEventListener('click', function () { m.hidden = true; S.tab = 'wl'; try { history.replaceState(null, '', '#wl'); } catch (e) {} render(); });
    var o = el('button', null, '로그아웃'); o.type = 'button'; o.addEventListener('click', function () { m.hidden = true; A.logout(); });
    m.appendChild(w); m.appendChild(o);
    b2.addEventListener('click', function (e) { e.stopPropagation(); m.hidden = !m.hidden; });
    box.appendChild(b2); box.appendChild(m);
  }
  document.addEventListener('click', function (e) { var m = document.querySelector('#acc .menu'); if (m && !m.contains(e.target)) m.hidden = true; });
  function accountCard() {
    var A = window.IGAUTH, box = el('div', 'acct');
    if (!A || !A.user) {
      var l = el('div', 'at'); l.appendChild(el('b', null, '로그인하면 새 낙찰을 메일로 알려 드립니다'));
      l.appendChild(el('span', null, '담은 업체에 새 낙찰이 생기면 아침에 한 통으로 보내고, 폰과 PC에서 같은 목록을 봅니다. 무료입니다.'));
      box.appendChild(l);
      var b = el('button', 'btn', '로그인 · 무료 가입'); b.type = 'button'; b.addEventListener('click', openLogin); box.appendChild(b);
      return box;
    }
    var l2 = el('div', 'at'); l2.appendChild(el('b', null, '새 낙찰 이메일 알림'));
    l2.appendChild(el('span', null, A.user.email + ' 로 매일 아침, 담은 업체에 새 낙찰이 있을 때만 보냅니다.'));
    box.appendChild(l2);
    var sw = el('button', 'sw'); sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', String(NOTIFY));
    sw.setAttribute('aria-label', '새 낙찰 이메일 알림'); sw.appendChild(el('i'));
    sw.addEventListener('click', function () { NOTIFY = !NOTIFY; sw.setAttribute('aria-checked', String(NOTIFY)); cloudPush(); });
    box.appendChild(sw);
    var lo = el('button', 'lo', '로그아웃'); lo.type = 'button'; lo.addEventListener('click', function () { A.logout(); }); box.appendChild(lo);
    return box;
  }

  function regionCard() {
    var A = window.IGAUTH, logged = !!(A && A.user);
    var box = el('div', 'acct rgc');
    var free = !!(logged && ME && ME.tier === 'free'), cap = free ? 1 : 20;
    var l = el('div', 'at'); l.appendChild(el('b', null, '지역 알림 · 업체를 고르지 않아도 됩니다'));
    l.appendChild(el('span', null, !logged
      ? '지역을 고른 뒤 위에서 로그인하면 그 지역의 새 낙찰을 메일로 받습니다.'
      : free ? '무료는 1개 지역의 새 낙찰을 매일 아침 메일로 보내 드립니다. 여러 지역은 일감 마스터에서 받으실 수 있습니다.'
             : '고른 지역의 새 낙찰을 매일 아침 한 통으로 보내 드립니다. 여러 지역을 고를 수 있습니다.'));
    box.appendChild(l);
    var chips = el('div', 'chips rgchips'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', '알림 받을 지역');
    uniq('rg').filter(function (g) { return g !== '미분류'; }).forEach(function (g) {
      var b = el('button', 'chip', g); b.type = 'button';
      b.setAttribute('aria-pressed', String(RG.indexOf(g) > -1));
      b.addEventListener('click', function () {
        var i = RG.indexOf(g);
        if (i > -1) RG.splice(i, 1);
        else if (RG.length >= cap) {
          if (free) { var m = box.querySelector('.rgfull'); if (!m) { m = el('div', 'rgfull'); box.appendChild(m); }
            m.textContent = ''; m.appendChild(document.createTextNode('무료는 지역 1곳까지 받을 수 있습니다. ')); var pb = el('button', 'lo', '일감 마스터 보기'); pb.type = 'button'; pb.addEventListener('click', function () { location.href = 'pro.html'; }); m.appendChild(pb); }
          return;
        } else RG.push(g);
        rgSave(); cloudPush(); render();
      });
      chips.appendChild(b);
    });
    box.appendChild(chips);
    return box;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function money(n) {
    if (!n) return '-';
    var eok = n / 1e8;
    if (eok >= 10000) return (eok / 1e4).toFixed(1) + '조';
    if (eok >= 1) return (eok >= 100 ? eok.toFixed(0) : eok.toFixed(1)) + '억';
    return Math.round(n / 1e4).toLocaleString('ko-KR') + '만';
  }
  function dshort(d) { return d ? d.slice(5).replace('-', '.') : ''; }

  function ago(days) {
    var d = new Date(S.maxD + 'T00:00:00'); d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }
  function filtered() {
    var q = S.q.trim().toLowerCase();
    var from = '';
    if (S.tab === 'win' && S.maxD) from = S.period === 'last' ? S.maxD : S.period === 'd3' ? ago(2) : S.period === 'week' ? ago(6) : '';
    return S.items.filter(function (r) {
      if (from && (r.d || '') < from) return false;
      if (S.region !== '전체' && r.rg !== S.region) return false;
      if (S.kind !== '전체' && r.kind !== S.kind) return false;
      if (q && (r.nm + ' ' + r.co + ' ' + r.dm).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  var IC = { win: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>', st: '<path d="M5 20v-7M12 20V5M19 20V10"/>', wl: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>', sell: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>', need: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>', about: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>' };
  function renderGnb() {
    var g = $('gnb'); g.textContent = '';
    TABS.forEach(function (t) {
      var b, ic = IC[t.id] || '';
      if (t.hidden) return;
      if (t.href) { b = el('a', 'tablink', t.label); b.href = t.href; }
      else {
        b = el('button', t.ready ? null : 'soonTab', t.label);
        if (t.id === 'wl') { b.textContent = '관심 업체'; if (wlCount()) b.appendChild(el('i', 'cnt', String(wlCount()))); }
        b.type = 'button';
        b.setAttribute('aria-current', String(S.tab === t.id || (t.id === 'win' && S.tab === 'co')));
        b.addEventListener('click', function () { S.tab = t.id; S.shown = PAGE; try { history.replaceState(null, '', '#' + t.id); } catch (e) {} render(); });
      }
      if (t.id === 'sell' || t.id === 'about') b.className += ' sep';
      if (t.desc) b.title = t.desc;
      if (ic) { var sp = el('span', 'em'); sp.setAttribute('aria-hidden', 'true'); sp.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ic + '</svg>'; b.insertBefore(sp, b.firstChild); }
      g.appendChild(b);
    });
  }

  function fillSelect(sel, values, cur) {
    sel.textContent = '';
    values.forEach(function (v) {
      var o = el('option', null, v); o.value = v; if (v === cur) o.selected = true; sel.appendChild(o);
    });
  }

  function uniq(key) {
    var m = {};
    S.items.forEach(function (r) { if (r[key]) m[r[key]] = (m[r[key]] || 0) + 1; });
    return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; });
  }

  function renderChips() {
    var c = $('regionChips'); c.textContent = '';
    ['전체'].concat(uniq('rg').slice(0, 6)).forEach(function (v) {
      var b = el('button', 'chip', v); b.type = 'button';
      b.setAttribute('aria-pressed', String(S.region === v));
      b.addEventListener('click', function () { S.region = v; S.shown = PAGE; $('fRegion').value = v; render(); });
      c.appendChild(b);
    });
  }

  function act(r) {
    var body = '현장: ' + r.nm + '\n지역: ' + (r.rg || '') + (r.kind ? ' · ' + r.kind : '') + '\n';
    var a = el('a', 'act', '이 현장으로 글쓰기');
    a.href = 'market/?type=sell&title=' + encodeURIComponent(r.nm.slice(0, 70)) + '&body=' + encodeURIComponent(body);
    return a;
  }

  function renderWin(list) {
    var board = $('board'); board.textContent = '';
    if (!list.length) { board.appendChild(el('div', 'empty', '조건에 맞는 낙찰이 없습니다. 지역이나 검색어를 바꿔 보세요.')); return; }
    var hd = el('div', 'hd');
    ['지역', '공종', (window.IGAUTH && window.IGAUTH.user) ? '현장명 · 발주처 · 낙찰 업체 (누르면 업체 정보)' : '현장명 · 발주처 · 낙찰 업체 (누르면 업체 정보 · 현장은 가입하면 보임)', '낙찰 금액'].forEach(function (t, i) {
      var s = el('span', null, t); if (i === 3) s.style.textAlign = 'right'; hd.appendChild(s);
    });
    board.appendChild(hd);
    list.slice(0, S.shown).forEach(function (r) {
      var row = el('div', 'row');
      row.appendChild(el('span', 'rg', r.rg || '-'));
      row.appendChild(el('span', 'kd', r.kind || ''));
      var nm = el('div', 'nm'), mem = !!(window.IGAUTH && window.IGAUTH.user);
      nm.appendChild(mem ? document.createTextNode(r.nm) : lockSplit(r.nm));
      if (r.s === '낙찰예정') nm.appendChild(el('span', 'tag', '낙찰 예정'));
      var sm2 = el('small', null); if (mem) sm2.textContent = r.dm; else sm2.appendChild(lockSplit(r.dm)); nm.appendChild(sm2);
      var src = r.u;
      if (!src && /^[A-Z0-9]+-\d{3}$/.test(r.id || '')) {
        var pr = r.id.split('-');
        src = 'https://www.g2b.go.kr/link/PNPE027_01/single/?bidPbancNo=' + pr[0] + '&bidPbancOrd=' + pr[1];
      }
      var wn = el('div', 'wn');
      wn.appendChild(el('span', 'wlab', '낙찰'));
      wn.appendChild(el('b', null, r.co));
      wn.appendChild(starBtn(r.co, r.b));
      nm.appendChild(wn);
      row.appendChild(nm);
      var am = el('div', 'am', money(r.amt));
      am.appendChild(el('small', null, dshort(r.d) + (r.np ? ' · ' + r.np + '개사 참여' : '')));
      row.appendChild(am);
      var hasBz = !!r.b; if (!hasBz) S.items.forEach(function (x) { if (x.co === r.co && x.b) hasBz = true; });
      if (hasBz) { row.classList.add('click'); row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-label', r.co + ' 업체 정보 보기'); }
      var openCo = function () {
        var bz = r.b || ''; if (!bz) S.items.forEach(function (x) { if (x.co === r.co && x.b) bz = x.b; });
        if (bz) openShare({ co: r.co, biz: bz });
      };
      if (hasBz) row.addEventListener('click', function (e) { if (e.target.closest('button,a')) return; openCo(); });
      if (hasBz) row.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === row) { e.preventDefault(); openCo(); } });
      board.appendChild(row);
    });
    if (list.length > S.shown) {
      var m = el('div', 'more'); var b = el('button', null, '더 보기 (' + (list.length - S.shown) + '건 남음)'); b.type = 'button';
      b.addEventListener('click', function () { S.shown += PAGE; render(); });
      m.appendChild(b); board.appendChild(m);
    }
  }

  function fmtBiz(b) { b = (b || '').replace(/\D/g, ''); return b.length === 10 ? b.slice(0, 3) + '-' + b.slice(3, 5) + '-' + b.slice(5) : b; }
  function srcOf(r) {
    var u = r.u;
    if (!u && /^[A-Z0-9]+-\d{3}$/.test(r.id || '')) { var p = r.id.split('-'); u = 'https://www.g2b.go.kr/link/PNPE027_01/single/?bidPbancNo=' + p[0] + '&bidPbancOrd=' + p[1]; }
    return u && /^https:\/\/([a-z0-9.-]+\.)?g2b\.go\.kr\//.test(u) ? u : '';
  }
  function openShare(c, src) {
    var d = $('sh');
    if (!d) {
      d = document.createElement('dialog'); d.id = 'sh';
      d.innerHTML = '<div class="lh"><h3 id="shName"></h3><button type="button" class="cp" id="shCopy">링크 복사</button><button type="button" class="x" aria-label="닫기">×</button></div><iframe id="shFrame" title="업체 페이지"></iframe>';
      document.body.appendChild(d);
      d.querySelector('.x').addEventListener('click', function () { d.close(); });
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
      $('shCopy').addEventListener('click', function () {
        var b = this, u = d.getAttribute('data-url');
        try { navigator.clipboard.writeText(u).then(function () { b.textContent = '복사됨'; setTimeout(function () { b.textContent = '링크 복사'; }, 1500); }); } catch (x) { b.textContent = '복사 실패'; }
      });
      window.addEventListener('message', function (e) {
        if (e.origin !== location.origin || !e.data || !e.data.ig) return;
        if (e.data.ig === 'join') { d.close(); openLogin('signup'); }
        else if (e.data.ig === 'pro') location.href = 'pro.html';
      });
    }
    var url = location.origin + '/c/' + c.biz + '/';
    d.setAttribute('data-url', url); $('shName').textContent = c.co || ''; $('shCopy').textContent = '링크 복사';
    $('shFrame').src = src || ('/c/' + c.biz + '/?embed=1'); $('shCopy').hidden = !!src; d.classList.toggle('doc', !!src);
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function openDoc(title, href) {
    openShare({ biz: '', co: title }, href);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="policy.html"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    var h = a.getAttribute('href'), t = /#refund/.test(h) ? '환불규정' : /#privacy/.test(h) ? '개인정보 처리방침' : '이용약관';
    openDoc(t, h);
  });
  function copyBtn(text) {
    var b = el('button', 'cp', '복사'); b.type = 'button';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      try { navigator.clipboard.writeText(text).then(function () { b.textContent = '복사됨'; setTimeout(function () { b.textContent = '복사'; }, 1500); }); } catch (x) { b.textContent = '복사 실패'; }
    });
    return b;
  }
  function lockSplit(t, wrap) {
    var f = document.createDocumentFragment(), w = String(t || '').trim().split(/\s+/);
    if (w.length < 2) { f.appendChild(el('span', 'bl', t || '')); return f; }
    var last = w.pop();
    f.appendChild(el('span', 'bl', w.join(' '))); f.appendChild(document.createTextNode(' ' + last));
    return f;
  }
  function maskText(t) {
    return String(t || '').split(/\s+/).filter(Boolean).map(function (w) {
      var core = w.replace(/[()（）\[\],]/g, '');
      return core.length <= 1 ? '•' : core.charAt(0) + new Array(Math.min(core.length - 1, 5) + 1).join('•');
    }).join(' ');
  }
  function coDetail(c) {
    var A = window.IGAUTH, member = !!(A && A.user);
    var d = el('div', 'cdet');
    var tot = 0; c.rows.forEach(function (r) { tot += r.amt || 0; });
    var top = el('div', 'dtop');
    var sm = el('div', 'dsum');
    sm.appendChild(el('b', null, '낙찰 ' + c.rows.length + '건 · 합계 ' + money(tot)));
    top.appendChild(sm);
    if (c.biz) {
      var pg = el('button', 'sbtn', '업체 정보 보기'); pg.type = 'button';
      pg.addEventListener('click', function () { openShare(c); }); top.appendChild(pg);
    }
    d.appendChild(top);
    var tb = el('div', 'wlist');
    c.rows.slice(0, 8).forEach(function (r) {
      var w = el('div', 'wi');
      var l = el('div', 'wl');
      var site = el('div', 'wsite'); if (member) site.textContent = r.nm; else site.appendChild(lockSplit(r.nm)); l.appendChild(site);
      var sub = [r.dm, (r.rg || '') + (r.kind ? ' · ' + r.kind : '')].filter(Boolean);
      var ds = el('div', 'wsub'); var dm = el('span', null); if (member) dm.textContent = r.dm || ''; else dm.appendChild(lockSplit(r.dm)); if (r.dm) ds.appendChild(dm);
      ds.appendChild(document.createTextNode((r.dm ? '  ' : '') + (r.rg || '') + (r.kind ? ' · ' + r.kind : '')));
      l.appendChild(ds);
      w.appendChild(l);
      var rt = el('div', 'wr2'); rt.appendChild(el('b', null, money(r.amt))); rt.appendChild(el('small', null, dshort(r.d) + ' 낙찰')); w.appendChild(rt);
      tb.appendChild(w);
    });
    d.appendChild(tb);
    if (!member) {
      var cta = el('div', 'wcta');
      var t = el('span', null); t.innerHTML = LOCK_SVG; t.appendChild(document.createTextNode(' 가입하면 현장명 · 발주처 · 주소 · 대표 전화가 모두 보입니다'));
      cta.appendChild(t);
      var jb = el('button', 'go', '무료 가입'); jb.type = 'button'; jb.addEventListener('click', function () { openLogin('signup'); });
      cta.appendChild(jb); d.appendChild(cta);
    }
    return d;
  }

  function renderCo(list, wl) {
    var board = $('board'); board.textContent = '';
    var by = {};
    list.forEach(function (r) {
      var c = by[r.co] || (by[r.co] = { co: r.co, n: 0, sum: 0, rg: {}, biz: '', rows: [] });
      c.n++; c.sum += r.amt || 0; c.rg[r.rg] = (c.rg[r.rg] || 0) + 1; c.rows.push(r);
      if (r.b) c.biz = r.b;
    });
    if (wl) Object.keys(WL).forEach(function (k) { if (!by[k]) by[k] = { co: k, n: 0, sum: 0, rg: {}, biz: WL[k].b || '', rows: [] }; });
    Object.keys(by).forEach(function (k) {
      var c = by[k]; var seen = (WL[k] && WL[k].seen) || '';
      c.fresh = WL[k] ? c.rows.filter(function (r) { return r.d > seen; }).length : 0;
    });
    var arr = Object.keys(by).map(function (k) {
      var c = by[k]; c.top = Object.keys(c.rg).sort(function (a, b) { return c.rg[b] - c.rg[a]; })[0] || '-'; return c;
    }).sort(function (a, b) { return wl ? (b.fresh - a.fresh || b.sum - a.sum) : (b.sum - a.sum); });
    if (!arr.length) {
      var em = el('div', 'soon');
      if (wl) {
        em.appendChild(el('b', null, '아직 담은 업체가 없습니다.'));
        em.appendChild(el('p', null, '업체 이름 옆의 ☆를 누르면 여기에 모입니다. 새 낙찰이 생기면 NEW로 알려 드립니다.'));
        var go = el('button', 'btn', '낙찰 업체 둘러보기'); go.type = 'button';
        go.addEventListener('click', function () { S.tab = 'co'; S.shown = PAGE; try { history.replaceState(null, '', '#co'); } catch (e) {} render(); });
        em.appendChild(go);
      } else em.appendChild(el('b', null, '조건에 맞는 업체가 없습니다.'));
      board.appendChild(em); return 0;
    }
    var hd = el('div', 'chd');
    ['업체명', '주요 지역', '낙찰 건수', '낙찰 합계'].forEach(function (t, i) { var s = el('span', null, t); if (i === 3) s.style.textAlign = 'right'; hd.appendChild(s); });
    board.appendChild(hd);
    arr.slice(0, S.shown).forEach(function (c) {
      var wrap = el('div', 'cwrap');
      var row = el('button', 'crow'); row.type = 'button';
      var open = S.openCo === c.co;
      row.setAttribute('aria-expanded', String(open));
      var nmc = el('span', 'nm', c.co);
      if (c.fresh) nmc.appendChild(el('span', 'new', 'NEW ' + c.fresh));
      row.appendChild(nmc);
      row.appendChild(el('span', 'kd c2', c.top));
      row.appendChild(el('span', 'co c3', c.n ? c.n + '건' : '낙찰 없음'));
      row.appendChild(el('span', 'am c4', money(c.sum)));
      row.addEventListener('click', function () { S.openCo = open ? '' : c.co; render(); });
      wrap.appendChild(row);
      wrap.appendChild(starBtn(c.co, c.biz, 'abs'));
      if (open) wrap.appendChild(coDetail(c));
      board.appendChild(wrap);
    });
    if (arr.length > S.shown) {
      var m = el('div', 'more'); var b = el('button', null, '더 보기 (' + (arr.length - S.shown) + '곳 남음)'); b.type = 'button';
      b.addEventListener('click', function () { S.shown += PAGE; render(); });
      m.appendChild(b); board.appendChild(m);
    }
    return arr.length;
  }


  // ---- 통계 ----
  var BANDS = [['전체 금액', 0, 1e18], ['1억 미만', 0, 1e8], ['1억~3억', 1e8, 3e8], ['3억~10억', 3e8, 1e9], ['10억~50억', 1e9, 5e9], ['50억 이상', 5e9, 1e18]];
  function quant(a, p) { if (!a.length) return 0; var i = (a.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); }
  function pct(n) { return n.toFixed(2) + '%'; }
  function scard(title, sub, wide) { var c = el('section', 'scard' + (wide ? ' wide' : '')); c.appendChild(el('h3', null, title)); if (sub) c.appendChild(el('p', 'ssub', sub)); return c; }
  function hbars(rows, fmt, onClick) {
    var box = el('div', 'hbars'), mx = rows.reduce(function (m, r) { return Math.max(m, r.v); }, 0) || 1;
    rows.forEach(function (r, i) {
      var row = el(onClick ? 'button' : 'div', 'hb'); if (onClick) { row.type = 'button'; row.addEventListener('click', function () { onClick(r); }); }
      row.appendChild(el('span', 'hn', (r.rank ? (i + 1) + '  ' : '') + r.k));
      var tr = el('span', 'tr'), f = el('i'); f.style.width = Math.max(2, r.v / mx * 100) + '%'; tr.appendChild(f); row.appendChild(tr);
      row.appendChild(el('span', 'hv', fmt(r))); box.appendChild(row);
    });
    return box;
  }
  function renderStats(list) {
    var board = $('board'); board.textContent = '';
    var b = BANDS[S.band];
    var inBand = list.filter(function (r) { return (r.amt || 0) >= b[1] && (r.amt || 0) < b[2]; });
    if (!inBand.length) { board.appendChild(el('div', 'empty', '조건에 맞는 낙찰이 없습니다. 지역이나 금액대를 바꿔 보세요.')); return; }
    var rates = inBand.map(function (r) { return parseFloat(r.rate); }).filter(function (x) { return x >= 50 && x <= 110; }).sort(function (a, b2) { return a - b2; });
    var npA = inBand.map(function (r) { return parseInt(r.np, 10) || 0; }).filter(Boolean);
    var sum = inBand.reduce(function (a, r) { return a + (r.amt || 0); }, 0);
    var wrap = el('div', 'stats');

    // 금액대 선택
    var bar = el('div', 'bandbar'); bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', '금액대');
    BANDS.forEach(function (x, i) { var c = el('button', 'chip', x[0]); c.type = 'button'; c.setAttribute('aria-pressed', String(S.band === i)); c.addEventListener('click', function () { S.band = i; render(); }); bar.appendChild(c); });
    wrap.appendChild(bar);

    // 핵심 숫자
    var kp = el('div', 'kpis');
    [[inBand.length.toLocaleString('ko-KR') + '건', '낙찰'], [rates.length ? pct(quant(rates, .5)) : '-', '낙찰률 중앙값'], [npA.length ? Math.round(npA.reduce(function (a, x) { return a + x; }, 0) / npA.length).toLocaleString('ko-KR') + '개사' : '-', '평균 참여 업체'], [money(sum), '낙찰 금액 합계']].forEach(function (k) {
      var d = el('div', 'kpi'); d.appendChild(el('b', null, k[0])); d.appendChild(el('span', null, k[1])); kp.appendChild(d);
    });
    wrap.appendChild(kp);

    var grid = el('div', 'sgrid'); wrap.appendChild(grid);
    var colL = el('div', 'scol'), colR = el('div', 'scol');

    // 낙찰률 분포
    var h = scard('낙찰률 분포', rates.length ? '낙찰된 업체 중 절반이 ' + pct(quant(rates, .25)) + ' ~ ' + pct(quant(rates, .75)) + ' 사이에 썼습니다.' : '낙찰률 자료가 없습니다.', true);
    if (rates.length) {
      var LO = 86, HI = 96, STEP = .5, N = (HI - LO) / STEP, bins = []; for (var i = 0; i < N; i++) bins.push(0);
      var out = 0; rates.forEach(function (x) { if (x < LO || x >= HI) out++; else bins[Math.floor((x - LO) / STEP)]++; });
      var mx = Math.max.apply(null, bins) || 1, med = quant(rates, .5), p25 = quant(rates, .25), p75 = quant(rates, .75);
      var hist = el('div', 'hist');
      bins.forEach(function (c, i) {
        var from = LO + i * STEP, col = el('div', 'col'); var f = el('i'); f.style.height = Math.max(c ? 3 : 0, Math.sqrt(c / mx) * 100) + '%';
        if (from + STEP > p25 && from <= p75) f.className = 'mid';
        col.title = from.toFixed(1) + '~' + (from + STEP).toFixed(1) + '% · ' + c + '건'; col.appendChild(f); hist.appendChild(col);
      });
      h.appendChild(hist);
      var ax = el('div', 'axis'); [86, 88, 90, 92, 94, 96].forEach(function (v) { ax.appendChild(el('span', null, v + '%')); }); h.appendChild(ax);
      h.appendChild(el('p', 'snote', '진한 막대가 가운데 50%입니다. 막대 높이는 건수의 제곱근이라 적은 구간도 보입니다. 중앙값 ' + pct(med) + ' · ' + LO + '~' + HI + '% 밖 ' + out + '건은 그래프에서 뺐습니다. 낙찰률은 같은 공사의 예정가격 대비 낙찰 금액 비율입니다.'));
    }
    grid.appendChild(h);

    // 금액대별 경쟁 강도 (금액대 선택과 무관하게 비교)
    var cp = scard('금액대별 경쟁 강도', '평균 몇 개 업체가 참여했는지 비교합니다.');
    var crow = BANDS.slice(1).map(function (x) {
      var ps = list.filter(function (r) { return (r.amt || 0) >= x[1] && (r.amt || 0) < x[2]; }).map(function (r) { return parseInt(r.np, 10) || 0; }).filter(Boolean);
      return { k: x[0], v: ps.length ? ps.reduce(function (a, y) { return a + y; }, 0) / ps.length : 0, n: ps.length };
    });
    cp.appendChild(hbars(crow, function (r) { return r.n ? Math.round(r.v).toLocaleString('ko-KR') + '개사' : '-'; }));
    colL.appendChild(cp);

    // 업체 TOP
    function agg(key, keyFn) {
      var m = {}; inBand.forEach(function (r) { var k = keyFn(r); if (!k) return; var o = m[k] || (m[k] = { k: k, v: 0, n: 0 }); o.v += r.amt || 0; o.n++; });
      return Object.keys(m).map(function (k) { m[k].rank = true; return m[k]; }).sort(function (a, b2) { return b2.v - a.v; }).slice(0, 10);
    }
    var tc = scard('낙찰 업체 TOP 10', '낙찰 금액 합계 기준입니다. 눌러서 업체 정보를 봅니다.');
    tc.appendChild(hbars(agg('co', function (r) { return r.co; }), function (r) { return money(r.v) + ' · ' + r.n + '건'; }, function (r) { S.tab = 'co'; S.q = r.k; S.openCo = r.k; S.period = 'all'; S.shown = PAGE; $('fQ').value = r.k; try { history.replaceState(null, '', '#co'); } catch (e) {} render(); }));
    colR.appendChild(tc);
    var td = scard('공사를 많이 내는 발주처 TOP 10', '낙찰 금액 합계 기준입니다.');
    td.appendChild(hbars(agg('dm', function (r) { return r.dm; }), function (r) { return money(r.v) + ' · ' + r.n + '건'; }));
    colL.appendChild(td);

    // 일별 추이
    var days = {}; inBand.forEach(function (r) { if (r.d) days[r.d] = (days[r.d] || 0) + 1; });
    var dk = Object.keys(days).sort(), dm = Math.max.apply(null, dk.map(function (k) { return days[k]; })) || 1;
    var dc = scard('일별 낙찰 건수', dk.length ? dshort(dk[0]) + ' ~ ' + dshort(dk[dk.length - 1]) + ' · 하루 최대 ' + dm + '건' : '');
    var dh = el('div', 'hist days'); dk.forEach(function (k) { var col = el('div', 'col'); var f = el('i'); f.style.height = Math.max(3, days[k] / dm * 100) + '%'; col.title = dshort(k) + ' · ' + days[k] + '건'; col.appendChild(f); dh.appendChild(col); });
    dc.appendChild(dh); colR.appendChild(dc); grid.appendChild(colL); grid.appendChild(colR);
    wrap.appendChild(el('p', 'snote', '조달청 나라장터 공공데이터 기준이며 위의 지역·공종·검색 조건이 함께 적용됩니다.'));
    board.appendChild(wrap);
  }

  function render() {
    renderGnb(); renderChips(); renderAcc();
    var tab = TABS.filter(function (t) { return t.id === S.tab; })[0];
    var board = $('board');
    $('title').textContent = tab.id === 'win' || tab.id === 'co' ? '새 일감' : tab.label;
    $('fPeriod').hidden = tab.id !== 'win'; $('fSort').hidden = false; $('dl').hidden = true;
    if (!tab.ready) {
      board.textContent = '';
      var s = el('div', 'soon'); s.appendChild(el('b', null, tab.label + ' 데이터는 준비 중입니다.'));
      s.appendChild(el('p', null, '지금은 낙찰과 업체를 먼저 열었습니다.')); board.appendChild(s);
      $('meta').textContent = ''; return;
    }
    if (S.tab === 'st') {
      $('regionChips').hidden = false; $('fSort').hidden = true; $('fPeriod').hidden = true;
      var sl = filtered(); renderStats(sl); $('title').textContent = '입찰 통계';
      $('meta').textContent = '최근 60일 · ' + sl.length.toLocaleString('ko-KR') + '건 기준';
      return;
    }
    if (S.tab === 'wl') {
      $('fPeriod').hidden = true;
      $('regionChips').hidden = true; $('fSort').hidden = true;
      var wlist = S.items.filter(function (r) { return WL[r.co]; });
      wlist.sort(function (a, b) { return b.d < a.d ? -1 : b.d > a.d ? 1 : 0; });
      var seenBefore = JSON.stringify(WL);
      var cn = renderCo(wlist, true);
      $('board').insertBefore(regionCard(), $('board').firstChild);
      $('board').insertBefore(accountCard(), $('board').firstChild);
      $('meta').textContent = wlCount() ? '관심 업체 ' + wlCount() + '곳' + (window.IGAUTH && window.IGAUTH.user ? '' : ' · 이 기기에 저장됩니다') : '';
      $('title').textContent = '관심 업체';
      // 이번에 보여 준 낙찰은 확인한 것으로 기록합니다 (다음 방문부터 NEW가 사라집니다)
      Object.keys(WL).forEach(function (k) { WL[k].seen = S.maxD; });
      if (JSON.stringify(WL) !== seenBefore) wlSave();
      return;
    }
    $('regionChips').hidden = false; $('fSort').hidden = false; $('dl').hidden = false;
    var list = filtered().slice();
    list.sort(function (a, b) { return S.sort === 'amt' ? (b.amt - a.amt) : (b.d < a.d ? -1 : b.d > a.d ? 1 : b.amt - a.amt); });
    if (S.tab === 'win') { renderWin(list); $('meta').textContent = '총 ' + list.length + '건' + (S.maxD ? ' · ' + S.maxD.slice(5).replace('-', '월 ') + '일 기준' : ''); }
    else { var n = renderCo(list); $('meta').textContent = '낙찰 업체 ' + (n || 0) + '곳 · 아래 조건 기준'; }
  }

  function renderStat() {
    var box = $('hstat'); if (!S.maxD || !S.items.length) return;
    var day = S.items.filter(function (r) { return r.d === S.maxD; });
    var sum = 0, cos = {}; day.forEach(function (r) { sum += r.amt || 0; cos[r.co] = 1; });
    var top = day.slice().sort(function (a, b) { return (b.amt || 0) - (a.amt || 0); }).slice(0, 3);
    box.textContent = '';
    box.appendChild(el('div', 'hl', S.maxD.slice(5).replace('-', '월 ') + '일 낙찰 요약'));
    var n = el('div', 'nums');
    [[String(day.length), '건', '낙찰'], [money(sum).replace(/[억만]$/, ''), money(sum).slice(-1), '낙찰 금액'], [String(Object.keys(cos).length), '곳', '업체']].forEach(function (x) {
      var d = el('div'); var b = el('b', null, x[0]); b.appendChild(el('small', null, x[1])); d.appendChild(b); d.appendChild(el('span', null, x[2])); n.appendChild(d);
    });
    box.appendChild(n);
    var ol = el('ol');
    top.forEach(function (r) {
      var li = el('li'), b = el('div', 'it');
      b.appendChild(el('span', 't', r.nm)); b.appendChild(el('span', 'a', money(r.amt)));
      b.appendChild(el('span', 'c', (r.rg || '') + ' · ' + r.co));
      li.appendChild(b); ol.appendChild(li);
    });
    box.appendChild(ol); box.hidden = false;
  }

  function boot(data) {
    S.items = data.items || []; S.corp = data.corp || {}; S.sample = !!data.sample;
    S.maxD = S.items.reduce(function (m, r) { return r.d && r.d > m ? r.d : m; }, '');
    fillSelect($('fRegion'), ['전체'].concat(uniq('rg')), S.region);
    fillSelect($('fKind'), ['전체'].concat(uniq('kind')), S.kind);
    if (data.updated) $('upd').textContent = data.updated.replace('T', ' ').replace(/(\d{2}:\d{2}).*$/, '$1') + ' 갱신';
    if (S.sample) { var b = el('div', 'banner', '지금 보이는 데이터는 화면 확인용 예시입니다. 실제 낙찰 정보가 아닙니다.'); $('banner').appendChild(b); }
    Object.keys(WL).forEach(function (k) { if (!WL[k].b) WL[k].b = bizOf(k); });
    renderStat(); render(); cloudSync();
  }

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    S.region = $('fRegion').value; S.kind = $('fKind').value; S.q = $('fQ').value; S.shown = PAGE;
    render();
  });
  $('fRegion').addEventListener('change', function () { S.region = this.value; S.shown = PAGE; render(); });
  $('fKind').addEventListener('change', function () { S.kind = this.value; S.shown = PAGE; render(); });

  // 지금 화면 조건 그대로 엑셀(CSV, 한글 깨짐 방지 BOM)로 저장
  function csvCell(v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function say(msg) { var tt = $('toast'); tt.textContent = msg; tt.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { tt.classList.remove('on'); }, 2600); }
  function downloadList() {
    var A = window.IGAUTH;
    if (!A || !A.user) { openLogin('signup'); return; }
    if (!ME) { say('잠시 뒤 다시 눌러 주세요'); loadMe(); return; }
    if (ME.tier === 'free') { location.href = 'pro.html'; return; }
    var list = filtered().slice();
    list.sort(function (a, b) { return b.d < a.d ? -1 : b.d > a.d ? 1 : b.amt - a.amt; });
    var bizs = []; list.forEach(function (r) { if (r.b && bizs.indexOf(r.b) < 0) bizs.push(r.b); });
    say('연락처를 불러오는 중입니다');
    var chain = Promise.resolve();
    for (var k = 0; k < bizs.length; k += 60) (function (part) { chain = chain.then(function () { return getContacts(part, true); }); })(bizs.slice(k, k + 60));
    chain.then(function () {
      var head = ['낙찰일', '공고명', '발주기관', '지역', '공종', '낙찰업체', '낙찰금액(원)', '낙찰률(%)', '사업자번호', '대표전화', '업체 주소', '공고 링크'];
      var out = [head.map(csvCell).join(',')];
      list.forEach(function (r) {
        var ct = r.b ? CT[r.b] : null;
        out.push([r.d, r.nm, r.dm, r.rg, r.kind, r.co, r.amt || '', r.rate || '', r.b || '', ct && ct.t ? ct.t : '', ct && ct.a ? ct.a : '', r.u || ''].map(csvCell).join(','));
      });
      out.push(''); out.push(csvCell('출처: 일감마켓(ilgammarket.co.kr) · 조달청 나라장터 공공데이터'));
      var blob = new Blob(['﻿' + out.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = '일감마켓_낙찰_' + (S.maxD || 'data') + '.csv'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      say(list.length.toLocaleString('ko-KR') + '건을 엑셀 파일로 저장했습니다');
    }, function () { say('연락처를 불러오지 못했습니다. 잠시 뒤 다시 눌러 주세요'); });
  }
  $('dl').addEventListener('click', downloadList);
  $('fSort').addEventListener('change', function () { S.sort = this.value; render(); });
  $('fPeriod').addEventListener('change', function () { S.period = this.value; S.shown = PAGE; render(); });

  document.querySelector('.brand').addEventListener('click', function (e) {
    e.preventDefault();
    S.tab = 'win'; S.region = '전체'; S.kind = '전체'; S.q = ''; S.sort = 'd'; S.period = 'd3'; S.shown = PAGE;
    $('fRegion').value = '전체'; $('fKind').value = '전체'; $('fQ').value = ''; $('fSort').value = 'd'; $('fPeriod').value = 'd3';
    try { history.replaceState(null, '', location.pathname); } catch (x) {}
    render(); window.scrollTo(0, 0);
  });

  // 앱(안드로이드)에서는 파일이 기기 안에 들어 있으므로 데이터만 홈페이지에서 받아 옵니다.
  var DATA_URL = (location.hostname === 'localhost' || location.protocol === 'capacitor:') ? 'https://ilgammarket.co.kr/data/public.json' : 'data/public.json';
  renderGnb();
  fetch(DATA_URL, { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error(r.status); return r.json();
  }).then(boot).catch(function () {
    $('board').appendChild(el('div', 'err', '데이터를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.'));
  });
})();
