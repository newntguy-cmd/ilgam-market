// 업체 이름을 누르면 페이지를 옮기지 않고 업체 정보를 떠 있는 창으로 보여 줍니다. 헤더를 끌어 옮길 수 있고, 뒤 화면은 그대로 보며 쓸 수 있습니다.
(function () {
  if (location.search.indexOf('embed') > -1) {
    // 팝업 안에서 다른 업체·발주처를 눌러도 팝업 안에서 바뀌게(전체 화면으로 안 바뀌게)
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="/o/"],a[href^="/c/"]');
      if (!a || e.defaultPrevented) return;
      e.preventDefault(); location.href = a.getAttribute('href') + '?embed=1';
    });
    return;
  }
  var d, f, nm;
  function build() {
    if (d) return;
    var st = document.createElement('style');
    st.textContent = 'dialog#cop{position:fixed;z-index:10000;margin:0;left:50%;top:72px;transform:translateX(-50%);width:min(760px,calc(100vw - 24px));height:min(640px,calc(100vh - 96px));padding:0;border:0;border-radius:16px;background:#faf7f0;box-shadow:0 0 0 1px rgba(201,164,92,.55),0 40px 90px rgba(0,0,0,.55);overflow:hidden}' +
      'dialog#cop[open]{display:flex;flex-direction:column}' +
      '#cop .lh{display:flex;align-items:center;gap:12px;padding:18px 22px;cursor:grab;touch-action:none;user-select:none;background:var(--gr-pro,#126352);color:#fff;border-bottom:1px solid rgba(230,200,131,.6);box-shadow:inset 0 1px 0 rgba(255,255,255,.26);flex:none}' +
      '#cop .lh h3{margin:0;flex:1;min-width:0;font-size:19px;font-weight:800;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '#cop .lh button{border:0;background:none;color:#fff;font-size:28px;line-height:1;cursor:pointer;min-width:44px;min-height:44px}' +
      '#cop .lh button:focus-visible{outline:3px solid #e6c883;outline-offset:2px}#cop iframe{flex:1;width:100%;border:0;background:#faf7f0}';
    document.head.appendChild(st);
    d = document.createElement('dialog'); d.id = 'cop'; d.setAttribute('aria-label', '업체 정보');
    d.innerHTML = '<div class="lh"><h3></h3><button type="button" aria-label="닫기">×</button></div><iframe title="업체 정보"></iframe>';
    nm = d.querySelector('h3'); f = d.querySelector('iframe');
    d.querySelector('button').addEventListener('click', function () { d.close(); });
    var sx, sy, ox, oy, mv = false, lh = d.querySelector('.lh');
    lh.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      var r = d.getBoundingClientRect(); d.style.transform = 'none'; d.style.left = r.left + 'px'; d.style.top = r.top + 'px';
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; mv = true; lh.setPointerCapture(e.pointerId); lh.style.cursor = 'grabbing';
    });
    lh.addEventListener('pointermove', function (e) {
      if (!mv) return;
      var x = Math.min(Math.max(ox + e.clientX - sx, 60 - d.offsetWidth), innerWidth - 60), y = Math.min(Math.max(oy + e.clientY - sy, 0), innerHeight - 56);
      d.style.left = x + 'px'; d.style.top = y + 'px';
    });
    lh.addEventListener('pointerup', function () { mv = false; lh.style.cursor = 'grab'; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.open) d.close(); });
    d.addEventListener('close', function () { f.src = 'about:blank'; });
    document.body.appendChild(d);
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || !e.data || !e.data.ig) return;
      d.close();
      if (e.data.ig === 'join') location.href = '/?join=1'; else if (e.data.ig === 'pro') location.href = '/pro.html';
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/c/"],a[href^="/o/"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var m = a.getAttribute('href').match(/^\/([co])\/([^/?#]+)\/?$/); if (!m || !d && !document.body) return;
    e.preventDefault(); build();
    nm.textContent = a.textContent.trim(); f.src = '/' + m[1] + '/' + m[2] + '/?embed=1';
    if (!d.open) d.show();
  });
})();
