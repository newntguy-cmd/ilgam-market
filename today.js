// 홈 '오늘' 띠: 오늘(또는 내일) 마감하는 입찰, 가장 최근 낙찰일의 건수. 다시 올 이유를 숫자로 보여 줍니다.
(function () {
  var box = document.getElementById('td'); if (!box) return;
  function $(i) { return document.getElementById(i) || document.createElement('i'); }
  function num(n) { return Number(n).toLocaleString('ko-KR'); }
  var kst = new Date(Date.now() + 324e5), today = kst.toISOString().slice(0, 10), hm = kst.toISOString().slice(11, 16);
  var tom = new Date(Date.parse(today) + 864e5).toISOString().slice(0, 10);
  fetch('data/today.json').then(function (r) { return r.json(); }).then(function (j) {
    var a = 0, b = 0, t = j.t || {};
    Object.keys(t).forEach(function (k) { var d = k.slice(0, 10), h = k.slice(11); if (d === today && h > hm) a += t[k]; else if (d === tom) b += t[k]; });
    var useTom = !a && b;
    $('tdA').textContent = num(useTom ? b : a); $('tdAl').textContent = useTom ? '내일 마감하는 입찰' : '오늘 마감하는 입찰';
    var bx = document.getElementById('td'); if (bx) bx.hidden = false;
  }).catch(function () {});
  fetch('data/recent.json').then(function (r) { return r.json(); }).then(function (j) {
    var it = j.items || [], mx = ''; it.forEach(function (x) { if (x.d > mx) mx = x.d; });
    if (!mx) return;
    var n = 0, c = {}; it.forEach(function (x) { if (x.d === mx) { n++; if (x.co) c[x.co] = 1; } });
    $('tdB').textContent = num(n); $('tdBl').textContent = Number(mx.slice(5, 7)) + '월 ' + Number(mx.slice(8, 10)) + '일 낙찰 · 업체 ' + num(Object.keys(c).length) + '곳';
    var bx = document.getElementById('td'); if (bx) bx.hidden = false;
  }).catch(function () {});
})();
