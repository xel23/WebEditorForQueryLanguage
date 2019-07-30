const operators = require('./operators');
const errorEx = require('./syntaxException');
const Token = require('./token');

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
                    if (this.tokens[this.tokens.length - 1].type === '-' || this.tokens[this.tokens.length - 1].type === '#') {
                        this.error("Unexpected token '" + this.tokens[this.tokens.length - 1].type +"':\n", this.tokens[this.tokens.length - 1].begin);
                    }
                    if (this.str[this.current - 2] !== ' ' && this.str[this.current - 1] !== '(') {
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
            case '-':  {
                if (this.current - 1 > 0) {
                    if (this.tokens[this.tokens.length - 1].type === '-' || this.tokens[this.tokens.length - 1].type === '#') {
                        this.error("Unexpected token '" + this.str[this.start] + "':\n", this.start);
                    }
                }
                this.addToken('-', '-', this.start, this.current);
            } break;
            case '#': {
                if (this.current - 1 > 0) {
                    if (this.tokens[this.tokens.length - 1].type === '#' || this.tokens[this.tokens.length - 1].type === '-') {
                        this.error("Unexpected token '" + this.str[this.start] +"':\n", this.start);
                    }
                }
                this.addToken('#', '#', this.start, this.current);
            } break;
            case '"': {
                this.addToken('"', '"', this.start, this.current);
                let cur =  this.stringQuote();
                this.addToken('QUOTED_TEXT', cur, this.start, this.current);
                this.addToken('"', '"', this.current - 1, this.current);
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
            case ',': this.addToken(',', ',', this.start, this.current); break; // ->>>
            case ' ':
            case '\t':
            case '\n':
            case '\r': {
                this.tokens[this.tokens.length - 1].end++;
                break;
            }
            default: {
                if (this.isAlphaNumeric(c)) {
                    this.identifier();
                }
                else {
                    this.error("Unexpected token:\n", this.current - 1);
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

    peek() {
        if (this.isAtEnd()) return '\0';
        return this.str[this.current];
    }

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
        return /[a-zA-Z_\-*?.]/.test(c);
    }

    identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();

        while(this.str[this.current] === ' ') {
            this.advance();
        }

        let curWord = this.str.substring(this.start, this.current);

        if (curWord.indexOf('..') !== -1) {
            let pos = this.start + curWord.indexOf('..');
            this.addToken('WORD', this.str.substring(this.start, pos)
                .replace(/ /g, ''), this.start, pos);
            let i = 0;
            while (this.str[pos + 2 + i] === ' ') i++;
            this.addToken('..', '..', pos, pos + 2 + i);
            if (this.str.substring(pos + 2, this.current).replace(/ /g, '') !== '') {
                this.addToken('WORD', this.str.substring(pos + 2, this.current)
                    .replace(/ /g, ''), pos + 2, this.current);
            }
        }
        else {
            this.addToken('WORD', this.str.substring(this.start, this.current)
                .replace(/ /g, ''), this.start, this.current);
        }
    }

    isAlphaNumeric(c) {
        return this.isDigit(c) || this.isAlpha(c);
    }

    error(message, n) {
        new errorEx(message, n, this.str);
    }
}

try {
    let t = new Lexer('test: t.. m');
    let res = t.scanTokens();
    console.log(res);
} catch(e) {
    console.log(e);
}

module.exports = Lexer;