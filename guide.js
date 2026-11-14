/* 이용방법 안내: 첫 화면의 '바로가기'를 누르면 지금 화면 위에 팝업으로 뜹니다. */
(function () {
  var box, last;
  function css() {
    var st = document.createElement('style');
    st.textContent = '#igguide{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,14,30,.68);font-family:inherit}#igguide[hidden]{display:none}'
    + '#igguide .p{width:min(720px,100%);max-height:92vh;overflow:auto;background:#fffdf8;color:#0f2342;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.5);border-top:5px solid #c9a45c}'
    + '#igguide .h{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:20px 28px 14px;background:#fffdf8;border-bottom:1px solid #eadfc6}'
    + '#igguide h2{margin:0;font-size:26px;font-weight:800;letter-spacing:-.02em}#igguide .x{width:44px;height:44px;border:0;border-radius:50%;background:#efe9da;color:#0f2342;font-size:24px;cursor:pointer}'
    + '#igguide .b{padding:8px 28px 30px}#igguide h3{margin:28px 0 10px;font-size:21px;font-weight:800;letter-spacing:-.02em;color:#0f2342}'
    + '#igguide p{margin:0 0 8px;font-size:18px;line-height:1.75;color:#33425b}#igguide .k{color:#8a6a28;font-weight:800}'
    + '#igguide ul{margin:0;padding:0;list-style:none}#igguide li{padding:11px 0;border-bottom:1px dashed #e6dcc4;font-size:18px;line-height:1.6;color:#33425b}#igguide li b{color:#0f2342}'
    + '#igguide ol{margin:0;padding:0;list-style:none;counter-reset:s}#igguide ol li{counter-increment:s;position:relative;padding-left:46px}#igguide ol li::before{content:counter(s);position:absolute;left:0;top:9px;width:30px;height:30px;border-radius:50%;background:#0f2342;color:#e6c883;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center}'
    + '#igguide .gift{margin:18px 0 0;padding:20px 22px;border-radius:12px;background:#0f2342;color:#fff}#igguide .gift b{display:block;font-size:22px;color:#e6c883;margin-bottom:6px}#igguide .gift span{font-size:17px;line-height:1.65;color:#dbe4f3}'
    + '#igguide .cta{margin-top:24px;display:flex;gap:12px;flex-wrap:wrap}#igguide .cta button{height:56px;padding:0 30px;border:0;border-radius:6px;font-size:18px;font-weight:800;font-family:inherit;cursor:pointer}'
    + '#igguide .cta .j{color:#0f2342;background:linear-gradient(180deg,#f1d795,#c9a45c 60%,#b08c44);box-shadow:0 4px 0 #8a6a28}#igguide .cta .c{background:#efe9da;color:#0f2342}'
    + '#igguide .n{margin:22px 0 0;font-size:14.5px;line-height:1.65;color:#6b7690}';
    document.head.appendChild(st);
  }
  function build() {
    css();
    box = document.createElement('div'); box.id = 'igguide'; box.hidden = true;
    box.innerHTML = '<div class="p" role="dialog" aria-modal="true" aria-labelledby="iggt"><div class="h"><h2 id="iggt">일감마켓 이용방법</h2><button type="button" class="x" aria-label="닫기">×</button></div><div class="b">'
    + '<h3>일감마켓은 어떤 곳인가요?</h3>'
    + '<p>조달청 나라장터의 공공 공사 <span class="k">낙찰 정보</span>를 매일 모아서 보여 드리고, 내 물건을 팔거나 필요한 물품을 찾을 수 있는 <span class="k">직거래장터</span>를 함께 운영합니다.</p>'
    + '<p>방금 낙찰된 현장과 업체를 가장 먼저 확인하고, 그 현장에 필요한 물품이 있다면 직거래장터에서 바로 이어 볼 수 있습니다.</p>'
    + '<h3>어떤 서비스가 있나요?</h3>'
    + '<ul><li><b>낙찰정보</b> · 방금 낙찰된 현장, 업체, 금액을 지역·공종별로 찾아봅니다.</li>'
    + '<li><b>관심업체</b> · 눈여겨보던 업체는 담아 두세요. 새 낙찰이 나오면 바로 알 수 있어요.</li>'
    + '<li><b>직거래장터</b> · 팔고 싶은 물건은 사진과 함께 올리고, 필요한 물품은 적어 올리면 판매자가 견적을 보냅니다.</li>'
    + '<li><b>아침 메일</b> · 가입하면 새로 낙찰된 현장을 매일 아침 메일로 받아볼 수 있습니다.</li></ul>'
    + '<h3>시작하는 방법</h3>'
    + '<ol><li>가입하기를 누르세요. 카드 등록은 필요 없어요.</li>'
    + '<li>낙찰정보에서 내 지역과 공종을 고르면 새 현장이 한눈에 보여요.</li>'
    + '<li>눈여겨보는 업체는 관심업체에 담아 두세요.</li>'
    + '<li>직거래장터에서 팔 물건을 올리거나, 필요한 물품을 적어 견적을 받아요.</li></ol>'
    + '<h3>가입하면 받는 것</h3>'
    + '<div class="gift"><b>가입하면 보이는 것</b><span>낙찰 현장·업체·금액과 통계가 전부 보입니다. 카드 등록은 필요 없습니다. 대표 전화·주소가 담긴 영업 리스트는 일감 마스터에서 이용할 수 있습니다.</span></div>'
    + '<ul style="margin-top:14px"><li><b>더 필요하시면 일감 마스터</b> · 영업 리스트 엑셀 저장, 여러 지역 알림, 관심업체 새 낙찰 알림 메일을 이용할 수 있습니다. 30일 49,900원, 90일 129,900원(부가세 포함)이며 한 번만 결제합니다.</li></ul>'
    + '<div class="cta"><button type="button" class="j" data-guide-join>가입하기</button><button type="button" class="c" data-guide-close>닫기</button></div>'
    + '<p class="n">일감마켓은 공공데이터를 가공해 보여 주는 정보서비스이며, 정확성과 완전성을 보장하지 않습니다. 직거래장터의 거래는 이용자끼리 직접 하며, 일감마켓은 거래 당사자가 아니므로 거래에서 생긴 분쟁에 책임을 지지 않습니다.</p>'
    + '</div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t === box || t.className === 'x' || t.hasAttribute('data-guide-close')) { close(); return; }
      if (t.hasAttribute('data-guide-join')) { close(); var j = document.querySelector('[data-act="join"]'); if (j) j.click(); }
    });
  }
  function open() {
    if (!box) build();
    var u = window.IGAUTH && window.IGAUTH.user, j = box.querySelector('[data-guide-join]'); if (j) j.style.display = u ? 'none' : '';
    last = document.activeElement; box.hidden = false; box.querySelector('.p').scrollTop = 0; box.querySelector('.x').focus();
  }
  function close() { if (box) box.hidden = true; if (last && last.focus) last.focus(); }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-guide]'); if (t) { e.preventDefault(); open(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && !box.hidden) close(); });
})();
