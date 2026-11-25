"""네이버 블로그용 '지역별 낙찰 현황' 글을 뽑습니다 (사람이 복사해서 올립니다).

사용: python3 tools/weekly_blog.py [출력파일] [지역수]   — 기본은 블로그_발행분.txt, 상위 4개 지역
사실만 씁니다: 나라장터에 공개된 낙찰 건수·금액·공종·큰 현장. 수익·할인 약속은 쓰지 않습니다.
"""
import json
import os
import sys
from collections import Counter
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_areas import cat_of, slug  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://ilgammarket.co.kr"
LEGAL = "※ 일감마켓은 나라장터에 공개된 자료를 정리해 보여 드리는 정보 서비스이며, 낙찰이나 계약의 당사자가 아닙니다."


def eok(n):
    n = n / 1e8
    return f"{n:,.0f}억 원" if n >= 10 else f"{n:,.1f}억 원"


def md(s):
    return s[5:].replace("-", "/")


def main(out, topn):
    d = json.load(open(os.path.join(ROOT, "data", "public.json"), encoding="utf-8"))
    a = json.load(open(os.path.join(ROOT, "data", "about.json"), encoding="utf-8"))
    f, t = a["week"]["from"], a["week"]["to"]
    rows = [r for r in d["items"] if r.get("s") == "낙찰" and f <= (r.get("d") or "") <= t]
    amt = lambda r: r.get("amt") or 0  # noqa: E731
    small = sum(1 for r in rows if amt(r) < 1e8)
    by = {}
    for r in rows:
        by.setdefault(r.get("rg") or "", []).append(r)
    ranked = sorted(((k, v) for k, v in by.items() if k and len(v) >= 5), key=lambda x: -len(x[1]))
    rk = ", ".join(f"{k} {len(v):,}건" for k, v in ranked[:5])
    cats = Counter(cat_of(r)[0] for r in rows if cat_of(r))
    ck = ", ".join(f"{k} {v:,}건" for k, v in cats.most_common(4))

    posts = []
    posts.append(f"""■ 제목: {md(f)}~{md(t)} 전국 공공 공사 낙찰 {len(rows):,}건 — 지역별·공종별로 정리했습니다

한 주(%s~%s) 동안 나라장터에서 낙찰된 공사·용역은 %s건, 합계 약 %s이었습니다.

지역별로는 %s 순이었습니다.
공종별로는 %s이 많았습니다.

낙찰 %s건 가운데 %s건(%d%%)이 1억 원 미만이었습니다.

일감마켓(ilgammarket.co.kr)에서는 이 자료를 지역·공종별로 걸러 볼 수 있고, 매일 아침 새 낙찰로 갱신됩니다. 관심 업체를 담아 두면 그 업체가 새로 낙찰받았을 때 메일로 알려 드립니다.

업체별 낙찰 이력을 모아 보는 '일감 마스터'는 30일 49,900원(부가세 포함, 자동 재결제 없음)입니다.

지역별 전체 현장과 업체
%s/a/

%s

#나라장터 #낙찰정보 #공공공사 #건설영업 #영업리스트 #일감마켓""" % (
        md(f), md(t), f"{len(rows):,}", eok(sum(amt(r) for r in rows)), rk, ck,
        f"{len(rows):,}", f"{small:,}", round(small * 100 / len(rows)), SITE, LEGAL))

    for rg, rs in ranked[:topn]:
        c = Counter(cat_of(r)[0] for r in rs if cat_of(r))
        ctop = ", ".join(f"{k} {v}건" for k, v in c.most_common(3))
        big = sorted([r for r in rs if amt(r)], key=lambda r: -amt(r))[:3]
        sm = sum(1 for r in rs if amt(r) < 1e8)
        lines = "\n".join(f"{i}. {r['nm'][:44]} — {r.get('co','')} (약 {eok(amt(r))})" for i, r in enumerate(big, 1))
        posts.append(f"""■ 제목: {rg} 낙찰 현황 {md(f)}~{md(t)} — {len(rs):,}건, 큰 현장은 어디였을까

{rg}에서는 한 주 동안 {len(rs):,}건이 낙찰됐고, 합계는 약 {eok(sum(amt(r) for r in rs))}입니다.
공종별로는 {ctop} 순이었고, {sm:,}건은 1억 원 미만의 작은 현장이었습니다.

금액이 큰 현장은 이랬습니다.
{lines}

{rg}의 전체 낙찰 현장과 업체는 아래에서 시군구·공종별로 걸러 보실 수 있습니다.
{SITE}/a/{quote(slug(rg))}/

{LEGAL}

#{rg}낙찰 #나라장터 #낙찰정보 #공공공사 #{rg}건설 #일감마켓""")
    open(out, "w", encoding="utf-8").write(("\n\n" + "=" * 50 + "\n\n").join(posts) + "\n")
    print(len(posts), "개 글 →", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "블로그_발행분.txt", int(sys.argv[2]) if len(sys.argv) > 2 else 4)
