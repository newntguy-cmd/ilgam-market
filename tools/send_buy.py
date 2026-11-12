"""매입문의 접수분을 담당자 메일로 보냅니다. 15분마다 실행됩니다.

서버(D1)에 쌓인 미발송 접수를 가져와 메일 한 통씩 보내고, 보낸 건은 발송 완료로 표시합니다.
환경변수: ADMIN_SECRET, SMTP_USER, SMTP_PASS (이미 알림 메일에 쓰는 값), BUY_TO(선택, 기본 help@ilgammarket.co.kr)
"""
import html
import json
import os
import smtplib
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from email.header import Header
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import base64
from email.utils import formataddr

WORKER = os.environ.get("WORKER_URL", "https://ilgam-pay.newntguy.workers.dev")
SECRET = os.environ.get("ADMIN_SECRET", "").strip()
FROM = "help@ilgammarket.co.kr"
TO = os.environ.get("BUY_TO", "").strip() or FROM

if not (SECRET and os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS")):
    print("ADMIN_SECRET / SMTP 값이 없어 건너뜁니다.")
    sys.exit(0)


def call(path, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(WORKER + path, data=data, method="POST" if data else "GET",
                                 headers={"X-Admin": SECRET, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


rows = call("/admin/buy-pending").get("rows") or []
print(f"미발송 매입문의 {len(rows)}건")
if not rows:
    sys.exit(0)

smtp = smtplib.SMTP("smtp.gmail.com", 587, timeout=30)
smtp.starttls()
smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
done = []
KST = timezone(timedelta(hours=9))
for r in rows:
    tel = r["tel"]
    shown = f"{tel[:3]}-{tel[3:-4]}-{tel[-4:]}" if len(tel) >= 9 else tel
    when = datetime.fromtimestamp(r["ts"] / 1000, KST).strftime("%m월 %d일 %H:%M")
    kind = "사무집기 문의" if r.get("kind") == "ask" else "매입문의"
    lines = [("구분", kind), ("분류", r.get("cat") or ""), ("물건", r["item"]), ("상태", r["state"]), ("지역", r["area"]), ("성함", r["name"]), ("전화", shown), ("전하는 말", r["memo"])]
    body = "\n".join(f"{k}: {v}" for k, v in lines if v) + f"\n\n접수 {when} · 일감마켓 {kind}"
    m = MIMEMultipart()
    m.attach(MIMEText(body, "plain", "utf-8"))
    for k in range(3):
        try:
            im = call(f"/admin/buy-img?id={r['id']}&i={k}")
        except Exception:
            break
        if not im.get("ok"):
            break
        part = MIMEImage(base64.b64decode(im["data"]), "jpeg")
        part.add_header("Content-Disposition", "attachment", filename=f"photo{k + 1}.jpg")
        m.attach(part)
    m["Subject"] = Header(f"[{kind}] {r['item'][:40]} · {r['name']} {shown}", "utf-8")
    m["From"] = formataddr(("일감마켓 매입문의", FROM))
    m["To"] = TO
    try:
        smtp.sendmail(FROM, [TO], m.as_string())
        done.append(r["id"])
    except Exception as e:  # 한 건 실패해도 나머지는 계속
        print("발송 실패", r["id"], type(e).__name__)
smtp.quit()
if done:
    call("/admin/buy-sent", {"ids": done})
print(f"발송 {len(done)}건")
