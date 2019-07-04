class Lexer {
    constructor(str) {
        this.str = str;
        this.start = 0;
        this.current = 0;
        this.tokens = [];
    }

    // lexer() {
    //     let isOperator = function (c) {
    //         return /[:;\^\$\.\|\?\*\+\(\)/\-=!]/.test(c);
    //     };
    //
    //     let isWhiteSpace = function (c) {
    //         return /[\s\t\r\n]/.test(c);
    //     };
    //
    //     let isSymbol = function (c) {
    //         return typeof c === "undefined" ? false : /[a-zA-Z_0-9]/.test(c);
    //     };
    //
    //     let isDigit = function (c) {
    //         return /[\d]/.test(c);
    //     };
    //
    //     let addToken = function (type, value) {
    //         this.tokens.push({
    //             type: type,
    //             value: value
    //         })
    //     };
    //
    //     let c, i = 0;
    //
    //     let advance = function () {
    //         return c = this.str[++i];
    //     };
    //
    //     while (i < this.str.length) {
    //         c = this.str[i];
    //         if (isWhiteSpace(c)) {
    //             advance.bind(this)();
    //         }
    //
    //         else if (isDigit(c)) {
    //             let num = c;
    //             while (isDigit(advance.bind(this)())) {
    //                 num += c;
    //             }
    //
    //             num = parseFloat(num);
    //
    //             addToken('number', num);
    //         }
    //
    //         else if (isSymbol(c)) {
    //             let word = c;
    //             while (isSymbol(advance.bind(this)())) {
    //                 word += c;
    //             }
    //
    //             addToken('word', word);
    //         }
    //
    //         else if (isOperator(c)) {
    //             switch (c) {
    //                 case '(': addToken(Object.keys(operators)[0], operators.LEFT_PAREN); break;
    //                 case ')': addToken(Object.keys(operators)[1], operators.RIGHT_PAREN); break;
    //                 case '{': addToken(Object.keys(operators)[2], operators.LEFT_BRACE); break;
    //                 case '}': addToken(Object.keys(operators)[3], operators.RIGHT_BRACE); break;
    //                 case '\,': addToken(Object.keys(operators)[4], operators.COMMA); break;
    //                 case '\.': addToken(Object.keys(operators)[5], operators.DOT); break;
    //                 case '-': addToken(Object.keys(operators)[6], operators.MINUS); break;
    //                 case '\+': addToken(Object.keys(operators)[7], operators.PLUS); break;
    //                 case ';': addToken(Object.keys(operators)[8], operators.SEMICOLON); break;
    //                 case '\*': addToken(Object.keys(operators)[9], operators.STAR); break;
    //                 case '\/': addToken(Object.keys(operators)[10], operators.SLASH); break;
    //                 case '!': {
    //                     if (advance.bind(this)() === '=') {
    //                         addToken(Object.keys(operators)[12], operators.BANG_EQUAL);
    //                     }
    //                     else {
    //                         addToken(Object.keys(operators)[11], operators.BANG);
    //                         i--;
    //                     }
    //                     break;
    //                 }
    //                 case '=': addToken(Object.keys(operators)[13], operators.EQUAL); break;
    //                 case '<': {
    //                     if ( advance.bind(this)() === '=') {
    //                         addToken(Object.keys(operators)[16], operators.LESS_EQUAL);
    //                     }
    //                     else {
    //                         addToken(Object.keys(operators)[15], operators.LESS);
    //                         i--;
    //                     }
    //                     break;
    //                 }
    //                 case '>': {
    //                     if (advance.bind(this)() === '=') {
    //                         addToken(Object.keys(operators)[18], operators.GREATER_EQUAL);
    //                     }
    //                     else {
    //                         addToken(Object.keys(operators)[17], operators.GREATER);
    //                         i--;
    //                     }
    //                     break;
    //                 }
    //                 case ':': addToken(Object.keys(operators)[19], operators.COLON); break;
    //             }
    //             advance.bind(this)();
    //         }
    //         else {
    //             throw "Unrecognized token";
    //         }
    //     }
    //
    //     addToken('(end)');
    //     return this.tokens;
    // }

    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanTokens();
        }

        this.tokens.push(new Token(operators.EOF, "", null));
        return this.tokens;
    }

    scanToken() {
        let c = this.advance();
        // if (isOperator(c)) {
            switch (c) {
                case '(': this.addToken(Object.keys(operators)[0]); break;
                case ')': this.addToken(Object.keys(operators)[1]); break;
                case '{': this.addToken(Object.keys(operators)[2]); break;
                case '}': this.addToken(Object.keys(operators)[3]); break;
                case '\,': this.addToken(Object.keys(operators)[4]); break;
                case '\.': this.addToken(Object.keys(operators)[5]); break;
                case '-': this.addToken(Object.keys(operators)[6]); break;
                case '\+': this.addToken(Object.keys(operators)[7]); break;
                case ';': this.addToken(Object.keys(operators)[8]); break;
                case '\*': this.addToken(Object.keys(operators)[9]); break;
                case '\/': this.addToken(Object.keys(operators)[10]); break;
                case '!': this.addToken(this.match('=') ? Object.keys(operators)[12] :
                    Object.keys(operators)[11]); break;
                case '=': this.addToken(this.match('=') ? Object.keys(operators)[14] :
                    Object.keys(operators)[13]); break;
                case '<': this.addToken(this.match('=') ? Object.keys(operators)[16] :
                    Object.keys(operators)[15]); break;
                case '>': this.addToken(this.match('=') ? Object.keys(operators)[18] :
                    Object.keys(operators)[17]); break;
                case ':': this.addToken(Object.keys(operators)[19]); break;
                case ' ':
                case '\r':
                case '\t':
                case '\n': break;
                default: if (this.isDigit(c)) {
                    this.number();
                } else {
                    throw 'Unexpected token';
                }
            }
            // advance.bind(this)();
        // }
        // else {
        //     throw "Unrecognized token";
        // }
    }

    isAtEnd() {
        return this.current >= this.str.length;
    }

    advance() {
        this.current++;
        return this.str[this.current - 1];
    }

    addToken(type) {
        if (arguments[1] === undefined) {
            this.tokens.push(new Token(type, null));
        }

        else if (typeof arguments[1] === 'object'){
            let text = this.str.substring(this.start - this.current);
            this.tokens.push(new Token(type, text, arguments[1]));
        }

        else {
            this.tokens.push(new Token(type, arguments[1].toString(), arguments[1]));
        }

    }

    match(expected) {
        if (this.isAtEnd()) return false;
        if (this.str[this.current] !== expected) return false;

        this.current++;
        return true;
    }

    isDigit(c) {
        return /[\d]/.test(c);
    };

    number() {
        while (this.isDigit(this.peek())) this.advance();
        this.addToken('NUMBER', parseFloat(this.str.substring(this.start, this.current)));
    }

    peek() {
        if (this.isAtEnd()) return '\0';
        return this.str[this.current];
    }
}

class Token {
    constructor(type, lexeme, literal) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
    }

    toString() {
        return this.type + " " + this.lexeme + " " + this.literal;
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
    COLON: ':',          // 19
    EOF: '(end)'         // 20
});

const keywords = Object.freeze({
    AND: 'and', // 1
    IF: 'if', // 2
    OR: 'or', // 3
    FALSE: 'false', // 4
    TRUE: 'true', // 5
    PROJECT: 'project' // 6
});

module.exports = Lexer;