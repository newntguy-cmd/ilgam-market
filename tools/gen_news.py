"""건설 뉴스 페이지(news/)를 만듭니다.

국토교통부가 공식 RSS로 내보내는 보도자료·입찰안내 중 건설과 관련된 것만 골라 '제목과 원문 링크'만 보여 줍니다.
(내용·저작권은 해당 기관에 있습니다.) 받아 오지 못하면 지난번 목록(data/news.json)을 그대로 씁니다.
"""
import datetime as dt
import html
import json
import os
import re
import http.cookiejar
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
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))  # 쿠키를 받아야 307 반복이 풀립니다
    raw = op.open(req, timeout=25).read()
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
    kst = dt.datetime.now(dt.timezone(dt.timedelta(hours=9)))
    today_s, yest_s = kst.strftime("%Y-%m-%d"), (kst - dt.timedelta(days=1)).strftime("%Y-%m-%d")
    wd = "월화수목금토일"
    def dlabel(d):
        x = dt.date.fromisoformat(d)
        tag = "오늘 " if d == today_s else ("어제 " if d == yest_s else "")
        return f"{tag}{x.month}월 {x.day}일 ({wd[x.weekday()]})"
    nb = sum(1 for r in items if r["s"] == "입찰안내")
    npr = len(items) - nb
    ntd = sum(1 for r in items if r["d"] == today_s)
    ICB = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>'
    ICP = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h13v14H4zM17 8h3v9a2 2 0 0 1-2 2M7 9h7M7 13h7"/></svg>'
    groups, order = {}, []
    for r in items:
        if r["d"] not in groups:
            groups[r["d"]] = []
            order.append(r["d"])
        groups[r["d"]].append(r)
    rows = ""
    for d in order:
        li = "".join(
            f'<li data-k="{e(r["s"])}"><span class="nk {"nb" if r["s"] == "입찰안내" else "np"}">{ICB if r["s"] == "입찰안내" else ICP}{e(r["s"])}</span>'
            f'<a href="{e(r["l"])}" target="_blank" rel="noopener nofollow">{e(r["t"])}</a></li>' for r in groups[d])
        rows += f'<h3 class="gd">{dlabel(d)}<small>{len(groups[d])}건</small></h3><ul class="nl">{li}</ul>'
    if not rows:
        rows = '<p class="empty">소식을 불러오는 중이에요. 잠시 뒤에 다시 와 주세요.</p>'
    upd = kst.strftime("%m.%d")
    css = ('.nt{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 18px}.nt div{background:#fff;border:1px solid #e3e7ed;border-radius:14px;padding:16px 20px}'
           '.nt b{display:block;font-size:34px;line-height:1.1;font-weight:800;color:#126352}.nt span{display:block;margin-top:4px;font-size:15px;font-weight:700;color:#42474c}'
           '.nw{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:20px;align-items:start}.nf{display:flex;gap:8px;margin:0 0 6px;flex-wrap:wrap}'
           '.nf button{min-height:44px;padding:0 18px;border:1px solid #d8d2c4;border-radius:999px;background:#fff;color:#2d3134;font-size:16px;font-weight:700;cursor:pointer}'
           '.nf button[aria-pressed=true]{background:#126352;border-color:#126352;color:#fff}.nf button:focus-visible{outline:3px solid #c9a45c;outline-offset:2px}'
           '.gd{display:flex;align-items:baseline;gap:10px;margin:22px 0 4px;font-size:18px;font-weight:800;color:#2d3134}.gd small{font-size:14px;font-weight:700;color:#8a6a28}'
           '.nl{list-style:none;margin:0;padding:0}.nl li{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-top:1px solid #e3e7ed}.nl li[hidden]{display:none}'
           '.nk{flex:none;display:inline-flex;align-items:center;gap:5px;min-width:92px;justify-content:center;padding:5px 10px;border-radius:8px;font-size:13.5px;font-weight:800}'
           '.nb{background:#e3f1ec;color:#0b4237}.np{background:#ece9e2;color:#2d3134}'
           '.nl a{color:#2d3134;font-weight:700;font-size:17px;line-height:1.5;text-decoration:none;word-break:keep-all}.nl a:hover{color:#126352;text-decoration:underline}.nl a:focus-visible{outline:3px solid #c9a45c;outline-offset:2px}'
           '.side{position:sticky;top:104px;background:#126352;color:#fff;border-radius:16px;padding:20px;box-shadow:0 0 0 1px rgba(201,164,92,.5)}.side h2{margin:0 0 4px;font-size:19px;color:#fff}'
           '.side p.s{margin:0 0 12px;font-size:14px;color:#cfe8df}.side ol{list-style:none;margin:0;padding:0}.side li{padding:12px 0;border-top:1px solid rgba(230,200,131,.35)}'
           '.side li b{display:block;font-size:16px;line-height:1.45;font-weight:700;word-break:keep-all}.side li a{color:#ffe08f;font-weight:800;text-decoration:none;font-size:15px}.side li span{display:block;margin-top:2px;font-size:15px;color:#e8f5ef}'
           '.side .go{display:block;margin-top:14px;text-align:center;padding:13px;border-radius:10px;background:linear-gradient(180deg,#f6e3ab,#d9b266);color:#2b2e32;font-weight:800;font-size:16px;text-decoration:none}'
           '.empty{color:#42474c}@media(max-width:900px){.nw{grid-template-columns:1fr}.side{position:static}}@media(max-width:560px){.nt b{font-size:26px}.nt div{padding:12px 14px}.nl li{flex-direction:column;gap:6px}}')
    js = ("<script>(function(){var bs=document.querySelectorAll('.nf button'),ls=document.querySelectorAll('.nl li'),gs=document.querySelectorAll('.gd');"
          "function f(k){bs.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.k===k?'true':'false')});ls.forEach(function(l){l.hidden=k!=='전체'&&l.dataset.k!==k});"
          "gs.forEach(function(g){var u=g.nextElementSibling;g.hidden=!u.querySelector('li:not([hidden])');u.hidden=g.hidden})}bs.forEach(function(b){b.addEventListener('click',function(){f(b.dataset.k)})});"
          "fetch('/data/recent.json').then(function(r){return r.json()}).then(function(j){var it=j.items||[],mx='';it.forEach(function(x){if(x.d>mx)mx=x.d});"
          "var t=it.filter(function(x){return x.d===mx&&x.amt&&x.co}).sort(function(a,b){return b.amt-a.amt}).slice(0,3),o=document.getElementById('sd');if(!o||!t.length)return;"
          "function E(s){return String(s).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}"
          "o.innerHTML=t.map(function(x){return '<li><b>'+E(x.nm)+'</b><a href=\"/c/'+E(x.b)+'/\">'+E(x.co)+'</a><span>'+(x.amt/1e8).toFixed(1)+'억 · '+E(x.rg||'')+'</span></li>'}).join('');"
          "document.getElementById('sdd').textContent=Number(mx.slice(5,7))+'월 '+Number(mx.slice(8,10))+'일 낙찰 중 금액이 큰 현장'}).catch(function(){})})()</script>")
    body = f'''<main class="wrap"><p class="crumb"><a href="/">일감마켓</a></p>
<h1>건설 뉴스</h1>
<p class="sum">국토교통부가 올린 보도자료와 입찰안내 중 건설과 관련된 소식 · {upd} 기준</p>
<div class="nt"><div><b>{ntd}건</b><span>오늘 올라온 소식</span></div><div><b>{nb}건</b><span>입찰안내</span></div><div><b>{npr}건</b><span>보도자료</span></div></div>
<div class="nw"><section class="card"><div class="nf" role="group" aria-label="종류"><button type="button" data-k="전체" aria-pressed="true">전체</button><button type="button" data-k="입찰안내" aria-pressed="false">입찰안내</button><button type="button" data-k="보도자료" aria-pressed="false">보도자료</button></div>{rows}</section>
<aside class="side"><h2>오늘의 큰 낙찰</h2><p class="s" id="sdd">금액이 큰 낙찰 현장</p><ol id="sd"><li><b>불러오는 중이에요</b></li></ol><a class="go" href="/#win">낙찰 현장 전체 보기</a></aside></div>
<p class="note">※ 국토교통부가 공개한 보도자료·입찰안내의 제목과 원문 링크입니다. 내용과 저작권은 해당 기관에 있으며, 일감마켓은 내용을 수정하거나 보증하지 않는 정보서비스입니다. 링크를 누르면 새 창에서 원문이 열립니다.</p>{js}</main>'''
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
<meta name="theme-color" content="#2d3134"><link rel="stylesheet" href="/page.css"><link rel="stylesheet" href="/btn3d.css?v=200"><style>{css}</style>
<link rel="preload" href="/fonts/NotoSansKR-sub.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="/font.css?v=1"></head>
<body>{HEADER.replace('aria-current="true"', '')}
{band(body)}
{FOOTER}{SCRIPTS}</body></html>
'''
    d_ = os.path.join(out, "news")
    os.makedirs(d_, exist_ok=True)
    open(os.path.join(d_, "index.html"), "w", encoding="utf-8").write(page)
    return [f"  <url><loc>{url}</loc><lastmod>{dt.date.today().isoformat()}</lastmod></url>"]
