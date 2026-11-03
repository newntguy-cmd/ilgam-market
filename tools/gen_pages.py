"""법인 업체별 전용 페이지(c/<사업자번호>/index.html), 사이트맵, robots.txt 를 만듭니다.

검색엔진이 읽을 수 있는 정적 페이지입니다. 법인만 만들고(개인사업자는 만들지 않음),
대표자명은 쓰지 않습니다. 같은 입력이면 같은 출력이 나오도록 시각 정보는 넣지 않습니다.
"""
import html
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else ROOT
SITE = "https://ilgammarket.co.kr"
d = json.load(open(os.path.join(ROOT, "data", "public.json"), encoding="utf-8"))
corp = d.get("corp") or {}
e = html.escape


def money(n):
    if not n:
        return "-"
    eok = n / 1e8
    if eok >= 1:
        return (f"{eok:.0f}" if eok >= 100 else f"{eok:.1f}") + "억"
    return f"{round(n / 1e4):,}만"


def fmt_biz(b):
    return f"{b[:3]}-{b[3:5]}-{b[5:]}" if len(b) == 10 else b


def clean_addr(a):
    a = re.sub(r"\s*\(\s*\)\s*", " ", a or "")
    a = re.sub(r"-0(?=\s|\(|$)", "", a)
    return re.sub(r"\s+", " ", a).strip()


def src(r):
    u = r.get("u") or ""
    if not u and re.match(r"^[A-Z0-9]+-\d{3}$", r.get("id") or ""):
        n, o = r["id"].split("-")
        u = f"https://www.g2b.go.kr/link/PNPE027_01/single/?bidPbancNo={n}&bidPbancOrd={o}"
    return u if re.match(r"^https://([a-z0-9.-]+\.)?g2b\.go\.kr/", u) else ""


by = {}
for r in d["items"]:
    if r.get("b") and r.get("s") == "낙찰":
        by.setdefault(r["b"], []).append(r)

STYLE = "/page.css"
made = {}
for biz, rows in by.items():
    rows.sort(key=lambda r: (r["d"], r["amt"]), reverse=True)
    name = rows[0]["co"]
    total = sum(r["amt"] or 0 for r in rows)
    regs = {}
    for r in rows:
        regs[r["rg"]] = regs.get(r["rg"], 0) + 1
    top = sorted(regs, key=lambda k: -regs[k])[0]
    # 전화·주소는 정적 페이지에 싣지 않습니다. 로그인한 사용자에게만 서버에서 내려줍니다.
    latest = rows[0]["d"]
    title = f"{name} 낙찰 이력 · 일감마켓"
    desc = f"{name}의 최근 공공 공사 낙찰 {len(rows)}건, 합계 {money(total)}. 주로 {top} 지역. 사업자번호 {fmt_biz(biz)}" + ". 조달청 나라장터 공공데이터 기준."
    url = f"{SITE}/c/{biz}/"
    ld = {"@context": "https://schema.org", "@type": "Organization", "name": name, "taxID": fmt_biz(biz), "url": url}
    hist = "".join(
        f'<tr><td class="dt">{e(r["d"][5:].replace("-", "."))}</td><td><b>{e(r["nm"])}</b><small>{e(r["dm"])}</small></td>'
        f'<td class="amt">{money(r["amt"])}</td><td class="lk">' + (f'<a href="{e(src(r))}" target="_blank" rel="noopener noreferrer">원문 ↗</a>' if src(r) else "") + "</td></tr>"
        for r in rows[:50]
    )
    info = f'<div class="l"><span>사업자번호</span><b>{fmt_biz(biz)}</b></div>'
    info += (f'<div class="l" id="ct" data-biz="{biz}"><span>대표 전화</span>'
             f'<a class="lock" href="/?join=1"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
             f'<span class="dots">031-•••-••••</span> 가입하면 보입니다</a></div>')
    page = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="일감마켓"><meta property="og:title" content="{e(name)} · 낙찰 {len(rows)}건 {money(total)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="https://ilgammarket.co.kr/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://ilgammarket.co.kr/og.png">
<meta name="theme-color" content="#0f2342"><link rel="stylesheet" href="{STYLE}">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script></head>
<body><header class="top"><div class="wrap"><a class="brand" href="/"><span class="logo"><i></i><i></i><i></i><i></i></span>일감마켓</a><nav><a href="/">최근 낙찰</a><a href="/#co">업체</a><a href="/market/">장터</a></nav></div></header>
<main class="wrap"><p class="crumb"><a href="/">일감마켓</a> › 업체</p>
<h1>{e(name)}</h1>
<p class="sum">최근 낙찰 <b>{len(rows)}건</b> · 합계 <b>{money(total)}</b> · 주요 지역 <b>{e(top)}</b> · 가장 최근 낙찰 {e(latest)}</p>
<section class="card"><h2>업체 정보</h2>{info}<p class="note">※ 조달청(나라장터) 등록 정보입니다. 최신 정보와 다를 수 있습니다.</p></section>
<section class="card"><h2>낙찰 이력</h2><table><tbody>{hist}</tbody></table></section>
<p class="more"><a class="btn" href="/#co">홈페이지에서 다른 업체 보기</a></p></main>
<footer><div class="wrap"><p>데이터 출처 조달청 나라장터 · 공공데이터포털. 공공데이터를 가공해 제공하며 정확성과 완전성을 보장하지 않습니다.</p><p><a href="/#biz">사업자 정보</a> (겟잇타운 · 사업자등록번호 594-06-03620 · 통신판매업 신고번호 제2026-용인기흥-01348호) · 문의 <a href="mailto:help@ilgammarket.co.kr">help@ilgammarket.co.kr</a> · <a href="/market/policy.html">이용약관</a> · <a href="/pro.html">일감 마스터</a> · <a href="/market/policy.html#refund">환불규정</a> · <a href="/market/policy.html#privacy">개인정보처리방침</a></p></div></footer><script type="module" src="/auth.js"></script><script src="/c.js" defer></script></body></html>
'''
    made[biz] = (page, latest)

cdir = os.path.join(OUT, "c")
os.makedirs(cdir, exist_ok=True)
for biz, (page, _) in made.items():
    p = os.path.join(cdir, biz)
    os.makedirs(p, exist_ok=True)
    f = os.path.join(p, "index.html")
    if not os.path.exists(f) or open(f, encoding="utf-8").read() != page:
        open(f, "w", encoding="utf-8").write(page)
for name in os.listdir(cdir):  # 60일 창에서 빠진 업체는 지웁니다
    if re.fullmatch(r"\d{10}", name) and name not in made:
        shutil.rmtree(os.path.join(cdir, name))

urls = [f"  <url><loc>{SITE}/</loc></url>", f"  <url><loc>{SITE}/pro.html</loc></url>"] + [
    f"  <url><loc>{SITE}/c/{b}/</loc><lastmod>{made[b][1]}</lastmod></url>" for b in sorted(made)
]
open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n")
open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8").write(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
print(f"업체 페이지 {len(made)}개")
