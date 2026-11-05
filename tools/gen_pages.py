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
    if r.get("b"):
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
        f'<tr><td class="dt">{e(r["d"][5:].replace("-", "."))}{"<small>낙찰 예정</small>" if r.get("s") == "낙찰예정" else ""}</td><td><b>{e(r["nm"])}</b><small>{e(r["dm"])}</small></td>'
        f'<td class="amt">{money(r["amt"])}</td><td class="lk"></td></tr>'
        for r in rows[:50]
    )
    info = f'<div class="l"><span>사업자번호</span><b>{fmt_biz(biz)}</b></div>'
    info += ('<div class="l" id="ct0"><span>주소</span><a class="lock" href="/?join=1"><svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5\" y=\"11\" width=\"14\" height=\"9\" rx=\"2\"/><path d=\"M8 11V8a4 4 0 0 1 8 0v3\"/></svg><span class="dots">경기 ••••• ••• ••••</span> 가입하면 보입니다</a></div>')
    info += (f'<div class="l" id="ct" data-biz="{biz}"><span>대표 전화</span>'
             f'<a class="lock" href="/?join=1"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
             f'<span class="dots">031-•••-••••</span> 가입하면 보입니다</a></div>')
    page = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="일감마켓"><meta property="og:title" content="{e(name)} · 낙찰 {len(rows)}건 {money(total)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="https://ilgammarket.co.kr/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://ilgammarket.co.kr/og.png">
<link rel="icon" type="image/svg+xml" href="/img/icon.svg">
<meta name="theme-color" content="#0f2342"><link rel="stylesheet" href="{STYLE}"><link rel="stylesheet" href="/btn3d.css?v=26">
<script>if(location.search.indexOf("embed")>-1)document.documentElement.className="embed"</script>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&display=swap" rel="stylesheet"></head>
<body><header class="top"><div class="wrap"><a class="brand" href="/" aria-label="일감마켓"><span class="logo"><i></i><i></i><i></i><i></i></span></a><nav aria-label="메뉴"><a href="/#home" title="일감마켓이 시작된 이야기"><span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/></svg></span>회사소개</a><a href="/#win" title="방금 낙찰된 현장과 업체"><span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/></svg></span>낙찰정보</a><a href="/market/" title="내 물건 팔고, 필요한 물품 견적받기"><span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/></svg></span>직거래장터</a><a href="/#wl" title="담아 둔 업체의 새 낙찰 알림"><span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg></span>관심업체</a></nav></div></header>
<main class="wrap"><p class="crumb"><a href="/">일감마켓</a> › 업체</p>
<h1>{e(name)}</h1>
<p class="sum">최근 낙찰 <b>{len(rows)}건</b> · 합계 <b>{money(total)}</b> · 주요 지역 <b>{e(top)}</b> · 가장 최근 낙찰 {e(latest)}</p>
<section class="card"><h2>업체 정보</h2>{info}<p class="note">※ 조달청(나라장터) 등록 정보입니다. 최신 정보와 다를 수 있습니다.</p></section>
<section class="card"><h2>낙찰 이력</h2><table><tbody>{hist}</tbody></table></section>
<p class="more"><a class="btn" href="/#co">홈페이지에서 다른 업체 보기</a></p></main>
<footer><div class="wrap"><p>데이터 출처 조달청 나라장터 · 공공데이터포털. 공공데이터를 가공해 제공하며 정확성과 완전성을 보장하지 않습니다.</p><p><a href="/#biz">사업자 정보</a> (겟잇타운 · 사업자등록번호 594-06-03620 · 통신판매업 신고번호 제2026-용인기흥-01348호) · 문의 <a href="mailto:help@ilgammarket.co.kr">help@ilgammarket.co.kr</a> · <a href="/market/policy.html">이용약관</a> · <a href="/pro.html">일감 마스터</a> · <a href="/market/policy.html#refund">환불규정</a> · <a href="/market/policy.html#privacy">개인정보처리방침</a></p></div></footer><script type="module" src="/auth.js"></script><script src="/c.js" defer></script><script src="/cs.js?v=2" defer></script><script src="/ga.js" defer></script></body></html>
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

# 회사소개 페이지용 작은 통계 파일 (낙찰 전체 파일 6MB를 소개 페이지에서 받지 않도록)
import collections
_it = d["items"]
_win = [r for r in _it if r.get("s") == "낙찰" and r.get("co") and r.get("amt")]
_win.sort(key=lambda r: (r.get("d") or "", r.get("amt") or 0), reverse=True)
_ds = sorted(r["d"] for r in _it if r.get("d"))
_about = {
    "updated": d.get("updated"), "n": len(_it),
    "cos": len({r["co"] for r in _it if r.get("co")}),
    "amt": sum(r.get("amt") or 0 for r in _it),
    "from": _ds[0] if _ds else "", "to": _ds[-1] if _ds else "",
    "regions": collections.Counter(r["rg"] for r in _it if r.get("rg")).most_common(17),
    "cards": [{"rg": r["rg"], "nm": r["nm"], "co": r["co"], "amt": r["amt"], "d": r["d"], "b": r.get("b", "")} for r in _win[:18]],
}
json.dump(_about, open(os.path.join(OUT, "data", "about.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# 이번 주 동향 (최근 7일 vs 직전 7일) — 회사소개 페이지
import datetime as _dt
_end = _dt.date.fromisoformat(_about["to"]) if _about["to"] else _dt.date.today()
def _rng(a, b):  # (end-a, end-b]
    lo, hi = (_end - _dt.timedelta(days=a)).isoformat(), (_end - _dt.timedelta(days=b)).isoformat()
    return [r for r in _it if r.get("s") == "낙찰" and r.get("d") and hi < r["d"] <= lo]
_cur, _prev = _rng(0, 7), _rng(7, 14)
_cc = collections.Counter(r["rg"] for r in _cur if r.get("rg"))
_pc = collections.Counter(r["rg"] for r in _prev if r.get("rg"))
_tr = sorted(({"rg": k, "cur": _cc[k], "prev": _pc.get(k, 0), "diff": _cc[k] - _pc.get(k, 0)} for k in _cc), key=lambda x: -x["diff"])
_about["week"] = {"n": len(_cur), "pn": len(_prev), "amt": sum(r.get("amt") or 0 for r in _cur), "pamt": sum(r.get("amt") or 0 for r in _prev), "from": (_end - _dt.timedelta(days=6)).isoformat(), "to": _end.isoformat()}
_tr = [x for x in _tr if x["rg"] != "미분류"]
_about["up"] = [x for x in _tr if x["diff"] > 0][:4]
_about["down"] = [x for x in _tr[::-1][:3] if x["diff"] < 0]
_about["big"] = [{"rg": r["rg"], "nm": r["nm"], "co": r["co"], "amt": r["amt"]} for r in sorted(_cur, key=lambda r: -(r.get("amt") or 0))[:5]]
json.dump(_about, open(os.path.join(OUT, "data", "about.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# 메인 '둘러보기'용: 이번 주 많이 낙찰받은 업체, 지역별 이번 주 건수
_cn = collections.Counter(); _ca = collections.Counter(); _cb = {}
for r in _cur:
    if r.get("co"):
        _cn[r["co"]] += 1; _ca[r["co"]] += r.get("amt") or 0
        if r.get("b"): _cb[r["co"]] = r["b"]
_about["topco"] = [{"co": k, "n": v, "amt": _ca[k], "b": _cb.get(k, "")} for k, v in sorted(_cn.items(), key=lambda kv: (-kv[1], -_ca[kv[0]]))[:10]]
_about["regw"] = [{"rg": k, "cur": _cc[k], "prev": _pc.get(k, 0)} for k in sorted(_cc, key=lambda x: -_cc[x]) if k != "미분류"]
json.dump(_about, open(os.path.join(OUT, "data", "about.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
