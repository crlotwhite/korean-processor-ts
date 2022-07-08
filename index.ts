// 한국어 처리를 위한 상수 객체
const UniKR: {
    start: number,
    end: number,
    choSeong: readonly string[],
    jungSeong: readonly string[],
    jongSeong: readonly string[]
} = {
    start: 44032,
    end: 55203,
    choSeong: [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ',
        'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ',
        'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ],
    jungSeong: [
        'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ',
        'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ',
        'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
    ],
    jongSeong: [
        '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ',
        'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ',
        'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ',
        'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ]
};

// 한국어 문자 처리를 위한 클래스
class KRCH {
    choSeong: string;
    jungSeong: string;
    jongSeong: string | null;

    public constructor(ch: string, ju: string, jo: string | null) {
        this.choSeong = ch;
        this.jungSeong = ju;
        this.jongSeong = jo;
    }

    public getOrigins(): string[] {
        return [this.choSeong, this.jungSeong, this.jongSeong !== null ? this.jongSeong : ''];
    }
}

// 단 하나의 문자라도 한글이 아니면 false
function isKoreanWord(str: string) {
    for(let i=0;i<str.length;i++) {
        const unicode = str[i].charCodeAt(0);
        if (unicode < UniKR.start || unicode > UniKR.end) {
            return false;
        }
    }
    return true;
}

// 한국어 자음 모음 분리
function parseKorean(ch: string) {
    const unicode = ch.charCodeAt(0);

    const offset: number = unicode - UniKR.start;
    
    const indexOfChoSeong = Math.floor(offset / 588);
    const indexOfJungSeong = Math.floor((offset - (indexOfChoSeong * 588)) / 28);
    const indexOfJongSeong = Math.floor(offset % 28);

    return new KRCH(
        UniKR.choSeong[indexOfChoSeong],
        UniKR.jungSeong[indexOfJungSeong],
        indexOfJongSeong !== 0 ? UniKR.jongSeong[indexOfJongSeong] : null
    );
}

//음절의 끝소리 규칙
function syllableEndingRule(krchArray: KRCH[]) {
    krchArray.forEach((krch) => {
        let changed: string | null;
        switch(krch.jongSeong) {
            case 'ㄱ':
            case 'ㄲ':
            case 'ㅋ':
                changed = 'ㄱ';
                break;
            case 'ㄴ':
                changed = 'ㄴ';
                break;
            case 'ㄷ':
            case 'ㅌ':
            case 'ㅅ':
            case 'ㅆ':
            case 'ㅈ':
            case 'ㅊ':
            case 'ㅎ':
                changed = 'ㄷ';
                break;
            case 'ㄹ':
                changed = 'ㄹ';
                break;
            case 'ㅁ':
                changed = 'ㅁ';
                break;
            case 'ㅂ':
            case 'ㅍ':
                changed = 'ㅂ';
                break;
            case 'ㅇ':
                changed = 'ㅇ';
                break;
            default:
                changed = krch.jongSeong;
                break;
        }
        krch.jongSeong = changed;
    });
    
}

// 구개음화
function palatalization(krchArray: KRCH[]) {
    for (let i=0,j=1;j<krchArray.length;i++,j++) {
        // 두번째 중성이 ㅣ,ㅑ,ㅕ,ㅛ,ㅠ,ㅒ,ㅖ가 아니거나 종성이 있을 때, 생략 
        if (
            (krchArray[j].jungSeong !== 'ㅣ' 
            && krchArray[j].jungSeong !== 'ㅑ'
            && krchArray[j].jungSeong !== 'ㅕ'
            && krchArray[j].jungSeong !== 'ㅛ'
            && krchArray[j].jungSeong !== 'ㅠ'
            && krchArray[j].jungSeong !== 'ㅒ'
            && krchArray[j].jungSeong !== 'ㅖ')
            && krchArray[j].jongSeong !== ''
        ) continue;
            

        switch(krchArray[i].jongSeong) {
            case 'ㄷ':
                switch(krchArray[j].choSeong) {
                    case 'ㅇ':
                        krchArray[i].jongSeong = '';
                        krchArray[j].choSeong = 'ㅈ';
                        break;
                    case 'ㅎ':
                        krchArray[i].jongSeong = '';
                        krchArray[j].choSeong = 'ㅊ';
                        break;
                }
                break;
            case 'ㅌ':
                krchArray[i].jongSeong = '';
                krchArray[j].choSeong = 'ㅊ';
                break;
            case 'ㄾ':
                krchArray[i].jongSeong = 'ㄹ';
                krchArray[j].choSeong = 'ㅊ';
                break;
        }
    }
    
    
}

// 전체 처리 과정
/**
 * 파이프라인 히스토리
 * 1. 음절 끝소리 규칙을 먼저 적용하면 다음의 문제 발생
 * - 볕이 -> 볃이 -> 벼지
 * - 하지만 올바른 발음은 벼치임.
 * => 결론: 구개음화 -> 끝소리규칙
 */
function pipe(words: string) {
    // 한글이 아닌 문자가 포함된 경우
    if (!isKoreanWord(words)) {
        return false;
    }

    // 모든 문자를 초성, 중성, 종성으로 분리하고 배열로 변환
    let krchArray: KRCH[] = [];
    for (let i=0;i<words.length;i++) {
        let res = parseKorean(words[i]);
        krchArray.push(res);
    }

    // 구개음화
    palatalization(krchArray);

    // 음절의 끝소리 규칙
    syllableEndingRule(krchArray);

    // 테스트를 위한 출력 코드
    krchArray.forEach((value) => {
        console.log(value.getOrigins().toString());
    })
    
}


function main() {
    pipe('서브도메인쓸수있는유일한무료프로젝트였는데이게이렇게되네굳이볕이');
}

main();