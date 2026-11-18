/* 폰 화면 하단 고정 메뉴: 모든 페이지에서 같은 자리·같은 크기로 보입니다. 데스크톱 상단 메뉴는 그대로입니다. */
(function () {
  if (!window.matchMedia || !matchMedia('(max-width:760px)').matches) return;
  if (document.getElementById('igtab')) return;
  var P = location.pathname, H = location.hash;
  var IDX = P === '/' || P === '/index.html';
  var IC = {
    win: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    mk: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
    wl: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    buy: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
  };
  var T = [
    ['win', '낙찰정보', '/#win', '낙찰정보'],
    ['mk', '직거래장터', '/market/', '직거래장터'],
    ['wl', '관심업체', '/#wl', '관심업체'],
    ['buy', '매입의 신', '/buy.html', '매입의 신']
  ];
  var MORE = [['회사소개', '/#home'], ['일감 마스터 이용권', '/pro.html'], ['고객센터·자주 묻는 질문', '/help.html'], ['약관·환불규정', '/market/policy.html']];
  function activeKey() {
    if (P.indexOf('/market/policy') === 0) return 'more';
    if (P.indexOf('/market') === 0) return 'mk';
    if (P.indexOf('/buy') === 0) return 'buy';
    if (P.indexOf('/pro') === 0 || P.indexOf('/help') === 0) return 'more';
    if (P.indexOf('/c/') === 0 || P.indexOf('/a/') === 0) return 'win';
    if (IDX) { var h = (location.hash || '#home').slice(1); return h === 'wl' ? 'wl' : h === 'home' ? '' : 'win'; }
    return '';
  }
  var s = document.createElement('style');
  s.textContent = 'header.top .gnb{display:none!important}'
    + 'body{padding-bottom:calc(64px + env(safe-area-inset-bottom))!important}'
    + '#igtab{position:fixed;left:0;right:0;bottom:0;z-index:2147481000;height:calc(60px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);display:grid;grid-template-columns:repeat(5,1fr);background:#0f2342;border-top:2px solid #c9a45c;box-shadow:0 -6px 20px rgba(5,14,30,.35)}'
    + '#igtab a,#igtab button{all:unset;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:60px;color:#b7c4da;font-size:12.5px;font-weight:600;line-height:1.1;font-family:inherit;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap}'
    + '#igtab svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}'
    + '#igtab [aria-current=true]{color:#e6c883}#igtab [aria-current=true] svg{stroke:#e6c883}'
    + '#igtab :focus-visible{outline:2px solid #e6c883;outline-offset:-4px}'
    + '#igmore{position:fixed;inset:0;z-index:2147481500;display:none;background:rgba(5,12,28,.6)}#igmore.on{display:block}'
    + '#igmore .sh{position:absolute;left:0;right:0;bottom:calc(62px + env(safe-area-inset-bottom));background:#fff;border-radius:20px 20px 0 0;padding:10px 20px 14px;box-shadow:0 -10px 30px rgba(5,14,30,.3)}'
    + '#igmore a{display:block;padding:16px 4px;border-top:1px solid #e3e7ed;color:#0f2342;font-size:17px;font-weight:600;text-decoration:none}#igmore a:first-child{border-top:0}';
  document.head.appendChild(s);
  var nav = document.createElement('nav'); nav.id = 'igtab'; nav.setAttribute('aria-label', '하단 메뉴');
  var ak = activeKey();
  function mk(k, label, svg) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + svg + '</svg><span>' + label + '</span>';
  }
  T.forEach(function (t) {
    var a = document.createElement('a'); a.href = t[2]; a.innerHTML = mk(t[0], t[1], IC[t[0]]);
    if (ak === t[0]) a.setAttribute('aria-current', 'true');
    if (IDX && (t[0] === 'win' || t[0] === 'wl')) {
      a.addEventListener('click', function (e) {
        var b = document.querySelectorAll('header.top .gnb button, header.top .gnb a');
        for (var i = 0; i < b.length; i++) if ((b[i].textContent || '').replace(/\s|\d/g, '') === t[3]) { e.preventDefault(); b[i].click(); window.scrollTo(0, 0); setTimeout(sync, 60); return; }
      });
    }
    nav.appendChild(a);
  });
  var mb = document.createElement('button'); mb.type = 'button'; mb.innerHTML = mk('more', '더보기', IC.more); mb.setAttribute('aria-haspopup', 'true');
  if (ak === 'more') mb.setAttribute('aria-current', 'true');
  nav.appendChild(mb);
  var sheet = document.createElement('div'); sheet.id = 'igmore';
  sheet.innerHTML = '<div class="sh" role="menu">' + MORE.map(function (m) { return '<a href="' + m[1] + '">' + m[0] + '</a>'; }).join('') + '</div>';
  function close() { sheet.classList.remove('on'); }
  mb.addEventListener('click', function () { sheet.classList.toggle('on'); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  sheet.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function (e) {
    if (IDX && a.getAttribute('href') === '/#home') { var b = document.querySelectorAll('header.top .gnb button, header.top .gnb a'); for (var i = 0; i < b.length; i++) if ((b[i].textContent || '').replace(/\s/g, '') === '회사소개') { e.preventDefault(); b[i].click(); window.scrollTo(0, 0); setTimeout(sync, 60); break; } }
    close(); }); });
  function sync() {
    var k = activeKey(), as = nav.children;
    for (var i = 0; i < as.length; i++) as[i].removeAttribute('aria-current');
    var map = { win: 0, mk: 1, wl: 2, buy: 3, more: 4 };
    if (map[k] !== undefined) as[map[k]].setAttribute('aria-current', 'true');
  }
  window.addEventListener('hashchange', sync);
  function add() { document.body.appendChild(nav); document.body.appendChild(sheet); }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();
