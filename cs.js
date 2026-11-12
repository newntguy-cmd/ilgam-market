/* 고객센터: 모든 페이지 공통 팝업. 메뉴의 '고객센터'를 누르면 지금 화면 위에 뜹니다. */
(function () {
  if (/[?&]embed=1/.test(location.search)) return;
  var ICON = '<span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-2 2.5-5 2.5"/></svg></span>';
  var BICON = '<span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></span>';
  function addMenu() {
    if (document.getElementById('gnb')) return; // 첫 화면은 app.js가 직접 만듭니다
    var nav = document.querySelector('header.top nav');
    if (!nav || nav.querySelector('[data-cs]')) return;
    var a = document.createElement('a');
    a.href = '#'; a.setAttribute('data-cs', '1'); a.setAttribute('role', 'button'); a.title = '문의와 자주 묻는 질문';
    a.innerHTML = ICON + '고객센터';
    var bm = document.createElement('a');
    bm.href = '#'; bm.setAttribute('data-buy', '1'); bm.setAttribute('role', 'button'); bm.title = '팔고 싶은 물건을 겟잇타운이 직접 매입합니다';
    bm.innerHTML = BICON + '매입문의';
    nav.appendChild(bm);
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
  // ---- 매입문의: 겟잇타운이 직접 매입. 접수 내용은 서버에 저장되고 담당자에게 메일로 전달됩니다.
  var bbox, blast, BAPI = 'https://ilgam-pay.newntguy.workers.dev';
  function bcss() {
    var st = document.createElement('style');
    st.textContent = '#igbuy{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,14,30,.62);font-family:inherit}#igbuy[hidden]{display:none}'
    + '#igbuy .p{width:min(560px,100%);max-height:92vh;overflow:auto;background:#fffdf8;color:#0f2342;border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,.45);border-top:4px solid #c9a45c}'
    + '#igbuy .h{display:flex;align-items:center;justify-content:space-between;padding:22px 26px 0}#igbuy h2{margin:0;font-size:24px;font-weight:800;letter-spacing:-.02em}'
    + '#igbuy .x{width:40px;height:40px;border:0;border-radius:50%;background:#efe9da;color:#0f2342;font-size:22px;cursor:pointer}'
    + '#igbuy .b{padding:6px 26px 26px}#igbuy .lead{margin:0 0 16px;font-size:17px;line-height:1.6;color:#33425b;word-break:keep-all}'
    + '#igbuy label{display:block;margin:14px 0 6px;font-size:16px;font-weight:700}#igbuy label i{font-style:normal;color:#8a6a28}'
    + '#igbuy input[type=text],#igbuy input[type=tel],#igbuy textarea{width:100%;box-sizing:border-box;padding:13px 14px;border:1.5px solid #d8cdb0;border-radius:8px;background:#fff;font:inherit;font-size:17px;color:#0f2342}'
    + '#igbuy textarea{min-height:92px;resize:vertical}#igbuy input:focus,#igbuy textarea:focus{outline:2px solid #c9a45c;border-color:#c9a45c}'
    + '#igbuy .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:480px){#igbuy .two{grid-template-columns:1fr}}'
    + '#igbuy .ag{display:flex;gap:10px;align-items:flex-start;margin:16px 0 0;font-size:14.5px;line-height:1.55;color:#4a5872;font-weight:400}#igbuy .ag input{margin-top:3px;width:20px;height:20px;flex:none}'
    + '#igbuy .go{width:100%;margin-top:18px;padding:16px;border:0;border-radius:10px;background:#0f2342;color:#fff;font:inherit;font-size:19px;font-weight:800;cursor:pointer}#igbuy .go[disabled]{opacity:.55;cursor:default}'
    + '#igbuy .er{margin:12px 0 0;color:#b3261e;font-size:15px;line-height:1.5}#igbuy .ok{padding:26px 6px 8px;text-align:center}#igbuy .ok b{display:block;font-size:22px;margin-bottom:8px}#igbuy .ok p{margin:0;font-size:17px;line-height:1.6;color:#33425b}'
    + '#igbuy .n{margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7690}#igbuy .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}';
    document.head.appendChild(st);
  }
  function bbuild() {
    bcss();
    bbox = document.createElement('div'); bbox.id = 'igbuy'; bbox.hidden = true;
    bbox.innerHTML = '<div class="p" role="dialog" aria-modal="true" aria-labelledby="igbuyt"><div class="h"><h2 id="igbuyt">매입문의</h2><button type="button" class="x" aria-label="닫기">×</button></div><div class="b">'
      + '<form id="igbuyf" novalidate><p class="lead">팔고 싶은 물건을 남겨 주시면 겟잇타운이 확인하고 직접 연락드립니다.</p>'
      + '<label for="ib_bi">어떤 물건인가요? <i>필수</i></label><input id="ib_bi" type="text" maxlength="120" autocomplete="off" placeholder="품명과 수량 (예: 책상 20개)">'
      + '<label for="ib_bs">상태와 사용 기간</label><input id="ib_bs" type="text" maxlength="120" autocomplete="off" placeholder="예: 2년 사용, 상태 양호">'
      + '<div class="two"><div><label for="ib_ba">물건이 있는 지역</label><input id="ib_ba" type="text" maxlength="40" autocomplete="off" placeholder="예: 경기 수원"></div>'
      + '<div><label for="ib_bn">성함 <i>필수</i></label><input id="ib_bn" type="text" maxlength="30" autocomplete="name"></div></div>'
      + '<label for="ib_bt">연락받을 전화번호 <i>필수</i></label><input id="ib_bt" type="tel" maxlength="20" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000">'
      + '<label for="ib_bm">전하실 말씀</label><textarea id="ib_bm" maxlength="600" placeholder="희망 가격, 처분 시기 등"></textarea>'
      + '<div class="hp" aria-hidden="true"><input id="ib_bw" type="text" tabindex="-1" autocomplete="off"></div>'
      + '<label class="ag" for="ib_bg"><input id="ib_bg" type="checkbox"><span>매입 상담 연락을 위해 성함·전화번호·문의 내용을 수집하며, 상담이 끝난 뒤 6개월 동안 보관하고 삭제합니다. 동의하지 않으셔도 일감마켓의 다른 서비스는 그대로 이용하실 수 있습니다.</span></label>'
      + '<p class="er" id="ib_ber" role="alert" hidden></p><button class="go" id="ib_bgo" type="submit">매입 문의 보내기</button></form>'
      + '<div class="ok" id="ib_bok" hidden><b>접수됐습니다</b><p>확인하고 남겨 주신 번호로 연락드리겠습니다.</p></div>'
      + '<p class="n">매입은 겟잇타운(대표 신상헌)이 직접 합니다. 일감마켓 직거래장터의 이용자 간 거래와는 별개입니다.</p></div></div>';
    document.body.appendChild(bbox);
    bbox.addEventListener('click', function (e) { if (e.target === bbox || e.target.className === 'x') bclose(); });
    bbox.querySelector('#igbuyf').addEventListener('submit', bsend);
  }
  function berr(t) { var e = bbox.querySelector('#ib_ber'); e.textContent = t || ''; e.hidden = !t; }
  function bsend(ev) {
    ev.preventDefault(); berr('');
    var v = function (id) { return (bbox.querySelector('#ib_' + id).value || '').trim(); };
    var tel = v('bt').replace(/[^0-9]/g, '');
    if (!v('bi')) { berr('어떤 물건인지 적어 주세요.'); return; }
    if (!v('bn')) { berr('성함을 적어 주세요.'); return; }
    if (tel.length < 9 || tel.length > 11) { berr('연락받을 전화번호를 다시 확인해 주세요.'); return; }
    if (!bbox.querySelector('#ib_bg').checked) { berr('개인정보 수집에 동의해 주셔야 접수할 수 있어요.'); return; }
    var go = bbox.querySelector('#ib_bgo'); go.disabled = true; go.textContent = '보내는 중…';
    fetch(BAPI + '/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: v('bi'), state: v('bs'), area: v('ba'), name: v('bn'), tel: tel, memo: v('bm'), hp: v('bw') }) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.message) || 'fail');
        bbox.querySelector('#igbuyf').hidden = true; bbox.querySelector('#ib_bok').hidden = false;
      })
      .catch(function (e) { go.disabled = false; go.textContent = '매입 문의 보내기'; berr((e && e.message && e.message !== 'fail' && e.message !== 'Failed to fetch') ? e.message : '접수하지 못했어요. 잠시 뒤 다시 보내 주시거나 help@ilgammarket.co.kr 로 보내 주세요.'); });
  }
  function bopen() { if (!bbox) bbuild(); blast = document.activeElement; bbox.hidden = false; var i = bbox.querySelector('#ib_bi'); if (i && !bbox.querySelector('#igbuyf').hidden) i.focus(); }
  function bclose() { if (bbox) bbox.hidden = true; if (blast && blast.focus) blast.focus(); }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-buy]'); if (!t) return; e.preventDefault(); bopen(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && bbox && !bbox.hidden) bclose(); });
  function init() { addMenu(); addCount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
