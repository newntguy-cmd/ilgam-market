/* '잠시만요' 가입 혜택 팝업: 가입하지 않은 방문자가 창을 떠나려 할 때(PC) 또는 한참 둘러본 뒤(모바일) 한 번 보여 줍니다. 하루에 한 번만. */
(function () {
  var KEY = 'ig_hold_until', box, shown = false;
  function snoozed() { try { return Number(localStorage.getItem(KEY) || 0) > Date.now(); } catch (e) { return false; } }
  function snooze() { try { localStorage.setItem(KEY, String(Date.now() + 864e5)); } catch (e) {} }
  function member() { return !!(window.IGAUTH && window.IGAUTH.user); }
  function busy() {
    var bn = document.getElementById('bn'), g = document.getElementById('igguide'), c = document.getElementById('igcs'), d = document.querySelector('dialog[open]');
    return (bn && bn.classList.contains('on')) || (g && !g.hidden) || (c && !c.hidden) || d;
  }
  function css() {
    var st = document.createElement('style');
    st.textContent = '#ighold{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,28,23,.55);font-family:inherit}#ighold[hidden]{display:none}'
    + '#ighold .p{position:relative;width:min(460px,100%);padding:38px 30px 26px;border-radius:18px;text-align:left;color:#fff;background:radial-gradient(120% 140% at 50% -20%,#3fae94 0,#1a7762 36%,#0e4f40 70%,#082f27 100%);border-top:4px solid #c9a45c;box-shadow:0 28px 64px rgba(0,0,0,.5)}'
    + '#ighold .x{position:absolute;right:12px;top:14px;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:19px;cursor:pointer}#ighold .x:hover{background:rgba(255,255,255,.26)}'
    + '#ighold h2{margin:0 36px 8px 0;font-size:28px;line-height:1.32;font-weight:800;letter-spacing:-.035em;word-break:keep-all}#ighold h2 em{font-style:normal;color:#ffe08f}'
    + '#ighold .sub{margin:0 0 20px;font-size:17px;line-height:1.5;color:#d3ece4;word-break:keep-all}'
    + '#ighold ul{margin:0 0 24px;padding:0;list-style:none;display:grid;gap:12px}#ighold li{position:relative;padding-left:34px;font-size:18px;line-height:1.45;font-weight:700;word-break:keep-all}'
    + '#ighold li:before{content:"";position:absolute;left:0;top:1px;width:23px;height:23px;border-radius:50%;background:#c9a45c}#ighold li:after{content:"";position:absolute;left:8px;top:6px;width:6px;height:11px;border:solid #2d3134;border-width:0 3px 3px 0;transform:rotate(45deg)}'
    + '#ighold .go{width:100%;height:58px;border:0;border-radius:12px;background:linear-gradient(180deg,#e6c883,#c9a45c);color:#2d3134;font-size:20px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 4px 0 #8a6a28}#ighold .go:active{transform:translateY(3px);box-shadow:0 1px 0 #8a6a28}'
    + '#ighold .no{display:block;margin:14px auto 0;background:none;border:0;color:#b9dccf;font-size:16px;cursor:pointer;font-family:inherit;padding:8px 14px}#ighold .no:hover{color:#fff}'
    + '@media (max-width:480px){#ighold .p{padding:34px 22px 22px}#ighold h2{font-size:22px}#ighold li{font-size:17px}}';
    document.head.appendChild(st);
  }
  function build() {
    css();
    box = document.createElement('div'); box.id = 'ighold'; box.hidden = true;
    box.innerHTML = '<div class="p" role="dialog" aria-modal="true" aria-labelledby="ighT"><button type="button" class="x" aria-label="닫기">✕</button>'
      + '<h2 id="ighT">낙찰된 공사,<br>누가 땄는지 보고 가세요</h2><p class="sub">가입하면 업체와 금액까지 바로 보여요.</p>'
      + '<ul><li>내 지역 낙찰 소식을 매일 아침 7:30에 메일로</li><li>낙찰 현장별 업체와 금액</li><li>직거래장터에 내 글 올리기</li></ul>'
      + '<button type="button" class="go" data-act="join">가입하기</button><button type="button" class="no">나중에 볼게요</button></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t === box || t.className === 'x' || t.className === 'no') hide();
      else if (t.hasAttribute('data-act')) hide();
    });
    // 가장 최근 낙찰일의 실제 건수를 제목에 넣습니다 (불러오지 못하면 기본 문구 그대로)
    fetch('/data/recent.json').then(function (r) { return r.json(); }).then(function (j) {
      var it = j.items || [], cnt = {}; it.forEach(function (x) { cnt[x.d] = (cnt[x.d] || 0) + 1; });
      var mx = '', n = 0; Object.keys(cnt).forEach(function (d) { if (cnt[d] >= 100 && d > mx) { mx = d; n = cnt[d]; } });
      if (!mx) return;
      box.querySelector('h2').innerHTML = Number(mx.slice(5, 7)) + '월 ' + Number(mx.slice(8, 10)) + '일 낙찰된 공사 <em>' + n.toLocaleString('ko-KR') + '건</em>,<br>누가 땄는지 보고 가세요';
    }).catch(function () {});
  }
  function hide() { if (box) box.hidden = true; snooze(); }
  function show() {
    if (shown || snoozed() || member() || busy()) return;
    if (!window.igKnown || !window.igKnown()) return;
    shown = true; if (!box) build(); box.hidden = false; box.querySelector('.go').focus(); snooze();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && !box.hidden) hide(); });
  // PC: 마우스가 화면 위쪽 밖으로 나갈 때
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 0) setTimeout(show, 150); });
  // 모바일·터치: 30초 동안 둘러본 뒤
  if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) setTimeout(show, 30000);
})();
