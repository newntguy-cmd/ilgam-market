// 올리기 전 자동 점검: 메뉴 고정 / 가로 넘침 / 조건 칸 밀림 / 사이트 밖으로 나가는 링크
// 실행: node tools/qa/check.js  (로컬 서버 127.0.0.1:8077 필요) — 하나라도 어긋나면 종료코드 1
const {chromium}=require('playwright');
const BASE='http://127.0.0.1:8077';
const URLS=['/','/#win','/#wl','/market/','/help.html','/buy.html','/pro.html','/b/','/b/경기/','/o/','/a/','/receipt.html','/pay-result.html','/market/policy.html'];
const W=[1890,1494,1272,1100,820,390];
let bad=0;const fail=m=>{bad++;console.log('  ✗',m)};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});
for(const w of W){const c=await b.newContext({viewport:{width:w,height:700}});const p=await c.newPage();
await p.addInitScript(()=>{try{localStorage.setItem('ig_bn_until',String(Date.now()+9e9));localStorage.setItem('ig_me',JSON.stringify({tier:'free'}))}catch(e){}});
const sig=[];
for(const u of URLS){try{await p.goto(BASE+u,{timeout:8000});await p.waitForTimeout(450);
const r=await p.evaluate(()=>{const h=document.querySelector('header.top');const m=h?[...h.querySelectorAll('.gnb>*,.brand,.acc button')].map(x=>{const r=x.getBoundingClientRect();const c=getComputedStyle(x);return [r.left,r.top,r.width,r.height].map(v=>v.toFixed(1)).join(',')+','+c.fontFamily.split(',')[0]+c.fontSize+c.fontWeight+c.borderTopWidth}).join('|'):'nohdr';
const ext=[...document.querySelectorAll('a[href^="http"]')].map(a=>a.href).filter(h=>!/ilgammarket\.co\.kr|mailto:/.test(h)&&/g2b\.go\.kr/.test(h));
return {m,ov:document.documentElement.scrollWidth>innerWidth+1,ext:ext.length}});
sig.push(r.m);if(r.ov)fail(w+'px '+u+' 가로 넘침');if(r.ext)fail(w+'px '+u+' 나라장터 바깥 링크 '+r.ext+'개');}catch(e){fail(w+'px '+u+' 열리지 않음')}}
if(new Set(sig).size>1)fail(w+'px 메뉴 위치가 페이지마다 다름 ('+new Set(sig).size+'종)');
else console.log('  ✓',w+'px 메뉴 고정·넘침 없음 ('+URLS.length+'개 페이지)');
if(w>=1272){await p.goto(BASE+'/#win');await p.waitForTimeout(2200);
const pos=()=>p.evaluate(()=>{const f=document.querySelector('.frs');if(!f)return 'none';const bx=f.parentElement;return Math.round(bx.getBoundingClientRect().height)+'/'+Math.round(bx.nextElementSibling.getBoundingClientRect().top)});
const a=await pos();for(const i of [3,5,1]){const cs=await p.$$('.frow:first-child .chip');if(cs[i]){await cs[i].click();await p.waitForTimeout(450)}}
const z=await pos();if(a!==z)fail(w+'px 조건 칸이 움직임 '+a+' → '+z);else console.log('  ✓',w+'px 조건 선택해도 아래 칸 안 밀림');}
await c.close();}
await b.close();console.log(bad?('점검 실패 '+bad+'건'):'점검 통과');process.exit(bad?1:0)})();
