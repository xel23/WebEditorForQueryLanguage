class Lexer {
    constructor(str) {
        this.str = str;
    }

    lexer() {
        let tokens = [];

        let isOperator = function (c) {
            return /[:;\^\$\.\|\?\*\+\(\)/-=!]/.test(c);
        };

        let isWhiteSpace = function (c) {
            return /[\s\t\r\n]/.test(c);
        };

        let isSymbol = function (c) {
            return typeof c === "undefined" ? false : /[a-zA-Z_0-9]/.test(c);
        };

        let isDigit = function (c) {
            return /[\d]/.test(c);
        };

        let addToken = function (type, value) {
            tokens.push({
                type: type,
                value: value
            })
        };

        let c, i = 0;

        let advance = function () {
            return c = this.str[++i];
        };

        while (i < this.str.length) {
            c = this.str[i];
            if (isWhiteSpace(c)) {
                advance.bind(this)();
            }

            else if (isDigit(c)) {
                let num = c;
                while (isDigit(advance.bind(this)())) {
                    num += c;
                }

                num = parseFloat(num);

                addToken('number', num);
            }

            else if (isSymbol(c)) {
                let word = c;
                while (isSymbol(advance.bind(this)())) {
                    word += c;
                }

                addToken('word', word);
            }

            else if (isOperator(c)) {
                switch (c) {
                    case '(': addToken(Object.keys(operators)[0], operators.LEFT_PAREN); break;
                    case ')': addToken(Object.keys(operators)[1], operators.RIGHT_PAREN); break;
                    case '{': addToken(Object.keys(operators)[2], operators.LEFT_BRACE); break;
                    case '}': addToken(Object.keys(operators)[3], operators.RIGHT_BRACE); break;
                    case '\,': addToken(Object.keys(operators)[4], operators.COMMA); break;
                    case '\.': addToken(Object.keys(operators)[5], operators.DOT); break;
                    case '-': addToken(Object.keys(operators)[6], operators.MINUS); break;
                    case '\+': addToken(Object.keys(operators)[7], operators.PLUS); break;
                    case ';': addToken(Object.keys(operators)[8], operators.SEMICOLON); break;
                    case '\*': addToken(Object.keys(operators)[9], operators.STAR); break;
                    case '\/': addToken(Object.keys(operators)[10], operators.SLASH); break;
                    case '!': {
                        if (advance.bind(this)() === '=') {
                            addToken(Object.keys(operators)[12], operators.BANG_EQUAL);
                        }
                        else {
                            addToken(Object.keys(operators)[11], operators.BANG);
                            i--;
                        }
                        break;
                    }
                    case '=': addToken(Object.keys(operators)[13], operators.EQUAL); break;
                    case '<': {
                        if ( advance.bind(this)() === '=') {
                            addToken(Object.keys(operators)[16], operators.LESS_EQUAL);
                        }
                        else {
                            addToken(Object.keys(operators)[15], operators.LESS);
                            i--;
                        }
                        break;
                    }
                    case '>': {
                        if (advance.bind(this)() === '=') {
                            addToken(Object.keys(operators)[18], operators.GREATER_EQUAL);
                        }
                        else {
                            addToken(Object.keys(operators)[17], operators.GREATER);
                            i--;
                        }
                        break;
                    }
                    case ':': addToken(Object.keys(operators)[19], operators.COLON); break;
                }
                advance.bind(this)();
            }
            else {
                throw "Unrecognized token";
            }
        }

        addToken('(end)');
        return tokens;
    }
}

const operators = Object.freeze({
    LEFT_PAREN: '(',     // 0
    RIGHT_PAREN: ')',    // 1
    LEFT_BRACE: '{',     // 2
    RIGHT_BRACE: '}',    // 3
    COMMA: '\,',         // 4
    DOT: '\.',           // 5
    MINUS: '-',          // 6
    PLUS: '\+',          // 7
    SEMICOLON: ';',      // 8
    STAR: '\*',          // 9
    SLASH: '\/',         // 10
    BANG: '!',           // 11
    BANG_EQUAL: '!=',    // 12
    EQUAL: '=',          // 13
    EQUAL_EQUAL: '==',   // 14
    LESS: '<',           // 15
    LESS_EQUAL: '<=',    // 16
    GREATER: '>',        // 17
    GREATER_EQUAL: '>=', // 18
    COLON: ':'           // 19
});

const keywords = Object.freeze({
    AND: 'and',
    IF: 'if',
    OR: 'or',
    FALSE: 'false',
    TRUE: 'true',
    PROJECT: 'project'
});

module.exports = Lexer;