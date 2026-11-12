// 업체 전용 페이지: 로그인한 사용자에게만 서버가 번호를 내려 줍니다.
(function () {
  var box = document.getElementById('ct'); if (!box) return;
  var API = 'https://ilgam-pay.newntguy.workers.dev', biz = box.getAttribute('data-biz'), busy = false;
  function line(k, node) {
    var l = document.createElement('div'); l.className = 'l';
    var s = document.createElement('span'); s.textContent = k; l.appendChild(s); l.appendChild(node); return l;
  }
  function txt(t) { var b = document.createElement('b'); b.textContent = t; return b; }
  function paint() {
    var A = window.IGAUTH; if (busy || !A || !A.ready || !A.user) return; busy = true;
    A.token().then(function (t) {
      return fetch(API + '/contacts', { method: 'POST', headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ bizs: [biz], open: true }) }).then(function (r) { return r.json(); });
    }).then(function (r) {
      if (!r || !r.ok) throw new Error('fail');
      var ct = r.contacts && r.contacts[biz], parent = box.parentNode, rows = [];
      if (ct) {
        if (ct.a) rows.push(line('주소', txt(ct.a.replace(/\s*\(\s*\)\s*/g, ' ').replace(/-0(?=\s|\(|$)/g, '').replace(/\s+/g, ' ').trim())));
        if (ct.t) { var a = document.createElement('a'); a.textContent = ct.t; a.href = 'tel:' + ct.t.replace(/[^0-9+]/g, ''); rows.push(line('대표 전화', a)); }
        if (!rows.length) rows.push(line('연락처', txt('등록된 정보가 없습니다')));
      } else if ((r.locked || []).indexOf(biz) >= 0) {
        var ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
        var mk = function (dots, label) { var q = document.createElement('a'); q.className = 'lock'; q.setAttribute('data-pro', '1'); q.href = '/pro.html'; q.innerHTML = ICON + '<span class="dots"></span> '; q.querySelector('.dots').textContent = dots; q.appendChild(document.createTextNode(label)); return q; };
        rows.push(line('주소', mk('••• ••••• ••• ••••', '일감 마스터에서 열림')));
        rows.push(line('대표 전화', mk('031-•••-••••', '전화번호 보기 · 30일 49,900원')));
      } else rows.push(line('연락처', txt('등록된 정보가 없습니다')));
      var c0 = document.getElementById('ct0'); if (c0) c0.parentNode.removeChild(c0);
      rows.forEach(function (n) { parent.insertBefore(n, box); }); parent.removeChild(box);
    }).catch(function () { busy = false; });
  }
  window.addEventListener('ig-auth', paint); paint();
})();

// 팝업 안에서 열린 경우: 링크를 눌러도 이 창이 바뀌지 않고, 바깥 화면이 처리합니다.
(function () {
  if (location.search.indexOf('embed') < 0 || window.parent === window) return;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (a.getAttribute('data-pro')) { e.preventDefault(); parent.postMessage({ ig: 'pro' }, location.origin); }
    else if (a.classList.contains('lock') || h.indexOf('join=1') > -1) { e.preventDefault(); parent.postMessage({ ig: 'join' }, location.origin); }
    else if (h.indexOf('pro.html') > -1) { e.preventDefault(); parent.postMessage({ ig: 'pro' }, location.origin); }
  });
})();

// 팝업: 낙찰 내역을 보여 줍니다. 비회원에게는 현장명·발주처를 흐리게 가립니다(마지막 단어만 보임).
(function () {
  if (location.search.indexOf('embed') < 0) return;
  var cells = [];
  document.querySelectorAll('section.card').forEach(function (s) {
    var h = s.querySelector('h2'); if (!h || h.textContent.indexOf('낙찰 이력') < 0) return;
    s.querySelectorAll('td b, td small').forEach(function (n) { cells.push({ n: n, t: n.textContent }); });
  });
  function apply() {
    var A = window.IGAUTH; if (!A) return;
    var mem = !!A.user;
    cells.forEach(function (c) {
      c.n.textContent = '';
      if (mem) { c.n.textContent = c.t; return; }
      var i = c.t.trim().lastIndexOf(' ');
      if (i < 0) { var w = document.createElement('span'); w.className = 'bl'; w.textContent = c.t; c.n.appendChild(w); return; }
      var p = document.createElement('span'); p.className = 'bl'; p.textContent = c.t.slice(0, i + 1);
      c.n.appendChild(p); c.n.appendChild(document.createTextNode(c.t.slice(i + 1)));
    });
  }
  window.addEventListener('ig-auth', apply); apply();
})();
