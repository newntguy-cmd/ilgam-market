/* 방문 통계(클라우드플레어 웹 분석): 쿠키 없이 페이지 조회수만 집계합니다. 업체 팝업(embed)은 제외합니다. */
(function () {
  if (/[?&]embed=1/.test(location.search)) return;
  var s = document.createElement('script');
  s.type = 'module';
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', '{"token": "1595215f092c4996a991dc57f4e2cbee"}');
  document.head.appendChild(s);
})();
