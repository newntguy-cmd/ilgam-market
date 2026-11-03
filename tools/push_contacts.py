"""법인 연락처를 Cloudflare D1(일감마켓 서버)에 올립니다. 매일 데이터 갱신 뒤에 실행됩니다.

환경변수 ADMIN_SECRET 이 없으면 아무것도 하지 않고 끝냅니다.
번호는 사이트 파일에 두지 않고 서버(D1)에만 두며, 가입한 사용자에게만 서버가 내려줍니다.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKER = os.environ.get("WORKER_URL", "https://ilgam-pay.newntguy.workers.dev")
SECRET = os.environ.get("ADMIN_SECRET", "").strip()
CHUNK = 400

if not SECRET:
    print("ADMIN_SECRET 이 없어 연락처 올리기를 건너뜁니다.")
    sys.exit(0)

d = json.load(open(os.path.join(ROOT, "data", "public.json"), encoding="utf-8"))
corp = d.get("corp") or {}
rows = [[b, (c.get("t") or "").strip(), (c.get("a") or "").strip()] for b, c in sorted(corp.items()) if len(b) == 10 and b.isdigit()]
print(f"올릴 연락처 {len(rows)}건")


def post(path, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(WORKER + path, data=data, method="POST" if data else "GET",
                                 headers={"X-Admin": SECRET, "Content-Type": "application/json", "User-Agent": "ilgam-market-bot/1.0"})
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except (urllib.error.URLError, OSError, ValueError) as e:
            last = e
            time.sleep(2 * (i + 1))
    raise last


sent = 0
for i in range(0, len(rows), CHUNK):
    r = post("/admin/contacts", {"rows": rows[i:i + CHUNK]})
    if not r.get("ok"):
        sys.exit(f"서버가 거절했습니다: {r}")
    sent += r.get("n", 0)
print(f"서버에 올림 {sent}건")
c = post("/admin/count")
print(f"서버 현황: 연락처 {c.get('contacts')}건, 가입 기록 {c.get('users')}명")
