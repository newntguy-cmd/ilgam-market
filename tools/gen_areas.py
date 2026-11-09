"""지역·공종·시군구별 '최근 낙찰 현장' 페이지(a/...)를 만듭니다.

영업 담당자가 검색창에 치는 말("경기 전기공사 낙찰", "평택 신축공사 낙찰")에 맞는 정적 페이지입니다.
공종 칸이 비어 있는 자료가 많아서, 공사명 글자에서 공종을 뽑아 씁니다. 같은 입력이면 같은 출력이 나옵니다.
"""
import html
import json
import os
import re
import shutil
from urllib.parse import quote

from common import FOOTER, HEADER, SCRIPTS

e = html.escape
MIN_COMBO = 8     # 지역×공종 페이지를 만드는 최소 건수
MIN_SGG = 10      # 시군구 페이지를 만드는 최소 건수
ROWS = 80         # 페이지당 보여 줄 현장 수

# (이름, 주소에 쓸 글자, 찾을 글자들) — 앞에 있을수록 먼저 맞춥니다.
CATS = [
    ("소방", "소방", ["소방", "스프링클러"]),
    ("통신", "통신", ["정보통신", "통신", "CCTV", "방송", "네트워크", "관제"]),
    ("전기", "전기", ["전기", "수배전", "변전", "가로등", "조명", "태양광", "배전"]),
    ("상하수도", "상하수도", ["상수도", "하수", "정수", "오수", "배수관", "관로", "급수"]),
    ("기계설비", "기계설비", ["기계설비", "냉난방", "보일러", "공조", "배관", "가스", "환기", "열원"]),
    ("조경", "조경", ["조경", "식재", "수목", "공원", "녹지", "정원"]),
    ("산림", "산림", ["산림", "숲", "임도", "조림", "사방", "산불", "벌채", "병해충", "수목"]),
    ("승강기", "승강기", ["승강기", "엘리베이터"]),
    ("철거·해체", "철거-해체", ["철거", "해체", "석면"]),
    ("도장·방수", "도장-방수", ["도장", "방수", "도색", "외벽"]),
    ("인테리어", "인테리어", ["인테리어", "실내건축", "내부공사", "내장"]),
    ("토목·도로", "토목-도로", ["토목", "도로", "교량", "하천", "옹벽", "포장", "배수로", "농로", "정비공사", "보도", "방호", "제방", "배수장", "수로", "정비사업", "유지관리", "맨홀", "안전시설"]),
    ("건축", "건축", ["건축", "신축", "증축", "개축", "리모델링", "보수공사", "개보수", "체육", "학교", "청사", "복지", "센터", "회관", "주택"]),
]


def cat_of(r):
    t = (r.get("nm") or "") + " " + (r.get("kind") or "")
    for label, slug, keys in CATS:
        if any(k in t for k in keys):
            return label, slug
    return None


def slug(s):
    return re.sub(r"[·ㆍ\s/]+", "-", s).strip("-")


def sgg_of(dm):
    t = (dm or "").split()
    for x in t[1:3]:
        if x.endswith(("시", "군", "구")):
            return x
    return ""


def money(n):
    if not n:
        return "-"
    eok = n / 1e8
    if eok >= 1:
        return (f"{eok:,.0f}" if eok >= 100 else f"{eok:.1f}") + "억"
    return f"{round(n / 1e4):,}만"


def build(d, out, site, linked):
    """linked: 업체 전용 페이지가 있는 사업자번호 집합. 만든 주소 목록을 돌려줍니다."""
    items = [r for r in d["items"] if r.get("s") == "낙찰" and r.get("rg") and r["rg"] != "미분류" and r.get("amt")]
    for r in items:
        c = cat_of(r)
        r["_c"] = c
        r["_g"] = sgg_of(r.get("dm"))
    items.sort(key=lambda r: (r["d"], r["amt"]), reverse=True)
    lo, hi = min(r["d"] for r in items), max(r["d"] for r in items)
    md = lambda x: x[5:].replace("-", ".")

    pages = {}  # 경로 -> (제목, 설명, 본문, 건수)

    def add(path, label, parent, rows, chips, rg=''):
        if not rows:
            return
        total = sum(r["amt"] for r in rows)
        cos = len({r.get("co") for r in rows if r.get("co")})
        title = f"{label} 낙찰 현장·업체 {len(rows):,}건 | 일감마켓"
        desc = f"{label} 최근 낙찰 {len(rows):,}건, 낙찰 업체 {cos:,}곳, 합계 {money(total)}. {md(lo)}~{md(hi)} 조달청 나라장터 공공데이터를 매일 갱신합니다."
        trs = ""
        for r in rows[:ROWS]:
            co = e(r.get("co") or "")
            if r.get("b") in linked:
                co = f'<a href="/c/{r["b"]}/">{co}</a>'
            cat = f'<span class="tg">{e(r["_c"][0])}</span>' if r["_c"] else ""
            trs += (f'<tr><td class="dt">{md(r["d"])}</td><td><b>{e(r["nm"])}</b><small>{e(r["dm"])} {cat}</small></td>'
                    f'<td class="co">{co}</td><td class="amt">{money(r["amt"])}</td></tr>')
        chip = "".join(f'<a class="chip" href="{h}">{e(t)} <i>{n}</i></a>' for h, t, n in chips)
        crumb = " › ".join(f'<a href="{h}">{e(t)}</a>' for h, t in parent)
        body = f'''<main class="wrap"><p class="crumb">{crumb}</p>
<h1>{e(label)} 낙찰 현장</h1>
<p class="sum">최근 낙찰 <b>{len(rows):,}건</b> · 낙찰 업체 <b>{cos:,}곳</b> · 합계 <b>{money(total)}</b> · {md(lo)}~{md(hi)} 기준</p>
<section class="card cta"><h2>{e(rg)}에 새 낙찰이 나면, 아침마다 메일로</h2><p>매일 아침 7:30, {e(rg)}의 새 낙찰 현장과 업체를 보내 드립니다.</p><a class="btn" href="/?join=1&amp;rg={quote(rg)}">알림 받아보기</a></section>
{('<section class="card"><h2>더 좁혀 보기</h2><p class="chips">' + chip + '</p></section>') if chip else ''}
<section class="card"><h2>최근 낙찰</h2><table><tbody>{trs}</tbody></table>{'<p class="note">최근 ' + str(ROWS) + '건만 보여 드립니다. 전체 목록은 일감마켓에서 확인하실 수 있습니다.</p>' if len(rows) > ROWS else ''}</section>
<p class="more"><a class="btn" href="/#win">일감마켓에서 전체 낙찰 보기</a></p>
<p class="note">※ 조달청 나라장터 공공데이터를 가공한 정보이며, 일감마켓은 낙찰을 주관·시행하지 않는 정보서비스입니다. 정확성과 완전성을 보장하지 않습니다.</p></main>'''
        pages[path] = (title, desc, body, len(rows))

    by_rg = {}
    for r in items:
        by_rg.setdefault(r["rg"], []).append(r)

    hub_links = []
    for rg, rows in sorted(by_rg.items(), key=lambda kv: -len(kv[1])):
        rs = slug(rg)
        chips = []
        cats = {}
        sg = {}
        for r in rows:
            if r["_c"]:
                cats.setdefault(r["_c"], []).append(r)
            if r["_g"]:
                sg.setdefault(r["_g"], []).append(r)
        for (label, cs), cr in sorted(cats.items(), key=lambda kv: -len(kv[1])):
            if len(cr) >= MIN_COMBO:
                chips.append((f"/a/{quote(rs)}/{quote(cs)}/", f"{label}", len(cr)))
                add(f"{rs}/{cs}", f"{rg} {label}", [("/", "일감마켓"), (f"/a/{quote(rs)}/", f"{rg} 낙찰")], cr, [], rg)
        for g, gr in sorted(sg.items(), key=lambda kv: -len(kv[1])):
            if len(gr) >= MIN_SGG:
                chips.append((f"/a/{quote(rs)}/{quote(slug(g))}/", g, len(gr)))
                add(f"{rs}/{slug(g)}", f"{rg} {g}", [("/", "일감마켓"), (f"/a/{quote(rs)}/", f"{rg} 낙찰")], gr, [], rg)
        add(rs, f"{rg}", [("/", "일감마켓")], rows, chips, rg)
        hub_links.append((f"/a/{quote(rs)}/", f"{rg} 낙찰 현장", len(rows)))

    hub = '<main class="wrap"><p class="crumb"><a href="/">일감마켓</a></p><h1>지역별 낙찰 현장</h1><p class="sum">지역을 고르면 최근 낙찰 현장과 업체를 보실 수 있습니다.</p><section class="card"><p class="chips">' + "".join(
        f'<a class="chip" href="{h}">{e(t)} <i>{n}</i></a>' for h, t, n in hub_links) + '</p></section></main>'
    pages[""] = ("지역별 공공 공사 낙찰 현장 | 일감마켓", f"전국 17개 지역의 최근 공공 공사 낙찰 현장과 낙찰 업체. {md(lo)}~{md(hi)} 조달청 나라장터 공공데이터 기준.", hub, len(items))

    adir = os.path.join(out, "a")
    if os.path.isdir(adir):
        shutil.rmtree(adir)
    urls = []
    css = ('.chips{display:flex;flex-wrap:wrap;gap:10px;margin:0}.chip{display:inline-block;padding:10px 16px;border-radius:999px;background:#fff;border:1px solid #d5dbe5;color:#0f2342;text-decoration:none;font-weight:600}'
           '.chip i{font-style:normal;color:#8a6a28;margin-left:4px}.chip:hover{border-color:#b8913f}.cta p{margin:6px 0 14px}td.co{white-space:nowrap}.tg{display:inline-block;margin-left:6px;padding:0 8px;border-radius:999px;background:#f1ece0;color:#6f4f0e;font-size:12px}')
    for path, (title, desc, body, n) in pages.items():
        url = f"{site}/a/" + (quote(path) + "/" if path else "")
        ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": title, "url": url}
        page = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="일감마켓"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="https://ilgammarket.co.kr/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/img/icon.svg">
<meta name="theme-color" content="#0f2342"><link rel="stylesheet" href="/page.css"><link rel="stylesheet" href="/btn3d.css?v=38"><style>{css}</style>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script><link rel="preload" href="/fonts/NotoSansKR-sub.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="/font.css?v=1"></head>
<body>{HEADER}
{body}
{FOOTER}{SCRIPTS}</body></html>
'''
        d_ = os.path.join(adir, path) if path else adir
        os.makedirs(d_, exist_ok=True)
        open(os.path.join(d_, "index.html"), "w", encoding="utf-8").write(page)
        urls.append(f"  <url><loc>{url}</loc><lastmod>{hi}</lastmod></url>")
    return urls
