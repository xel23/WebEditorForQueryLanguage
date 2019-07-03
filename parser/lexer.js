class Lexer {
    constructor(str) {
        this.str = str;
    }

    lexer() {
        let tokens = [];

        let isOperator = function (c) {
            return /[:;\^\$\.\|\?\*\+\(\)/]/.test(c);
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
                addToken('operator', c);
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

// single character tokens
const operators = Object.freeze({
    LEFT_PAREN: '(',
    RIGHT_PAREN: ')',
    LEFT_BRACE: '{',
    RIGHT_BRACE: '}',
    COMMA: '\,',
    DOT: '\.',
    MINUS: '-',
    PLUS: '\+',
    SEMICOLON: ';',
    STAR: '\*',
    // SLASH: '\/',
    BANG: '!',
    BANG_EQUAL: '!=',
    EQUAL: '=',
    EQUAL_EQUAL: '==',
    LESS: '<',
    LESS_EQUAL: '<=',
    GREATER: '>',
    GREATER_EQUAL: '>='
});

const keywords = Object.freeze({
    AND: 'and',
    IF: 'if',
    OR: 'or',
    FALSE: 'false',
    TRUE: 'true',
    PROJECT: 'project'
});

// one or two character tokens

module.exports = Lexer;