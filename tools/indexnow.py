"""검색엔진(네이버·빙 등)에 새로 만든/바뀐 페이지 주소를 직접 알립니다 (IndexNow).
기본: 직전 커밋에서 바뀐 페이지만. ALL=1 이면 사이트맵 전체."""
import json, os, re, subprocess, sys, time, urllib.request, glob
HOST = "ilgammarket.co.kr"
KEY = next((os.path.basename(f)[:-4] for f in glob.glob("*.txt") if re.fullmatch(r"[0-9a-f]{32}\.txt", os.path.basename(f))), None)
if not KEY: sys.exit("키 파일 없음")

def from_sitemaps():
    urls = []
    for f in sorted(glob.glob("sitemap-*.xml")):
        urls += re.findall(r"<loc>([^<]+)</loc>", open(f, encoding="utf-8").read())
    return urls

def from_git():
    out = subprocess.run(["git", "diff", "--name-only", "HEAD~1", "HEAD"], capture_output=True, text=True).stdout.split()
    urls = []
    for p in out:
        m = re.match(r"^((?:c|a|o|b)(?:/[^/]+)*)/index\.html$", p) or re.match(r"^(b)/index\.html$", p)
        if m: urls.append("https://%s/%s/" % (HOST, m.group(1)))
        elif p == "index.html": urls.append("https://%s/" % HOST)
    return urls

urls = from_sitemaps() if os.environ.get("ALL") == "1" else from_git()
urls = list(dict.fromkeys(urls))
print("보낼 주소", len(urls))
if not urls: sys.exit(0)
for ep in ("https://searchadvisor.naver.com/indexnow", "https://api.indexnow.org/indexnow"):
    for i in range(0, len(urls), 10000):
        body = json.dumps({"host": HOST, "key": KEY, "keyLocation": "https://%s/%s.txt" % (HOST, KEY), "urlList": urls[i:i + 10000]}).encode()
        req = urllib.request.Request(ep, body, {"Content-Type": "application/json; charset=utf-8"})
        try:
            r = urllib.request.urlopen(req, timeout=60); print(ep, i, r.status)
        except Exception as e:
            print(ep, i, "오류", getattr(e, "code", e))
