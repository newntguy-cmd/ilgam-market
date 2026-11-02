#!/usr/bin/env python3
"""관심 업체 새 낙찰 이메일 알림.
매일 아침 데이터 갱신 뒤 실행합니다. 필요한 비밀값이 없으면 조용히 건너뜁니다.
환경변수: FB_BOT_EMAIL, FB_BOT_PASSWORD (알림 발송 계정), SMTP_USER, SMTP_PASS (Gmail 앱 비밀번호)
"""
import json, os, sys, smtplib, html, urllib.request, urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

API_KEY = "AIzaSyC7txkoe-zROxqJ5rrbHsdDTuHrFrAy450"
PROJECT = "sanup-jangter"
SITE = "https://ilgammarket.co.kr"
FROM = "help@ilgammarket.co.kr"
DOCS = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"
H = {"Referer": SITE + "/", "Content-Type": "application/json"}

def need(*k):
    return all(os.environ.get(x) for x in k)

def call(url, body=None, method=None, headers=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
                                 headers=headers or H, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read() or b"null")

def money(n):
    if not n: return "-"
    e = n / 1e8
    return (f"{e:.0f}" if e >= 100 else f"{e:.1f}") + "억" if e >= 1 else f"{round(n/1e4):,}만"

def by_rg_new(items, regs, last, test):
    return [r for r in items if r.get("rg") in regs and (test or (r.get("d") or "") > last)]

def build(rows, total=None):
    total = total or len(rows)
    cards = ""
    for r in rows:
        cards += (f'<tr><td style="padding:14px 20px;border-bottom:1px solid #e3e7ed">'
                  f'<div style="font-size:16px;font-weight:700;color:#0f2342">{html.escape(r["co"])}</div>'
                  f'<div style="font-size:14px;color:#46556d;margin-top:4px">{html.escape(r["nm"])}</div>'
                  f'<div style="font-size:13px;color:#6b788e;margin-top:4px">{html.escape(r.get("rg") or "")} · {html.escape(r.get("d") or "")} · '
                  f'<b style="color:#0f2342">{money(r.get("amt"))}</b></div></td></tr>')
    return f"""<div style="background:#eef0f3;padding:24px 12px;font-family:'Malgun Gothic',Apple SD Gothic Neo,sans-serif">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;border-collapse:collapse">
<tr><td style="background:#0f2342;padding:18px 20px;border-bottom:3px solid #c9a45c;color:#fff;font-size:18px;font-weight:700">일감마켓 <span style="font-weight:400;font-size:13px;color:#aebbd1">새 낙찰 알림</span></td></tr>
<tr><td style="padding:18px 20px 6px;font-size:15px;color:#0f2342">담아 두신 업체와 지역에 새 낙찰 <b>{total}건</b>이 있습니다.{f' 금액이 큰 순서로 {len(rows)}건만 보여 드립니다.' if total > len(rows) else ''}</td></tr>
{cards}
<tr><td style="padding:20px;text-align:center"><a href="{SITE}/#wl" style="display:inline-block;padding:12px 22px;background:#c9a45c;color:#0f2342;font-weight:700;text-decoration:none;border-radius:4px">일감마켓에서 보기</a></td></tr>
<tr><td style="padding:16px 20px;background:#f8f9fb;font-size:12px;color:#6b788e;line-height:1.6">이 메일은 일감마켓에서 알림을 켜 두셔서 보내 드렸습니다. 받고 싶지 않으시면 {SITE}/#wl 에서 로그인 후 알림을 끄시거나 {FROM} 으로 알려 주세요.<br>겟잇타운 · 대표 신상헌 · 통신판매업 신고 완료</td></tr>
</table></div>"""

def main():
    if not need("FB_BOT_EMAIL", "FB_BOT_PASSWORD", "SMTP_USER", "SMTP_PASS"):
        print("알림 비밀값이 아직 없어 건너뜁니다."); return
    data = json.load(open("data/public.json", encoding="utf-8"))
    items = data.get("items", [])
    max_d = max((r.get("d") or "" for r in items), default="")
    by_co = {}
    for r in items:
        by_co.setdefault(r["co"], []).append(r)

    tok = call(f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}",
               {"email": os.environ["FB_BOT_EMAIL"], "password": os.environ["FB_BOT_PASSWORD"], "returnSecureToken": True})["idToken"]
    auth = dict(H, Authorization="Bearer " + tok)
    res = call(f"{DOCS}:runQuery", {"structuredQuery": {"from": [{"collectionId": "watch"}],
               "where": {"fieldFilter": {"field": {"fieldPath": "notify"}, "op": "EQUAL", "value": {"booleanValue": True}}}}}, headers=auth)
    docs = [x["document"] for x in res if "document" in x]
    print("알림 대상", len(docs), "명, 기준일", max_d)

    smtp = smtplib.SMTP("smtp.gmail.com", 587, timeout=30); smtp.starttls()
    smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
    sent = 0
    for d in docs:
        f = d["fields"]
        email = f.get("email", {}).get("stringValue", "")
        allc = [v.get("stringValue", "") for v in f.get("cos", {}).get("arrayValue", {}).get("values", [])]
        cos = [c for c in allc if not c.startswith("@지역:")]
        regs = {c[4:] for c in allc if c.startswith("@지역:")}   # 지역 알림은 같은 목록에 '@지역:이름'으로 저장됩니다
        last = f.get("lastSent", {}).get("stringValue", "")
        if not last:
            # 처음이면 가입(수정)일 기준으로, 그 전 낙찰은 보내지 않습니다.
            last = (f.get("updatedAt", {}).get("timestampValue", "") or "")[:10]
            # UTC → KST 하루 차이를 고려해 하루 전으로 잡습니다.
            try:
                import datetime
                last = (datetime.date.fromisoformat(last) - datetime.timedelta(days=1)).isoformat()
            except Exception:
                last = max_d
        test = os.path.exists("tools/alert_test.flag")   # 시험용: 기준일을 무시하고 최근 낙찰 몇 건을 보냅니다
        rows = [r for c in cos for r in by_co.get(c, []) if test or (r.get("d") or "") > last]
        if regs:
            rows += [r for r in by_rg_new(items, regs, last, test)]
        seen_ids, uniq_rows = set(), []
        for r in rows:                       # 업체와 지역이 겹치는 낙찰은 한 번만 보냅니다
            if r["id"] in seen_ids: continue
            seen_ids.add(r["id"]); uniq_rows.append(r)
        rows = uniq_rows
        if test: rows = sorted(rows, key=lambda r: r.get("d") or "", reverse=True)[:3]
        rows.sort(key=lambda r: (r.get("d") or "", r.get("amt") or 0), reverse=True)
        total = len(rows)
        if email and rows:
            m = MIMEMultipart("alternative")
            m["Subject"] = f"[일감마켓] 새 낙찰 {total}건"
            m["From"] = formataddr(("일감마켓", FROM)); m["To"] = email
            m["List-Unsubscribe"] = f"<mailto:{FROM}?subject=알림해제>"
            m.attach(MIMEText(f"관심 업체·지역에 새 낙찰 {total}건이 있습니다. {SITE}/#wl", "plain", "utf-8"))
            show = rows if total <= 30 else sorted(rows, key=lambda r: r.get("amt") or 0, reverse=True)[:30]
            m.attach(MIMEText(build(show, total), "html", "utf-8"))
            try:
                smtp.sendmail(FROM, [email], m.as_string()); sent += 1
            except Exception as e:
                print("발송 실패", type(e).__name__); continue
        if not test and max_d and max_d != f.get("lastSent", {}).get("stringValue", ""):
            try:
                call(f"https://firestore.googleapis.com/v1/{d['name']}?updateMask.fieldPaths=lastSent",
                     {"fields": {"lastSent": {"stringValue": max_d}}}, method="PATCH", headers=auth)
            except Exception as e:
                print("기록 실패", type(e).__name__)
    smtp.quit()
    print("발송", sent, "통")

if __name__ == "__main__":
    try: main()
    except urllib.error.HTTPError as e:
        print("HTTP 오류", e.code, e.read()[:200]); sys.exit(0)   # 알림 실패가 데이터 갱신을 막지 않게 합니다
