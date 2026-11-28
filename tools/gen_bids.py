"""진행 중인 입찰공고 페이지(b/...)를 만듭니다.

data/bids.json(수집기가 내보낸 공개용 공고)을 지역별로 나눠 '마감이 가까운 순'으로 보여 줍니다.
담당자 이름·전화는 데이터에 없습니다. 같은 입력이면 같은 출력이 나옵니다.
"""
import datetime as dt
import html
import json
import os
import re
import shutil
from urllib.parse import quote

from common import FOOTER, HEADER, SCRIPTS, band
from gen_areas import money

e = html.escape
ROWS = 150
POP = '''<div id="bdp" role="dialog" aria-modal="false" aria-label="입찰공고 상세"><div class="bx"><div class="bhd"><b>입찰공고</b><button type="button" class="x" aria-label="닫기">×</button></div><div id="bdc"></div></div></div>
<script>(function(){var P=document.getElementById('bdp'),C=document.getElementById('bdc');function E(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function R(k,v){return v?'<dt>'+k+'</dt><dd>'+E(v)+'</dd>':''}
function W(c){var t=String(c||'').replace('T',' ');var m=/(\d+)-(\d+)-(\d+) (\d+:\d+)/.exec(t);if(!m)return t;var w='일월화수목금토'[new Date(+m[1],+m[2]-1,+m[3]).getDay()];return +m[2]+'월 '+ +m[3]+'일('+w+') '+m[4]}
function open(i){var d=(window.BDS||[])[i];if(!d)return;var who=d.dm||d.og,rg=d.rg&&d.rg!=='미분류'&&d.rg!=='기타'?d.rg:'';var kd=new Date(Date.now()+324e5).toISOString().slice(0,10),xx=Math.round((Date.parse(String(d.cl).slice(0,10))-Date.parse(kd))/864e5);d.dd=xx<=0?'D-day':'D-'+xx;var kn=String(d.kind||'').replace(/공사업$/,'공사')||'공사';var lead=E(who)+'에서 '+(d.pr?'<b>'+E(d.pr)+'</b> 규모 ':'')+E(kn)+(/[가-힣]$/.test(kn)&&/사$/.test(kn)?'를':'를')+' 내놨어요. <b>'+E(W(d.cl))+'</b>까지 입찰을 받아요.</p><p class="nx">낙찰 업체는 아직 정해지지 않았어요. 입찰이 끝나면 일감마켓에 올라와요.';
C.innerHTML=(d.dd?'<span class="dd'+(/^D-(0|1|2)$|D-day/.test(d.dd)?' hot':'')+'">'+(d.dd==='D-day'?'오늘 마감':'마감 '+E(d.dd))+'</span>':'')+'<h3>'+E(d.nm)+'</h3><p class="lead">'+lead+'</p><dl>'+R('발주한 곳',who)+R('지역',d.ar||d.rg)+R('예상 금액',d.pr)+R('입찰 마감',W(d.cl))+'</dl><details class="mo"><summary>공고 상세 더 보기</summary><dl>'+R('공고기관',d.og&&d.og!==d.dm?d.og:'')+R('업종',d.kind)+R('결과 확인',W(d.op))+R('입찰 방식',d.m)+R('공고 게시',d.pd)+'</dl></details><div class="ac"><a class="g" href="/?join=1">'+(rg?E(rg)+' ':'')+'낙찰 소식, 아침 7:30 메일로 받기</a><small class="gs">이 공고도 낙찰되면 그 메일에 들어 있어요.</small>'+(d.ol?'<a class="t" href="'+E(d.ol)+'">'+E(who)+'이 지난번에 일감을 준 업체 보기</a>':(d.al?'<a class="t" href="'+E(d.al)+'">'+E(rg)+' 지난 낙찰 현장 보기</a>':''))+'<button type="button" class="sh t" data-i="'+i+'">이 공고 공유하기</button></div><small>입찰 참가 전 나라장터의 공고문을 꼭 확인하세요. 일감마켓은 입찰을 주관·대행하지 않는 정보서비스입니다.</small>';P.classList.add('on');P.querySelector('.x').focus()}
function close(){P.classList.remove('on')}
document.addEventListener('click',function(e){var sb=e.target.closest&&e.target.closest('#bdp .sh');if(sb){var d=(window.BDS||[])[+sb.getAttribute('data-i')];if(d){var t=d.nm+' · 마감 '+String(d.cl||'').replace('T',' ')+(d.pr?' · '+d.pr:'')+'\\nhttps://ilgammarket.co.kr/b/';if(navigator.share){navigator.share({title:d.nm,text:t}).catch(function(){})}else if(navigator.clipboard){navigator.clipboard.writeText(t).then(function(){sb.textContent='복사했어요'})}}return}var b=e.target.closest&&e.target.closest('.bdo');if(b){open(+b.getAttribute('data-i'));return}if(e.target===P||(e.target.closest&&e.target.closest('#bdp .x')))close()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
var H=P.querySelector('.bhd'),X=P.querySelector('.bx'),sx,sy,ox,oy,mv=false;H.addEventListener('pointerdown',function(e){if(e.target.closest('button'))return;var r=X.getBoundingClientRect();X.style.transform='none';X.style.left=r.left+'px';X.style.top=r.top+'px';sx=e.clientX;sy=e.clientY;ox=r.left;oy=r.top;mv=true;H.setPointerCapture(e.pointerId)});
H.addEventListener('pointermove',function(e){if(!mv)return;X.style.left=Math.min(Math.max(ox+e.clientX-sx,60-X.offsetWidth),innerWidth-60)+'px';X.style.top=Math.min(Math.max(oy+e.clientY-sy,0),innerHeight-56)+'px'});
H.addEventListener('pointerup',function(){mv=false})})()</script>
'''


JSX = r'''<script>(function(){var C=document.querySelector('.chips');if(!C)return;var cache={};function put(h,html,push){var d=new DOMParser().parseFromString(html,'text/html');var L=d.getElementById('bl'),H=d.getElementById('bh'),S=d.getElementById('bs');if(!L)return false;var m=/window\.BDS=(\[[\s\S]*?\]);/.exec(html);document.getElementById('bl').innerHTML=L.innerHTML;document.getElementById('bh').textContent=H.textContent;document.getElementById('bs').innerHTML=S.innerHTML;document.title=d.title;try{window.BDS=m?JSON.parse(m[1]):[]}catch(x){window.BDS=[]}if(window.igLive)window.igLive();C.querySelectorAll('.chip').forEach(function(c){c.classList.toggle('on',c.getAttribute('href')===h)});if(push){try{history.pushState({h:h},'',h)}catch(x){}}return true}
function go(h,push){if(cache[h])return put(h,cache[h],push);fetch(h).then(function(r){return r.text()}).then(function(t){cache[h]=t;put(h,t,push)}).catch(function(){location.href=h})}
C.addEventListener('click',function(e){var a=e.target.closest('a.chip');if(!a||e.metaKey||e.ctrlKey)return;e.preventDefault();go(a.getAttribute('href'),true)});
window.addEventListener('popstate',function(){var p=location.pathname.replace(/%[0-9A-F]{2}/gi,function(x){return x});go(location.pathname,false)})})()</script>'''


def build(bids, out, site, org_ok=None, oslug=None):
    items = bids.get("items") or []
    _seen, _u = set(), []
    for r in items:
        k = (r.get("nm"), r.get("dm"), r.get("cl"), r.get("pr"))
        if k not in _seen:
            _seen.add(k)
            _u.append(r)
    items = _u
    org_ok = org_ok or set()
    if not items:
        return []
    upd = (bids.get("updated") or "")[:10]
    today = dt.date.fromisoformat(upd) if upd else dt.date.today()
    # 홈 '오늘' 띠용 작은 자료: 앞으로 3일 안에 마감하는 공고의 마감 시각만
    try:
        lim = (today + dt.timedelta(days=3)).isoformat()
        os.makedirs(os.path.join(out, "data"), exist_ok=True)
        json.dump({"updated": bids.get("updated") or "", "t": __import__("collections").Counter(r["cl"][:16].replace("T", " ") for r in items if r.get("cl") and r["cl"][:10] <= lim)},
                  open(os.path.join(out, "data", "today.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    except Exception as ex:
        print("today.json 실패", ex)
    bdir = os.path.join(out, "b")
    if os.path.isdir(bdir):
        shutil.rmtree(bdir)
    for r in items:
        r["_k"] = r["rg"] if r.get("rg") and r["rg"] != "미분류" else ""
    by = {}
    for r in items:
        by.setdefault(r["_k"] or "기타", []).append(r)
    css = ('.chips{display:flex;flex-wrap:wrap;gap:10px;margin:0}.chip{display:inline-block;padding:10px 16px;border-radius:999px;background:#fff;border:1px solid #e8ded2;color:#2d3134;text-decoration:none;font-weight:600}'
           '.chip i{font-style:normal;color:#8a6a28;margin-left:4px}.chip:hover{border-color:#b8913f}.chip.on{background:#3f4349;color:#fff;border-color:#2d3134}.chip.on i{color:#e6c883}.dd{display:inline-block;white-space:nowrap;padding:3px 10px;border-radius:999px;background:#3f4349;color:#fff;font-size:13.5px;font-weight:700;line-height:1.3}td.dt{white-space:nowrap;vertical-align:top}td.dt small{display:block;margin-top:5px;color:#42474c}.dd.hot{background:#b3261e}'
           'td.co{white-space:nowrap}.bdo{all:unset;cursor:pointer;font-weight:800;color:#2d3134;border-bottom:2px solid #c9a45c;line-height:1.5}.bdo:hover{color:#8a6a28}.bdo:focus-visible{outline:3px solid #c9a45c;outline-offset:2px}'
           '#bdp{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(10,22,44,.62)}#bdp.on{display:flex}#bdp .bx{position:relative;width:min(560px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:22px;padding:28px 26px 24px;box-shadow:0 24px 60px rgba(0,0,0,.35)}#bdp h3{margin:0 40px 6px 0;font-size:23px;line-height:1.4;color:#2d3134;word-break:keep-all}#bdp .dd{margin-bottom:10px}#bdp dl{margin:16px 0 0;display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px 12px;font-size:17px}#bdp dt{color:#42474c}#bdp dd{margin:0;font-weight:700;color:#2d3134}#bdp .x{position:absolute;top:14px;right:14px;width:42px;height:42px;border-radius:50%;border:0;background:#efe9da;font-size:22px;cursor:pointer}#bdp .ac{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}#bdp .ac a{flex:1;min-width:180px;text-align:center;padding:15px 18px;border-radius:12px;font-size:17px;font-weight:800;text-decoration:none;background:#3f4349;color:#fff}#bdp .ac a.g{background:#c9a45c;color:#2d3134}#bdp .ac button.sh{flex:1;min-width:180px;padding:15px 18px;border-radius:12px;font-family:inherit;font-size:17px;font-weight:800;cursor:pointer;background:#fff;color:#2d3134;border:2px solid #2d3134}#bdp small{display:block;margin-top:16px;font-size:14px;line-height:1.6;color:#42474c}'
           '@media(max-width:640px){.card table,.card tbody{display:block}.card tr{display:grid;grid-template-columns:78px minmax(0,1fr) auto;grid-template-areas:"d n a" "d c c";column-gap:10px;row-gap:3px;padding:11px 0;border-bottom:1px solid #ece7da}.card td{display:block;padding:0;border:0;min-width:0}td.dt{grid-area:d}.card td:nth-child(2){grid-area:n}td.co{grid-area:c;white-space:normal;font-size:13px;color:#43484d}td.amt{grid-area:a;text-align:right;white-space:nowrap}}')
    md = lambda x: x[5:10].replace("-", ".")

    def dday(cl):
        try:
            n = (dt.date.fromisoformat(cl[:10]) - today).days
        except ValueError:
            return ""
        return ("D-day" if n == 0 else f"D-{n}"), n <= 2

    pages = {}

    JSB = "<script>window.igLive=function(){var B=window.BDS||[],n=Date.now(),rm=0,k=new Date(n+324e5).toISOString().slice(0,10);document.querySelectorAll('#bl tbody tr').forEach(function(tr){var b=tr.querySelector('.bdo');var d=b&&B[b.getAttribute('data-i')];if(!d||!d.cl)return;var t=Date.parse(d.cl.replace(' ','T')+':00+09:00');if(t<n){tr.remove();rm++;return}var x=Math.round((Date.parse(d.cl.slice(0,10))-Date.parse(k))/864e5),s=tr.querySelector('.dd');if(s){s.textContent=x<=0?'D-day':'D-'+x;s.className='dd'+(x<=2?' hot':'')}});var bs=document.querySelector('#bs b');if(rm&&bs){var v=parseInt(bs.textContent.replace(/,/g,''),10);if(v)bs.textContent=Math.max(v-rm,0).toLocaleString()+'건'}};window.igLive()</script>"

    def add(path, label, rows, chips, crumb):
        nowk = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%Y-%m-%d %H:%M")
        rows = sorted([r for r in rows if r["cl"][:16].replace("T", " ") >= nowk], key=lambda r: (r["cl"], r["id"]))  # 이미 마감 시각이 지난 공고는 뺍니다
        total = len(rows)
        trs = ""
        det = []
        for r in rows[:ROWS]:
            dd = dday(r["cl"])
            ddh = f'<span class="dd{" hot" if dd and dd[1] else ""}">{dd[0]}</span>' if dd else ""
            nm = f'<button type="button" class="bdo" data-i="{len(det)}">{e(r["nm"])}</button>'
            ol = f'/o/{quote(oslug(r["dm"]))}/' if (oslug and r.get("dm") in org_ok) else ""
            det.append({"nm": r["nm"], "og": r.get("og") or "", "dm": r.get("dm") or "", "kind": r.get("kind") or "", "rg": r.get("rg") or "", "ar": r.get("ar") or "",
                        "pr": money(r["pr"]) if r.get("pr") else "", "cl": r["cl"][:16], "op": (r.get("op") or "")[:16], "m": r.get("m") or "", "pd": r.get("pd") or "", "ol": ol,
                        "dd": dd[0] if dd else "", "al": (f'/a/{quote(r["rg"])}/' if r.get("rg") and r["rg"] not in ("미분류", "기타") and os.path.isdir(os.path.join(out, "a", r["rg"])) else "")})
            org = e(r.get("og") or r.get("dm") or "")
            kind = f' · {e(r["kind"])}' if r.get("kind") else ""
            trs += (f'<tr><td class="dt">{ddh}<small>{md(r["cl"])} 마감</small></td><td><b>{nm}</b><small>{org}{kind}</small></td>'
                    f'<td class="co">{e(r.get("ar") or "")}</td><td class="amt">{money(r["pr"]) if r.get("pr") else "-"}</td></tr>')
        title = f"{label} 입찰공고 {total:,}건 · 마감 임박순 | 일감마켓"
        desc = f"{label}에서 지금 입찰 중인 공사 공고 {total:,}건. 마감이 가까운 순서로 정리했고, 조달청 나라장터 공공데이터를 매일 갱신합니다."
        chip = "".join(f'<a class="chip" href="{h}">{e(t)} <i>{n}</i></a>' for h, t, n in chips)
        if chip:
            chip = f'<a class="chip on" href="/b/" data-all="1">전체 <i>{total}</i></a>' + chip
        body = f'''<main class="wrap"><p class="crumb">{crumb}</p>
<h1 id="bh">{e(label)} 입찰공고</h1>
<p class="sum" id="bs">입찰 중인 공사 <b>{total:,}건</b> · 마감이 가까운 순 · {md(upd)} 기준</p>
{('<section class="card"><h2>지역별로 보기</h2><p class="chips">' + chip + '</p></section>') if chip else ''}
<section class="card" id="bl"><h2>마감 임박</h2><table><tbody>{trs}</tbody></table><script>window.BDS={json.dumps(det, ensure_ascii=False).replace('</','<\\/')};</script>{JSB}{'<p class="note">마감이 가까운 ' + str(ROWS) + '건만 보여 드려요. 공고 제목을 누르면 자세한 내용이 열려요.</p>' if total > ROWS else '<p class="note">공고 제목을 누르면 자세한 내용이 열려요.</p>'}</section>
<p class="more"><a class="btn" href="/#win">일감마켓에서 낙찰 현장 보기</a></p>
{JSX if chip else ''}
<p class="note">※ 조달청 나라장터 공공데이터를 가공한 정보이며, 일감마켓은 입찰을 주관⁠·⁠대행하지 않는 정보서비스입니다. 입찰 참가 전 나라장터의 공고문을 꼭 확인하세요. 정확성과 완전성을 보장하지 않습니다.</p></main>'''
        pages[path] = (title, desc, body)

    chips = []
    for k, rows in sorted(by.items(), key=lambda kv: -len(kv[1])):
        s = re.sub(r"[·ㆍ\s/]+", "-", k)
        chips.append((f"/b/{quote(s)}/", k, len(rows)))
        add(s, k, rows, [], '<a href="/">일감마켓</a> › <a href="/b/">입찰공고</a>')
    add("", "전국", items, chips, '<a href="/">일감마켓</a>')

    urls = []
    for path, (title, desc, body) in pages.items():
        url = f"{site}/b/" + (quote(path) + "/" if path else "")
        page = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="일감마켓"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="https://ilgammarket.co.kr/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/img/icon.svg">
<meta name="theme-color" content="#2d3134"><link rel="stylesheet" href="/page.css"><link rel="stylesheet" href="/btn3d.css?v=202"><style>{css}</style>
<link rel="preload" href="/fonts/NotoSansKR-sub.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="/font.css?v=1"></head>
<body>{HEADER}
{band(body)}
{POP}{FOOTER}{SCRIPTS}</body></html>
'''
        d_ = os.path.join(bdir, path) if path else bdir
        os.makedirs(d_, exist_ok=True)
        open(os.path.join(d_, "index.html"), "w", encoding="utf-8").write(page)
        urls.append(f"  <url><loc>{url}</loc><lastmod>{upd}</lastmod></url>")
    return urls
