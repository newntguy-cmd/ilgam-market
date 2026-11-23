"""발주처별 '최근 낙찰 현장' 페이지(o/...)를 만듭니다.

영업 담당자는 "어느 발주처가 요즘 공사를 내고, 누가 따냈는지"를 봅니다.
공공 발주처(시·군·공단 등)만 있고 개인 정보는 없습니다. 같은 입력이면 같은 출력이 나옵니다.
"""
import html
import json
import os
import re
import shutil
from urllib.parse import quote

from common import FOOTER, HEADER, SCRIPTS, band
from gen_areas import cat_of, money

e = html.escape
MIN_ORG = 3     # 발주처 페이지를 만드는 최소 낙찰 건수
ROWS = 80


def oslug(dm):
    return re.sub(r"[·ㆍ\s/]+", "-", (dm or "").strip()).strip("-")


def rows_of(d):
    items = [r for r in d["items"] if r.get("s") == "낙찰" and r.get("dm") and r.get("amt")]
    by = {}
    for r in items:
        by.setdefault(oslug(r["dm"]), []).append(r)
    return {k: v for k, v in by.items() if k and len(v) >= MIN_ORG}


def eligible(d):
    """페이지가 있는 발주처 이름 집합(다른 페이지에서 링크할 때 씁니다)."""
    return {v[0]["dm"] for v in rows_of(d).values()}


def build(d, out, site, linked):
    orgs = rows_of(d)
    allr = [r for v in orgs.values() for r in v]
    lo, hi = min(r["d"] for r in allr), max(r["d"] for r in allr)
    md = lambda x: x[5:].replace("-", ".")
    odir = os.path.join(out, "o")
    if os.path.isdir(odir):
        shutil.rmtree(odir)
    css = ('.chips{display:flex;flex-wrap:wrap;gap:10px;margin:0}.chip{display:inline-block;padding:10px 16px;border-radius:999px;background:#fff;border:1px solid #d5dbe5;color:#26282b;text-decoration:none;font-weight:600}'
           '.chip i{font-style:normal;color:#8a6a28;margin-left:4px}.chip:hover{border-color:#b8913f}.cta p{margin:6px 0 14px}td.co{white-space:nowrap}@media(max-width:640px){.card table,.card tbody{display:block}.card tr{display:grid;grid-template-columns:46px minmax(0,1fr) auto;grid-template-areas:"d n a" "d c c";column-gap:10px;row-gap:2px;padding:11px 0;border-bottom:1px solid #ece7da}.card td{display:block;padding:0;border:0;min-width:0}td.dt{grid-area:d;white-space:nowrap}.card td:nth-child(2){grid-area:n}td.co{grid-area:c;white-space:normal;font-size:13px;color:#595e64}td.amt{grid-area:a;text-align:right;white-space:nowrap}}.tg{display:inline-block;margin-left:6px;padding:0 8px;border-radius:999px;background:#f1ece0;color:#6f4f0e;font-size:12px}')
    urls = []
    for s, rows in sorted(orgs.items()):
        rows.sort(key=lambda r: (r["d"], r["amt"]), reverse=True)
        name = rows[0]["dm"]
        rg = next((r["rg"] for r in rows if r.get("rg") and r["rg"] != "미분류"), "")
        total = sum(r["amt"] for r in rows)
        cos = len({r.get("co") for r in rows if r.get("co")})
        rt = sorted(float(r["rate"]) for r in rows if r.get("rate") and 50 <= float(r["rate"]) <= 100.5)
        rtx = (f' · 낙찰률 <b>{rt[0]:.1f}~{rt[-1]:.1f}%</b> (가운데 {rt[len(rt)//2]:.1f}%)' if len(rt) >= 5 else "")
        title = f"{name} 낙찰 현장·업체 {len(rows):,}건 | 일감마켓"
        desc = f"{name}에서 낸 공사 중 최근 낙찰된 {len(rows):,}건과 낙찰 업체 {cos:,}곳, 합계 {money(total)}. {md(lo)}~{md(hi)} 조달청 나라장터 공공데이터를 매일 갱신합니다."
        trs = ""
        for r in rows[:ROWS]:
            co = e(r.get("co") or "")
            if r.get("b") in linked:
                co = f'<a href="/c/{r["b"]}/">{co}</a>'
            c = cat_of(r)
            tg = f'<span class="tg">{e(c[0])}</span>' if c else ""
            trs += (f'<tr><td class="dt">{md(r["d"])}</td><td><b>{e(r["nm"])}</b><small>{e(r.get("rg") or "")} {tg}</small></td>'
                    f'<td class="co">{co}</td><td class="amt">{money(r["amt"])}</td></tr>')
        crumb = '<a href="/">일감마켓</a>' + (f' › <a href="/a/{quote(re.sub(r"[·ㆍ\s/]+", "-", rg))}/">{e(rg)} 낙찰</a>' if rg else "")
        body = f'''<main class="wrap"><p class="crumb">{crumb}</p>
<h1>{e(name)} 낙찰 현장</h1>
<p class="sum">최근 낙찰 <b>{len(rows):,}건</b> · 낙찰 업체 <b>{cos:,}곳</b> · 합계 <b>{money(total)}</b>{rtx} · {md(lo)}~{md(hi)} 기준</p>
<section class="card cta"><h2>{e(name)} 낙찰 업체 {cos:,}곳, 내 영업 리스트로</h2><ul class="cb"><li><b>대표 전화·주소 10곳</b><span>가입하면 바로 영업 리스트에 담겨요</span></li><li><b>아침 7:30 메일</b><span>{e(rg) if rg else "내 지역"}에 새 낙찰이 나면 그날 아침 받아요</span></li><li><b>낙찰률·낙찰 현황</b><span>이 페이지처럼 가입 전에도 그대로 볼 수 있어요</span></li></ul><a class="btn" href="/?join=1{('&amp;rg=' + quote(rg)) if rg else ''}">내 영업 리스트 만들기</a></section>
<section class="card"><h2>최근 낙찰</h2><table><tbody>{trs}</tbody></table>{'<p class="note">최근 ' + str(ROWS) + '건만 보여 드려요. 전체 목록은 일감마켓에서 확인할 수 있어요.</p>' if len(rows) > ROWS else ''}</section>
<p class="more"><a class="btn" href="/#win">일감마켓에서 전체 낙찰 보기</a></p>
<p class="note">※ 조달청 나라장터 공공데이터를 가공한 정보이며, 일감마켓은 낙찰을 주관⁠·⁠시행하지 않는 정보서비스입니다. 정확성과 완전성을 보장하지 않습니다.</p></main>'''
        url = f"{site}/o/{quote(s)}/"
        ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": title, "url": url}
        page = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="일감마켓"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="https://ilgammarket.co.kr/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/img/icon.svg">
<meta name="theme-color" content="#26282b"><link rel="stylesheet" href="/page.css"><link rel="stylesheet" href="/btn3d.css?v=105"><style>{css}</style>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script><link rel="preload" href="/fonts/NotoSansKR-sub.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="/font.css?v=1"></head>
<body>{HEADER}
{band(body)}
{FOOTER}{SCRIPTS}</body></html>
'''
        d_ = os.path.join(odir, s)
        os.makedirs(d_, exist_ok=True)
        open(os.path.join(d_, "index.html"), "w", encoding="utf-8").write(page)
        urls.append(f"  <url><loc>{url}</loc><lastmod>{hi}</lastmod></url>")

    # 허브: 발주처 이름으로 찾기(글자 거르기)
    by_rg = {}
    for sl, rows in orgs.items():
        rg = next((r["rg"] for r in rows if r.get("rg") and r["rg"] != "미분류"), "기타")
        by_rg.setdefault(rg, []).append((rows[0]["dm"], sl, len(rows)))
    secs = ""
    for rg in sorted(by_rg):
        chips = "".join(f'<a class="chip" href="/o/{quote(sl)}/" data-n="{e(nm)}">{e(nm)} <i>{n}</i></a>' for nm, sl, n in sorted(by_rg[rg]))
        secs += f'<section class="card og"><h2>{e(rg)}</h2><p class="chips">{chips}</p></section>'
    hbody = (f'<main class="wrap"><p class="crumb"><a href="/">일감마켓</a></p><h1>발주처별 낙찰 현장</h1>'
             f'<p class="sum">공사를 낸 발주처를 고르면 최근 낙찰 현장과 업체를 볼 수 있어요. 낙찰 {len(allr):,}건 · 발주처 {len(orgs):,}곳 · {md(lo)}~{md(hi)} 기준</p>'
             f'<p><input id="oq" type="search" placeholder="발주처 이름 (예: 평택시, 한국도로공사)" autocomplete="off" style="width:100%;box-sizing:border-box;height:52px;padding:0 16px;border:1px solid #d5dbe5;border-radius:12px;font-size:17px"></p>'
             f'{secs}<p id="oe" class="note" hidden>찾는 발주처가 없어요. 낙찰이 3건 이상인 발주처만 모아 보여 드려요.</p>'
             '<script>(function(){var q=document.getElementById("oq"),cs=[].slice.call(document.querySelectorAll(".og .chip")),ss=[].slice.call(document.querySelectorAll(".og")),e=document.getElementById("oe");q.addEventListener("input",function(){var v=q.value.trim(),n=0;cs.forEach(function(c){var m=!v||c.getAttribute("data-n").indexOf(v)>-1;c.style.display=m?"":"none";if(m)n++});ss.forEach(function(s){s.style.display=s.querySelector(".chip:not([style*=none])")?"":"none"});e.hidden=n>0})})()</script></main>')
    htitle = "발주처별 공공 공사 낙찰 현장 | 일감마켓"
    hdesc = f"공사를 낸 발주처 {len(orgs):,}곳의 최근 낙찰 현장과 낙찰 업체. {md(lo)}~{md(hi)} 조달청 나라장터 공공데이터 기준."
    hurl = f"{site}/o/"
    hpage = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(htitle)}</title>
<meta name="description" content="{e(hdesc)}">
<link rel="canonical" href="{hurl}">
<meta property="og:type" content="website"><meta property="og:site_name" content="일감마켓"><meta property="og:title" content="{e(htitle)}"><meta property="og:description" content="{e(hdesc)}"><meta property="og:url" content="{hurl}"><meta property="og:image" content="https://ilgammarket.co.kr/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/img/icon.svg">
<meta name="theme-color" content="#26282b"><link rel="stylesheet" href="/page.css"><link rel="stylesheet" href="/btn3d.css?v=105"><style>{css}</style>
<link rel="preload" href="/fonts/NotoSansKR-sub.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="/font.css?v=1"></head>
<body>{HEADER}
{band(hbody)}
{FOOTER}{SCRIPTS}</body></html>
'''
    os.makedirs(odir, exist_ok=True)
    open(os.path.join(odir, "index.html"), "w", encoding="utf-8").write(hpage)
    urls.insert(0, f"  <url><loc>{hurl}</loc><lastmod>{hi}</lastmod></url>")
    return urls
