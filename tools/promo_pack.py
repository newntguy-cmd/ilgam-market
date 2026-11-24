"""홍보 묶음: 이번 주 낙찰 데이터에서 사실만 뽑아 스레드(반말) 글 여러 개를 만듭니다 (사람이 복사해서 올립니다).
사용: python3 tools/promo_pack.py [출력파일]   — 기본 promo_threads.txt
수익·할인 약속, 업체 연락처를 열어 준다는 표현은 쓰지 않습니다."""
import json, os, sys, re
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_areas import cat_of
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "ilgammarket.co.kr"
def eok(n):
    n /= 1e8
    return f"{n:,.0f}억" if n >= 10 else f"{n:,.1f}억"
def main(out):
    d = json.load(open(os.path.join(ROOT, "data", "public.json"), encoding="utf-8"))
    a = json.load(open(os.path.join(ROOT, "data", "about.json"), encoding="utf-8"))
    f, t = a["week"]["from"], a["week"]["to"]
    rows = [r for r in d["items"] if r.get("s") == "낙찰" and f <= (r.get("d") or "") <= t and r.get("amt")]
    n = len(rows); tot = sum(r["amt"] for r in rows)
    small = [r for r in rows if r["amt"] < 1e8]
    byrg = Counter(r.get("rg") for r in rows if r.get("rg"))
    bycat = Counter(cat_of(r)[0] for r in rows if cat_of(r))
    big = sorted(rows, key=lambda r: -r["amt"])
    new = [r for r in rows if re.search(r"신축|건립|신설|증축", r["nm"])]
    school = [r for r in rows if re.search(r"학교|교육", r["nm"] + (r.get("dm") or ""))]
    wins = Counter(r.get("co") for r in rows if r.get("co"))
    multi = [(c, k) for c, k in wins.most_common(5) if k >= 2]
    md = lambda x: x[5:].replace("-", "/")
    P = []
    P.append(f"이번 주({md(f)}~{md(t)}) 나라장터 낙찰 공사 {n:,}건.\n합계 {eok(tot)}.\n\n근데 이 중 {len(small):,}건({round(len(small)*100/n)}%)이 1억 미만 현장이야.\n절반 넘는 현장이 1억 미만이야. 큰 현장만 보면 놓치는 게 많아.\n\n지역별로 정리해놨어\n{URL}")
    r0 = big[0]
    P.append(f"이번 주 제일 크게 낙찰된 현장.\n\n{r0['nm'][:40]}\n{r0.get('co','')} · 약 {eok(r0['amt'])}\n\n그 다음 4개는 {', '.join(eok(r['amt']) for r in big[1:5])}.\n한 주에 이런 일이 터져.\n{URL}")
    (rg1, c1), (rg2, c2), (rg3, c3) = byrg.most_common(3)
    P.append(f"이번 주 낙찰 제일 많이 터진 지역.\n\n1위 {rg1} {c1}건\n2위 {rg2} {c2}건\n3위 {rg3} {c3}건\n\n너네 동네는 몇 건이었을까\n{URL}")
    cs = bycat.most_common(4)
    P.append("이번 주 낙찰 공종별 건수.\n\n" + "\n".join(f"{k} {v}건" for k, v in cs) + f"\n\n자재·장비 파는 사람이면 어디가 내 시장인지 바로 보여.\n{URL}")
    if new:
        P.append(f"신축·건립·증축 공사만 추려보면 이번 주 {len(new)}건.\n\n신축·건립 공사는 지역별로 따로 모아볼 수 있어.\n현장별 낙찰 업체까지 정리해놨어\n{URL}")
    if school:
        P.append(f"학교·교육청 발주 공사가 이번 주 {len(school)}건.\n지역별로 어디서 났는지 정리해놨어.\n{URL}")
    if multi:
        c, k = multi[0]
        P.append(f"이번 주에 낙찰을 {k}번 받은 업체가 있어. {c}.\n\n업체별 낙찰 이력도 한 곳에 모아놨어.\n{URL}")
    P.append(f"영업 나가기 전에 아침마다 하는 일.\n나라장터 들어가서 어제 낙찰된 공사 찾기.\n\n그 시간 줄이려고 만들었어.\n매일 아침 새로 낙찰된 현장·업체가 정리돼서 메일로 와.\n{URL}")
    P.append(f"나라장터에 공개된 낙찰 데이터인데 일일이 찾으려면 진짜 오래 걸려.\n그래서 지역·공종별로 한 화면에 모아놨어.\n오늘도 새로 올라왔어.\n{URL}")
    P.append(f"지금까지 쌓인 낙찰 데이터 {a.get('n', 0):,}건.\n지역, 공종, 금액, 업체까지 전부 검색돼.\n건설 영업하는 사람들 이거 좀 써봐\n{URL}")
    out_txt = ("\n\n" + "-" * 30 + "\n\n").join(f"[{i}번]\n{p}" for i, p in enumerate(P, 1))
    open(out, "w", encoding="utf-8").write(out_txt + "\n")
    print(len(P), "개 →", out)
if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "promo_threads.txt")
