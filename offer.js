/* 신규 고객 첫 결제 혜택: 결제 내역이 없는 계정은 30일 39,900원. 서버가 알려 준 값일 때만 화면 가격을 바꿉니다(정상가 49,900원). */
(function () {
  var W = 'https://ilgam-pay.newntguy.workers.dev', O = window.IGOFFER = { on: false, price: 0, list: 49900 }, avail = 0, first = null;
  function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
  function apply() {
    var A = window.IGAUTH, on = !!avail && (!A || !A.user || first === true);
    O.on = on; O.price = avail;
    document.documentElement.classList.toggle('ig-offer', on);
    document.querySelectorAll('[data-of]').forEach(function (e) {
      if (e._o === undefined) e._o = e.innerHTML;
      e.innerHTML = on ? e._o.split(won(O.list)).join(won(avail)).split(won(Math.round(O.list / 30))).join(won(Math.round(avail / 30))) : e._o;
    });
    window.dispatchEvent(new Event('ig-offer'));
  }
  function status() {
    var A = window.IGAUTH; first = null;
    if (!A || !A.user || !avail) { apply(); return; }
    apply();
    A.token().then(function (t) { return fetch(W + '/status', { headers: { Authorization: 'Bearer ' + t } }); })
      .then(function (r) { return r.json(); }).then(function (d) { first = !!(d && d.first === true && d.firstPrice === avail); apply(); })
      .catch(function () { first = false; apply(); });
  }
  fetch(W + '/offer').then(function (r) { return r.json(); }).then(function (d) {
    if (d && d.ok && d.firstPrice > 0 && d.firstPrice < d.listPrice) { avail = d.firstPrice; O.list = d.listPrice; status(); }
  }).catch(function () {});
  window.addEventListener('ig-auth', status);
})();
