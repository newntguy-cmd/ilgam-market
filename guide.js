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
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mask(s, member) {
    s = String(s || ''); if (member) return esc(s);
    var i = s.trim().lastIndexOf(' '); if (i < 0) return '<span class="bl">' + esc(s) + '</span>';
    return '<span class="bl">' + esc(s.slice(0, i + 1)) + '</span>' + esc(s.slice(i + 1));
  }
  function build() {
    css();
    var st = document.createElement('style');
    st.textContent = '#igguide .igrg{display:flex;flex-wrap:wrap;gap:10px;margin:6px 0 4px}#igguide .igrg button{height:50px;padding:0 20px;border:1px solid #d9cba6;border-radius:999px;background:#fff;color:#0f2342;font:inherit;font-size:18px;font-weight:800;cursor:pointer}#igguide .igrg button small{margin-left:6px;font-size:14px;font-weight:600;color:#8a6a28}#igguide .igrg button[aria-pressed=true]{background:#0f2342;color:#fff;border-color:#0f2342}#igguide .igrg button[aria-pressed=true] small{color:#e6c883}'
    + '#igguide .cd{margin:12px 0 0;padding:16px 18px;border:1px solid #eadfc6;border-radius:12px;background:#fff}#igguide .cd b.am{display:block;font-size:26px;color:#0f2342;letter-spacing:-.02em}#igguide .cd .s{margin:4px 0 6px;font-size:17px;font-weight:700;color:#0f2342;line-height:1.45}#igguide .cd .m{font-size:15px;color:#6b7690}'
    + '#igguide .bl{filter:blur(5px);user-select:none}#igguide .mr{margin:14px 0 0;font-size:17px;color:#33425b}#igguide .mr b{color:#8a6a28}#igguide .em{padding:26px 0;text-align:center;color:#6b7690;font-size:17px}';
    document.head.appendChild(st);
    box = document.createElement('div'); box.id = 'igguide'; box.hidden = true;
    box.innerHTML = '<div class="p" role="dialog" aria-modal="true" aria-labelledby="iggt"><div class="h"><h2 id="iggt">어느 지역이 궁금하세요?</h2><button type="button" class="x" aria-label="닫기">×</button></div><div class="b">'
    + '<p style="margin-top:14px">지역을 누르면 이번 주 낙찰된 큰 공사 3곳을 바로 보여 드려요.</p>'
    + '<div class="igrg" id="iggr"></div><div id="iggc"></div>'
    + '<p class="n">일감마켓은 공공데이터를 가공해 보여 주는 정보서비스이며, 정확성과 완전성을 보장하지 않습니다. 직거래장터의 거래는 이용자끼리 직접 하며, 일감마켓은 거래 당사자가 아니므로 거래에서 생긴 분쟁에 책임을 지지 않습니다.</p>'
    + '</div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t === box || t.className === 'x') { close(); return; }
      var rb = t.closest && t.closest('[data-rg]'); if (rb) { pick(rb.getAttribute('data-rg')); return; }
      var sh = t.closest && t.closest('[data-show]'); if (sh) { var g = sh.getAttribute('data-show'); close(); if (window.IGGUIDE) window.IGGUIDE.show(g); return; }
      if (t.hasAttribute && t.hasAttribute('data-guide-join')) { close(); var j = document.querySelector('[data-act="join"]'); if (j) j.click(); }
    });
  }
  function pick(g) {
    var G = window.IGGUIDE, c = document.getElementById('iggc'), member = !!(window.IGAUTH && window.IGAUTH.user);
    [].forEach.call(document.querySelectorAll('#iggr button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-rg') === g)); });
    var r = G.pick(g), h = '';
    r.top.forEach(function (x) { h += '<div class="cd"><b class="am">' + esc(x.amt) + '</b><div class="s">' + mask(x.site, member) + '</div><div class="m">' + esc(x.co) + (x.cat ? ' · ' + esc(x.cat) : '') + '</div></div>'; });
    h += '<p class="mr">' + esc(g) + '에서 이번 주 <b>' + r.n + '건</b>이 낙찰됐어요.</p>';
    h += '<div class="cta"><button type="button" class="j" data-show="' + esc(g) + '">' + esc(g) + ' 낙찰 전체 보기</button>' + (member ? '' : '<button type="button" class="c" data-guide-join>가입하기</button>') + '</div>';
    c.innerHTML = h;
  }
  function fill() {
    var G = window.IGGUIDE, r = document.getElementById('iggr'); if (!r) return;
    if (!G) { r.innerHTML = '<div class="em">낙찰 정보를 불러오는 중이에요</div>'; setTimeout(fill, 600); return; }
    if (r.getAttribute('data-ok')) return; r.setAttribute('data-ok', '1');
    r.innerHTML = G.regions.map(function (x) { return '<button type="button" data-rg="' + esc(x.g) + '" aria-pressed="false">' + esc(x.g) + '<small>' + x.n + '건</small></button>'; }).join('');
  }
  function open() {
    if (!box) build();
    
    fill(); last = document.activeElement; box.hidden = false; box.querySelector('.p').scrollTop = 0; box.querySelector('.x').focus();
  }
  function close() { if (box) box.hidden = true; if (last && last.focus) last.focus(); }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-guide]'); if (t) { e.preventDefault(); open(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && !box.hidden) close(); });
})();
