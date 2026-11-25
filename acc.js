/* 일감마켓 '내 계정' 공통 메뉴 — 첫 화면·낙찰 목록·업체·요금·고객센터·직거래장터 어디서나 똑같이 보이고 똑같이 동작합니다.
   (첫 화면은 app.js 가 같은 모양으로 그립니다. 메뉴 항목·순서·문구를 바꾸면 app.js 의 renderAcc 도 함께 바꿉니다.) */
(function () {
  'use strict';
  var box = document.getElementById('acc');
  if (!box || document.getElementById('gnb')) return;   // 첫 화면은 app.js 가 처리
  var API = 'https://ilgam-pay.newntguy.workers.dev';
  var ME = null, built = false, menu = null;

  function cached() { try { return JSON.parse(localStorage.getItem('ig_me')) || null; } catch (e) { return null; } }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function label(me) {
    if (me && me.tier === 'pro' && me.until) { var d = new Date(me.until); return '일감 마스터 · ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일까지'; }
    return '일감 마스터 이용권 · 결제 내역';
  }

  function build(user) {
    var me = ME || cached() || {};
    box.textContent = '';
    if (me.tier !== 'pro') {
      var pay = el('button', 'jn pay', '결제하기'); pay.type = 'button'; pay.id = 'tjn';
      pay.addEventListener('click', function () { location.href = '/pro.html#buy'; });
      box.appendChild(pay);
    }
    var b = el('button', null, '내 계정 ▾'); b.type = 'button'; b.id = 'tme'; b.setAttribute('aria-haspopup', 'true');
    var m = el('div', 'menu'); m.hidden = true;
    m.appendChild(el('div', 'em', user.email || ''));
    var w = el('button', null, '★ 내 관심업체'); w.type = 'button'; w.addEventListener('click', function () { location.href = '/#wl'; });
    var p = el('button', null, label(me)); p.type = 'button'; p.addEventListener('click', function () { location.href = '/pro.html'; });
    m.appendChild(w); m.appendChild(p);
    if (me.admin) { var ad = el('button', null, '관리자 통계'); ad.type = 'button'; ad.addEventListener('click', function () { location.href = '/admin.html'; }); m.appendChild(ad); }
    var o = el('button', null, '로그아웃'); o.type = 'button';
    o.addEventListener('click', function () { m.hidden = true; try { localStorage.removeItem('ig_me'); } catch (e) {} window.IGAUTH.logout().then(function () { location.reload(); }, function () { location.reload(); }); });
    m.appendChild(o);
    b.addEventListener('click', function (e) { e.stopPropagation(); m.hidden = !m.hidden; });
    box.appendChild(b); box.appendChild(m);
    menu = m; built = true;
  }

  // 로그인했던 분이 '내 계정'을 누르면 로그인 확인이 끝나기 전에도 다른 화면으로 튕기지 않게, 확인될 때까지 기다립니다.
  box.addEventListener('click', function (e) {
    var t = e.target; if (!t || t.id !== 'tme') return;
    if (built) return;
    if (cached()) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  document.addEventListener('click', function (e) { if (menu && !menu.contains(e.target) && e.target.id !== 'tme') menu.hidden = true; });

  function refresh() {
    var A = window.IGAUTH;
    if (!A || !A.ready) return;
    if (!A.user) { built = false; try { localStorage.removeItem('ig_me'); } catch (e) {} return; }
    build(A.user);
    A.token().then(function (tk) {
      return fetch(API + '/me', { headers: { 'Authorization': 'Bearer ' + tk } }).then(function (r) { return r.json(); });
    }).then(function (r) {
      if (!r || !r.ok) return;
      ME = r; try { localStorage.setItem('ig_me', JSON.stringify(r)); } catch (e) {}
      var open = menu && !menu.hidden; build(A.user); if (open && menu) menu.hidden = false;
    }, function () {});
  }

  window.addEventListener('ig-auth', refresh);
  if (window.IGAUTH && window.IGAUTH.ready) refresh();
  else if (!window.IGAUTH) { var s = document.createElement('script'); s.type = 'module'; s.src = '/auth.js'; document.head.appendChild(s); }
})();
