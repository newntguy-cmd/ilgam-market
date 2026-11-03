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
        var p = document.createElement('a'); p.href = '/pro.html'; p.textContent = '오늘 ' + r.limit + '곳을 모두 확인하셨습니다 · 일감 마스터 보기'; rows.push(line('대표 전화', p));
      } else rows.push(line('연락처', txt('등록된 정보가 없습니다')));
      rows.forEach(function (n) { parent.insertBefore(n, box); }); parent.removeChild(box);
    }).catch(function () { busy = false; });
  }
  window.addEventListener('ig-auth', paint); paint();
})();
