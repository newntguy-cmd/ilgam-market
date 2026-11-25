"""업체 페이지와 지역 페이지가 같이 쓰는 머리글·바닥글."""
from hdr import header as _hdr
import re as _re
def band(s):
    """제목(h1)과 요약(.sum)을 남색 상단 띠로 감싸 모든 목록 페이지가 같은 모양이 되게 합니다."""
    return _re.sub(r'(<h1>.*?</h1>\s*<p class="sum">.*?</p>)', r'<div class="pgband">\1</div>', s, count=1, flags=_re.S)
HEADER = _hdr('낙찰정보')
FOOTER = '<footer><div class="wrap"><p>일감마켓에서 결제가 이루어지는 것은 일감 마스터 이용권(정보 이용료)뿐입니다. 낙찰정보는 공공데이터를 가공해 보여 주는 단순 기업 정보 제공이며, 낙찰·계약과 직거래장터 거래에 대한 결제는 사이트에서 발생하지 않고 PG를 사용하지 않습니다. 이용권 외의 거래·매출에서 생기는 대금·세금·분쟁의 책임은 해당 거래 당사자에게 있으며, 일감마켓은 거래 당사자가 아닙니다.</p><p>데이터 출처 조달청 나라장터 · 공공데이터포털. 공공데이터를 가공해 제공하며 정확성과 완전성을 보장하지 않습니다.</p><p><a href="/#biz">사업자 정보</a> (겟잇타운 · 사업자등록번호 594-06-03620 · 통신판매업 신고번호 제2026-용인기흥-01348호) · 문의 <a href="mailto:help@ilgammarket.co.kr">help@ilgammarket.co.kr</a> · <a href="/market/policy.html">이용약관</a> · <a href="/pro.html">일감 마스터</a> · <a href="/market/policy.html#refund">환불규정</a> · <a href="/market/policy.html#privacy">개인정보처리방침</a></p></div></footer>'
SCRIPTS = '<script type="module" src="/auth.js"></script><script src="/c.js?v=3" defer></script><script src="/submenu.js?v=5" defer></script><script src="/acc.js?v=2" defer></script><script src="/tabbar.js?v=6" defer></script><script src="/cs.js?v=9zG" defer></script><script src="/ga.js" defer></script>'
