/* 고객센터: 모든 페이지 공통 팝업. 메뉴의 '고객센터'를 누르면 지금 화면 위에 뜹니다. */
(function () {
  if (/[?&]embed=1/.test(location.search)) return;
  var ICON = '<span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-2 2.5-5 2.5"/></svg></span>';
  function addMenu() {
    if (document.getElementById('gnb')) return; // 첫 화면은 app.js가 직접 만듭니다
    var nav = document.querySelector('header.top nav');
    if (!nav || nav.querySelector('[data-cs]')) return;
    var a = document.createElement('a');
    a.href = '#'; a.setAttribute('data-cs', '1'); a.setAttribute('role', 'button'); a.title = '문의와 자주 묻는 질문';
    a.innerHTML = ICON + '고객센터';
    nav.appendChild(a);
  }

  // 관심업체 개수 표시(이 기기에 저장된 값): 모든 페이지의 메뉴에서 똑같이 보이게
  function addCount() {
    var nav = document.querySelector('header.top nav'); if (!nav) return;
    var n = 0; try { n = Object.keys(JSON.parse(localStorage.getItem('ilgam_wl') || '{}') || {}).length; } catch (e) {}
    var items = nav.children;
    for (var i = 0; i < items.length; i++) {
      if (items[i].textContent.indexOf('관심업체') < 0) continue;
      var old = items[i].querySelector('.cnt'); if (old) old.remove();
      if (n > 0) { var b = document.createElement('i'); b.className = 'cnt'; b.textContent = String(n); items[i].appendChild(b); }
    }
  }
  var FAQ = [
    ['가입하면 무엇이 달라지나요?', '가입하면 낙찰 현장·업체·금액이 전부 보입니다. 카드 등록은 필요 없습니다. 업체 전화·주소는 일감 마스터를 결제하면 확인할 수 있습니다.'],
    ['직거래장터는 어떻게 이용하나요?', '팔고 싶은 물건은 사진과 함께 올리고, 필요한 물품은 적어 올리면 판매자가 견적을 보냅니다. 거래는 이용자끼리 직접 하며, 일감마켓은 거래 당사자가 아닙니다.'],
    ['글 신고, 삭제, 회원 탈퇴는 어떻게 하나요?', '아래 이메일로 보내 주시면 접수해 드립니다.'],
    ['이용권 결제와 환불은요?', '<a href="/market/policy.html#refund" target="_blank" rel="noopener">환불규정</a>에서 확인하실 수 있습니다.']
  ];
  var box;
  function css() {
    var st = document.createElement('style');
    st.textContent = '#igcs{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,14,30,.62);font-family:inherit}#igcs[hidden]{display:none}'
    + '#igcs .p{width:min(560px,100%);max-height:90vh;overflow:auto;background:#fffdf8;color:#0f2342;border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,.45);border-top:4px solid #c9a45c}'
    + '#igcs .h{display:flex;align-items:center;justify-content:space-between;padding:22px 26px 6px}#igcs h2{margin:0;font-size:24px;font-weight:800;letter-spacing:-.02em}'
    + '#igcs .x{width:40px;height:40px;border:0;border-radius:50%;background:#efe9da;color:#0f2342;font-size:22px;cursor:pointer}'
    + '#igcs .b{padding:8px 26px 26px}#igcs .ct{margin:10px 0 18px;padding:18px 20px;border-radius:10px;background:#0f2342;color:#fff}'
    + '#igcs .ct b{display:block;font-size:15px;color:#e6c883;margin-bottom:8px}#igcs .ct a{display:block;color:#fff;font-size:20px;font-weight:800;text-decoration:none;margin-top:4px;word-break:break-all}'
    + '#igcs details{border-bottom:1px solid #e6dcc4}#igcs summary{padding:15px 2px;font-size:18px;font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:12px}#igcs summary::-webkit-details-marker{display:none}'
    + '#igcs summary::after{content:"+";color:#8a6a28;font-size:22px;line-height:1}#igcs details[open] summary::after{content:"−"}'
    + '#igcs details p{margin:0 0 16px;font-size:17px;line-height:1.7;color:#33425b}#igcs details a{color:#8a6a28;font-weight:700}'
    + '#igcs .n{margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7690}';
    document.head.appendChild(st);
  }
  function build() {
    css();
    box = document.createElement('div'); box.id = 'igcs'; box.hidden = true;
    var f = FAQ.map(function (q) { return '<details><summary>' + q[0] + '</summary><p>' + q[1] + '</p></details>'; }).join('');
    box.innerHTML = '<div class="p" role="dialog" aria-modal="true" aria-labelledby="igcst"><div class="h"><h2 id="igcst">고객센터</h2><button type="button" class="x" aria-label="닫기">×</button></div>'
      + '<div class="b"><div class="ct"><b>문의</b><a href="mailto:help@ilgammarket.co.kr">help@ilgammarket.co.kr</a><a href="tel:07080648210">070-8064-8210</a></div>'
      + f + '<p class="n">일감마켓은 거래 당사자가 아니며, 이용자 간 거래에서 생긴 분쟁에 책임을 지지 않습니다.</p></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) { if (e.target === box || e.target.className === 'x') close(); });
  }
  var last;
  function open() { if (!box) build(); last = document.activeElement; box.hidden = false; var x = box.querySelector('.x'); if (x) x.focus(); }
  function close() { if (box) box.hidden = true; if (last && last.focus) last.focus(); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cs]');
    if (!t) return; e.preventDefault(); open();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && !box.hidden) close(); });
  function init() { addMenu(); addCount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
