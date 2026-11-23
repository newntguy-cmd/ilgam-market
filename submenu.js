/* 상단 메뉴 세부메뉴: 메뉴 글자 위에 마우스를 올리면 바로 아래에 펼쳐지는 안내판입니다.
   메뉴 자체의 크기·위치는 건드리지 않고(겹쳐서 표시), 터치 화면에서는 나타나지 않습니다. */
(function () {
  if (!window.matchMedia || !matchMedia('(hover:hover) and (min-width:900px)').matches) return;
  var REG = ['서울', '경기', '인천', '부산', '대구', '대전', '광주-전남', '울산', '세종', '강원', '충북', '충남', '전북', '경북', '경남', '제주'];
  var SUB = {
    '낙찰정보': [
      { t: '낙찰정보', l: [['최신 낙찰 현장', '/#win', '방금 낙찰된 현장과 업체'], ['입찰공고', '/b/', '입찰 중인 공사, 마감이 가까운 순'], ['분야별 낙찰', '/a/전국/', '전기·통신·소방·토목 등 분야로 찾기'], ['발주처별 낙찰', '/o/', '공사를 낸 발주처로 찾기']] },
      { t: '지역별 낙찰', cols: 4, l: REG.map(function (r) { return [r.replace('-', '·'), '/a/' + r + '/']; }) }
    ],
    '직거래장터': [
      { t: '직거래장터', l: [['팔고 싶은 물건 올리기', '/market/?c=sell', '사진 한 장으로 등록'], ['필요한 물품 적어 올리기', '/market/?c=need', '판매자가 견적을 보내요'], ['장터 전체 보기', '/market/']] }
    ],
    '고객센터': [
      { t: '고객센터', l: [['자주 묻는 질문', '/help.html'], ['일감 마스터 이용권', '/pro.html', '30일·90일 요금과 영수증'], ['약관·환불규정', '/market/policy.html'], ['이메일 문의', 'mailto:help@ilgammarket.co.kr']] }
    ]
  };
  var box, cur, tm;
  function css() {
    var s = document.createElement('style');
    s.textContent = '#igsub{position:fixed;border-radius:0 0 16px 16px;border:1px solid rgba(201,164,92,.5);border-top:0;z-index:2147482000;display:none;background:#3f2b1e;border-top:1px solid rgba(201,164,92,.5);border-bottom:3px solid #c9a45c;box-shadow:0 22px 40px rgba(27,18,13,.45)}'
      + '#igsub .in{padding:22px 28px 26px;display:flex;gap:44px;width:max-content;max-width:calc(100vw - 32px)}#igsub .c h4{margin:0 0 10px;font-size:15px;font-weight:700;color:#e6c883;letter-spacing:-.01em}'
      + '#igsub .c ul{margin:0;padding:0;list-style:none}#igsub .g ul{display:grid;grid-auto-flow:column;grid-template-rows:repeat(4,auto);grid-template-columns:repeat(4,104px);column-gap:14px}'
      + '#igsub a{display:block;padding:7px 0;color:#fff;font-size:17px;font-weight:600;text-decoration:none;white-space:nowrap}#igsub a small{display:block;margin-top:2px;font-size:13.5px;font-weight:400;color:#ccb8a3}'
      + '.gnb .igh{color:#3f2b1e!important;background:#fff!important;box-shadow:inset 0 -3px 0 #c9a45c!important}.igopen [aria-current=true]:not(.igh),.igopen [aria-current=page]:not(.igh){background:transparent!important;box-shadow:none!important}'
      + '#igsub a:hover,#igsub a:focus-visible{color:#e6c883;outline:0}';
    document.head.appendChild(s);
  }
  function build() {
    css(); box = document.createElement('div'); box.id = 'igsub'; box.setAttribute('role', 'menu'); document.body.appendChild(box);
    box.addEventListener('mouseenter', function () { clearTimeout(tm); });
    box.addEventListener('mouseleave', hide);
    box.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a'); if (!a) return;
      var h = a.getAttribute('href') || '';
      if (location.pathname === '/' && h === '/#win') { var n = nav().querySelector('[data-tab="win"]'); if (n) { e.preventDefault(); n.click(); hideNow(); } }
    });
  }
  function nav() { return document.querySelector('nav.gnb'); }
  function label(el) { return (el.textContent || '').replace(/\d+$/, '').trim(); }
  function show(el) {
    var k = label(el), d = SUB[k]; if (!d) { hideNow(); return; }
    clearTimeout(tm); if (!box) build();
    if (cur === k) return; cur = k;
    var h = document.querySelector('header.top'); box.style.top = Math.round(h.getBoundingClientRect().bottom) + 'px';
    box.innerHTML = '<div class="in">' + d.map(function (c) {
      return '<div class="c' + (c.cols ? ' g' : '') + '"><h4>' + c.t + '</h4><ul>' + c.l.map(function (x) {
        return '<li><a role="menuitem" href="' + x[1] + '">' + x[0] + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</a></li>';
      }).join('') + '</ul></div>';
    }).join('') + '</div>';
    box.style.display = 'block';
    var inn = box.firstChild, L = el.getBoundingClientRect().left - 28, mx = window.innerWidth - inn.offsetWidth - 16;
    box.style.left = Math.max(16, Math.min(L, mx)) + 'px'; box.style.right = 'auto';
    var nv = nav(); nv.classList.add('igopen'); [].forEach.call(nv.querySelectorAll('.igh'), function (x) { x.classList.remove('igh'); }); el.classList.add('igh');
  }
  function hideNow() { if (box) box.style.display = 'none'; cur = null; var nv = nav(); if (nv) { nv.classList.remove('igopen'); [].forEach.call(nv.querySelectorAll('.igh'), function (x) { x.classList.remove('igh'); }); } }
  function hide() { clearTimeout(tm); tm = setTimeout(hideNow, 140); }
  function init() {
    var g = nav(); if (!g) return;
    g.addEventListener('mouseover', function (e) { var t = e.target.closest && e.target.closest('a,button'); if (t && g.contains(t)) show(t); });
    g.addEventListener('mouseleave', hide);
    g.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('a,button'); if (t) show(t); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideNow(); });
    window.addEventListener('scroll', hideNow, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
