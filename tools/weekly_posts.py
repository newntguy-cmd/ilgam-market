"""지역방·카페·스레드에 올릴 '이번 주 ○○ 낙찰 현황' 글을 지역별로 뽑습니다 (사람이 복사해서 올립니다).

사용: python3 tools/weekly_posts.py [출력파일]   — 기본은 weekly_posts.txt
사실만 씁니다: 나라장터에 공개된 낙찰 건수·금액·공종·큰 현장. 할인·수익 약속은 쓰지 않습니다.
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


def eok(n):
    n = n / 1e8
    return f"{n:,.0f}억" if n >= 10 else f"{n:,.1f}억"


def main(out):
    d = json.load(open(os.path.join(ROOT, "data", "public.json"), encoding="utf-8"))
    a = json.load(open(os.path.join(ROOT, "data", "about.json"), encoding="utf-8"))
    f, t = a["week"]["from"], a["week"]["to"]
    rows = [r for r in d["items"] if r.get("s") == "낙찰" and f <= (r.get("d") or "") <= t]
    by = {}
    for r in rows:
        by.setdefault(r.get("rg") or "", []).append(r)
    posts = []
    for rg, rs in sorted(by.items(), key=lambda x: -len(x[1])):
        if not rg or len(rs) < 5:
            continue
        cats = Counter(cat_of(r)[0] for r in rs if cat_of(r))
        top = ", ".join(f"{k} {v}건" for k, v in cats.most_common(3))
        big = sorted([r for r in rs if r.get("amt")], key=lambda r: -r["amt"])[:3]
        lines = [f"[이번 주 {rg} 낙찰 현황] {f[5:].replace('-', '/')}~{t[5:].replace('-', '/')}",
                 f"낙찰 {len(rs):,}건, 합계 약 {eok(sum(r.get('amt') or 0 for r in rs))}"]
        if top:
            lines.append(f"많이 나온 공종: {top}")
        if big:
            lines.append("큰 현장")
            for i, r in enumerate(big, 1):
                lines.append(f"{i}. {r['nm'][:40]} · {r.get('co','')} · 약 {eok(r['amt'])}")
        lines.append(f"전체 현장과 업체: {SITE}/a/{quote(slug(rg))}/")
        lines.append("※ 나라장터 공개 자료이며, 일감마켓은 낙찰을 주관·시행하지 않는 정보서비스입니다.")
        posts.append("\n".join(lines))
    open(out, "w", encoding="utf-8").write(("\n\n" + "=" * 40 + "\n\n").join(posts) + "\n")
    print(len(posts), "개 지역 글 →", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "weekly_posts.txt")
