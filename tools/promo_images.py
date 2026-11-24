"""블로그·스레드용 데이터 이미지(PNG)를 만듭니다. 이번 주 낙찰 데이터 기준, 나라장터 공개 자료만 씁니다.
사용: python3 tools/promo_images.py [출력폴더]   (playwright 필요)"""
import json, os, sys
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_areas import cat_of
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "promo_images")
os.makedirs(OUT, exist_ok=True)
def cut(t, k=16):
    if len(t) <= k: return t
    c = t[:k]
    sp = c.rfind(' ')
    if sp >= 8: c = c[:sp]
    return c.rstrip(' ([{~·-') + '…'
def eok(n):
    n /= 1e8
    return f"{n:,.0f}억" if n >= 10 else f"{n:,.1f}억"
d = json.load(open(os.path.join(ROOT, "data", "public.json"), encoding="utf-8"))
a = json.load(open(os.path.join(ROOT, "data", "about.json"), encoding="utf-8"))
f, t = a["week"]["from"], a["week"]["to"]
md = lambda x: x[5:].replace("-", "/")
rows = [r for r in d["items"] if r.get("s") == "낙찰" and f <= (r.get("d") or "") <= t and r.get("amt")]
CSS = """@font-face{font-family:'N';src:url('file://%s/fonts/NotoSansKR-sub.woff');font-weight:400 800}
*{box-sizing:border-box;margin:0}body{width:1000px;height:1000px;background:#f2ecde;font-family:'N','Noto Sans KR',sans-serif;color:#2d3134;padding:64px 60px;position:relative}
.t{font-size:38px;font-weight:700;color:#4a4f55}.h{font-size:78px;font-weight:800;letter-spacing:-.03em;margin-top:14px;line-height:1.2}
.g{color:#8a6a28}.big{font-size:200px;font-weight:800;letter-spacing:-.04em;line-height:1;margin-top:30px}
.row{display:flex;align-items:center;gap:18px;margin-top:34px}.nm{width:270px;font-size:46px;font-weight:700;white-space:nowrap}
.bar{height:60px;background:#2d3134;border-radius:8px}.v{font-size:46px;font-weight:800}
.ft{position:absolute;left:60px;right:60px;bottom:44px}.ft span{display:block;font-size:30px;color:#4a4f55}
.ft b{display:block;margin-top:8px;color:#2d3134;font-size:40px}.sub{font-size:48px;margin-top:34px;line-height:1.5}
.bx{display:flex;gap:14px;margin-top:34px}.box{flex:1;background:#fff;border:1px solid #ddd2ba;border-radius:16px;padding:24px 20px}.box b{display:block;font-size:56px;font-weight:800;line-height:1.1}.box span{font-size:32px;color:#4a4f55}
.s{margin-top:30px;font-size:42px;line-height:1.4}.s i{font-style:normal;font-weight:800;color:#8a6a28;margin-right:8px}.s small{display:block;font-size:34px;color:#4a4f55}
.c{margin-top:30px;font-size:36px;color:#4a4f55;line-height:1.4}""" % ROOT
def page(inner, note="나라장터 공개 자료 · 일감마켓은 낙찰의 당사자가 아닙니다"):
    return f"<html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{inner}<div class='ft'><span>{note}</span><b>일감마켓 ilgammarket.co.kr</b></div></body></html>"
n = len(rows); tot = sum(r["amt"] for r in rows); small = sum(1 for r in rows if r["amt"] < 1e8)
byrg = Counter(r.get("rg") for r in rows if r.get("rg"))
bycat = Counter(cat_of(r)[0] for r in rows if cat_of(r))
pages = {}
pages["01_전국요약"] = page(f"<div class='t'>{md(f)} ~ {md(t)} 전국 낙찰</div><div class='big'>{n:,}<span style='font-size:90px'>건</span></div><div class='h'>합계 <span class='g'>{eok(tot)}</span></div><div class='sub'>1억 미만 현장이 <b class='g'>{small:,}건 ({round(small*100/n)}%)</b></div>")
def bars(title, items, unit="건"):
    mx = items[0][1]
    rs = "".join(f"<div class='row'><div class='nm'>{k}</div><div class='bar' style='width:{int(300*v/mx)}px'></div><div class='v'>{v:,}{unit}</div></div>" for k, v in items)
    return page(f"<div class='t'>{md(f)} ~ {md(t)}</div><div class='h'>{title}</div>{rs}")
pages["02_지역별건수"] = bars("지역별 낙찰 건수 TOP 5", byrg.most_common(5))
pages["03_공종별건수"] = bars("공종별 낙찰 건수 TOP 5", bycat.most_common(5))
for rg, c in byrg.most_common(16):
    rs = [r for r in rows if r.get("rg") == rg]
    if len(rs) < 5: continue
    top = Counter(cat_of(r)[0] for r in rs if cat_of(r)).most_common(3)
    big = sorted(rs, key=lambda r: -r["amt"])[:2]
    sm = sum(1 for r in rs if r["amt"] < 1e8)
    boxes = f"<div class='bx'><div class='box'><b>{len(rs):,}건</b><span>낙찰</span></div><div class='box'><b>{eok(sum(r['amt'] for r in rs))}</b><span>합계</span></div><div class='box'><b>{sm:,}건</b><span>1억 미만</span></div></div>"
    lines = "".join(f"<div class='s'><i>{i}</i>{cut(r['nm'])}<small>{eok(r['amt'])}</small></div>" for i, r in enumerate(big, 1))
    pages[f"지역_{rg}"] = page(f"<div class='t'>{md(f)} ~ {md(t)}</div><div class='h'>{rg} 낙찰 현황</div>{boxes}<div class='c'>많이 나온 공종 · " + ", ".join(f"{k} {v}건" for k, v in top[:2]) + f"</div>{lines}")
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1000, "height": 1000})
    for k, h in pages.items():
        hp = os.path.join(OUT, "_t.html"); open(hp, "w", encoding="utf-8").write(h)
        pg.goto("file://" + hp); pg.wait_for_timeout(250); pg.screenshot(path=os.path.join(OUT, k + ".png"))
    b.close()
os.remove(os.path.join(OUT, "_t.html")); print(len(pages), "장 →", OUT)
