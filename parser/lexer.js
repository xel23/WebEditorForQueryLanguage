let operators = require('./operators');
let symbols = require('./symbols');
let types = require('./types');

class Token {
    constructor(type, lexeme, literal) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        if (arguments[3] !== undefined) {
            this.begin = arguments[3];
            this.end = arguments[4];
        }
    }

    toString() {
        return this.type + " " + this.lexeme + " " + this.literal;
    }
}

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
            case '(': {
                if (this.current - 1 > 0) {
                    if (this.tokens[this.tokens.length - 1].type !== types.TUPLE_NAME && this.str[this.current - 2]
                        !== ' ' && this.str[this.current - 1] !== '(') {
                        let err = "";
                        for (let i = 0; i < this.current - 1; i++) err += " ";
                        this.error("Unexpected token:\n" + this.str + "\n" + err + "^");
                    }
                }
                this.addToken(operators.LEFT_PAREN, '('); break;
            }
            case ')': this.addToken(operators.RIGHT_PAREN); break;
            // case '{': this.addToken(types.STRING, this.string()); break;
            // case ',': this.addToken(symbols.COMMA); break;
            case ' ':
            case '\t':
            case '\n':
            case '\r': break;
            default: {
                if (!this.isAtEnd()) {
                    if (this.isDigit(c)) {
                        this.number();
                    } else if (this.isAlpha(c)) {
                        this.identifier();
                    }
                    else {
                        let err = "";
                        for (let i = 0; i < this.current - 1; i++) err += " ";
                        this.error("Unexpected token:\n" + this.str + "\n" + err + "^");
                    }
                }
                else {
                    let err = "";
                    for (let i = 0; i < this.current - 1; i++) err += " ";
                    this.error("Unexpected token:\n" + this.str + "\n" + err + "^");
                }
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

        else if (typeof arguments[1] === 'object' && !(arguments[2] !== undefined)){
            let text = this.str.substring(this.start - this.current);
            this.tokens.push(new Token(type, text, arguments[1]));
        }

        else if (arguments[2] !== undefined) {
            this.tokens.push(new Token(type, arguments[1].toString(), arguments[1], arguments[2], arguments[3]));
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

    string() {
        while (this.peek() !== '}' && !this.isAtEnd()) {
            this.advance();
        }

        if (this.isAtEnd()) {
            let err = "";
            for (let i = 0; i < this.current; i++) err += " ";
            this.error("SyntaxError: missing '}' after word list:\n" + this.str + "\n" + err + "^");
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

        while(this.str[this.current] === ' ') {
            this.advance();
        }

        if (this.str[this.current] === ':') {
            let fieldName = this.str.substring(this.start, this.current).replace(/ /g, '');
            this.addToken(types.FIELD_NAME, fieldName);

            this.advance();
            this.addToken(operators.COLON);

            let fieldValue = this.fieldValueIdentifier(this.current);

            this.addToken(types.FIELD_VALUE, fieldValue);
        }
        else if (this.str[this.current] === '(') {
            let cur = this.str.substring(this.start, this.current).replace(/ /g, '');

            if (cur.toUpperCase() in operators) {
                this.addToken(types.OPERATOR, cur, this.start, this.current - 1);
            }
            else {
                this.addToken(types.TUPLE_NAME, cur);
            }
            this.addToken(operators.LEFT_PAREN, '(');
            this.advance();
            this.start = this.current;
            this.scanToken();
        }
        else if (this.str.substring(this.start, this.current).replace(/ /g, '').toUpperCase() in operators) {
            this.addToken(types.OPERATOR, this.str.substring(this.start, this.current).replace(/ /g, ''), this.start, this.current - 1);
        }
        // else if (this.tokens[this.tokens.length - 1].type === symbols.COMMA) {
        //     this.addToken(types.FIELD_VALUE, this.str.substring(this.start, this.current).replace(/ /g, ''));
        // }
        else {
            let err = "";
            for (let i = 0; i < this.current; i++) err += " ";
            this.error("Unexpected token:\n" + this.str + "\n" + err + "^");
        }
    }

    fieldValueIdentifier() {
        this.start = this.current;
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

        if (this.start === this.current) {
            let err = "";
            for (let i = 0; i < this.current; i++) err += " ";
            this.error("Unexpected token:\n" + this.str + "\n" + err + "^");
        }

        return this.str.substring(this.start, this.current);
    }

    isAlphaNumeric(c) {
        return this.isDigit(c) || this.isAlpha(c);
    }

    error(message) {
        throw message;
    }
}

module.exports = Lexer;