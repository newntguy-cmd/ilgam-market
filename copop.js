// 업체 이름을 누르면 페이지를 옮기지 않고 그 자리에서 업체 정보를 팝업으로 보여 줍니다.
(function () {
  if (location.search.indexOf('embed') > -1) return;
  var d, f, nm;
  function build() {
    if (d) return;
    var st = document.createElement('style');
    st.textContent = 'dialog#cop{width:min(760px,calc(100vw - 24px));height:min(640px,88vh);padding:0;border:0;border-radius:16px;background:#faf7f0;box-shadow:0 0 0 1px rgba(201,164,92,.55),0 40px 90px rgba(0,0,0,.55);overflow:hidden}' +
      'dialog#cop[open]{display:flex;flex-direction:column}dialog#cop::backdrop{background:rgba(6,20,17,.66)}' +
      '#cop .lh{display:flex;align-items:center;gap:12px;padding:18px 22px;background:var(--gr-pro,#126352);color:#fff;border-bottom:1px solid rgba(230,200,131,.6);box-shadow:inset 0 1px 0 rgba(255,255,255,.26);flex:none}' +
      '#cop .lh h3{margin:0;flex:1;min-width:0;font-size:19px;font-weight:800;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '#cop .lh button{border:0;background:none;color:#fff;font-size:28px;line-height:1;cursor:pointer;min-width:44px;min-height:44px}' +
      '#cop .lh button:focus-visible{outline:3px solid #e6c883;outline-offset:2px}#cop iframe{flex:1;width:100%;border:0;background:#faf7f0}';
    document.head.appendChild(st);
    d = document.createElement('dialog'); d.id = 'cop'; d.setAttribute('aria-label', '업체 정보');
    d.innerHTML = '<div class="lh"><h3></h3><button type="button" aria-label="닫기">×</button></div><iframe title="업체 정보"></iframe>';
    nm = d.querySelector('h3'); f = d.querySelector('iframe');
    d.querySelector('button').addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.addEventListener('close', function () { f.src = 'about:blank'; });
    document.body.appendChild(d);
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || !e.data || !e.data.ig) return;
      d.close();
      if (e.data.ig === 'join') location.href = '/?join=1'; else if (e.data.ig === 'pro') location.href = '/pro.html';
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/c/"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var m = a.getAttribute('href').match(/^\/c\/(\d+)\/?$/); if (!m || !d && !document.body) return;
    e.preventDefault(); build();
    nm.textContent = a.textContent.trim(); f.src = '/c/' + m[1] + '/?embed=1';
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  });
})();
