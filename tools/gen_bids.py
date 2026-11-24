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
POP = '''<div id="bdp" role="dialog" aria-modal="true" aria-label="입찰공고 상세"><div class="bx"><button type="button" class="x" aria-label="닫기">×</button><div id="bdc"></div></div></div>
<script>(function(){var P=document.getElementById('bdp'),C=document.getElementById('bdc');function E(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function R(k,v){return v?'<dt>'+k+'</dt><dd>'+E(v)+'</dd>':''}
function open(i){var d=(window.BDS||[])[i];if(!d)return;C.innerHTML=(d.dd?'<span class="dd'+(/^D-(0|1|2)$|D-day/.test(d.dd)?' hot':'')+'">'+E(d.dd)+'</span>':'')+'<h3>'+E(d.nm)+'</h3><dl>'+R('발주처',d.dm||d.og)+R('공고기관',d.og&&d.og!==d.dm?d.og:'')+R('업종',d.kind)+R('지역',d.ar||d.rg)+R('추정가격',d.pr)+R('입찰 마감',d.cl.replace('T',' '))+R('개찰',d.op)+R('입찰 방식',d.m)+R('공고 게시',d.pd)+'</dl><div class="ac">'+(d.ol?'<a href="'+E(d.ol)+'">이 발주처 지난 낙찰 현장 보기</a>':(d.al?'<a href="'+E(d.al)+'">'+E(d.rg)+' 지난 낙찰 현장 보기</a>':''))+'<a class="g" href="/#win">가입하고 낙찰 현장 보기</a><button type="button" class="sh" data-i="'+i+'">이 공고 공유하기</button></div><small>입찰 참가 전 나라장터의 공고문을 꼭 확인하세요. 일감마켓은 입찰을 주관·대행하지 않는 정보서비스입니다.</small>';P.classList.add('on');P.querySelector('.x').focus()}
function close(){P.classList.remove('on')}
document.addEventListener('click',function(e){var sb=e.target.closest&&e.target.closest('#bdp .sh');if(sb){var d=(window.BDS||[])[+sb.getAttribute('data-i')];if(d){var t=d.nm+' · 마감 '+String(d.cl||'').replace('T',' ')+(d.pr?' · '+d.pr:'')+'\\nhttps://ilgammarket.co.kr/b/';if(navigator.share){navigator.share({title:d.nm,text:t}).catch(function(){})}else if(navigator.clipboard){navigator.clipboard.writeText(t).then(function(){sb.textContent='복사했어요'})}}return}var b=e.target.closest&&e.target.closest('.bdo');if(b){open(+b.getAttribute('data-i'));return}if(e.target===P||(e.target.closest&&e.target.closest('#bdp .x')))close()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')close()})})()</script>
'''


JSX = r'''<script>(function(){var C=document.querySelector('.chips');if(!C)return;var cache={};function put(h,html,push){var d=new DOMParser().parseFromString(html,'text/html');var L=d.getElementById('bl'),H=d.getElementById('bh'),S=d.getElementById('bs');if(!L)return false;var m=/window\.BDS=(\[[\s\S]*?\]);/.exec(html);document.getElementById('bl').innerHTML=L.innerHTML;document.getElementById('bh').textContent=H.textContent;document.getElementById('bs').innerHTML=S.innerHTML;document.title=d.title;try{window.BDS=m?JSON.parse(m[1]):[]}catch(x){window.BDS=[]}C.querySelectorAll('.chip').forEach(function(c){c.classList.toggle('on',c.getAttribute('href')===h)});if(push){try{history.pushState({h:h},'',h)}catch(x){}}return true}
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

    def add(path, label, rows, chips, crumb):
        rows = sorted(rows, key=lambda r: (r["cl"], r["id"]))
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
<section class="card" id="bl"><h2>마감 임박</h2><table><tbody>{trs}</tbody></table><script>window.BDS={json.dumps(det, ensure_ascii=False).replace('</','<\\/')};</script>{'<p class="note">마감이 가까운 ' + str(ROWS) + '건만 보여 드려요. 공고 제목을 누르면 자세한 내용이 열려요.</p>' if total > ROWS else '<p class="note">공고 제목을 누르면 자세한 내용이 열려요.</p>'}</section>
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
<meta name="theme-color" content="#2d3134"><link rel="stylesheet" href="/page.css"><link rel="stylesheet" href="/btn3d.css?v=105"><style>{css}</style>
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
