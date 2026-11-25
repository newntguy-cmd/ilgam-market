"""건설 뉴스 페이지(news/)를 만듭니다.

국토교통부가 공식 RSS로 내보내는 보도자료·입찰안내 중 건설과 관련된 것만 골라 '제목과 원문 링크'만 보여 줍니다.
(내용·저작권은 해당 기관에 있습니다.) 받아 오지 못하면 지난번 목록(data/news.json)을 그대로 씁니다.
"""
import datetime as dt
import html
import json
import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

from common import FOOTER, HEADER, SCRIPTS, band

e = html.escape
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEEDS = [("보도자료", "https://www.molit.go.kr/dev/board/board_rss.jsp?rss_id=NEWS"),
         ("입찰안내", "https://www.molit.go.kr/dev/board/board_rss.jsp?rss_id=tender")]
KEEP = ("건설", "공사", "시공", "입찰", "발주", "주택", "아파트", "재건축", "재개발", "정비사업", "인프라", "SOC", "도로", "철도", "교량", "터널", "하천", "댐",
        "공항", "항만", "신도시", "택지", "분양", "건축", "스마트건설", "부실", "감리", "사업비", "하자", "도시", "국토", "토지", "임대", "공공주택", "안전", "수주", "계약")
DROP = ("택시", "버스", "카드", "운전", "자동차", "항공권", "화물차")
CAP = 120
SITE = "https://ilgammarket.co.kr"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (ilgammarket news; +https://ilgammarket.co.kr)"})
    raw = urllib.request.urlopen(req, timeout=25).read()
    out = []
    for it in ET.fromstring(raw).iter("item"):
        t = (it.findtext("title") or "").strip()
        l = (it.findtext("link") or "").strip()
        p = it.findtext("pubDate") or ""
        try:
            d = parsedate_to_datetime(p).astimezone(dt.timezone(dt.timedelta(hours=9))).strftime("%Y-%m-%d")
        except Exception:
            d = (it.findtext("{http://purl.org/dc/elements/1.1/}date") or "")[:10]
        if t and l.startswith("http") and d:
            out.append({"t": re.sub(r"\s+", " ", t), "l": l, "d": d})
    return out


def relevant(t):
    return any(k in t for k in KEEP) and not any(k in t for k in DROP)


def build(out, site=SITE):
    path = os.path.join(ROOT, "data", "news.json")
    old = []
    if os.path.exists(path):
        try:
            old = json.load(open(path, encoding="utf-8")).get("items", [])
        except Exception:
            old = []
    got, fails = [], 0
    for src, url in FEEDS:
        try:
            for r in fetch(url):
                if relevant(r["t"]):
                    r["s"] = src
                    got.append(r)
        except Exception as ex:
            fails += 1
            print("뉴스 받기 실패", src, ex)
    seen, items = set(), []
    for r in got + old:
        if r["l"] in seen:
            continue
        seen.add(r["l"])
        items.append(r)
    items.sort(key=lambda r: r["d"], reverse=True)
    items = items[:CAP]
    if fails < len(FEEDS) or not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        json.dump({"updated": dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%Y-%m-%d %H:%M"), "items": items}, open(path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    md = lambda x: x[5:10].replace("-", ".")
    rows = "".join(f'<li><span class="nd">{md(r["d"])}</span><a href="{e(r["l"])}" target="_blank" rel="noopener nofollow">{e(r["t"])}</a><em>{e(r["s"])}</em></li>' for r in items)
    if not rows:
        rows = '<li class="empty">소식을 불러오는 중이에요. 잠시 뒤에 다시 와 주세요.</li>'
    upd = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%m.%d")
    css = ('.nl{list-style:none;margin:0;padding:0}.nl li{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:12px;align-items:baseline;padding:15px 0;border-top:1px solid #e3e7ed}'
           '.nl li:first-child{border-top:0}.nd{color:#8a6a28;font-weight:800;font-size:15px}.nl a{color:#2d3134;font-weight:700;font-size:17px;line-height:1.5;text-decoration:none;word-break:keep-all}'
           '.nl a:hover{color:#8a6a28;text-decoration:underline}.nl a:focus-visible{outline:3px solid #c9a45c;outline-offset:2px}.nl em{font-style:normal;font-size:12.5px;color:#42474c;background:#f3e7d3;border-radius:20px;padding:3px 10px;white-space:nowrap}'
           '.nl .empty{display:block;color:#42474c}@media(max-width:640px){.nl li{grid-template-columns:56px minmax(0,1fr);row-gap:6px}.nl em{grid-column:2;justify-self:start}}')
    body = f'''<main class="wrap"><p class="crumb"><a href="/">일감마켓</a></p>
<h1>건설 뉴스</h1>
<p class="sum">국토교통부가 올린 보도자료와 입찰안내 중 건설과 관련된 소식 <b>{len(items):,}건</b> · {upd} 기준</p>
<section class="card"><h2>최신 소식</h2><ul class="nl">{rows}</ul></section>
<p class="more"><a class="btn" href="/#win">일감마켓에서 낙찰 현장 보기</a></p>
<p class="note">※ 국토교통부가 공개한 보도자료·입찰안내의 제목과 원문 링크입니다. 내용과 저작권은 해당 기관에 있으며, 일감마켓은 내용을 수정하거나 보증하지 않는 정보서비스입니다. 링크를 누르면 새 창에서 원문이 열립니다.</p></main>'''
    title = "건설 뉴스 · 국토교통부 보도자료·입찰안내 | 일감마켓"
    desc = "국토교통부가 올린 보도자료와 입찰안내 중 건설·주택·인프라 관련 소식을 매일 모아 보여 드립니다. 제목을 누르면 원문이 열려요."
    url = f"{site}/news/"
    page = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="일감마켓"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{site}/og.png">
<link rel="icon" type="image/svg+xml" href="/img/icon.svg">
<meta name="theme-color" content="#2d3134"><link rel="stylesheet" href="/page.css"><link rel="stylesheet" href="/btn3d.css?v=184"><style>{css}</style>
<link rel="preload" href="/fonts/NotoSansKR-sub.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="/font.css?v=1"></head>
<body>{HEADER.replace('aria-current="true"', '')}
{band(body)}
{FOOTER}{SCRIPTS}</body></html>
'''
    d_ = os.path.join(out, "news")
    os.makedirs(d_, exist_ok=True)
    open(os.path.join(d_, "index.html"), "w", encoding="utf-8").write(page)
    return [f"  <url><loc>{url}</loc><lastmod>{dt.date.today().isoformat()}</lastmod></url>"]
