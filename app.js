(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TABS = [
    { id: 'win', label: '오늘의 낙찰', ready: true },
    { id: 'co', label: '업체', ready: true },
    { id: 'bid', label: '입찰', ready: false },
    { id: 'con', label: '계약', ready: false },
    { id: 'market', label: '장터', href: 'market/' }
  ];
  var PAGE = 30;
  var S = { tab: 'win', region: '전체', kind: '전체', q: '', sort: 'd', period: 'last', shown: PAGE, items: [], sample: false, maxD: '' };

  var HT = (location.hash || '').slice(1);
  if (['win', 'co', 'bid', 'con'].indexOf(HT) > -1) S.tab = HT;

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
    if (S.tab === 'win' && S.maxD) from = S.period === 'last' ? S.maxD : S.period === 'week' ? ago(6) : '';
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
      if (r.u && /^https:\/\/([a-z0-9.-]+\.)?g2b\.go\.kr\//.test(r.u)) {
        var o = el('a', 'orig', '나라장터 원문 ↗'); o.href = r.u; o.target = '_blank'; o.rel = 'noopener noreferrer';
        nm.appendChild(o);
      }
      row.appendChild(nm);
      row.appendChild(el('span', 'co', r.co));
      var am = el('div', 'am', money(r.amt));
      am.appendChild(el('small', null, dshort(r.d) + (r.np ? ' · ' + r.np + '개사 참여' : '')));
      row.appendChild(am);
      row.appendChild(act(r));
      board.appendChild(row);
    });
    if (list.length > S.shown) {
      var m = el('div', 'more'); var b = el('button', null, '더 보기 (' + (list.length - S.shown) + '건 남음)'); b.type = 'button';
      b.addEventListener('click', function () { S.shown += PAGE; render(); });
      m.appendChild(b); board.appendChild(m);
    }
  }

  function renderCo(list) {
    var board = $('board'); board.textContent = '';
    var by = {};
    list.forEach(function (r) {
      var c = by[r.co] || (by[r.co] = { co: r.co, n: 0, sum: 0, rg: {} });
      c.n++; c.sum += r.amt || 0; c.rg[r.rg] = (c.rg[r.rg] || 0) + 1;
    });
    var arr = Object.keys(by).map(function (k) {
      var c = by[k]; c.top = Object.keys(c.rg).sort(function (a, b) { return c.rg[b] - c.rg[a]; })[0] || '-'; return c;
    }).sort(function (a, b) { return b.sum - a.sum; });
    if (!arr.length) { board.appendChild(el('div', 'empty', '조건에 맞는 업체가 없습니다.')); return; }
    var hd = el('div', 'chd');
    ['업체명', '주요 지역', '낙찰 건수', '낙찰 합계'].forEach(function (t, i) { var s = el('span', null, t); if (i === 3) s.style.textAlign = 'right'; hd.appendChild(s); });
    board.appendChild(hd);
    arr.slice(0, S.shown).forEach(function (c) {
      var row = el('div', 'crow');
      row.appendChild(el('span', 'nm', c.co));
      row.appendChild(el('span', 'kd c2', c.top));
      row.appendChild(el('span', 'co c3', c.n + '건'));
      row.appendChild(el('span', 'am c4', money(c.sum)));
      board.appendChild(row);
    });
    if (arr.length > S.shown) {
      var m = el('div', 'more'); var b = el('button', null, '더 보기 (' + (arr.length - S.shown) + '곳 남음)'); b.type = 'button';
      b.addEventListener('click', function () { S.shown += PAGE; render(); });
      m.appendChild(b); board.appendChild(m);
    }
    return arr.length;
  }

  function render() {
    renderGnb(); renderChips();
    var tab = TABS.filter(function (t) { return t.id === S.tab; })[0];
    var board = $('board');
    $('title').textContent = tab.id === 'win' ? '오늘의 낙찰' : tab.label + ' 검색 결과';
    $('fPeriod').hidden = tab.id !== 'win';
    if (!tab.ready) {
      board.textContent = '';
      var s = el('div', 'soon'); s.appendChild(el('b', null, tab.label + ' 데이터는 준비 중입니다.'));
      s.appendChild(el('p', null, '지금은 낙찰과 업체를 먼저 열었습니다.')); board.appendChild(s);
      $('meta').textContent = ''; return;
    }
    var list = filtered().slice();
    list.sort(function (a, b) { return S.sort === 'amt' ? (b.amt - a.amt) : (b.d < a.d ? -1 : b.d > a.d ? 1 : b.amt - a.amt); });
    if (S.tab === 'win') { renderWin(list); $('meta').textContent = '총 ' + list.length + '건' + (S.period === 'last' && S.maxD ? ' · ' + S.maxD.slice(5).replace('-', '월 ') + '일 기준' : ''); }
    else { var n = renderCo(list); $('meta').textContent = '낙찰 업체 ' + (n || 0) + '곳 · 아래 조건 기준'; }
  }

  function boot(data) {
    S.items = data.items || []; S.sample = !!data.sample;
    S.maxD = S.items.reduce(function (m, r) { return r.d && r.d > m ? r.d : m; }, '');
    fillSelect($('fRegion'), ['전체'].concat(uniq('rg')), S.region);
    fillSelect($('fKind'), ['전체'].concat(uniq('kind')), S.kind);
    if (data.updated) $('upd').textContent = '갱신 ' + data.updated.replace('T', ' ');
    if (S.sample) { var b = el('div', 'banner', '지금 보이는 데이터는 화면 확인용 예시입니다. 실제 낙찰 정보가 아닙니다.'); $('banner').appendChild(b); }
    render();
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

  renderGnb();
  fetch('data/public.json', { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error(r.status); return r.json();
  }).then(boot).catch(function () {
    $('board').appendChild(el('div', 'err', '데이터를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.'));
  });
})();
