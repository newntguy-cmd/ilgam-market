"""전 페이지 공통 머리글(메뉴) 생성기. 메뉴 6개·가입/로그인 자리를 모든 페이지에서 똑같이 정적으로 넣어
페이지를 옮겨도 메뉴 위치·크기가 바뀌지 않고, 스크립트가 뒤늦게 끼워 넣지 않게 합니다."""
import re

SVG = {
 '회사소개': '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>',
 '낙찰정보': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
 '직거래장터': '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
 '관심업체': '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
 '매입의 신': '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
 '고객센터': '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-2 2.5-5 2.5"/>',
}
TITLE = {
 '회사소개': '일감마켓이 시작된 이야기', '낙찰정보': '방금 낙찰된 현장과 업체', '직거래장터': '내 물건 팔고, 필요한 물품 견적받기',
 '관심업체': '담아 둔 업체의 새 낙찰 알림', '매입의 신': '냉난방기·에어컨·사무집기 매입을 일감마켓에서 검토합니다', '고객센터': '문의와 자주 묻는 질문',
}
ORDER = ['회사소개', '낙찰정보', '직거래장터', '관심업체', '매입의 신', '고객센터']

def header(active='', base='/'):
    """base: 사이트 루트까지의 경로('/' 또는 시장 페이지용 '../')."""
    href = {'회사소개': base + '#home', '낙찰정보': base + '#win', '직거래장터': base + 'market/' if base == '/' else './',
            '관심업체': base + '#wl', '매입의 신': base + 'buy.html', '고객센터': base + 'help.html'}
    out = []
    for n in ORDER:
        extra = ' data-buy="buy"' if n == '매입의 신' else (' data-cs="1"' if n == '고객센터' else '')
        cur = ' aria-current="true"' if n == active else ''
        out.append('<a href="%s"%s%s title="%s"><span class="em" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true">%s</svg></span>%s</a>'
                   % (href[n], cur, extra, TITLE[n], SVG[n], n))
    acc = ('<div class="acc" id="acc"><button type="button" id="tjn" class="jn">가입하기</button><button type="button" id="tme">로그인</button></div>'
           "<script>try{if(localStorage.getItem('ig_me')){document.getElementById('tme').textContent='내 계정';document.getElementById('tjn').hidden=true}}catch(e){}</script>")
    return ('<header class="top"><div class="wrap"><a class="brand" href="%s" aria-label="일감마켓"><span class="logo"><i></i><i></i><i></i><i></i></span></a>'
            '<nav class="gnb" aria-label="메뉴">%s</nav>%s</div></header>' % (base, ''.join(out), acc))

def patch(path, active, base='/'):
    s = open(path, encoding='utf-8').read()
    new, n = re.subn(r'<header class="top">.*?</header>', lambda m: header(active, base), s, count=1, flags=re.S)
    assert n == 1, path
    open(path, 'w', encoding='utf-8').write(new)

if __name__ == '__main__':
    patch('buy.html', '매입의 신'); patch('help.html', '고객센터'); patch('pro.html', '')
    patch('receipt.html', ''); patch('pay-result.html', '')
    patch('market/index.html', '직거래장터', '../')
    print('ok')
