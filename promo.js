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
    st.textContent = '#ighold{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,14,30,.7);font-family:inherit}#ighold[hidden]{display:none}'
    + '#ighold .p{position:relative;width:min(520px,100%);padding:34px 28px 24px;border-radius:16px;text-align:center;color:#0f2342;background:linear-gradient(180deg,#fff7dc,#f6e3a8);box-shadow:0 26px 60px rgba(0,0,0,.5)}'
    + '#ighold .x{position:absolute;right:12px;top:12px;width:42px;height:42px;border:0;border-radius:8px;background:#0f2342;color:#fff;font-size:20px;cursor:pointer}'
    + '#ighold h2{margin:0 0 4px;font-size:34px;font-weight:800;letter-spacing:-.03em}#ighold h2+p{margin:0 0 18px;font-size:24px;font-weight:800;letter-spacing:-.02em}#ighold h2+p em{font-style:normal;background:linear-gradient(transparent 58%,rgba(201,164,92,.6) 58%)}'
    + '#ighold .cmp{display:grid;grid-template-columns:.8fr 1.4fr;background:#fff;border-radius:10px;overflow:hidden;text-align:center;box-shadow:0 2px 0 rgba(0,0,0,.08)}'
    + '#ighold .cmp>div{padding:20px 14px}#ighold .cmp .a{border-right:1px solid #e8dfc8;display:flex;flex-direction:column;align-items:center;justify-content:center}'
    + '#ighold .cmp span.t{display:inline-block;padding:5px 14px;border-radius:20px;background:#ece7d8;font-weight:800;font-size:15px;margin-bottom:14px}#ighold .cmp .b span.t{background:#c9a45c;color:#0f2342}'
    + '#ighold .cmp .a b{font-size:20px;color:#8a93a6}#ighold .cmp li{list-style:none;font-size:18px;line-height:1.5;padding:4px 0;font-weight:700}#ighold .cmp ul{margin:0;padding:0}#ighold .cmp li i{font-style:normal;color:#8a6a28;font-weight:800}'
    + '#ighold .go{width:100%;height:60px;margin-top:18px;border:0;border-radius:8px;background:#0f2342;color:#fff;font-size:20px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 4px 0 #050e1e}'
    + '#ighold .no{display:block;margin:14px auto 0;background:none;border:0;color:#5b6679;font-size:15px;text-decoration:underline;cursor:pointer;font-family:inherit}'
    + '@media (max-width:480px){#ighold h2{font-size:28px}#ighold h2+p{font-size:20px}#ighold .cmp{grid-template-columns:.7fr 1.5fr}#ighold .cmp li{font-size:16px}}';
    document.head.appendChild(st);
  }
  function build() {
    css();
    box = document.createElement('div'); box.id = 'ighold'; box.hidden = true;
    box.innerHTML = '<div class="p" role="dialog" aria-modal="true" aria-labelledby="ighT"><button type="button" class="x" aria-label="닫기">✕</button><h2 id="ighT">잠시만요!</h2><p><em>14일 혜택</em> 놓치실 거예요?</p>'
      + '<div class="cmp"><div class="a"><span class="t">가입 안 하면</span><b>둘러보기만</b></div><div class="b"><span class="t">가입하면</span><ul><li><i>14일</i> 일감 맛보기</li><li><i>매일 아침</i> 새 낙찰 메일</li><li><i>직거래장터</i> 글 올리기</li><li><i>카드 등록</i> 필요 없음</li></ul></div></div>'
      + '<button type="button" class="go" data-act="join">가입하고 14일 시작하기</button><button type="button" class="no">오늘은 그냥 볼게요</button></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t === box || t.className === 'x' || t.className === 'no') hide();
      else if (t.hasAttribute('data-act')) hide();
    });
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
