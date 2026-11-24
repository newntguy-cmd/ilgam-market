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
    ms: '<path d="M12 3l8 6-8 12L4 9z"/><path d="M4 9h16"/>',
    cs: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/>',
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
    + '#igtab{position:fixed;left:0;right:0;bottom:0;z-index:2147481000;height:calc(60px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);display:grid;grid-template-columns:repeat(5,1fr);background:#3f4349;border-top:2px solid #c9a45c;box-shadow:0 -6px 20px rgba(29,31,33,.35)}'
    + '#igtab a,#igtab button{all:unset;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:60px;color:#d8c8b9;font-size:12.5px;font-weight:600;line-height:1.1;font-family:inherit;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap}'
    + '#igtab svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}'
    + '#igtab [aria-current=true]{color:#e6c883}#igtab [aria-current=true] svg{stroke:#e6c883}'
    + '#igtab :focus-visible{outline:2px solid #e6c883;outline-offset:-4px}'
    + '#igmore{position:fixed;inset:0;z-index:2147481500;display:none;background:#fff;overflow-y:auto;-webkit-overflow-scrolling:touch}#igmore.on{display:block}'
    + '#igmore .hd{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:0 16px;height:60px;background:#fff;border-bottom:1px solid #e3e7ed;font-size:19px;font-weight:800;color:#2d3134}'
    + '#igmore .x{all:unset;box-sizing:border-box;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#f1f3f7;cursor:pointer}#igmore .x svg{width:22px;height:22px;stroke:#2d3134;stroke-width:2.2;fill:none;stroke-linecap:round}'
    + '#igmore .bd{padding:16px 16px calc(150px + env(safe-area-inset-bottom))}'
    + '#igmore h4{margin:22px 4px 10px;font-size:13.5px;font-weight:700;color:#42474c}'
    + '#igmore .tl{display:grid;grid-template-columns:1fr 1fr;gap:10px}#igmore .tl a{display:flex;align-items:center;gap:10px;min-height:56px;padding:0 14px;border-radius:14px;background:#f1f3f7;color:#2d3134;font-size:16.5px;font-weight:700;text-decoration:none}'
    + '#igmore .tl svg{width:24px;height:24px;flex:none;fill:none;stroke:#a8791f;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}'
    + '#igmore .rg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}#igmore .rg a{display:flex;align-items:center;justify-content:center;min-height:46px;border-radius:12px;border:1px solid #e3e7ed;color:#2d3134;font-size:15px;font-weight:600;text-decoration:none;text-align:center;line-height:1.2}'
    + '#igmore .ls a{display:block;padding:17px 4px;border-bottom:1px solid #e3e7ed;color:#2d3134;font-size:17px;font-weight:600;text-decoration:none}#igmore .ls a small{display:block;margin-top:3px;font-size:13.5px;font-weight:400;color:#42474c}'
    + '#igmore .ft{position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #e3e7ed}#igmore .ft a{flex:1;display:flex;align-items:center;justify-content:center;height:52px;border-radius:14px;font-size:17px;font-weight:800;text-decoration:none;border:1px solid #2d3134;color:#2d3134;background:#fff}#igmore .ft a.p{background:#c9a45c;border-color:#8a6a28}';
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
  var REG = ['서울','경기','인천','부산','대구','대전','광주-전남','울산','세종','강원','충북','충남','전북','경북','경남','제주'];
  var CATS = [['전기','전기'],['통신','통신'],['소방','소방'],['기계설비','기계설비'],['토목·도로','토목-도로'],['건축','건축'],['조경','조경'],['상하수도','상하수도'],['산림','산림'],['인테리어','인테리어'],['도장·방수','도장-방수'],['철거·해체','철거-해체'],['승강기','승강기']];
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function ti(h, ic, t, dt) { return '<a href="' + h + '"' + (dt ? ' data-go="' + dt + '"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[ic] + '</svg>' + t + '</a>'; }
  var logged = false; try { logged = !!localStorage.getItem('ig_me'); } catch (e) {}
  sheet.innerHTML = '<div class="hd"><span>전체메뉴</span><button type="button" class="x" aria-label="닫기">' + X + '</button></div><div class="bd">'
    + '<h4>바로가기</h4><div class="tl">' + ti('/#win', 'win', '낙찰정보', '낙찰정보') + ti('/market/', 'mk', '직거래장터') + ti('/#wl', 'wl', '관심업체', '관심업체') + ti('/buy.html', 'buy', '매입의 신') + ti('/pro.html', 'ms', '일감 마스터') + ti('/help.html', 'cs', '고객센터') + '</div>'
    + '<h4>지역별 낙찰</h4><div class="rg">' + REG.map(function (r) { return '<a href="/a/' + r + '/">' + r.replace('-', '·') + '</a>'; }).join('') + '</div>'
    + '<h4>입찰공고</h4><div class="ls"><a href="/b/">입찰 중인 공사 공고<small>마감이 가까운 순, 지역별로 모았어요</small></a></div>'
    + '<h4>분야별 낙찰</h4><div class="rg">' + CATS.map(function (c) { return '<a href="/a/전국/' + c[1] + '/">' + c[0] + '</a>'; }).join('') + '</div>'
    + '<h4>발주처별 낙찰</h4><div class="ls"><a href="/o/">발주처 이름으로 찾기<small>공사를 낸 곳의 최근 낙찰 현장과 업체</small></a></div>'
    + '<h4>직거래장터</h4><div class="ls"><a href="/market/?c=sell">팔고 싶은 물건 올리기<small>사진 한 장으로 등록해요</small></a><a href="/market/?c=need">필요한 물품 적어 올리기<small>판매자가 견적을 보내요</small></a></div>'
    + '<h4>더 보기</h4><div class="ls"><a href="/#home" data-go="회사소개">회사소개</a><a href="/help.html">자주 묻는 질문</a><a href="/market/policy.html">약관·환불규정</a><a href="mailto:help@ilgammarket.co.kr">이메일 문의</a></div></div>'
    + '<div class="ft">' + (logged ? '<a class="p" href="/pro.html#buy">일감 마스터 결제하기</a>' : '<a href="/#login" data-login="1">로그인</a><a class="p" href="/#join" data-join="1">가입하기</a>') + '</div>';
  function close() { sheet.classList.remove('on'); document.documentElement.style.overflow = ''; }
  mb.addEventListener('click', function () { sheet.classList.add('on'); document.documentElement.style.overflow = 'hidden'; });
  sheet.querySelector('.x').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  function gnbClick(label) { if (label === '회사소개') { var br = document.querySelector('.brand'); if (br && document.getElementById('gnb') && document.getElementById('gnb').getAttribute('data-ok')) { br.click(); window.scrollTo(0, 0); setTimeout(sync, 60); return true; } return false; } var b = document.querySelectorAll('header.top .gnb button, header.top .gnb a'); for (var i = 0; i < b.length; i++) if ((b[i].textContent || '').replace(/\s|\d/g, '') === label) { b[i].click(); window.scrollTo(0, 0); setTimeout(sync, 60); return true; } return false; }
  sheet.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'); if (!a) return;
    var g = a.getAttribute('data-go');
    if (g && IDX && gnbClick(g)) { e.preventDefault(); close(); return; }
    if (a.getAttribute('data-login') || a.getAttribute('data-join')) {
      var t = document.getElementById(a.getAttribute('data-join') ? 'tjn' : 'tme') || document.querySelector(a.getAttribute('data-join') ? '.acc .jn' : '.acc button:last-child');
      if (t) { e.preventDefault(); close(); t.click(); return; }
    }
    close();
  });
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
