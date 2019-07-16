let operators = require('./operators');
let errorEx = require('./syntaxException');
let types = require('./types');
let Token = require('./token');

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
                        this.error("Unexpected token:\n", this.current);
                    }
                }
                this.addToken(operators.LEFT_PAREN, '(', this.start, this.current); break;
            }
            case ')': this.addToken(operators.RIGHT_PAREN, ')', this.start, this.current); break;
            case '{': {
                let cur = this.stringBrace();
                this.addToken('COMPLEX_VALUE', cur, this.start, this.current);
                break;
            }
            case '\-': this.addToken('\-', '\-', this.start, this.current); break;
            case '#': this.addToken('#', '#', this.start, this.current); break;
            case '"': {
                let cur =  this.stringQuote();
                this.addToken('QUOTED_TEXT', cur, this.start, this.current);
                break;
            }
            case ':': this.addToken(':', ':', this.start, this.current); break;
            case '.': {
                if (this.str[this.current] !== '.') {
                    this.error("Unexpected token:\n", this.current - 1);
                } else {
                    this.advance();
                    this.addToken('..', '..', this.start, this.current);
                }
                break;
            }
            // case '*': this.addToken('*', '*', this.start, this.current); break;
            case ',': this.addToken(''); break; // ->>>
            case ' ':
            case '\t':
            case '\n':
            case '\r': break;
            default: {
                if (!this.isAtEnd()) {
                    if (this.isAlphaNumeric(c)) {
                        this.identifier();
                    }
                    else {
                        this.error("Unexpected token switch1:\n", this.current - 1);
                    }
                }
                else {
                    this.error("Unexpected token switch2:\n",this.current - 1);
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

    isDigit(c) {
        return /[\d]/.test(c);
    };

    // number() {
    //     while (this.isDigit(this.peek())) this.advance();
    //     if (this.peek() === '.' && this.isDigit(this.peekNext())) {
    //         this.advance();
    //
    //         while (this.isDigit(this.peek())) this.advance();
    //     }
    //     this.addToken('NUMBER', parseFloat(this.str.substring(this.start, this.current)), this.start, this.current);
    // }

    peek() {
        if (this.isAtEnd()) return '\0';
        return this.str[this.current];
    }

    // peekNext() {
    //     if (this.current + 1 >= this.str.length) return '\0';
    //     return this.str[this.current + 1];
    // }

    stringBrace() {
        while (this.peek() !== '}' && !this.isAtEnd()) {
            this.advance();
        }

        if (this.isAtEnd()) {
            this.error("SyntaxError: missing '}':\n", this.current);
        }

        this.advance();
        return this.str.substring(this.start + 1, this.current - 1);
    }

    stringQuote() {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            this.advance();
        }

        if (this.isAtEnd()) {
            this.error("SyntaxError: missing '\"':\n", this.current);
        }

        this.advance();
        return this.str.substring(this.start + 1, this.current - 1);
    }

    isAlpha(c) {
        return /[a-zA-Z_\-*?]/.test(c);
    }

    identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();

        while(this.str[this.current] === ' ') {
            this.advance();
        }

        // if (this.str[this.current] === ':') {
        //     let fieldName = this.str.substring(this.start, this.current).replace(/ /g, '');
        //     this.addToken(types.FIELD_NAME, fieldName, this.start, this.current);
        //
        //     this.advance();
        //     this.addToken(operators.COLON, ':', this.tokens[this.tokens.length - 1].end, this.current);
        //
        //     let fieldValue = this.fieldValueIdentifier(this.current);
        //
        //     this.addToken(types.FIELD_VALUE, fieldValue, this.start, this.current);
        // }
        // else if (this.str[this.current] === '(') {
        //     let cur = this.str.substring(this.start, this.current).replace(/ /g, '');
        //
        //     if (cur.toUpperCase() in operators) {
        //         this.addToken(types.OPERATOR, cur, this.start, this.current);
        //     }
        //     else {
        //         this.addToken(types.TUPLE_NAME, cur, this.start, this.current);
        //     }
        //     this.addToken(operators.LEFT_PAREN, '(', this.tokens[this.tokens.length - 1].end, this.current + 1);
        //     this.advance();
        //     this.start = this.current;
        //     this.scanToken();
        // }
        // else if (this.str.substring(this.start, this.current).replace(/ /g, '').toUpperCase() in operators) {
        //     this.addToken(types.OPERATOR, this.str.substring(this.start, this.current).replace(/ /g, ''), this.start, this.current - 1);
        // }
        // else {
        //     this.error("Unexpected token identifier:\n", this.start);
        // }

        this.addToken('WORD', this.str.substring(this.start, this.current).replace(/ /g, ''), this.start, this.current);
    }

    // fieldValueIdentifier() {
    //     this.start = this.current;
    //     while (this.peek() === ' ' || this.peek() === '\t' || this.peek() === '\n' || this.peek() === '\r') {
    //         this.advance();
    //         this.start = this.current;
    //     }
    //
    //     let cur;
    //     if (this.peek() === '{') {
    //         cur = this.stringBrace();
    //         return cur;
    //     }
    //
    //     while (this.isAlphaNumeric(this.peek())) this.advance();
    //
    //     if (this.start === this.current) {
    //         this.error("Unexpected token fieldValueIdentifier:\n", this.start);
    //     }
    //
    //     return this.str.substring(this.start, this.current);
    // }

    isAlphaNumeric(c) {
        return this.isDigit(c) || this.isAlpha(c);
    }

    error(message, n) {
        new errorEx(message, n, this.str);
    }
}

module.exports = Lexer;

// try {
//     let t = new Lexer(' #bug by: yarko -minor -normal');
//     let res = t.scanTokens();
//     console.log(res);
// } catch (e) {
//     console.log(e);
// }