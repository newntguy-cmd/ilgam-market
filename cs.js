/* 고객센터: 모든 페이지 공통 팝업. 메뉴의 '고객센터'를 누르면 지금 화면 위에 뜹니다. */
(function () {
  if (/[?&]embed=1/.test(location.search)) return;
  var ICON = '<span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-2 2.5-5 2.5"/></svg></span>';
  var AICON = '<span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v7M19 13v7M7 9V5h10v4"/></svg></span>';
  var BICON = '<span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></span>';
  function addMenu() {
    if (document.getElementById('gnb')) return; // 첫 화면은 app.js가 직접 만듭니다
    var nav = document.querySelector('header.top nav');
    if (!nav || nav.querySelector('[data-cs]')) return;
    var a = document.createElement('a');
    a.href = '/help.html'; a.setAttribute('data-cs', '1'); a.setAttribute('role', 'button'); a.title = '문의와 자주 묻는 질문';
    a.innerHTML = ICON + '고객센터';
    var bm = document.createElement('a');
    bm.href = '/buy.html'; bm.setAttribute('data-buy', 'buy'); bm.setAttribute('role', 'button'); bm.title = '냉난방기·에어컨·사무집기 매입을 일감마켓에서 검토합니다';
    bm.innerHTML = BICON + '매입의 신';
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
    ['일감마켓은 어떤 서비스인가요?', '조달청 나라장터 등 공공 공사 낙찰 정보를 지역과 공종별로 보여 드리고, 남는 자재와 필요한 물품을 거래하는 직거래장터를 함께 운영해요.'],
    ['가입하면 무엇이 달라지나요?', '가입하면 낙찰 현장과 업체, 금액을 볼 수 있어요. 대표 전화⁠·⁠주소는 10곳까지 열람할 수 있고, 더 필요하면 일감 마스터에서 영업 리스트로 이용할 수 있어요.'],
    ['낙찰 정보는 어디서 오고, 얼마나 자주 바뀌나요?', '조달청 나라장터 등 공공데이터포털의 자료를 가공해 보여 드려요. 매일 아침 새로 낙찰된 현장으로 갱신해요. 공공데이터를 가공한 정보라 정확성과 완전성을 보장하지 않으니, 중요한 판단 전에는 원문을 함께 확인해 주세요.'],
    ['일감 마스터는 무엇이고 얼마인가요?', '대표 전화⁠·⁠주소 조회와 영업 리스트 엑셀, 지역·업체 알림을 쓸 수 있는 이용권이에요. 30일 49,900원, 90일 129,900원, 180일 239,000원, 12개월(365일) 399,000원이고(길수록 한 달 값이 내려가요) 부가세가 포함돼 있어요. 자동으로 다시 결제되지 않아요.'],
    ['영수증과 세금계산서는 어떻게 받나요?', '결제 후 일감 마스터 페이지의 ‘내 결제 내역’에서 영수증을 보고 PDF로 저장할 수 있어요. 카드로 결제하면 카드 매출전표와 일감마켓 영수증이 증빙이 돼요. 일감마켓은 간이과세 사업자여서 세금계산서와 현금영수증은 발행하지 않아요.'],
    ['이용권 환불은 어떻게 하나요?', '결제 후 7일 안에 쓰기 전이면 전액 환불해요. 아래 이메일로 가입 이메일을 적어 보내 주시면 영업일 기준 3일 안에 확인해요. 자세한 내용은 <a href="/market/policy.html#refund" target="_blank" rel="noopener">환불규정</a>에서 볼 수 있어요.<br><a href="mailto:help@ilgammarket.co.kr">help@ilgammarket.co.kr</a>'],
    ['직거래장터는 어떻게 이용하나요?', '팔고 싶은 물건은 사진과 함께 올리고, 필요한 물품은 적어 올리면 판매자가 견적을 보내요. 거래는 이용자끼리 직접 하며, 일감마켓은 거래 당사자가 아니에요.'],
    ['글 신고, 삭제, 회원 탈퇴는 어떻게 하나요?', '아래 이메일로 보내 주시면 접수해 드려요.<br><a href="mailto:help@ilgammarket.co.kr">help@ilgammarket.co.kr</a>']
  ];
  var box;
  function css() {
    var st = document.createElement('style');
    st.textContent = '#igcs{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(13,22,20,.62);font-family:inherit}#igcs[hidden]{display:none}'
    + '#igcs .p{width:min(560px,100%);max-height:90vh;overflow:auto;background:#fffdf8;color:#1e332f;border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,.45);border-top:4px solid #c9a45c}'
    + '#igcs .h{display:flex;align-items:center;justify-content:space-between;padding:22px 26px 6px}#igcs h2{margin:0;font-size:24px;font-weight:800;letter-spacing:-.02em}'
    + '#igcs .x{width:40px;height:40px;border:0;border-radius:50%;background:#efe9da;color:#1e332f;font-size:22px;cursor:pointer}'
    + '#igcs .b{padding:8px 26px 26px}#igcs .ct{margin:10px 0 18px;padding:18px 20px;border-radius:14px;background:radial-gradient(120% 90% at 90% -20%,rgba(201,164,92,.34),transparent 55%),linear-gradient(165deg,#294540,#182a26 72%);color:#fff;box-shadow:0 14px 30px rgba(24,42,38,.28),inset 0 1px 0 rgba(255,255,255,.16),inset 0 0 0 1px rgba(201,164,92,.25)}'
    + '#igcs .ct b{display:block;font-size:15px;color:#e6c883;margin-bottom:8px}#igcs .ct a{display:block;color:#fff;font-size:20px;font-weight:800;text-decoration:none;margin-top:4px;word-break:break-all}'
    + '#igcs details{border-bottom:1px solid #e6dcc4}#igcs summary{padding:15px 2px;font-size:18px;font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:12px}#igcs summary::-webkit-details-marker{display:none}'
    + '#igcs summary::after{content:"+";color:#8a6a28;font-size:22px;line-height:1}#igcs details[open] summary::after{content:"−"}'
    + '#igcs details p{margin:0 0 16px;font-size:17px;line-height:1.7;color:#385650}#igcs details a{color:#8a6a28;font-weight:700}'
    + '#igcs .n{margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7690}';
    document.head.appendChild(st);
  }
  function pgcss() {
    var st = document.createElement('style');
    st.textContent = '#igcs.pg,#igbuy.pg{position:static;display:block;background:none;padding:0;z-index:auto}#igcs.pg .p,#igbuy.pg .p{width:auto;max-height:none;overflow:visible;box-shadow:none;border-top:0;background:none}#igcs.pg .h,#igbuy.pg .h{display:none}#igcs.pg .b,#igbuy.pg .b{padding:6px 0 26px}';
    document.head.appendChild(st);
  }
  function build() {
    css();
    box = document.getElementById('igcs'); if (!box) { box = document.createElement('div'); box.id = 'igcs'; box.hidden = true; }
    var f = FAQ.map(function (q) { return '<details><summary>' + q[0] + '</summary><p>' + q[1] + '</p></details>'; }).join('');
    box.innerHTML = '<div class="p" role="dialog" aria-modal="true" aria-labelledby="igcst"><div class="h"><h2 id="igcst">고객센터</h2><button type="button" class="x" aria-label="닫기">×</button></div>'
      + '<div class="b"><div class="ct"><b>문의</b><a href="mailto:help@ilgammarket.co.kr">help@ilgammarket.co.kr</a><a href="tel:07080648210">070-8064-8210</a></div>'
      + f + '<p class="n">일감마켓은 거래 당사자가 아니며, 이용자 간 거래에서 생긴 분쟁에 책임을 지지 않습니다.</p></div></div>';
    if (!box.parentNode) document.body.appendChild(box);
    box.addEventListener('click', function (e) { if (e.target === box || e.target.className === 'x') close(); });
  }
  var last;
  function open() { if (!box) build(); last = document.activeElement; box.hidden = false; var x = box.querySelector('.x'); if (x) x.focus(); }
  function close() { if (box) box.hidden = true; if (last && last.focus) last.focus(); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cs]');
    if (!t) return; e.preventDefault(); if (location.pathname !== '/help.html') location.href = '/help.html';
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && !box.hidden) close(); });
  // ---- 매입문의 · 사무집기 문의: 겟잇타운이 직접 응대합니다. 접수 내용은 서버에 저장되고 담당자에게 메일로 전달됩니다.
  var bbox, blast, bkind = 'buy', BAPI = 'https://ilgam-pay.newntguy.workers.dev';
  var BF = {
    buy: { title: '매입의 신', lead: '냉난방기·에어컨·사무집기 매입을 일감마켓에서 검토합니다. 사진과 함께 팔고 싶은 물건을 남겨 주세요.',
      cats: ['냉난방기', '에어컨', '사무집기'], catLabel: '어떤 물건인가요?',
      item: '품명과 수량', itemEx: '예: 시스템에어컨 3대, 사무용 책상 20개', state: '상태와 사용 기간', stateEx: '예: 2년 사용, 상태 양호', area: '물건이 있는 지역',
      memo: '희망 가격, 처분 시기 등', agree: '매입 상담', send: '매입 문의 보내기', done: '확인하고 남겨 주신 번호로 연락드리겠습니다.',
      note: '남겨 주신 내용은 일감마켓에서 검토한 뒤 연락드립니다. 직거래장터의 이용자 간 거래와는 별개입니다.' },
    ask: { title: '사무집기 문의', lead: '필요한 사무집기를 남겨 주시면 일감마켓에서 확인하고 연락드립니다.',
      cats: null, catLabel: '',
      item: '필요한 사무집기', itemEx: '예: 책상 10개, 의자 10개, 파티션', state: '사용 시기와 기간', stateEx: '예: 12월부터 6개월', area: '설치할 지역',
      memo: '예산, 납품 일정 등', agree: '사무집기 상담', send: '문의 보내기', done: '확인하고 남겨 주신 번호로 연락드리겠습니다.',
      note: '남겨 주신 내용은 일감마켓에서 확인한 뒤 연락드립니다. 직거래장터의 이용자 간 거래와는 별개입니다.' }
  };
  function bcss() {
    var st = document.createElement('style');
    st.textContent = '#igbuy{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(13,22,20,.62);font-family:inherit}#igbuy[hidden]{display:none}'
    + '#igbuy .p{width:min(560px,100%);max-height:92vh;overflow:auto;background:#fffdf8;color:#1e332f;border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,.45);border-top:4px solid #c9a45c}'
    + '#igbuy .h{display:flex;align-items:center;justify-content:space-between;padding:22px 26px 0}#igbuy h2{margin:0;font-size:24px;font-weight:800;letter-spacing:-.02em}'
    + '#igbuy .x{width:40px;height:40px;border:0;border-radius:50%;background:#efe9da;color:#1e332f;font-size:22px;cursor:pointer}'
    + '#igbuy .b{padding:6px 26px 26px}#igbuy .lead{margin:0 0 16px;font-size:17px;line-height:1.6;color:#385650;word-break:keep-all}'
    + '#igbuy label{display:block;margin:14px 0 6px;font-size:16px;font-weight:700}#igbuy label i{font-style:normal;color:#8a6a28}'
    + '#igbuy input[type=text],#igbuy input[type=tel],#igbuy textarea{width:100%;box-sizing:border-box;padding:13px 14px;border:1.5px solid #d8cdb0;border-radius:8px;background:#fff;font:inherit;font-size:17px;color:#1e332f}'
    + '#igbuy textarea{min-height:92px;resize:vertical}#igbuy input:focus,#igbuy textarea:focus{outline:2px solid #c9a45c;border-color:#c9a45c}'
    + '#igbuy .cats{display:flex;gap:8px;flex-wrap:wrap}#igbuy .cats label{display:block;margin:0;font-weight:700}#igbuy .cats input{position:absolute;opacity:0;pointer-events:none}'
    + '#igbuy .cats span{display:block;padding:11px 18px;border:1.5px solid #d8cdb0;border-radius:999px;background:#fff;font-size:17px;cursor:pointer}#igbuy .cats input:checked+span{background:#1e332f;color:#fff;border-color:#1e332f}#igbuy .cats input:focus-visible+span{outline:2px solid #c9a45c;outline-offset:2px}'
    + '#igbuy .two{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;align-items:end}@media(max-width:480px){#igbuy .two{grid-template-columns:1fr}}'
    + '#igbuy .ag{display:flex;gap:10px;align-items:flex-start;margin:16px 0 0;font-size:14.5px;line-height:1.55;color:#4b716a;font-weight:400}#igbuy .ag input{margin-top:3px;width:20px;height:20px;flex:none}'
    + '#igbuy .go{width:100%;margin-top:18px;padding:16px;border:0;border-radius:10px;background:#1e332f;color:#fff;font:inherit;font-size:19px;font-weight:800;cursor:pointer}#igbuy .go[disabled]{opacity:.55;cursor:default}'
    + '#igbuy .er{margin:12px 0 0;color:#b3261e;font-size:15px;line-height:1.5}#igbuy .ok{padding:26px 6px 8px;text-align:center}#igbuy .ok b{display:block;font-size:22px;margin-bottom:8px}#igbuy .ok p{margin:0;font-size:17px;line-height:1.6;color:#385650}'
    + '#igbuy .ph{display:flex;flex-wrap:wrap;gap:10px}#igbuy .addp{display:block;margin:0}#igbuy .addp span{display:flex;align-items:center;justify-content:center;width:96px;height:96px;border:1.5px dashed #c9b88e;border-radius:10px;background:#fff;color:#8a6a28;font-size:15px;font-weight:700;cursor:pointer;text-align:center;line-height:1.3}'
    + '#igbuy .th{position:relative;width:96px;height:96px;border-radius:10px;overflow:hidden;border:1px solid #d8cdb0;background:#fff}#igbuy .th img{width:100%;height:100%;object-fit:cover;display:block}#igbuy .th button{position:absolute;top:4px;right:4px;width:26px;height:26px;border:0;border-radius:50%;background:rgba(30,51,47,.82);color:#fff;font-size:16px;line-height:1;cursor:pointer}'
    + '#igbuy .n{margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7690}#igbuy .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}';
    document.head.appendChild(st);
  }
  function bfill(kind) {
    var c = BF[kind]; bkind = kind;
    var cats = c.cats ? '<label>' + c.catLabel + ' <i>필수</i></label><div class="cats" role="radiogroup" aria-label="' + c.catLabel + '">'
      + c.cats.map(function (k) { return '<label><input type="radio" name="ib_cat" value="' + k + '"><span>' + k + '</span></label>'; }).join('') + '</div>' : '';
    bbox.querySelector('.p').innerHTML = '<div class="h"><h2 id="igbuyt">' + c.title + '</h2><button type="button" class="x" aria-label="닫기">×</button></div><div class="b">'
      + '<form id="igbuyf" novalidate><p class="lead">' + c.lead + '</p>' + cats
      + '<label for="ib_bi">' + c.item + ' <i>필수</i></label><input id="ib_bi" type="text" maxlength="120" autocomplete="off" placeholder="' + c.itemEx + '">'
      + '<label for="ib_bs">' + c.state + '</label><input id="ib_bs" type="text" maxlength="120" autocomplete="off" placeholder="' + c.stateEx + '">'
      + '<div class="two"><div><label for="ib_ba">' + c.area + '</label><input id="ib_ba" type="text" maxlength="40" autocomplete="off" placeholder="예: 경기 수원"></div>'
      + '<div><label for="ib_bn">성함 <i>필수</i></label><input id="ib_bn" type="text" maxlength="30" autocomplete="name"></div></div>'
      + '<label for="ib_bt">연락받을 전화번호 <i>필수</i></label><input id="ib_bt" type="tel" maxlength="20" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000">'
      + '<label for="ib_bm">전하실 말씀</label><textarea id="ib_bm" maxlength="600" placeholder="' + c.memo + '"></textarea>'
      + '<label>사진 <small style="font-weight:400;color:#6b7690">선택 · 최대 3장</small></label><div class="ph" id="ib_ph"><label class="addp" for="ib_bf"><span>＋ 사진 추가</span></label><input id="ib_bf" type="file" accept="image/*" multiple hidden></div>'
      + '<div class="hp" aria-hidden="true"><input id="ib_bw" type="text" tabindex="-1" autocomplete="off"></div>'
      + '<label class="ag" for="ib_bg"><input id="ib_bg" type="checkbox"><span>' + c.agree + ' 연락을 위해 성함⁠·⁠전화번호·문의 내용⁠·⁠사진을 수집하며, 상담이 끝난 뒤 6개월 동안 보관하고 삭제합니다. 동의하지 않으셔도 일감마켓의 다른 서비스는 그대로 이용하실 수 있습니다.</span></label>'
      + '<p class="er" id="ib_ber" role="alert" hidden></p><button class="go" id="ib_bgo" type="submit">' + c.send + '</button></form>'
      + '<div class="ok" id="ib_bok" hidden><b>접수됐습니다</b><p>' + c.done + '</p></div>'
      + '<p class="n">' + c.note + '</p></div>';
    bbox.querySelector('#igbuyf').addEventListener('submit', bsend);
    bimgs = []; var bf = bbox.querySelector('#ib_bf'); if (bf) bf.addEventListener('change', bpick);
  }
  function bbuild() {
    bcss();
    bbox = document.getElementById('igbuy');
    if (!bbox) { bbox = document.createElement('div'); bbox.id = 'igbuy'; bbox.hidden = true;
      bbox.innerHTML = '<div class="p" role="dialog" aria-modal="true" aria-labelledby="igbuyt"></div>';
      document.body.appendChild(bbox); }
    bbox.addEventListener('click', function (e) { if (e.target === bbox || e.target.className === 'x') bclose(); });
  }
  function berr(t) { var e = bbox.querySelector('#ib_ber'); e.textContent = t || ''; e.hidden = !t; }
  var bimgs = [];
  function bshrink(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var m = 1280, w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, m / Math.max(w, h));
        var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u);
        var q = 0.82, d = cv.toDataURL('image/jpeg', q);
        while (d.length > 700000 && q > 0.4) { q -= 0.12; d = cv.toDataURL('image/jpeg', q); }
        d.length > 880000 ? rej(new Error('big')) : res(d);
      };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('bad')); };
      im.src = u;
    });
  }
  function bthumbs() {
    var box = bbox.querySelector('#ib_ph'); if (!box) return;
    box.querySelectorAll('.th').forEach(function (n) { n.remove(); });
    var add = box.querySelector('.addp');
    bimgs.forEach(function (d, i) {
      var t = document.createElement('div'); t.className = 'th';
      var im = document.createElement('img'); im.src = d; im.alt = '첨부 사진 ' + (i + 1);
      var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', '사진 빼기');
      x.addEventListener('click', function () { bimgs.splice(i, 1); bthumbs(); });
      t.append(im, x); box.insertBefore(t, add);
    });
    add.style.display = bimgs.length >= 3 ? 'none' : '';
  }
  function bpick(ev) {
    var fs = Array.prototype.slice.call(ev.target.files || [], 0, 3 - bimgs.length); ev.target.value = '';
    berr('');
    fs.reduce(function (p, f) { return p.then(function () { return bshrink(f).then(function (d) { bimgs.push(d); bthumbs(); }); }); }, Promise.resolve())
      .catch(function () { berr('사진을 불러오지 못했어요. 다른 사진으로 시도해 주세요.'); });
  }
  function bsend(ev) {
    ev.preventDefault(); berr('');
    var c = BF[bkind];
    var v = function (id) { return (bbox.querySelector('#ib_' + id).value || '').trim(); };
    var tel = v('bt').replace(/[^0-9]/g, '');
    var cat = ''; if (c.cats) { var r = bbox.querySelector('input[name=ib_cat]:checked'); cat = r ? r.value : ''; if (!cat) { berr('냉난방기·에어컨·사무집기 중 어떤 물건인지 골라 주세요.'); return; } }
    if (!v('bi')) { berr(c.item + '를 적어 주세요.'); return; }
    if (!v('bn')) { berr('성함을 적어 주세요.'); return; }
    if (tel.length < 9 || tel.length > 11) { berr('연락받을 전화번호를 다시 확인해 주세요.'); return; }
    if (!bbox.querySelector('#ib_bg').checked) { berr('개인정보 수집에 동의해 주셔야 접수할 수 있어요.'); return; }
    var go = bbox.querySelector('#ib_bgo'); go.disabled = true; go.textContent = '보내는 중…';
    fetch(BAPI + '/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: bkind, cat: cat, item: v('bi'), state: v('bs'), area: v('ba'), name: v('bn'), tel: tel, memo: v('bm'), hp: v('bw'), imgs: bimgs }) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.message) || 'fail');
        bbox.querySelector('#igbuyf').hidden = true; bbox.querySelector('#ib_bok').hidden = false;
      })
      .catch(function (e) { go.disabled = false; go.textContent = c.send; berr((e && e.message && e.message !== 'fail' && e.message !== 'Failed to fetch') ? e.message : '접수하지 못했어요. 잠시 뒤 다시 보내 주시거나 help@ilgammarket.co.kr 로 보내 주세요.'); });
  }
  function bopen(kind) { if (!bbox) bbuild(); blast = document.activeElement; bfill(kind); bbox.hidden = false; var i = bbox.querySelector('#ib_bi'); if (i && !bbox.querySelector('input[name=ib_cat]')) i.focus(); }
  function bclose() { if (bbox) bbox.hidden = true; if (blast && blast.focus) blast.focus(); }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-buy]'); if (!t) return; e.preventDefault(); if (location.pathname !== '/buy.html') location.href = '/buy.html'; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && bbox && !bbox.hidden) bclose(); });
  // 메뉴 위에 마우스를 올리면 그 페이지를 미리 불러 두어, 누르는 순간 바로 열리게 (지원하는 브라우저에서만)
  function warm() {
    try {
      if (!(window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules'))) return;
      if (!window.matchMedia || !matchMedia('(hover:hover)').matches) return;
      var here = location.pathname, list = ['/market/', '/buy.html', '/help.html', '/pro.html'].filter(function (u) { return u === '/market/' ? here.indexOf('/market/') !== 0 : here !== u; });
      var sr = document.createElement('script'); sr.type = 'speculationrules';
      sr.textContent = JSON.stringify({ prerender: [{ urls: list, eagerness: 'moderate' }] });
      document.head.appendChild(sr);
    } catch (e) {}
  }
  // 처음 접속한 사람도 메뉴를 눌렀을 때 끊기지 않도록, 한가할 때 다른 메뉴 페이지의 파일을 미리 받아 둡니다
  function prefetchAll() {
    try {
      if (navigator.connection && navigator.connection.saveData) return;
      var here = location.pathname, seen = {};
      ['/', '/market/', '/buy.html', '/help.html', '/pro.html'].filter(function (p) { return p === '/market/' ? here.indexOf('/market/') !== 0 : here !== p && !(p === '/' && here === '/index.html'); }).forEach(function (p, i) {
        setTimeout(function () {
          fetch(p, { credentials: 'omit' }).then(function (r) { return r.text(); }).then(function (h) {
            var re = /(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g, m;
            while ((m = re.exec(h))) {
              var u = new URL(m[1], location.origin + p).href;
              if (u.indexOf(location.origin) !== 0 || seen[u]) continue; seen[u] = 1;
              var l = document.createElement('link'); l.rel = 'prefetch'; l.as = /\.css/.test(u) ? 'style' : 'script'; l.href = u; document.head.appendChild(l);
            }
          }).catch(function () {});
        }, 700 * i);
      });
    } catch (e) {}
  }
  function init() {
    warm();
    if (document.readyState === 'complete') setTimeout(prefetchAll, 1500); else addEventListener('load', function () { setTimeout(prefetchAll, 1500); });
    addMenu(); addCount();
    // 가입하기·로그인: 다른 페이지에서는 첫 화면의 로그인 창으로 보냅니다(첫 화면⁠·⁠장터는 자체 처리)
    var tj = document.getElementById('tjn'), tm = document.getElementById('tme');
    if (tj && tm && !document.getElementById('gnb') && location.pathname.indexOf('/market/') !== 0) {
      tj.addEventListener('click', function () { location.href = tj.classList.contains('pay') ? '/pro.html#buy' : '/#join'; });
      tm.addEventListener('click', function () { var c = false; try { c = !!localStorage.getItem('ig_me'); } catch (e) {} location.href = c ? '/pro.html' : '/#login'; });
    }
    if (document.getElementById('igbuy') && document.getElementById('igbuy').classList.contains('pg')) { pgcss(); bcss(); bbuild(); bfill('buy'); bbox.hidden = false; }
    var pc = document.getElementById('igcs'); if (pc && pc.classList.contains('pg')) { pgcss(); build(); pc.hidden = false; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
