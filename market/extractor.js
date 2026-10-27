import {parseSheet,kind,SAMPLE} from './parse.js';
const $=id=>document.getElementById(id);
export function initExtractor(opt){
const KS=['자재','가설·임대','공사·서비스'];
const KC={'자재':'m','가설·임대':'r','공사·서비스':'s'};
let items=[],tab='전체',gsel='',qs='',shown=60,sel=new Set();
function load(list){items=list.map((x,i)=>Object.assign({id:i,k:kind(x)},x));sel=new Set();tab='전체';gsel='';qs='';$('q').value='';shown=60;buildG();render();}
function fromSample(){return SAMPLE.map(a=>({f:a[0],g:a[1],n:a[2],s:a[3],u:a[4],q:a[5]}));}
function buildG(){const g=$('g');g.textContent='';const o=document.createElement('option');o.value='';o.textContent='모든 공종';g.append(o);
  [...new Set(items.map(x=>x.g).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko')).forEach(v=>{const p=document.createElement('option');p.value=v;p.textContent=v;g.append(p);});}
function vis(){const q=qs.toLowerCase();return items.filter(x=>(tab==='전체'||x.k===tab)&&(!gsel||x.g===gsel)&&(!q||(x.n+' '+x.s).toLowerCase().includes(q)));}
function fmt(n){return Number(n).toLocaleString('ko-KR',{maximumFractionDigits:3});}
function render(){
  const cnt={};items.forEach(x=>{cnt[x.k]=(cnt[x.k]||0)+1;});
  const t=$('tabs');t.textContent='';
  [['전체',items.length],...KS.map(k=>[k,cnt[k]||0])].forEach(([k,n])=>{
    const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String(tab===k));
    const a=document.createElement('span');a.className='n';a.textContent=n.toLocaleString('ko-KR');
    const l=document.createElement('span');l.className='l';l.textContent=k==='공사·서비스'?'공사·서비스':k;
    b.append(a,l);b.addEventListener('click',()=>{tab=k;shown=60;render();});t.append(b);});
  const v=vis();$('cnt').textContent=v.length.toLocaleString('ko-KR')+'개 품목';
  const ls=$('list');ls.textContent='';
  if(!v.length){const e=document.createElement('div');e.className='empty card';e.textContent='조건에 맞는 품목이 없습니다.';ls.append(e);}
  v.slice(0,shown).forEach(x=>{
    const r=document.createElement('label');r.className='it'+(sel.has(x.id)?' sel':'');
    const c=document.createElement('input');c.type='checkbox';c.checked=sel.has(x.id);
    c.addEventListener('change',()=>{c.checked?sel.add(x.id):sel.delete(x.id);r.classList.toggle('sel',c.checked);upd();});
    const m=document.createElement('div');
    const nm=document.createElement('div');nm.className='nm';nm.textContent=x.n;m.append(nm);
    if(x.s){const sp=document.createElement('div');sp.className='sp';sp.textContent=x.s;m.append(sp);}
    const mt=document.createElement('div');mt.className='meta';
    const kb=document.createElement('span');kb.className='k '+KC[x.k];kb.textContent=x.k;mt.append(kb);
    if(x.g){const g=document.createElement('span');g.textContent=x.g;mt.append(g);}
    m.append(mt);
    const q=document.createElement('div');q.className='qt';const qb=document.createElement('b');qb.textContent=fmt(x.q);const qu=document.createElement('span');qu.textContent=x.u;q.append(qb,qu);
    r.append(c,m,q);ls.append(r);});
  $('more').hidden=v.length<=shown;
  upd();
}
function upd(){const n=sel.size;$('bar').hidden=!n;
  const t=$('bt');t.textContent='';t.append(n+'개 선택');
  if(n){const s=document.createElement('small');s.textContent='요청서에 담을 품목';t.append(s);}
  if(!n)closeSheet();}
function mk(){
  const rows=items.filter(x=>sel.has(x.id));
  const L=['견적 요청서','현장명\t'+$('site').value,'요청 품목\t'+rows.length+'건','','구분\t품명\t규격\t단위\t수량\t단가(원)\t비고'];
  rows.forEach(x=>L.push([x.k,x.n,x.s,x.u,x.q,'',''].join('\t')));
  $('out').value=L.join('\n');$('outl').textContent='요청 품목 '+rows.length+'건';
}
function openSheet(){mk();$('sheet').hidden=false;document.body.style.overflow='hidden';}
function closeSheet(){if($('sheet').hidden)return;$('sheet').hidden=true;document.body.style.overflow='';}
$('go').addEventListener('click',openSheet);
$('shclose').addEventListener('click',closeSheet);$('shbg').addEventListener('click',closeSheet);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet();});
$('site').addEventListener('input',mk);
$('clear').addEventListener('click',()=>{sel=new Set();render();});
$('copy').addEventListener('click',async()=>{const o=$('out');const b=$('copy');
  try{await navigator.clipboard.writeText(o.value);b.textContent='복사했습니다';}catch(e){o.focus();o.select();b.textContent='선택했습니다. 길게 눌러 복사해 주세요';}
  setTimeout(()=>{b.textContent='견적 요청서 복사';},2200);});
$('q').addEventListener('input',e=>{qs=e.target.value.trim();shown=60;render();});
$('g').addEventListener('change',e=>{gsel=e.target.value;shown=60;render();});
$('moreb').addEventListener('click',()=>{shown+=100;render();});
$('all').addEventListener('click',()=>{const v=vis().slice(0,shown);const every=v.length>0&&v.every(x=>sel.has(x.id));v.forEach(x=>{every?sel.delete(x.id):sel.add(x.id);});render();});
function readFile(f){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=()=>rej(new Error('읽지 못했습니다'));
  r.onload=()=>{try{
    const wb=XLSX.read(r.result,{type:'array'});const all=[];
    wb.SheetNames.filter(n=>/내역서/.test(n)&&!/집계/.test(n)).forEach(n=>{
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:null});
      const p=parseSheet(rows);if(p)p.forEach(x=>all.push(Object.assign({f:f.name},x)));});
    res(all);}catch(e){rej(e);}};r.readAsArrayBuffer(f);});}
async function handle(fl){
  fl=[...fl].filter(f=>/\.xlsx?$/i.test(f.name));if(!fl.length)return;
  const box=$('files');box.textContent='읽는 중…';let all=[];const bad=[];
  for(const f of fl){try{const r=await readFile(f);if(r.length)all=all.concat(r);else bad.push(f.name);}catch(e){bad.push(f.name);}}
  box.textContent='';
  fl.forEach(f=>{const c=document.createElement('span');c.className='chip';c.textContent=f.name+(bad.includes(f.name)?' (품목을 찾지 못함)':'');box.append(c);});
  const d=$('demo');
  if(all.length){d.hidden=true;load(all);}
  else{d.hidden=false;d.textContent='';const b=document.createElement('b');b.textContent='안내';const s=document.createElement('span');s.textContent='올린 파일에서 품목 표를 찾지 못했습니다. 공종별내역서나 내역서 시트가 있는 엑셀인지 확인해 주세요.';d.append(b,s);}
}
$('pick').addEventListener('click',()=>$('file').click());
$('file').addEventListener('change',e=>{handle(e.target.files);e.target.value='';});
const dz=$('drop');
['dragenter','dragover'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.add('over');}));
['dragleave','drop'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.remove('over');}));
dz.addEventListener('drop',e=>handle(e.dataTransfer.files));

$('topost').addEventListener('click',()=>{
  const rows=items.filter(x=>sel.has(x.id)).map(x=>({n:x.n.slice(0,80),s:(x.s||'').slice(0,80),u:x.u,q:x.q,k:x.k}));
  closeSheet();opt.onPost({site:$('site').value.trim(),rows});});
load(fromSample());
}
