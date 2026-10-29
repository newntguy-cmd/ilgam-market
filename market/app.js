import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,reauthenticateWithCredential,EmailAuthProvider,deleteUser}
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocs,setDoc,addDoc,updateDoc,deleteDoc,query,where,orderBy,limit,serverTimestamp}
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {initExtractor} from './extractor.js';

const firebaseConfig={
  apiKey:"AIzaSyC7txkoe-zROxqJ5rrbHsdDTuHrFrAy450",
  authDomain:"sanup-jangter.firebaseapp.com",
  projectId:"sanup-jangter",
  storageBucket:"sanup-jangter.firebasestorage.app",
  messagingSenderId:"162560625771",
  appId:"1:162560625771:web:0d355af8bff1fecde3352e"
};
const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);

const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
const btn=(text,cls,fn)=>{const b=el('button',cls,text);b.type='button';if(fn)b.addEventListener('click',fn);return b;};
const CATS=['자재','장비·공구','가설·임대','공사·서비스','기타'];
const TYPE={need:'구해요',sell:'팝니다'};
const S={user:null,profile:null,blocks:new Map(),posts:[],limit:40,more:false,type:'all',cat:'',q:'',closed:false,view:'feed',attach:null,loading:true,loadErr:false,signingUp:false,authMode:'login',wtype:'need',photos:[]};

/* ---------- 공통 ---------- */
let toastT;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2600);}
function ago(ts){
  const ms=ts&&ts.toMillis?ts.toMillis():null;if(!ms)return '방금';
  const s=Math.max(0,(Date.now()-ms)/1000);
  if(s<60)return '방금';if(s<3600)return Math.floor(s/60)+'분 전';if(s<86400)return Math.floor(s/3600)+'시간 전';
  if(s<86400*7)return Math.floor(s/86400)+'일 전';
  const d=new Date(ms);return (d.getMonth()+1)+'월 '+d.getDate()+'일';
}
function authMsg(e){
  const c=(e&&e.code)||'';
  if(/invalid-credential|user-not-found|wrong-password|invalid-login/.test(c))return '이메일 또는 비밀번호가 맞지 않습니다.';
  if(c.includes('email-already-in-use'))return '이미 가입된 이메일입니다. 로그인해 주세요.';
  if(c.includes('weak-password'))return '비밀번호는 6자 이상으로 해 주세요.';
  if(c.includes('invalid-email'))return '이메일 형식을 확인해 주세요.';
  if(c.includes('too-many-requests'))return '시도가 너무 많습니다. 잠시 후 다시 해 주세요.';
  if(c.includes('network'))return '인터넷 연결을 확인해 주세요.';
  if(c.includes('requires-recent-login'))return '다시 로그인한 뒤 시도해 주세요.';
  return '처리하지 못했습니다. 잠시 후 다시 해 주세요.';
}
function fsMsg(e){
  const c=(e&&e.code)||'';
  if(c.includes('permission'))return '권한이 없어 처리하지 못했습니다.';
  if(c.includes('unavailable')||c.includes('network'))return '인터넷 연결을 확인해 주세요.';
  return '처리하지 못했습니다. 잠시 후 다시 해 주세요.';
}

/* ---------- 겹침 화면(상세·시트) 관리: 뒤로가기 버튼과 맞춤 ---------- */
const stack=[];
let gResolve=null,gResult=false;
function pushO(n){stack.push(n);history.pushState({o:n},'');}
function back(){history.back();}
addEventListener('popstate',()=>{
  const n=stack.pop();
  if(n==='g')hideG();else if(n==='d')hideDetail();else if(n==='v')$('viewer').hidden=true;
});
function hideG(){
  $('gsheet').hidden=true;
  document.body.style.overflow=$('detail').hidden?'':'hidden';
  const r=gResolve;gResolve=null;const v=gResult;gResult=false;if(r)r(v);
}
function showG(build){
  const p=$('gpanel');p.textContent='';build(p);
  $('gsheet').hidden=false;document.body.style.overflow='hidden';pushO('g');
}
$('gbg').addEventListener('click',back);
$('dback').addEventListener('click',back);
function sheetHead(p,title){const h=el('header');h.append(el('h3',null,title),btn('닫기',null,back));p.append(h);}
function ask(title,msg,ok,danger){
  return new Promise(res=>{
    gResolve=res;
    showG(p=>{
      p.append(el('h3',null,title));
      if(msg)p.append(el('div','tip',msg));
      p.append(btn(ok,'big '+(danger?'danger':'primary'),()=>{gResult=true;back();}),btn('취소','big',back));
    });
  });
}
function openPolicy(){
  showG(p=>{sheetHead(p,'약관과 방침');const f=el('iframe','pol');f.src='policy.html';f.title='약관과 방침';p.append(f);});
}

/* ---------- 화면 전환 ---------- */
function go(v){
  S.view=v;
  ['feed','write','tool','me'].forEach(k=>{$('v-'+k).hidden=k!==v;});
  document.querySelectorAll('#nav button').forEach(b=>{if(b.dataset.v===(v==='tool'?'write':v))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  $('tback').hidden=v!=='tool';
  $('ttl').textContent=v==='tool'?'공내역서에서 품목 불러오기':'장터';
  $('who').hidden=v==='tool';
  scrollTo(0,0);
  if(v==='write')renderWrite();
  if(v==='me')renderMe();
  if(v==='tool')document.body.dataset.tool='1';else delete document.body.dataset.tool;
}
document.querySelectorAll('#nav button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.v)));
$('tback').addEventListener('click',()=>go('write'));
function needLogin(){
  if(S.user&&S.profile)return false;
  toast('로그인이 필요합니다');S.authMode='login';go('me');return true;
}
function updateWho(){
  $('who').textContent='';
  const t=$('tme');if(t){t.textContent=S.user?(S.profile?S.profile.nick+' 님':'내 정보'):'로그인';}
}
$('tme').addEventListener('click',()=>{if(!S.user)S.authMode='login';go('me');});

/* ---------- 장터(목록) ---------- */
async function loadFeed(){
  S.loading=true;S.loadErr=false;renderFeed();
  try{
    const snap=await getDocs(query(collection(db,'posts'),orderBy('createdAt','desc'),limit(S.limit)));
    S.posts=snap.docs.map(d=>Object.assign({id:d.id},d.data()));
    S.more=snap.docs.length>=S.limit;
  }catch(e){S.loadErr=true;}
  S.loading=false;renderFeed();
}
function visible(){
  const q=S.q.toLowerCase();
  return S.posts.filter(p=>!S.blocks.has(p.authorId)&&(S.type==='all'||p.type===S.type)&&(!S.cat||p.cat===S.cat)&&(S.closed||p.status!=='closed')&&(!q||((p.title||'')+' '+(p.body||'')).toLowerCase().includes(q)));
}
function postCard(p){
  const b=el('button','post'+(p.status==='closed'?' done':''));b.type='button';
  const tx=el('div','tx');
  const r=el('div','row');r.append(el('span','tag '+p.type,TYPE[p.type]||''));
  if(p.cat)r.append(el('span','tag cat',p.cat));
  if(p.status==='closed')r.append(el('span','tag end','거래완료'));
  r.append(el('span','tm',ago(p.createdAt)));
  tx.append(r,el('h3',null,p.title||''));
  if(p.body)tx.append(el('p',null,p.body));
  const n=(p.items||[]).length;
  tx.append(el('div','by',(p.authorName||'')+(n?' · 품목 '+n+'개':'')+(p.pc>1?' · 사진 '+p.pc+'장':'')));
  b.append(tx);
  if(p.thumb){const im=el('img');im.src=p.thumb;im.alt='';im.loading='lazy';b.append(im);}
  b.addEventListener('click',()=>openPost(p.id));
  return b;
}
function renderFeed(){
  const t=$('ftype');t.textContent='';
  [['all','전체'],['need','구해요'],['sell','팝니다']].forEach(([k,l])=>{
    const b=btn(l,null,()=>{S.type=k;renderFeed();});b.setAttribute('aria-pressed',String(S.type===k));t.append(b);});
  const c=$('fcat');c.textContent='';
  ['',...CATS].forEach(k=>{const b=btn(k||'모든 분류',null,()=>{S.cat=k;renderFeed();});b.setAttribute('aria-pressed',String(S.cat===k));c.append(b);});
  const ls=$('flist');ls.textContent='';
  if(S.loading){for(let i=0;i<4;i++)ls.append(el('div','skel'));$('fcnt').textContent='불러오는 중…';$('fmore').hidden=true;$('fdone').hidden=true;return;}
  $('fdone').hidden=false;$('fdone').textContent=S.closed?'거래완료 글 숨기기':'거래완료 글도 보기';
  if(S.loadErr){
    const e=el('div','empty card');e.append(el('div',null,'글을 불러오지 못했습니다.'),el('br'),btn('다시 시도','primary',loadFeed));
    ls.append(e);$('fcnt').textContent='';$('fmore').hidden=true;return;
  }
  const v=visible();$('fcnt').textContent=v.length+'개의 글';
  if(!v.length){
    const e=el('div','empty card');
    e.append(el('div',null,S.q||S.cat||S.type!=='all'?'조건에 맞는 글이 없습니다.':'아직 올라온 글이 없습니다.'),el('br'),btn('첫 글 올리기','primary',()=>go('write')));
    ls.append(e);
  }
  v.forEach(p=>ls.append(postCard(p)));
  $('fmore').hidden=!S.more;
}
$('fq').addEventListener('input',e=>{S.q=e.target.value.trim();renderFeed();});
$('fdone').addEventListener('click',()=>{S.closed=!S.closed;renderFeed();});
$('fmoreb').addEventListener('click',()=>{S.limit+=40;loadFeed();});

/* ---------- 글 보기 ---------- */
let cur=null,curComments=[];
function hideDetail(){$('detail').hidden=true;document.body.style.overflow='';cur=null;}
async function openPost(id){
  let p=S.posts.find(x=>x.id===id);
  if(!p){
    try{const d=await getDoc(doc(db,'posts',id));if(!d.exists()){toast('삭제된 글입니다');return;}p=Object.assign({id},d.data());}
    catch(e){toast(fsMsg(e));return;}
  }
  cur=p;curComments=[];
  $('detail').hidden=false;document.body.style.overflow='hidden';pushO('d');
  renderDetail();loadComments();loadPhotos(p);
}
function renderDetail(){
  const p=cur;if(!p)return;
  const mine=S.user&&p.authorId===S.user.uid;
  const b=$('dbody');b.textContent='';
  if(p.pc){const g=el('div','gal');g.id='gal';b.append(g);}
  const r=el('div','row');r.append(el('span','tag '+p.type,TYPE[p.type]||''));
  if(p.cat)r.append(el('span','tag cat',p.cat));
  if(p.status==='closed')r.append(el('span','tag end','거래완료'));
  b.append(r,el('h2','dtitle',p.title||''),el('div','dby',(p.authorName||'')+' · '+ago(p.createdAt)));
  if(p.body)b.append(el('div','dbody',p.body));
  if(p.items&&p.items.length){
    const c=el('div','card form');c.append(el('h3','h4','품목 '+p.items.length+'개'));
    const w=el('div','its');
    p.items.forEach(it=>{
      const li=el('div','li');const l=el('span',null,it.n+(it.s?' · '+it.s:''));
      li.append(l,el('span',null,Number(it.q).toLocaleString('ko-KR',{maximumFractionDigits:3})+' '+it.u));w.append(li);});
    c.append(w,btn('품목 표 복사',null,async()=>{
      const t=['품명\t규격\t단위\t수량',...p.items.map(i=>[i.n,i.s||'',i.u,i.q].join('\t'))].join('\n');
      try{await navigator.clipboard.writeText(t);toast('복사했습니다');}catch(e){toast('복사하지 못했습니다');}}));
    b.append(c);
  }
  if(mine){
    const a=el('div','act');
    a.append(btn(p.status==='closed'?'다시 열기':'거래완료로 바꾸기','primary',toggleClosed),btn('글 삭제','danger',delPost));
    b.append(a);
  }else{
    const s=el('div','sub');
    s.append(btn('신고하기',null,()=>report(p.id,null,p.authorId)),btn('작성자 차단',null,()=>blockUser(p.authorId,p.authorName,true)));
    b.append(s);
  }
  const ch=el('h3','h4','댓글');ch.id='chead';b.append(ch);
  const cl=el('div');cl.id='clist';b.append(cl);
  renderComments();renderCbox();renderGal();
}
function renderGal(){
  const g=$('gal');if(!g||!cur)return;g.textContent='';
  const ph=cur._ph;
  if(!ph){g.append(el('div','skel gs'));return;}
  const sc=el('div','gs');
  ph.forEach((x,i)=>{const im=el('img');im.src=x;im.alt=(cur.title||'')+' 사진 '+(i+1);im.addEventListener('click',()=>viewer(ph,i));sc.append(im);});
  g.append(sc);
  if(ph.length>1){const c=el('span','gc','1 / '+ph.length);g.append(c);
    sc.addEventListener('scroll',()=>{c.textContent=(Math.round(sc.scrollLeft/sc.clientWidth)+1)+' / '+ph.length;});}
}
async function loadPhotos(p){
  if(!p.pc||p._ph)return;
  try{
    const s=await getDocs(collection(db,'posts',p.id,'photos'));
    p._ph=s.docs.map(d=>d.data()).sort((a,b)=>a.n-b.n).map(x=>x.data);
  }catch(e){p._ph=[];}
  if(cur===p)renderGal();
}
function viewer(ph,i){
  const v=$('viewer');v.textContent='';
  const sc=el('div','vs');ph.forEach(x=>{const im=el('img');im.src=x;im.alt='';sc.append(im);});
  const c=el('button','vx','닫기');c.type='button';c.addEventListener('click',back);
  v.append(sc,c);v.hidden=false;pushO('v');sc.scrollLeft=sc.clientWidth*i;
}
async function loadComments(){
  const p=cur;if(!p||!S.user){renderComments();return;}
  try{
    const snap=await getDocs(query(collection(db,'comments'),where('postId','==',p.id)));
    if(cur!==p)return;
    curComments=snap.docs.map(d=>Object.assign({id:d.id},d.data()));
    curComments.sort((a,b)=>((a.createdAt&&a.createdAt.toMillis&&a.createdAt.toMillis())||Infinity)-((b.createdAt&&b.createdAt.toMillis&&b.createdAt.toMillis())||Infinity));
  }catch(e){const l=$('clist');if(l){l.textContent='';l.append(el('div','tip','댓글을 불러오지 못했습니다.'));}return;}
  renderComments();
}
function renderComments(){
  const l=$('clist');if(!l)return;l.textContent='';
  if(!S.user){
    const c=el('div','card form');c.append(el('div','tip','로그인하면 댓글을 보고 남길 수 있습니다. 연락처는 댓글로 주고받으세요.'),btn('로그인하기','primary',()=>{needLogin();back();}));
    l.append(c);$('chead').textContent='댓글';return;
  }
  const list=curComments.filter(c=>!S.blocks.has(c.authorId));
  $('chead').textContent='댓글 '+list.length;
  if(!list.length)l.append(el('div','tip','아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.'));
  list.forEach(c=>{
    const w=el('div','cm'),h=el('div','ch');h.append(el('b',null,c.authorName||''),el('span',null,ago(c.createdAt)));
    if(S.user.uid===c.authorId)h.append(btn('삭제',null,()=>delComment(c)));
    else h.append(btn('신고',null,()=>report(cur.id,c.id,c.authorId)));
    w.append(h,el('p',null,c.text||''));l.append(w);
  });
}
function renderCbox(){
  const cb=$('cbox');cb.textContent='';
  if(!S.user||!S.profile){cb.hidden=true;return;}
  cb.hidden=false;
  const t=el('textarea');t.placeholder='댓글을 입력하세요';t.maxLength=500;t.rows=1;t.setAttribute('aria-label','댓글');
  t.addEventListener('input',()=>{t.style.height='auto';t.style.height=Math.min(t.scrollHeight,120)+'px';});
  const s=btn('등록','primary',async()=>{
    const text=t.value.trim();if(!text)return;
    s.disabled=true;
    try{
      const data={postId:cur.id,text,authorId:S.user.uid,authorName:S.profile.nick,createdAt:serverTimestamp()};
      const ref=await addDoc(collection(db,'comments'),data);
      curComments.push(Object.assign({id:ref.id},data,{createdAt:{toMillis:()=>Date.now()}}));
      t.value='';t.style.height='auto';renderComments();
    }catch(e){toast(fsMsg(e));}
    s.disabled=false;
  });
  cb.append(t,s);
}
async function toggleClosed(){
  const p=cur,st=p.status==='closed'?'open':'closed';
  try{await updateDoc(doc(db,'posts',p.id),{status:st});p.status=st;const q=S.posts.find(x=>x.id===p.id);if(q)q.status=st;renderDetail();renderFeed();toast(st==='closed'?'거래완료로 바꿨습니다':'다시 열었습니다');}
  catch(e){toast(fsMsg(e));}
}
async function delPhotos(id){
  const s=await getDocs(collection(db,'posts',id,'photos'));
  for(const d of s.docs)await deleteDoc(d.ref);
}
async function delPost(){
  if(!await ask('글을 삭제할까요?','삭제하면 되돌릴 수 없습니다.','삭제',true))return;
  const id=cur.id;
  try{await delPhotos(id);await deleteDoc(doc(db,'posts',id));S.posts=S.posts.filter(x=>x.id!==id);back();renderFeed();toast('삭제했습니다');}
  catch(e){toast(fsMsg(e));}
}
async function delComment(c){
  if(!await ask('댓글을 삭제할까요?',null,'삭제',true))return;
  try{await deleteDoc(doc(db,'comments',c.id));curComments=curComments.filter(x=>x.id!==c.id);renderComments();}
  catch(e){toast(fsMsg(e));}
}
async function report(postId,commentId,targetUid){
  if(needLogin())return;
  const reasons=['스팸·광고','욕설·비방','사기 의심','불법·위험 물품','기타 부적절한 내용'];
  const reason=await new Promise(res=>{
    gResolve=null;
    showG(p=>{sheetHead(p,'신고 사유를 골라 주세요');
      reasons.forEach(r=>p.append(btn(r,'opt',()=>{p.dataset.r=r;gResult=true;back();})));
      gResolve=()=>res($('gpanel').dataset.r||null);});
  });
  if(!reason)return;
  try{
    const d={postId,targetUid,reason,reporterId:S.user.uid,createdAt:serverTimestamp()};
    if(commentId)d.commentId=commentId;
    await addDoc(collection(db,'reports'),d);
    toast('신고했습니다. 확인 후 조치하겠습니다');
  }catch(e){toast(fsMsg(e));}
  delete $('gpanel').dataset.r;
}
async function blockUser(uid,nick,closeDetailAfter){
  if(needLogin())return;
  if(uid===S.user.uid)return;
  if(!await ask((nick||'이 사용자')+' 님을 차단할까요?','이 사용자의 글과 댓글이 보이지 않습니다. 내 정보에서 해제할 수 있습니다.','차단',true))return;
  try{
    await setDoc(doc(db,'users',S.user.uid,'blocks',uid),{nick:nick||'',createdAt:serverTimestamp()});
    S.blocks.set(uid,nick||'');
    if(closeDetailAfter)back();
    renderFeed();toast('차단했습니다');
  }catch(e){toast(fsMsg(e));}
}

/* ---------- 글쓰기 ---------- */
const MAXP=5;
function loadImg(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file);const i=new Image();
  i.onload=()=>{URL.revokeObjectURL(u);res(i);};i.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('img'));};i.src=u;});}
function drawJ(img,max,q,square){
  const w=img.naturalWidth,h=img.naturalHeight,c=document.createElement('canvas'),x=c.getContext('2d');
  if(square){c.width=c.height=max;const sc=Math.max(max/w,max/h);x.fillStyle='#fff';x.fillRect(0,0,max,max);x.drawImage(img,(max-w*sc)/2,(max-h*sc)/2,w*sc,h*sc);}
  else{const r=Math.min(1,max/Math.max(w,h));c.width=Math.round(w*r);c.height=Math.round(h*r);x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);}
  return c.toDataURL('image/jpeg',q);
}
async function prep(file){
  const img=await loadImg(file);
  let q=.8,m=1280,full=drawJ(img,m,q);
  while(full.length>380000&&q>.4){q-=.08;m=Math.max(800,m-160);full=drawJ(img,m,q);}
  let tq=.7,thumb=drawJ(img,240,tq,true);
  while(thumb.length>38000&&tq>.3){tq-=.1;thumb=drawJ(img,240,tq,true);}
  return {full,thumb};
}
function renderWrite(){
  const f=$('wform');
  if(!S.user||!S.profile){
    f.textContent='';f.append(el('h2',null,'글쓰기'),el('div','tip','글을 올리려면 로그인이 필요합니다. 둘러보기는 로그인 없이 됩니다.'),
      btn('로그인 / 회원가입','primary big',()=>{S.authMode='login';go('me');}));
    return;
  }
  const keep={title:($('wt')||{}).value,body:($('wb')||{}).value,cat:($('wc')||{}).value};
  if(S.pre){keep.title=S.pre.title;keep.body=S.pre.body;S.pre=null;}
  f.textContent='';
  f.append(el('h2',null,'글쓰기'));
  const seg=el('div','seg seg3');seg.style.gridTemplateColumns='1fr 1fr';
  [['need','구해요','필요한 물건'],['sell','팝니다','팔 물건']].forEach(([k,l,s])=>{
    const b=btn(l+' · '+s,null,()=>{S.wtype=k;renderWrite();});b.setAttribute('aria-pressed',String(S.wtype===k));seg.append(b);});
  f.append(seg);
  const pl=el('div');pl.append(el('label',null,'사진 (선택, 최대 '+MAXP+'장)'));
  const ph=el('div','photos');
  const add=btn('','ph add',()=>inp.click());add.append(el('b',null,'+'),el('span',null,S.photos.length+'/'+MAXP));add.setAttribute('aria-label','사진 추가');
  const inp=el('input');inp.type='file';inp.accept='image/*';inp.multiple=true;inp.hidden=true;
  inp.addEventListener('change',async()=>{
    const fl=[...inp.files].slice(0,MAXP-S.photos.length);inp.value='';if(!fl.length)return;
    add.disabled=true;toast('사진을 줄이는 중…');
    for(const fi of fl){try{S.photos.push(await prep(fi));}catch(e){toast('사진을 읽지 못했습니다');}}
    renderWrite();
  });
  if(S.photos.length<MAXP)ph.append(add,inp);
  S.photos.forEach((x,i)=>{
    const t=el('div','ph');const im=el('img');im.src=x.thumb;im.alt='선택한 사진 '+(i+1);t.append(im);
    const rm=btn('✕','x',()=>{S.photos.splice(i,1);renderWrite();});rm.setAttribute('aria-label','사진 빼기');t.append(rm);
    if(i===0)t.append(el('span','mn','대표'));ph.append(t);});
  pl.append(ph);f.append(pl);
  const a=el('div','attach');
  if(S.attach){
    a.append(el('span',null,'공내역서 품목 '),el('b',null,S.attach.rows.length+'개'),el('span',null,' 포함'));
    a.append(btn('빼기',null,()=>{S.attach=null;renderWrite();}));f.append(a);
  }else if(S.wtype==='need'){
    f.append(btn('공내역서 엑셀에서 품목 불러오기','big ghost',()=>go('tool')));
  }
  const g1=el('div');g1.append(el('label',null,'분류'));
  const sel=el('select');sel.id='wc';CATS.forEach(c=>{const o=el('option',null,c);o.value=c;sel.append(o);});sel.value=keep.cat||CATS[0];g1.append(sel);
  const g2=el('div');g2.append(el('label',null,'제목'));
  const ti=el('input');ti.id='wt';ti.maxLength=80;ti.placeholder=S.wtype==='need'?'예) 조립식 가설사무소 임대 구합니다':'예) 사용 안 한 H빔 10톤 팝니다';ti.value=keep.title||'';g2.append(ti);
  const g3=el('div');g3.append(el('label',null,'내용'));
  const bo=el('textarea');bo.id='wb';bo.maxLength=3000;bo.placeholder=S.wtype==='need'?'수량, 지역, 필요한 시기를 적어 주세요.':'상태, 수량, 가격, 지역을 적어 주세요.';bo.value=keep.body||'';g3.append(bo);
  f.append(g1,g2,g3,el('div','tip','연락처는 글에 적지 말고, 댓글로 주고받으세요. 댓글은 로그인한 회원에게만 보입니다.'));
  const err=el('div','err');err.id='werr';
  const sub=btn('올리기','primary big',async()=>{
    const title=ti.value.trim(),body=bo.value.trim();
    err.textContent='';
    if(title.length<2){err.textContent='제목을 2자 이상 적어 주세요.';ti.focus();return;}
    sub.disabled=true;sub.textContent='올리는 중…';
    try{
      const data={type:S.wtype,title,body,cat:sel.value,authorId:S.user.uid,authorName:S.profile.nick,status:'open',createdAt:serverTimestamp()};
      if(S.attach&&S.attach.rows.length)data.items=S.attach.rows.slice(0,300);
      const pics=S.photos.slice();
      if(pics.length){data.thumb=pics[0].thumb;data.pc=pics.length;}
      const ref=await addDoc(collection(db,'posts'),data);
      let fail=0;
      for(let i=0;i<pics.length;i++){
        sub.textContent='사진 올리는 중 ('+(i+1)+'/'+pics.length+')';
        try{await addDoc(collection(db,'posts',ref.id,'photos'),{data:pics[i].full,n:i});}catch(e){fail++;}
      }
      if(fail)toast('사진 '+fail+'장을 올리지 못했습니다');
      S.attach=null;S.photos=[];S.posts.unshift(Object.assign({id:ref.id},data,{createdAt:{toMillis:()=>Date.now()}}));
      renderWrite();go('feed');renderFeed();toast('글을 올렸습니다');openPost(ref.id);
    }catch(e){err.textContent=fsMsg(e);sub.disabled=false;sub.textContent='올리기';}
  });
  f.append(err,sub);
}

/* ---------- 내 정보 ---------- */
function field(label,type,id,ph,extra){
  const w=el('div');w.append(el('label',null,label));
  const i=el('input');i.type=type;i.id=id;if(ph)i.placeholder=ph;if(extra)Object.assign(i,extra);
  if(type==='password'){
    const box=el('div','pw');box.append(i);
    const t=btn('보기',null,()=>{const show=i.type==='password';i.type=show?'text':'password';t.textContent=show?'숨기기':'보기';});
    t.setAttribute('aria-label','비밀번호 보기 또는 숨기기');box.append(t);w.append(box);
  }else w.append(i);
  return w;
}
function renderMe(){
  const v=$('v-me');v.textContent='';
  if(!S.user){renderAuth(v);return;}
  if(!S.profile){renderNick(v);return;}
  const h=el('div','card me-h');h.append(el('b',null,S.profile.nick),el('span',null,S.user.email));v.append(h);
  const m=el('div','card menu');
  m.append(
    mi('내가 쓴 글','',myPosts),
    mi('차단한 사용자',S.blocks.size?S.blocks.size+'명':'',blockList),
    mi('약관과 개인정보처리방침','',openPolicy),
    mi('로그아웃','',async()=>{await signOut(auth);toast('로그아웃했습니다');}));
  v.append(m);
  const d=btn('회원 탈퇴','danger big',delAccount);v.append(d);
}
function mi(t,r,fn){const b=btn('',null,fn);b.append(el('span',null,t),el('span',null,r?r+'  ›':'›'));return b;}
function renderAuth(v){
  const c=el('div','card form f');
  const tabs=el('div','auth-tabs');
  [['login','로그인'],['signup','회원가입']].forEach(([k,l])=>{const b=btn(l,null,()=>{S.authMode=k;renderMe();});b.setAttribute('aria-pressed',String(S.authMode===k));tabs.append(b);});
  c.append(tabs);
  const signup=S.authMode==='signup';
  c.append(el('h2',null,signup?'회원가입':'로그인'));
  if(signup)c.append(field('닉네임 (2~20자, 다른 사람에게 보입니다)','text','anick','예) 현장소장김씨',{maxLength:20,autocomplete:'nickname'}));
  c.append(field('이메일','email','aem','name@example.com',{autocomplete:'email',inputMode:'email'}));
  c.append(field(signup?'비밀번호 (6자 이상)':'비밀번호','password','apw','',{autocomplete:signup?'new-password':'current-password'}));
  let chk;
  if(signup){
    const w=el('label','chk');chk=el('input');chk.type='checkbox';chk.id='aok';
    const s=el('span');const lk=btn('약관과 개인정보처리방침',null,e=>{e.preventDefault();openPolicy();});
    s.append('만 14세 이상이며 ',lk,' 에 동의합니다.');w.append(chk,s);c.append(w);
  }
  const err=el('div','err');
  const go1=btn(signup?'가입하기':'로그인','primary big',async()=>{
    err.textContent='';
    const em=$('aem').value.trim(),pw=$('apw').value;
    if(!em||!pw){err.textContent='이메일과 비밀번호를 입력해 주세요.';return;}
    go1.disabled=true;
    try{
      if(signup){
        const nick=$('anick').value.trim();
        if(nick.length<2){err.textContent='닉네임을 2자 이상 적어 주세요.';go1.disabled=false;return;}
        if(!chk.checked){err.textContent='약관 동의에 체크해 주세요.';go1.disabled=false;return;}
        S.signingUp=true;
        const cr=await createUserWithEmailAndPassword(auth,em,pw);
        try{await setDoc(doc(db,'users',cr.user.uid),{nick,createdAt:serverTimestamp()});S.profile={nick};}
        catch(e){S.profile=null;}
        S.signingUp=false;S.user=cr.user;
        updateWho();if(S.pre&&S.profile)go('write');else renderMe();toast('가입했습니다');
      }else{
        await signInWithEmailAndPassword(auth,em,pw);
        toast('로그인했습니다');
      }
    }catch(e){S.signingUp=false;err.textContent=authMsg(e);go1.disabled=false;}
  });
  c.append(err,go1);
  if(!signup)c.append(btn('비밀번호를 잊으셨나요?','',async()=>{
    const em=$('aem').value.trim();if(!em){err.textContent='위에 이메일을 먼저 입력해 주세요.';return;}
    try{await sendPasswordResetEmail(auth,em);toast('재설정 메일을 보냈습니다');}catch(e){err.textContent=authMsg(e);}
  }));
  v.append(c);
}
function renderNick(v){
  const c=el('div','card form f');c.append(el('h2',null,'닉네임을 정해 주세요'),field('닉네임 (2~20자)','text','nn','',{maxLength:20}));
  const err=el('div','err');
  c.append(err,btn('저장','primary big',async()=>{
    const nick=$('nn').value.trim();if(nick.length<2){err.textContent='2자 이상 적어 주세요.';return;}
    try{await setDoc(doc(db,'users',S.user.uid),{nick,createdAt:serverTimestamp()});S.profile={nick};updateWho();renderMe();}
    catch(e){err.textContent=fsMsg(e);}
  }));
  v.append(c);
}
async function myPosts(){
  let list=[];
  try{const s=await getDocs(query(collection(db,'posts'),where('authorId','==',S.user.uid)));list=s.docs.map(d=>Object.assign({id:d.id},d.data()));}
  catch(e){toast(fsMsg(e));return;}
  list.sort((a,b)=>((b.createdAt&&b.createdAt.toMillis&&b.createdAt.toMillis())||0)-((a.createdAt&&a.createdAt.toMillis&&a.createdAt.toMillis())||0));
  showG(p=>{sheetHead(p,'내가 쓴 글');
    if(!list.length)p.append(el('div','tip','아직 쓴 글이 없습니다.'));
    list.forEach(x=>{const c=postCard(x);c.addEventListener('click',()=>{S.posts.some(y=>y.id===x.id)||S.posts.push(x);back();setTimeout(()=>openPost(x.id),60);});p.append(c);});});
}
function blockList(){
  showG(p=>{sheetHead(p,'차단한 사용자');
    if(!S.blocks.size)p.append(el('div','tip','차단한 사용자가 없습니다.'));
    [...S.blocks].forEach(([uid,nick])=>{
      const r=el('div','row');r.style.justifyContent='space-between';r.append(el('b',null,nick||'(이름 없음)'));
      r.append(btn('해제',null,async()=>{
        try{await deleteDoc(doc(db,'users',S.user.uid,'blocks',uid));S.blocks.delete(uid);back();renderMe();renderFeed();toast('차단을 해제했습니다');}
        catch(e){toast(fsMsg(e));}}));
      p.append(r);});});
}
async function delAccount(){
  showG(p=>{
    sheetHead(p,'회원 탈퇴');
    p.append(el('div','tip','내가 쓴 글과 댓글, 차단 목록, 계정 정보가 모두 삭제되며 되돌릴 수 없습니다. 계속하려면 비밀번호를 입력해 주세요.'));
    const f=el('div','f');f.append(field('비밀번호','password','dpw','',{autocomplete:'current-password'}));p.append(f);
    const err=el('div','err');
    const ok=btn('탈퇴하기','big danger',async()=>{
      err.textContent='';const pw=$('dpw').value;if(!pw){err.textContent='비밀번호를 입력해 주세요.';return;}
      ok.disabled=true;ok.textContent='처리 중…';
      try{
        const u=S.user;
        await reauthenticateWithCredential(u,EmailAuthProvider.credential(u.email,pw));
        for(const col of ['posts','comments']){
          const s=await getDocs(query(collection(db,col),where('authorId','==',u.uid)));
          for(const d of s.docs){if(col==='posts')await delPhotos(d.id);await deleteDoc(d.ref);}
        }
        const b=await getDocs(collection(db,'users',u.uid,'blocks'));
        for(const d of b.docs)await deleteDoc(d.ref);
        await deleteDoc(doc(db,'users',u.uid));
        await deleteUser(u);
        back();toast('탈퇴했습니다');loadFeed();
      }catch(e){err.textContent=authMsg(e);ok.disabled=false;ok.textContent='탈퇴하기';}
    });
    p.append(err,ok,btn('취소','big',back));
  });
}

/* ---------- 공내역서 연결 ---------- */
initExtractor({onPost:({site,rows})=>{
  if(!rows.length)return;
  const capped=rows.slice(0,300);
  S.attach={site,rows:capped};S.wtype='need';
  go('write');
  const t=$('wt'),b=$('wb');
  if(t&&!t.value)t.value=('[공내역서] '+(site?site+' ':'')+'자재 견적 요청').slice(0,80);
  if(b&&!b.value)b.value='아래 품목의 단가를 알고 싶습니다.\n'+(site?'현장: '+site+'\n':'')+'납품 지역과 시기: ';
  if(rows.length>300)toast('품목이 많아 앞의 300개만 담았습니다');
}});

/* ---------- 로그인 상태 ---------- */
async function loadBlocks(){
  S.blocks=new Map();
  try{const s=await getDocs(collection(db,'users',S.user.uid,'blocks'));s.docs.forEach(d=>S.blocks.set(d.id,(d.data()||{}).nick||''));}catch(e){}
}
onAuthStateChanged(auth,async u=>{
  S.user=u;
  if(u){
    if(!S.signingUp){
      try{const d=await getDoc(doc(db,'users',u.uid));S.profile=d.exists()?{nick:d.data().nick}:null;}catch(e){S.profile=null;}
    }
    await loadBlocks();
  }else{S.profile=null;S.blocks=new Map();}
  updateWho();renderFeed();
  if(S.pre&&S.user&&S.profile&&S.view!=='write'){go('write');}
  else if(S.view==='me'||S.view==='write'){if(S.view==='me')renderMe();else renderWrite();}
  if(cur){renderDetail();loadComments();}
});

/* 낙찰 사이트에서 넘어온 글쓰기: 제목과 내용만 채워 주고, 올리기 전에 직접 고치고 고릅니다 */
const QP=new URLSearchParams(location.search);
if(QP.get('title')||QP.get('body')){S.pre={title:(QP.get('title')||'').slice(0,80),body:(QP.get('body')||'').slice(0,3000)};if(QP.get('type')==='sell')S.wtype='sell';}
go(S.pre?'write':'feed');
loadFeed();
