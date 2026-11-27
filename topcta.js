/* 상단 고정 결제 안내 — 가입 전(로그인 기록 없음)인 분께만, 모든 화면 같은 자리에 같은 모양으로 보입니다.
   로그인한 분은 상단 '결제하기'가 이미 있고, 일감 마스터 이용 중이면 아무것도 보이지 않습니다. */
(function () {
  'use strict';
  try { if (localStorage.getItem('ig_me')) return; } catch (e) {}
  var acc = document.getElementById('acc');
  if (!acc || document.getElementById('tcta')) return;
  var a = document.createElement('a');
  a.id = 'tcta'; a.className = 'tcta'; a.href = '/pro.html#buy';
  a.innerHTML = '<span class="n">일감 마스터</span><span class="m">마스터</span>';
  acc.parentNode.insertBefore(a, acc);
})();
