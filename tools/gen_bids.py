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

from common import FOOTER, HEADER, SCRIPTS
from gen_areas import money

e = html.escape
ROWS = 150


def build(bids, out, site):
    items = bids.get("items") or []
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
    css = ('.chips{display:flex;flex-wrap:wrap;gap:10px;margin:0}.chip{display:inline-block;padding:10px 16px;border-radius:999px;background:#fff;border:1px solid #d5dbe5;color:#0f2342;text-decoration:none;font-weight:600}'
           '.chip i{font-style:normal;color:#8a6a28;margin-left:4px}.chip:hover{border-color:#b8913f}.dd{display:inline-block;white-space:nowrap;padding:3px 10px;border-radius:999px;background:#0f2342;color:#fff;font-size:13.5px;font-weight:700;line-height:1.3}td.dt{white-space:nowrap;vertical-align:top}td.dt small{display:block;margin-top:5px;color:#6b788e}.dd.hot{background:#b3261e}'
           'td.co{white-space:nowrap}@media(max-width:640px){.card table,.card tbody{display:block}.card tr{display:grid;grid-template-columns:78px minmax(0,1fr) auto;grid-template-areas:"d n a" "d c c";column-gap:10px;row-gap:3px;padding:11px 0;border-bottom:1px solid #ece7da}.card td{display:block;padding:0;border:0;min-width:0}td.dt{grid-area:d}.card td:nth-child(2){grid-area:n}td.co{grid-area:c;white-space:normal;font-size:13px;color:#4a5a73}td.amt{grid-area:a;text-align:right;white-space:nowrap}}')
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
        for r in rows[:ROWS]:
            dd = dday(r["cl"])
            ddh = f'<span class="dd{" hot" if dd and dd[1] else ""}">{dd[0]}</span>' if dd else ""
            nm = e(r["nm"])
            if r.get("u"):
                nm = f'<a href="{e(r["u"])}" target="_blank" rel="noopener nofollow">{nm}</a>'
            org = e(r.get("og") or r.get("dm") or "")
            kind = f' · {e(r["kind"])}' if r.get("kind") else ""
            trs += (f'<tr><td class="dt">{ddh}<small>{md(r["cl"])} 마감</small></td><td><b>{nm}</b><small>{org}{kind}</small></td>'
                    f'<td class="co">{e(r.get("ar") or "")}</td><td class="amt">{money(r["pr"]) if r.get("pr") else "-"}</td></tr>')
        title = f"{label} 입찰공고 {total:,}건 · 마감 임박순 | 일감마켓"
        desc = f"{label}에서 지금 입찰 중인 공사 공고 {total:,}건. 마감이 가까운 순서로 정리했고, 조달청 나라장터 공공데이터를 매일 갱신합니다."
        chip = "".join(f'<a class="chip" href="{h}">{e(t)} <i>{n}</i></a>' for h, t, n in chips)
        body = f'''<main class="wrap"><p class="crumb">{crumb}</p>
<h1>{e(label)} 입찰공고</h1>
<p class="sum">입찰 중인 공사 <b>{total:,}건</b> · 마감이 가까운 순 · {md(upd)} 기준</p>
{('<section class="card"><h2>지역별로 보기</h2><p class="chips">' + chip + '</p></section>') if chip else ''}
<section class="card"><h2>마감 임박</h2><table><tbody>{trs}</tbody></table>{'<p class="note">마감이 가까운 ' + str(ROWS) + '건만 보여 드려요. 공고 제목을 누르면 나라장터에서 열려요.</p>' if total > ROWS else '<p class="note">공고 제목을 누르면 나라장터에서 열려요.</p>'}</section>
<p class="more"><a class="btn" href="/#win">일감마켓에서 낙찰 현장 보기</a></p>
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
<meta name="theme-color" content="#0f2342"><link rel="stylesheet" href="/page.css"><link rel="stylesheet" href="/btn3d.css?v=80"><style>{css}</style>
<link rel="preload" href="/fonts/NotoSansKR-sub.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="/font.css?v=1"></head>
<body>{HEADER}
{body}
{FOOTER}{SCRIPTS}</body></html>
'''
        d_ = os.path.join(bdir, path) if path else bdir
        os.makedirs(d_, exist_ok=True)
        open(os.path.join(d_, "index.html"), "w", encoding="utf-8").write(page)
        urls.append(f"  <url><loc>{url}</loc><lastmod>{upd}</lastmod></url>")
    return urls
