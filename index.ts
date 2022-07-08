// 한국어 처리를 위한 상수 객체
const UniKR: {
    start: number,
    end: number,
    choSeong: readonly string[],
    jungSeong: readonly string[],
    jongSeong: readonly string[],
    postpositions: readonly string[]
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
    ],
    postpositions: [
        '이', '가', // 행위주격
        '으로써', '로써', // 도구격
        '에서', '에게서', '부터', // 원천격
        '까지', // 도달격
        '에게', '한테', '께', // 수혜격
        '와', '과', // 동반격
        '에서', // 처소격
        '을', '를', // 목적격
        '의', // 소유격
        '으로서', '로서', // 위격
        '으로', '로', // 향격
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

    public mergeOrigin(): string {
        const unicodeOfJungSeong = this.jungSeong.charCodeAt(0);

        const consonantStart = 12623;

        const indexOfChoSeong = UniKR.choSeong.indexOf(this.choSeong);
        const indexOfJungSeong = unicodeOfJungSeong - consonantStart;
        const indexOfJongSeong = this.jongSeong !== null ? UniKR.jongSeong.indexOf(this.jongSeong) : 0;

        return String.fromCharCode(
            UniKR.start + (indexOfChoSeong * 588) + (indexOfJungSeong * 28) + indexOfJongSeong
        );
    }
}

// 단 하나의 문자라도 한글이 아니면 false
function isKoreanWord(str: string) {
    for (let i=0;i<str.length;i++) {
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

// 조사 체크
function isPostposition(word: string) {
    return UniKR.postpositions.indexOf(word) !== -1 ? true : false;

}

//음절의 끝소리 규칙
function syllableEndingRule(krchArray: KRCH[]) {
    krchArray.forEach((krch) => {
        let changed: string | null;
        switch (krch.jongSeong) {
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
            

        switch (krchArray[i].jongSeong) {
            case 'ㄷ':
                switch (krchArray[j].choSeong) {
                    case 'ㅇ':
                        krchArray[i].jongSeong = null;
                        krchArray[j].choSeong = 'ㅈ';
                        break;
                    case 'ㅎ':
                        krchArray[i].jongSeong = null;
                        krchArray[j].choSeong = 'ㅊ';
                        break;
                }
                break;
            case 'ㅌ':
                krchArray[i].jongSeong = null;
                krchArray[j].choSeong = 'ㅊ';
                break;
            case 'ㄾ':
                krchArray[i].jongSeong = 'ㄹ';
                krchArray[j].choSeong = 'ㅊ';
                break;
        }
    }
}

// 경음화 (된소리되기)
function tensification(krchArray: KRCH[]) {
    for (let i=0,j=1;j<krchArray.length;i++,j++) {
        switch (krchArray[i].jongSeong) {
            case 'ㄱ':
            case 'ㄷ':
            case 'ㅂ':
            case 'ㄹ':
            case 'ㄴ':
            case 'ㅁ':
                switch (krchArray[j].choSeong) {
                    case 'ㄱ':
                        krchArray[j].choSeong = 'ㄲ';
                        break;
                    case 'ㄷ':
                        krchArray[j].choSeong = 'ㄸ';
                        break;
                    case 'ㅂ':
                        krchArray[j].choSeong = 'ㅃ';
                        break;
                    case 'ㅅ':
                        krchArray[j].choSeong = 'ㅆ';
                        break;
                    case 'ㅈ':
                        krchArray[j].choSeong = 'ㅉ';
                        break;
                }
                break;
        }
    }
}

// 격음화
function aspiration(krchArray: KRCH[]) {
    for (let i=0, j=1;j<krchArray.length;i++,j++) {
        if (krchArray[j].choSeong === 'ㅎ') {
            switch (krchArray[i].jongSeong) {
                case 'ㄱ':
                    krchArray[i].jongSeong = null;
                    krchArray[j].choSeong = 'ㅋ';
                    break;
                case 'ㄷ':
                    krchArray[i].jongSeong = null;
                    krchArray[j].choSeong = 'ㅌ';
                    break;
                case 'ㅂ':
                    krchArray[i].jongSeong = null;
                    krchArray[j].choSeong = 'ㅍ';
                    break;
                case 'ㅈ':
                    krchArray[i].jongSeong = null;
                    krchArray[j].choSeong = 'ㅊ';
                    break;
                case 'ㄲ':
                    krchArray[i].jongSeong = 'ㄱ';
                    krchArray[j].choSeong = 'ㅋ';
                    break;
                case 'ㄵ':
                    krchArray[i].jongSeong = 'ㄴ';
                    krchArray[j].choSeong = 'ㅊ';
                    break;
                case 'ㄺ':
                    krchArray[i].jongSeong = 'ㄹ';
                    krchArray[j].choSeong = 'ㅋ';
                    break;
                case 'ㄼ':
                    krchArray[i].jongSeong = 'ㄹ';
                    krchArray[j].choSeong = 'ㅍ';
                    break;
            }
        } else if (
            krchArray[i].jongSeong === 'ㅎ' 
            || krchArray[i].jongSeong === 'ㄶ' 
            || krchArray[i].jongSeong === 'ㅀ'
        ) {
            switch (krchArray[j].choSeong) {
                case 'ㄱ':
                    krchArray[j].choSeong = 'ㅋ';
                    break;
                case 'ㄷ':
                    krchArray[j].choSeong = 'ㅌ';
                    break;
                case 'ㅂ':
                    krchArray[j].choSeong = 'ㅍ';
                    break;
                case 'ㅈ':
                    krchArray[j].choSeong = 'ㅊ';
                    break;
            }
            switch (krchArray[i].jongSeong) {
                case 'ㅎ':
                    krchArray[i].jongSeong = null;
                    break;
                case 'ㄶ':
                    krchArray[i].jongSeong = 'ㄴ';
                    break;
                case 'ㅀ':
                    krchArray[i].jongSeong = 'ㄹ';
                    break;
            }
        }
        
    }
}

// ㄴ 첨가
function nAddition(krchArray: KRCH[]) {
    for (let i=0,j=1;j<krchArray.length;i++,j++) {
        if (
            krchArray[i].jongSeong !== null 
            && krchArray[j].choSeong === 'ㅇ'
            && (
                krchArray[j].jungSeong === 'ㅣ'
                || krchArray[j].jungSeong === 'ㅑ'
                || krchArray[j].jungSeong === 'ㅕ'
                || krchArray[j].jungSeong === 'ㅛ'
                || krchArray[j].jungSeong === 'ㅠ'
            )
        ) {
            krchArray[j].choSeong = 'ㄴ';
        }
    }
}

// 자음군 단순화
function simplification(krchArray: KRCH[]) {
    for (let i=0,j=1;j<krchArray.length;i++,j++) {
        // 예외 단어 1. 밟다, 넓다 등등
        switch (krchArray[i].mergeOrigin()) {
            case '밟':
                krchArray[i].jongSeong = 'ㅂ';
                continue;
            case '넓':
                switch (krchArray[j].mergeOrigin()) {
                    case '다':
                    case '둥':
                    case '적':
                    case '죽':
                        krchArray[i].jongSeong = 'ㅂ';
                }
                continue;
        }

        // 예외 단어 2. ㄺ 예외, ㄱ앞에서 ㄹ이 됨.
        if (krchArray[i].jongSeong === 'ㄺ' && krchArray[j].choSeong === 'ㄱ') {
            krchArray[i].jongSeong = 'ㄹ';
            continue;
        }

        
        // 일반
        switch (krchArray[i].jongSeong) {
            case 'ㄳ':
                krchArray[i].jongSeong = 'ㄱ';
                break;
            case 'ㄵ':
            case 'ㄶ':
                krchArray[i].jongSeong = 'ㄴ';
                break;
            case 'ㄼ':
            case 'ㄽ':
            case 'ㄾ':
            case 'ㅀ':
                krchArray[i].jongSeong = 'ㄹ';
                break;
            case 'ㅄ':
                krchArray[i].jongSeong = 'ㅂ';
                // 없이 와 같은 예외 단어 처리
                if (krchArray[j].choSeong === 'ㅇ') {
                    krchArray[j].choSeong = 'ㅅ';
                }
                break;
            case 'ㄺ':
                krchArray[i].jongSeong = 'ㄱ';
                break;
            case 'ㄻ':
                krchArray[i].jongSeong = 'ㅁ';
                break;
            case 'ㄿ':
                krchArray[i].jongSeong = 'ㅍ';
                break;
        }
    }
}

function cascading(krchArray: KRCH[]) {
    for (let i=0,j=1;j<krchArray.length;i++,j++) {
        if (krchArray[i].jongSeong !== null && krchArray[j].choSeong === 'ㅇ') {
            krchArray[j].choSeong = krchArray[i].jongSeong!;
            krchArray[i].jongSeong = null;
        }
    }
}

// 전체 처리 과정
/*
 * 파이프라인 히스토리
 * 1. 음절 끝소리 규칙을 먼저 적용하면 다음의 문제 발생
 * - 볕이 -> 볃이 -> 벼지
 * - 하지만 올바른 발음은 벼치임.
 * => 결론: 구개음화 -> 끝소리규칙
 * 2. 음절 끝소리 규칙으로 인해 ㅎ이 변해서 격음화가 작동 않함
 * - 이렇게 -> 이럳게 -> 이럳께
 * - 하지만 올바른 발음은 이러케임.
 * => 결론: 구개음화 이후, 끝소리규칙 이전에 동작함.
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

    // 자음군 단순화
    simplification(krchArray);

    // 격음화
    aspiration(krchArray);

    // 음절의 끝소리 규칙
    syllableEndingRule(krchArray);

    // 경음화
    tensification(krchArray);

    // ㄴ첨가
    nAddition(krchArray);

    // 연음
    cascading(krchArray);

    // 테스트를 위한 출력 코드
//     krchArray.forEach((value) => {
//         console.log(value.mergeOrigin());
//     })
    let result = '';
    krchArray.forEach((krch) => {
        result += krch.mergeOrigin();
    });
    return result;
}

// function main() {
//     pipe('서브도메인쓸수있는유일한무료프로젝트였는데이게이렇게되네굳이볕이안고신지담다솜이불맨입');
// }

// main();