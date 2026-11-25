"""네이버 블로그 '이번 주 ○○ 공공공사 낙찰 현황' 글(해요체)과 남색 카드 이미지를 지역별로 만듭니다.
사용: python3 tools/blog_card.py [출력폴더]   (playwright 필요) — 이번 주 낙찰 데이터 기준, 나라장터 공개 자료만 씁니다."""
import json, os, sys
from collections import Counter
from urllib.parse import quote
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_areas import cat_of, slug
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "blog_cards")
os.makedirs(OUT, exist_ok=True)
d = json.load(open(os.path.join(ROOT, "data", "public.json"), encoding="utf-8"))
a = json.load(open(os.path.join(ROOT, "data", "about.json"), encoding="utf-8"))
f, t = a["week"]["from"], a["week"]["to"]
md = lambda x: f"{int(x[5:7])}/{int(x[8:10])}"
eok = lambda n: f"{n/1e8:,.1f}억"
rows = [r for r in d["items"] if r.get("s") == "낙찰" and f <= (r.get("d") or "") <= t and r.get("amt")]
byrg = Counter(r.get("rg") for r in rows if r.get("rg"))
CSS = """@font-face{font-family:'N';src:url('file://@ROOT@/fonts/NotoSansKR-sub.woff');font-weight:400 800}
*{box-sizing:border-box;margin:0}body{width:1000px;height:1000px;font-family:'N','Noto Sans KR',sans-serif;color:#fff;padding:86px 76px;position:relative;overflow:hidden;
background:radial-gradient(circle at 82% 8%,rgba(180,190,210,.34),rgba(0,0,0,0) 38%),linear-gradient(160deg,#1f3f78 0%,#112a56 48%,#0a1b3b 100%)}
.pill{display:inline-block;border:2px solid #d9b46a;color:#f0cf8a;border-radius:999px;padding:14px 34px;font-size:34px;font-weight:700}
.h{font-size:96px;font-weight:800;letter-spacing:-.04em;line-height:1.15;margin-top:44px}.h em{font-style:normal;color:#e8c883}
.bx{display:flex;gap:24px;margin-top:48px}.box{flex:1;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:22px;padding:28px 34px}
.box span{display:block;font-size:28px;color:#c7d0e2}.box b{display:block;font-size:78px;font-weight:800;color:#e8c883;margin-top:10px;letter-spacing:-.02em}
.ln{position:absolute;left:76px;right:76px;bottom:140px;border-top:1px solid rgba(255,255,255,.3)}
.ft{position:absolute;left:76px;right:76px;bottom:76px;display:flex;justify-content:space-between;align-items:center;font-size:40px}.ft b{font-weight:800}.ft span{font-size:34px;color:#dfe5f1}""".replace("@ROOT@", ROOT)
def card(name, n, mx):
    sub = "공공공사" if name != "전국" else "공공공사"
    return (f"<html><head><meta charset='utf-8'><style>{CSS}</style></head><body><div class='pill'>{md(f)} ~ {md(t)}</div>"
            f"<div class='h'>이번 주 {name}<br>{sub}<br><em>낙찰 현황</em></div>"
            f"<div class='bx'><div class='box'><span>낙찰 현장</span><b>{n:,}건</b></div><div class='box'><span>최대 금액</span><b>{eok(mx)}</b></div></div>"
            f"<div class='ln'></div><div class='ft'><b>일감마켓</b><span>ilgammarket.co.kr</span></div></body></html>")
CSS2 = """@font-face{font-family:'N';src:url('file://@ROOT@/fonts/NotoSansKR-sub.woff');font-weight:400 800}
*{box-sizing:border-box;margin:0}body{width:1000px;background:#f2ecde;font-family:'N','Noto Sans KR',sans-serif;color:#1c2b4a;padding:60px 56px}
.t{font-size:48px;font-weight:800}.t em{font-style:normal;color:#8a6a28}.s{font-size:26px;color:#6a6f76;margin-top:12px}
.r{display:flex;align-items:center;gap:22px;background:#fff;border-radius:22px;padding:22px 30px;margin-top:18px;box-shadow:0 6px 18px rgba(45,49,52,.12)}
.r.f{background:linear-gradient(120deg,#1f3f78,#0f2550);color:#fff}
.n{flex:none;width:58px;height:58px;border-radius:50%;background:#e6c883;color:#1c2b4a;font-weight:800;font-size:28px;display:flex;align-items:center;justify-content:center}
.m{flex:1;min-width:0}.m b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:29px;line-height:1.25;font-weight:800;word-break:keep-all}.m span{font-size:22px;color:#6a6f76}.f .m span{color:#c7d0e2}
.a{flex:none;text-align:right}.a b{display:block;font-size:42px;font-weight:800;color:#8a6a28}.f .a b{color:#e8c883}.a span{font-size:21px;color:#6a6f76}.f .a span{color:#c7d0e2}
.ft{text-align:center;margin-top:34px;font-size:26px}.ft b{font-weight:800}.ft div{font-size:20px;color:#6a6f76;margin-top:8px}""".replace("@ROOT@", ROOT)
def top6(name, big):
    rows_ = "".join(
        f"<div class='r{' f' if i == 1 else ''}'><div class='n'>{i}</div><div class='m'><b>{r['nm']}</b><span>{r.get('dm') or ''}</span></div>"
        f"<div class='a'><b>{eok(r['amt'])}</b><span>낙찰률 {float(r['rate']):g}%</span></div></div>" if r.get('rate') else
        f"<div class='r{' f' if i == 1 else ''}'><div class='n'>{i}</div><div class='m'><b>{r['nm']}</b><span>{r.get('dm') or ''}</span></div><div class='a'><b>{eok(r['amt'])}</b></div></div>"
        for i, r in enumerate(big, 1))
    return (f"<html><head><meta charset='utf-8'><style>{CSS2}</style></head><body><div class='t'>금액이 큰 현장 <em>TOP 6</em></div>"
            f"<div class='s'>{name} · {md(f)} ~ {md(t)} 낙찰</div>{rows_}"
            f"<div class='ft'><b>일감마켓</b> · ilgammarket.co.kr<div>출처: 조달청 나라장터 공공데이터 · 일감마켓은 거래 당사자가 아니에요</div></div></body></html>")
posts = []; cards = {}
def ro(w):
    c = ord(w[-1]) - 0xAC00
    return "로" if not (0 <= c < 11172) or c % 28 in (0, 8) else "으로"
def facts(name, rs):
    cats = Counter(cat_of(r)[0] for r in rs if cat_of(r)).most_common(3)
    sm = sum(1 for r in rs if r["amt"] < 1e8)
    dm = Counter(r.get("dm") for r in rs if r.get("dm")).most_common(1)
    amt = sum(r["amt"] for r in rs)
    L = [f"이번 주 {name} 낙찰 합계는 약 {eok(amt)}이에요.",
         "공종별로는 " + ", ".join(f"{k} {v}건" for k, v in cats) + " 순으로 많았어요.",
         f"1억 원 미만 현장이 {sm:,}건({round(sm * 100 / len(rs))}%)이었어요."]
    if dm and dm[0][1] >= 3:
        L.append(f"가장 많이 낙찰을 낸 발주처는 {dm[0][0]}{ro(dm[0][0])} {dm[0][1]}건이에요.")
    return L
def build(name, rs):
    big = sorted(rs, key=lambda r: -r["amt"])[:6]
    title = f"이번 주 {name} 공공공사 낙찰 현황 ({md(f)}~{md(t)}) | 최대 {int(big[0]['amt'] // 1e8):,}억"
    where = "전국에서" if name == "전국" else f"{name}에서"
    n6 = {1: "한", 2: "두", 3: "세", 4: "네", 5: "다섯", 6: "여섯"}[len(big)]
    body = [f"이번 주 {where} 낙찰된 공공공사는 {len(rs):,}건이에요.", f"그중 금액이 큰 현장 {n6} 곳을 모았어요.", "",
            f"[사진 1장] 카드_{name}.png", "",
            *facts(name, rs), "",
            f"{name} 전체 낙찰 현장과 지역별·분야별 현황은 일감마켓에서 매일 아침 갱신돼요.", "https://ilgammarket.co.kr"]
    posts.append(f"■ 카테고리: 최신 낙찰 현장\n■ 제목: {title}\n■ 분홍 밑줄 강조: 낙찰된 공공공사는 {len(rs):,}건 / 일감마켓에서 매일 아침 갱신\n\n" + "\n".join(body))
    cards[f"카드_{name}_표지"] = card(name, len(rs), big[0]["amt"])
    cards[f"카드_{name}_TOP6"] = top6(name, big)
build("전국", rows)
for rg, c in byrg.most_common(8):
    if c >= 5: build(rg, [r for r in rows if r.get("rg") == rg])

# ── 마감 입찰공고 시리즈(내일 마감) ──
import datetime
kst = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) + datetime.timedelta(hours=9)
dd = (kst + datetime.timedelta(days=1)).strftime("%Y-%m-%d"); dl = f"{int(dd[5:7])}/{int(dd[8:10])}"
bd = json.load(open(os.path.join(ROOT, "data", "bids.json"), encoding="utf-8"))["items"]
bs = [r for r in bd if (r.get("cl") or "")[:10] == dd and r.get("pr")]
bsa = [r for r in bd if (r.get("cl") or "")[:10] == dd]
if bs:
    big = sorted(bs, key=lambda r: -r["pr"])[:6]
    cov = (f"<html><head><meta charset='utf-8'><style>{CSS}</style></head><body><div class='pill'>마감 임박</div>"
           f"<div class='h'>{dl} 마감<br>공사<br><em>입찰공고</em></div>"
           f"<div class='bx'><div class='box'><span>마감 공고</span><b>{len(bsa):,}건</b></div><div class='box'><span>최대 금액</span><b>{eok(big[0]['pr'])}</b></div></div>"
           f"<div class='ln'></div><div class='ft'><b>일감마켓</b><span>ilgammarket.co.kr</span></div></body></html>")
    rws = "".join(
        f"<div class='r{' f' if i == 1 else ''}'><div class='n'>{i}</div><div class='m'><b>{r['nm'].strip()}</b><span>{(r.get('dm') or r.get('og') or '')} · {r.get('rg') or ''} · {r['cl'][11:16]} 마감</span></div>"
        f"<div class='a'><b>{eok(r['pr'])}</b><span>추정가격</span></div></div>" for i, r in enumerate(big, 1))
    t6 = (f"<html><head><meta charset='utf-8'><style>{CSS2}</style></head><body><div class='t'>{dl} 마감, 금액 큰 공고 <em>TOP 6</em></div>"
          f"<div class='s'>공사 입찰공고 · {dl} 마감</div>{rws}"
          f"<div class='ft'><b>일감마켓</b> · ilgammarket.co.kr<div>출처: 조달청 나라장터 공공데이터 · 일감마켓은 거래 당사자가 아니에요</div></div></body></html>")
    cards[f"카드_{dl.replace('/', '-')}마감_표지"] = cov; cards[f"카드_{dl.replace('/', '-')}마감_TOP6"] = t6
    rgc = Counter(r.get("rg") for r in bsa if r.get("rg")).most_common(3)
    big1 = sum(1 for r in bs if r["pr"] >= 1e8); morn = sum(1 for r in bsa if (r["cl"] or "")[11:13] < "12")
    bfacts = (f"지역별로는 " + ", ".join(f"{k} {v}건" for k, v in rgc) + " 순으로 많아요.\n"
              f"추정가격 1억 원 이상 공고는 {big1:,}건이고, 오전에 마감하는 공고는 {morn:,}건이에요.")
    posts.append(f"■ 카테고리: 나라장터 입찰공고\n■ 제목: {dl} 마감 공사 입찰공고 {len(bsa):,}건 | 최대 {int(big[0]['pr'] // 1e8):,}억\n■ 분홍 밑줄 강조: 입찰공고는 {len(bsa):,}건 / 일감마켓에서 매일 아침 갱신\n\n"
                 f"{dl}에 마감하는 공사 입찰공고는 {len(bsa):,}건이에요.\n그중 금액이 큰 공고 여섯 곳을 모았어요.\n\n[사진 1장] 카드_{dl.replace('/', '-')}마감.png\n\n{bfacts}\n\n입찰공고 전체 목록은 일감마켓에서 매일 아침 갱신돼요.\nhttps://ilgammarket.co.kr/b/")
open(os.path.join(OUT, "블로그글.txt"), "w", encoding="utf-8").write(("\n\n" + "=" * 40 + "\n\n").join(posts) + "\n")
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1000, "height": 1000})
    for k, h in cards.items():
        hp = os.path.join(OUT, "_t.html"); open(hp, "w", encoding="utf-8").write(h)
        pg.set_viewport_size({"width": 1000, "height": 1000}); pg.goto("file://" + hp); pg.wait_for_timeout(250); pg.screenshot(path=os.path.join(OUT, k + ".png"), full_page=k.endswith("TOP6"))
    b.close()
os.remove(os.path.join(OUT, "_t.html")); print(len(cards), "장 →", OUT)
