// check for unary operators and other operators

let operators = require('./operators');

class Lexer {
    constructor(str) {
        this.str = str;
        this.start = 0;
        this.current = 0;
        this.tokens = [];
    }

    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(operators.EOF, "", null));
        return this.tokens;
    }

    scanToken() {
        let c = this.advance();
            switch (c) {
                case '(': this.addToken(operators.LEFT_PAREN); break;
                case ')': this.addToken(operators.RIGHT_PAREN); break;
                case '{': this.addToken(operators.LEFT_BRACE); break;
                case '}': this.addToken(operators.RIGHT_BRACE); break;
                case '\,': this.addToken(operators.COMMA); break;
                case '\.': this.addToken(operators.DOT); break;
                case '-': this.addToken(operators.MINUS); break;
                case '\+': this.addToken(operators.PLUS); break;
                case ';': this.addToken(operators.SEMICOLON); break;
                case '\*': this.addToken(operators.STAR); break;
                case '\/': this.addToken(operators.SLASH); break;
                case '!': this.addToken(this.match('=') ? operators.BANG_EQUAL : operators.BANG); break;
                case '=': this.addToken(this.match('=') ? operators.EQUAL_EQUAL : operators.EQUAL); break;
                case '<': this.addToken(this.match('=') ? operators.LESS_EQUAL : operators.LESS); break;
                case '>': this.addToken(this.match('=') ? operators.GREATER_EQUAL :
                    operators.GREATER); break;
                case ':': this.addToken(operators.COLON); break;
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
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance();

            while (this.isDigit(this.peek())) this.advance();
        }
        this.addToken('NUMBER', parseFloat(this.str.substring(this.start, this.current)));
    }

    peek() {
        if (this.isAtEnd()) return '\0';
        return this.str[this.current];
    }

    peekNext() {
        if (this.current + 1 >= this.str.length) return '\0';
        return this.str[this.current + 1];
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

const keywords = Object.freeze({
    AND: 'and', // 1
    IF: 'if', // 2
    OR: 'or', // 3
    FALSE: 'false', // 4
    TRUE: 'true', // 5
    PROJECT: 'project' // 6
});

module.exports = Lexer;