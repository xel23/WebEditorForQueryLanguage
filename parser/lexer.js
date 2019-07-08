let operators = require('./operators');
let symbols = require('./symbols');
let types = require('./types');

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

// Below is new lexer for Hub query grammar
class Lexer {
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
            case '{': this.addToken(types.STRING, this.string()); break;
            case ',': this.addToken(symbols.COMMA); break;
            case ' ':
            case '\t':
            case '\n':
            case '\r': break;
            default: {
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    throw "Unexpected token ";
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

        this.advance();
        return this.str.substring(this.start + 1, this.current - 1);
    }

    isAlpha(c) {
        return /[a-zA-Z_\-]/.test(c);
    }

    identifier() {
        while (this.peek() === ' ' || this.peek() === '\t' || this.peek() === '\n' || this.peek() === '\r') {
            this.advance();
            this.start = this.current;
        }


        while (this.isAlphaNumeric(this.peek())) this.advance();

        if (this.str[this.current] === ':') {
            let fieldName = this.str.substring(this.start, this.current);
            this.addToken(types.FIELD_NAME, fieldName);

            this.advance();
            this.addToken(operators.COLON);

            let fieldValue = this.fieldValueIdentifier(this.current);

            this.addToken(types.FIELD_VALUE, fieldValue);
        }
        else if (this.str[this.current] === '(') {
            this.addToken(types.TUPLE_NAME, this.str.substring(this.start, this.current));
            this.advance();
            this.start = this.current;
            this.addToken(operators.LEFT_PAREN);
            this.scanToken();
        }
        else if (this.str.substring(this.start, this.current).toUpperCase() in operators) {
            this.addToken(types.OPERATOR, this.str.substring(this.start, this.current));
        }
        else {
            this.addToken(types.FIELD_VALUE, this.str.substring(this.start, this.current));
        }
    }

    fieldValueIdentifier() {
        while (this.peek() === ' ' || this.peek() === '\t' || this.peek() === '\n' || this.peek() === '\r') {
            this.advance();
            this.start = this.current;
        }

        let cur;
        if (this.peek() === '{') {
            cur = this.string();
            return cur;
        }

        while (this.isAlphaNumeric(this.peek())) this.advance();

        return this.str.substring(this.start, this.current);
    }

    isAlphaNumeric(c) {
        return this.isDigit(c) || this.isAlpha(c);
    }
}

module.exports = Lexer;