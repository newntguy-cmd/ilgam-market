// 이용권 구매 (토스페이먼츠 결제창)
(function(){
  var CLIENT_KEY='live_ck_6BYq7GWPVvDjmOGMJDvn8NE5vbo1';
  window.IGPAY={WORKER:'https://ilgam-pay.newntguy.workers.dev',CLIENT_KEY:CLIENT_KEY,
    plans:{'30':{amount:49900,name:'일감 마스터 30일 이용권'},'90':{amount:129900,name:'일감 마스터 90일 이용권'}}};
  var $=function(i){return document.getElementById(i);};
  function fmt(t){var d=new Date(t);return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일';}
  function say(t,bad){var e=$('bmsg');e.textContent=t;e.className='bmsg'+(bad?' bad':'');}

  function render(){
    var A=window.IGAUTH,box=$('buybox');if(!A||!A.ready){return;}
    var on=!!A.user;
    $('bin').hidden=on;$('bout').hidden=!on;
    if(on){$('who').textContent=A.user.email;checkStatus();orders();}
  }
  function checkStatus(){
    var A=window.IGAUTH;if(!window.IGPAY.WORKER||!A.user)return;
    A.token().then(function(t){return fetch(IGPAY.WORKER+'/status',{headers:{Authorization:'Bearer '+t}});})
     .then(function(r){return r.json();}).then(function(d){
       if(d.pro){$('until').textContent='일감 마스터 이용 중 · '+fmt(d.until)+'까지. 지금 결제하면 이어서 더해집니다.';$('until').hidden=false;}
     }).catch(function(){});
  }
  function won(n){return Number(n).toLocaleString('ko-KR')+'원';}
  function orders(){
    var A=window.IGAUTH,box=$('myo');if(!box||!IGPAY.WORKER||!A.user)return;
    A.token().then(function(t){return fetch(IGPAY.WORKER+'/orders',{headers:{Authorization:'Bearer '+t}});})
     .then(function(r){return r.json();}).then(function(d){
       var L=$('mylist');if(!d.ok){return;}box.hidden=false;
       if(!d.orders.length){L.textContent='아직 결제한 내역이 없습니다.';return;}
       L.innerHTML='';
       d.orders.forEach(function(o){
         var r=document.createElement('div');r.className='ord';
         var dt=new Date(o.at);
         var s=document.createElement('span');s.textContent=dt.getFullYear()+'.'+(dt.getMonth()+1)+'.'+dt.getDate()+' · 일감 마스터 '+o.plan+'일 이용권 · '+won(o.amount);
         r.appendChild(s);
         var a=document.createElement('a');a.href='/receipt.html?o='+encodeURIComponent(o.orderId);a.target='_blank';a.rel='noopener';a.textContent='영수증 보기';r.appendChild(a);
         L.appendChild(r);
       });
     }).catch(function(){});
  }
  function buy(plan){
    var A=window.IGAUTH,P=IGPAY;
    if(!P.WORKER){say('결제 서버를 준비하고 있습니다. 곧 열립니다.',1);return;}
    if(!A.user){say('먼저 로그인해 주세요.',1);return;}
    var uid=A.user.uid.replace(/[^A-Za-z0-9]/g,'').slice(0,8);
    var orderId='ig_'+plan+'_'+uid+'_'+Date.now();
    say('결제창을 여는 중입니다…');
    var tp=window.TossPayments(P.CLIENT_KEY);
    tp.payment({customerKey:A.user.uid}).requestPayment({
      method:'CARD',amount:{currency:'KRW',value:P.plans[plan].amount},orderId:orderId,
      orderName:P.plans[plan].name,customerEmail:A.user.email,
      successUrl:location.origin+'/pay-result.html',failUrl:location.origin+'/pay-result.html'
    }).catch(function(e){say(e&&e.code==='USER_CANCEL'?'결제를 취소하셨습니다.':'결제창을 열지 못했습니다. 잠시 뒤 다시 시도해 주세요.',1);});
  }
  function auth(kind){
    var em=$('em').value.trim(),pw=$('pw').value;
    if(!em||!pw){say('이메일과 비밀번호를 입력해 주세요.',1);return;}
    say('처리 중입니다…');
    window.IGAUTH[kind](em,pw).then(function(){say('');}).catch(function(e){say(e.message,1);});
  }
  window.addEventListener('ig-auth',render);
  document.addEventListener('DOMContentLoaded',function(){
    if(!$('b30'))return;
    $('b30').onclick=function(){buy('30');};$('b90').onclick=function(){buy('90');};
    $('lg').onclick=function(){auth('login');};$('su').onclick=function(){auth('signup');};
    $('lo').onclick=function(){window.IGAUTH.logout();};
    render();
  });
})();
