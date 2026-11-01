(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TABS = [
    { id: 'win', label: '최근 낙찰', ready: true },
    { id: 'co', label: '업체', ready: true },
    { id: 'wl', label: '관심', ready: true },
    { id: 'bid', label: '입찰', ready: false },
    { id: 'con', label: '계약', ready: false },
    { id: 'market', label: '장터', href: 'market/' }
  ];
  var PAGE = 30;
  var S = { corp: {}, openCo: '', openWin: '', tab: 'win', region: '전체', kind: '전체', q: '', sort: 'd', period: 'd3', shown: PAGE, items: [], sample: false, maxD: '' };

  var HT = (location.hash || '').slice(1);
  if (['win', 'co', 'wl', 'bid', 'con'].indexOf(HT) > -1) S.tab = HT;

  // 관심 업체: 이 기기에 저장합니다. { 업체명: { b: 사업자번호, seen: 마지막으로 확인한 낙찰일 } }
  var WL = {};
  try { WL = JSON.parse(localStorage.getItem('ilgam_wl') || '{}') || {}; } catch (e) { WL = {}; }
  function wlSave() { try { localStorage.setItem('ilgam_wl', JSON.stringify(WL)); } catch (e) {} }
  var NOTIFY = true;            // 이메일 알림 켜짐 여부(로그인 시 클라우드와 동기화)
  var syncT = 0;
  function cloudPush() {
    if (!window.IGAUTH || !window.IGAUTH.user) return;
    clearTimeout(syncT);
    syncT = setTimeout(function () { window.IGAUTH.push(Object.keys(WL), NOTIFY).catch(function () {}); }, 400);
  }
  function cloudSync() {
    var A = window.IGAUTH; if (!A || !A.user) return;
    A.pull().then(function (r) {
      if (r) { (r.cos || []).forEach(function (k) { if (!WL[k]) WL[k] = { b: bizOf(k), seen: S.maxD }; }); NOTIFY = r.notify !== false; }
      wlSave(); render(); return A.push(Object.keys(WL), NOTIFY);
    }).catch(function () {});
  }
  function bizOf(name) { for (var i = 0; i < S.items.length; i++) if (S.items[i].co === name && S.items[i].b) return S.items[i].b; return ''; }
  window.addEventListener('ig-auth', function () { render(); if (window.IGAUTH.user && S.items.length) cloudSync(); });
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
  function openLogin() { setMode('login'); $('lgErr').textContent = ''; var d = $('lg'); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); $('lgEm').focus(); }
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
  function renderAcc() {
    var A = window.IGAUTH, box = $('acc'); box.textContent = '';
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

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function money(n) {
    if (!n) return '-';
    var eok = n / 1e8;
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

  function renderGnb() {
    var g = $('gnb'); g.textContent = '';
    TABS.forEach(function (t) {
      var b;
      if (t.href) { b = el('a', 'tablink', t.label); b.href = t.href; }
      else {
        b = el('button', t.ready ? null : 'soonTab', t.label);
        if (t.id === 'wl') { b.textContent = '★ 관심'; if (wlCount()) b.appendChild(el('i', 'cnt', String(wlCount()))); }
        b.type = 'button';
        b.setAttribute('aria-current', String(S.tab === t.id));
        b.addEventListener('click', function () { S.tab = t.id; S.shown = PAGE; try { history.replaceState(null, '', '#' + t.id); } catch (e) {} render(); });
      }
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
    ['지역', '공종', '현장명 · 발주처', '낙찰 업체', '낙찰 금액', ''].forEach(function (t, i) {
      var s = el('span', null, t); if (i === 4) s.style.textAlign = 'right'; hd.appendChild(s);
    });
    board.appendChild(hd);
    list.slice(0, S.shown).forEach(function (r) {
      var row = el('div', 'row');
      row.appendChild(el('span', 'rg', r.rg || '-'));
      row.appendChild(el('span', 'kd', r.kind || ''));
      var nm = el('div', 'nm');
      nm.appendChild(document.createTextNode(r.nm));
      if (r.s === '낙찰예정') nm.appendChild(el('span', 'tag', '낙찰 예정'));
      nm.appendChild(el('small', null, r.dm));
      var src = r.u;
      if (!src && /^[A-Z0-9]+-\d{3}$/.test(r.id || '')) {
        var pr = r.id.split('-');
        src = 'https://www.g2b.go.kr/link/PNPE027_01/single/?bidPbancNo=' + pr[0] + '&bidPbancOrd=' + pr[1];
      }
      if (src && /^https:\/\/([a-z0-9.-]+\.)?g2b\.go\.kr\//.test(src)) {
        var o = el('a', 'orig', '나라장터 원문 ↗'); o.href = src; o.target = '_blank'; o.rel = 'noopener noreferrer';
        nm.appendChild(o);
      }
      row.appendChild(nm);
      var cob = el('button', 'co colink', r.co); cob.type = 'button'; cob.title = '업체 정보 보기';
      var key = (r.id || '') + '|' + r.co, isOpen = S.openWin === key;
      cob.setAttribute('aria-expanded', String(isOpen));
      cob.addEventListener('click', function () { S.openWin = isOpen ? '' : key; render(); });
      var cw = el('div', 'co cowrap'); cob.className = 'colink';
      cw.appendChild(cob); cw.appendChild(starBtn(r.co, r.b));
      row.appendChild(cw);
      var am = el('div', 'am', money(r.amt));
      am.appendChild(el('small', null, dshort(r.d) + (r.np ? ' · ' + r.np + '개사 참여' : '')));
      row.appendChild(am);
      row.appendChild(act(r));
      board.appendChild(row);
      if (isOpen) {
        var rows = S.items.filter(function (x) { return x.co === r.co; }).sort(function (a, b) { return b.d < a.d ? -1 : b.d > a.d ? 1 : 0; });
        var biz = ''; rows.forEach(function (x) { if (x.b) biz = x.b; });
        var dd = coDetail({ co: r.co, biz: biz, rows: rows }); dd.className += ' wdet';
        board.appendChild(dd);
      }
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
  function copyBtn(text) {
    var b = el('button', 'cp', '복사'); b.type = 'button';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      try { navigator.clipboard.writeText(text).then(function () { b.textContent = '복사됨'; setTimeout(function () { b.textContent = '복사'; }, 1500); }); } catch (x) { b.textContent = '복사 실패'; }
    });
    return b;
  }
  function coDetail(c) {
    var d = el('div', 'cdet');
    var info = el('div', 'cinfo');
    var ct = c.biz ? S.corp[c.biz] : null;
    function line(k, v, extra) {
      var l = el('div', 'cl'); l.appendChild(el('span', 'k', k));
      var s = el('span', 'v'); if (typeof v === 'string') s.textContent = v; else s.appendChild(v);
      l.appendChild(s); if (extra) l.appendChild(extra); info.appendChild(l);
    }
    if (c.biz) {
      line('사업자번호', fmtBiz(c.biz), copyBtn(fmtBiz(c.biz)));
      if (ct && ct.a) { var ad = ct.a.replace(/\s*\(\s*\)\s*/g, ' ').replace(/-0(?=\s|\(|$)/g, '').replace(/\s+/g, ' ').trim(); line('주소', ad, copyBtn(ad)); }
      if (ct && ct.t) { var ta = el('a', null, ct.t); ta.href = 'tel:' + ct.t.replace(/[^0-9+]/g, ''); line('대표 전화', ta, copyBtn(ct.t)); }
      if (!ct || (!ct.a && !ct.t)) line('연락처', '등록된 정보가 없습니다');
      var bz = el('a', 'ext', '비즈노에서 전화·팩스 확인 ↗'); bz.href = 'https://bizno.net/article/' + c.biz; bz.target = '_blank'; bz.rel = 'noopener noreferrer';
      info.appendChild(bz);
      var pg = el('a', 'ext', '이 업체 전용 페이지 (공유용) ↗'); pg.href = 'c/' + c.biz + '/'; pg.style.marginLeft = '16px'; info.appendChild(pg);
      info.appendChild(el('div', 'note', '※ 조달청(나라장터) 등록 정보입니다. 최신 정보와 다를 수 있습니다.'));
    } else {
      info.appendChild(el('div', 'note', '개인사업자는 연락처를 공개하지 않습니다. 공고 원문에서 확인해 주세요.'));
    }
    d.appendChild(info);
    d.appendChild(el('div', 'chist', '최근 낙찰 ' + c.rows.length + '건'));
    c.rows.slice(0, 8).forEach(function (r) {
      var h = el('div', 'hrow');
      h.appendChild(el('span', 'hd1', dshort(r.d)));
      var nm = el('span', 'hn', r.nm); h.appendChild(nm);
      h.appendChild(el('span', 'hm', money(r.amt)));
      var u = srcOf(r);
      if (u) { var o = el('a', 'orig', '원문 ↗'); o.href = u; o.target = '_blank'; o.rel = 'noopener noreferrer'; h.appendChild(o); }
      d.appendChild(h);
    });
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

  function render() {
    renderGnb(); renderChips(); renderAcc();
    var tab = TABS.filter(function (t) { return t.id === S.tab; })[0];
    var board = $('board');
    $('title').textContent = tab.id === 'win' ? '최근 낙찰' : tab.id === 'co' ? '낙찰 업체' : tab.label;
    $('fPeriod').hidden = tab.id !== 'win';
    if (!tab.ready) {
      board.textContent = '';
      var s = el('div', 'soon'); s.appendChild(el('b', null, tab.label + ' 데이터는 준비 중입니다.'));
      s.appendChild(el('p', null, '지금은 낙찰과 업체를 먼저 열었습니다.')); board.appendChild(s);
      $('meta').textContent = ''; return;
    }
    if (S.tab === 'wl') {
      $('fPeriod').hidden = true;
      $('regionChips').hidden = true; $('fSort').hidden = true;
      var wlist = S.items.filter(function (r) { return WL[r.co]; });
      wlist.sort(function (a, b) { return b.d < a.d ? -1 : b.d > a.d ? 1 : 0; });
      var seenBefore = JSON.stringify(WL);
      var cn = renderCo(wlist, true);
      $('board').insertBefore(accountCard(), $('board').firstChild);
      $('meta').textContent = wlCount() ? '관심 업체 ' + wlCount() + '곳' + (window.IGAUTH && window.IGAUTH.user ? '' : ' · 이 기기에 저장됩니다') : '';
      $('title').textContent = '관심 업체';
      // 이번에 보여 준 낙찰은 확인한 것으로 기록합니다 (다음 방문부터 NEW가 사라집니다)
      Object.keys(WL).forEach(function (k) { WL[k].seen = S.maxD; });
      if (JSON.stringify(WL) !== seenBefore) wlSave();
      return;
    }
    $('regionChips').hidden = false; $('fSort').hidden = false;
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
      var li = el('li'), b = el('button'); b.type = 'button';
      b.appendChild(el('span', 't', r.nm)); b.appendChild(el('span', 'a', money(r.amt)));
      b.appendChild(el('span', 'c', (r.rg || '') + ' · ' + r.co));
      b.addEventListener('click', function () { S.tab = 'win'; S.period = 'last'; S.sort = 'amt'; $('fPeriod').value = 'last'; $('fSort').value = 'amt'; S.shown = PAGE; render(); $('res').scrollIntoView({ behavior: 'auto' }); });
      li.appendChild(b); ol.appendChild(li);
    });
    box.appendChild(ol); box.hidden = false;
  }

  function boot(data) {
    S.items = data.items || []; S.corp = data.corp || {}; S.sample = !!data.sample;
    S.maxD = S.items.reduce(function (m, r) { return r.d && r.d > m ? r.d : m; }, '');
    fillSelect($('fRegion'), ['전체'].concat(uniq('rg')), S.region);
    fillSelect($('fKind'), ['전체'].concat(uniq('kind')), S.kind);
    if (data.updated) $('upd').textContent = '갱신 ' + data.updated.replace('T', ' ');
    if (S.sample) { var b = el('div', 'banner', '지금 보이는 데이터는 화면 확인용 예시입니다. 실제 낙찰 정보가 아닙니다.'); $('banner').appendChild(b); }
    Object.keys(WL).forEach(function (k) { if (!WL[k].b) WL[k].b = bizOf(k); });
    renderStat(); render(); cloudSync();
  }

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    S.region = $('fRegion').value; S.kind = $('fKind').value; S.q = $('fQ').value; S.shown = PAGE;
    render(); $('res').scrollIntoView();
  });
  $('fRegion').addEventListener('change', function () { S.region = this.value; S.shown = PAGE; render(); });
  $('fKind').addEventListener('change', function () { S.kind = this.value; S.shown = PAGE; render(); });
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
