#!/usr/bin/env python3
"""data/public.json 에서 최근 8일치(주간 보기가 날짜 경계로 하루 더 걸쳐도 모자라지 않게)만 뽑아 data/recent.json 을 만듭니다.
첫 화면이 이 가벼운 파일로 먼저 뜨고, 전체(public.json)는 화면이 뜬 뒤 뒤에서 받습니다."""
import json, os, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(ROOT, "data", "public.json"), encoding="utf-8"))
items = d.get("items") or []
mx = max((r.get("d") or "" for r in items), default="")
if mx:
    frm = (datetime.date.fromisoformat(mx) - datetime.timedelta(days=7)).isoformat()
    bz = {}
    for r in items:                      # 업체명 → 사업자번호 (최근 건에 번호가 빠져 있어도 화면이 같은 결과를 내도록)
        if r.get("co") and r.get("b") and r["co"] not in bz:
            bz[r["co"]] = r["b"]
    sub = []
    for r in items:
        if (r.get("d") or "") >= frm:
            r = dict(r)
            if not r.get("b") and r.get("co") in bz:
                r["b"] = bz[r["co"]]
            sub.append(r)
    out = {k: v for k, v in d.items() if k != "items"}
    out["items"] = sub
    out["partial"] = True
    json.dump(out, open(os.path.join(ROOT, "data", "recent.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("recent.json", len(sub), "건 /", len(items), "건")
