let operators = require('./operators');
let symbols = require('./symbols');
let types = require('./types');

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







// Below is new lexer for Hub query grammar

class NewLexer {
    constructor(str) {
        this.str = str;
        this.start = 0;
        this.current = 0;
        this.tokens = [];
    }

    // ok
    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(operators.EOF, "", null));
        return this.tokens;
    }

    // need to change
    // not name
    scanToken() {
        let c = this.advance();
        switch (c) {
            case '(': this.addToken(operators.LEFT_PAREN); break;
            case ')': this.addToken(operators.RIGHT_PAREN); break;
            case '{': this.string(); break;
            case ',': this.addToken(symbols.COMMA); break;
            case 'a': {
                // TO DO: check 'a' character for all words
                break;
            }
            case 'n': {
                // TO DO: check 'n' character for all words
                break;
            }
            case 'o': {
                // TO DO: check 'o' character for all words
                break;
            }
            default: {
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    throw "Unexpected token";
                }
            }
        }
    }

    // ok
    isAtEnd() {
        return this.current >= this.str.length;
    }

    // ok
    advance() {
        this.current++;
        return this.str[this.current - 1];
    }

    // need to change
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

    // ok
    match(expected) {
        if (this.isAtEnd()) return false;
        if (this.str[this.current] !== expected) return false;

        this.current++;
        return true;
    }

    // ok
    isDigit(c) {
        return /[\d]/.test(c);
    };

    // ok
    number() {
        while (this.isDigit(this.peek())) this.advance();
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance();

            while (this.isDigit(this.peek())) this.advance();
        }
        this.addToken('NUMBER', parseFloat(this.str.substring(this.start, this.current)));
    }

    // ok
    peek() {
        if (this.isAtEnd()) return '\0';
        return this.str[this.current];
    }

    // ok
    peekNext() {
        if (this.current + 1 >= this.str.length) return '\0';
        return this.str[this.current + 1];
    }

    string() {
        while (this.peek() !== '}' && !this.isAtEnd()) {
            this.advance();
        }

        if (this.isAtEnd()) {
            throw "Unterminated string";
        }

        this.addToken(types.STRING, this.str.substring(this.start + 1, this.current - 1));

        this.advance();
    }

    isAlpha(c) {
        return /[a-zA-Z_]/.test(c);
    }

    identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();

        // this.addToken(types.IDENTIFIER, this.str.substring(this.start, this.current));

        // if identifier is a keyword
        let text = this.str.substring(this.start, this.current);

    }

    isAlphaNumeric(c) {
        return this.isDigit(c) || this.isAlpha(c);
    }
}