const operators = require('./const/operators');
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
        switch (true) {
            case /[(]/.test(c): {
                if (this.current - 1 > 0) {
                    if (this.tokens[this.tokens.length - 1].type === '-' ||
                        this.tokens[this.tokens.length - 1].type === '#' || (this.str[this.current - 2] !== ' ' &&
                            this.str[this.current - 1] !== '(')) {
                        this.identifier();
                    }
                }
                this.addToken(operators.LEFT_PAREN, '(', this.start, this.current); break;
            }
            case /[)]/.test(c): this.addToken(operators.RIGHT_PAREN, ')', this.start, this.current); break;
            case /[{]/.test(c): {
                let cur = this.stringBrace();
                this.addToken('COMPLEX_VALUE', cur, this.start, this.current);
                break;
            }
            case /[\-]/.test(c):  {
                if (this.current - 1 > 0) {
                    if (this.tokens[this.tokens.length - 1].type === '-' || this.tokens[this.tokens.length - 1].type === '#') {
                        this.identifier();
                    }
                }
                this.addToken('-', '-', this.start, this.current);
            } break;
            case /[#]/.test(c): {
                if (this.current - 1 > 0) {
                    if (this.tokens[this.tokens.length - 1].type === '#' || this.tokens[this.tokens.length - 1].type === '-') {
                        this.identifier();
                    }
                }
                this.addToken('#', '#', this.start, this.current);
            } break;
            case /["]/.test(c): {
                this.addToken('"', '"', this.start, this.current);
                let cur =  this.stringQuote();
                this.addToken('QUOTED_TEXT', cur, this.start, this.current);
                this.addToken('"', '"', this.current - 1, this.current);
                break;
            }
            case /[:]/.test(c): this.addToken(':', ':', this.start, this.current); break;
            case /[.]/.test(c): {
                if (this.str[this.current] === '.') {
                    this.advance();
                    this.addToken('..', '..', this.start, this.current);
                }
                else {
                    this.identifier();
                }
                break;
            }
            case /[,]/.test(c): this.addToken(',', ',', this.start, this.current); break;
            case /[\s]/.test(c): {
                if (this.tokens.length === 0) {
                    while (/[\s]/.test(this.str[this.current])) this.current++;
                    this.addToken('TEXT', this.str.substring(this.start, this.current), this.start, this.current);
                    break;
                }
                else
                    this.tokens[this.tokens.length - 1].end++;
                break;
            }
            default: {
                this.identifier();
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

    addToken(type, text, begin, end) {
        if (begin !== undefined) {
            this.tokens.push(new Token(type, text, text, begin, end));
        }

        else {
            this.tokens.push(new Token(type, text, text));
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

        this.advance();
        return this.str.substring(this.start + 1, this.current - 1);
    }

    stringQuote() {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            this.advance();
        }

        this.advance();
        return this.str.substring(this.start + 1, this.current - 1);
    }

    isAlpha(c) {
        return /[a-zA-Z_\-*?.]/.test(c);
    }

    isText(c) {
        if (c !== undefined && c !== '\0') {
            return !(/[\s:,(){}\-#."*?a-zA-Z_]/.test(c));
        }
        return false;
    }

    identifier() {
        if (this.isText(this.str[this.current - 1])) {
            while (this.isText(this.peek()) || this.isAlphaNumeric(this.peek())) this.advance();

            this.addToken('TEXT', this.str.substring(this.start, this.current), this.start, this.current);
        }
        else {
            while (this.isAlphaNumeric(this.peek())) this.advance();
            while(/[\s]/.test(this.str[this.current])) {
                this.advance();
            }

            let curWord = this.str.substring(this.start, this.current);

            if (curWord.indexOf('..') !== -1) {
                let pos = this.start + curWord.indexOf('..');
                this.addToken('WORD', this.str.substring(this.start, pos)
                    .replace(/[\s]/g, ''), this.start, pos);
                let i = 0;
                while (this.str[pos + 2 + i] === ' ') i++;
                this.addToken('..', '..', pos, pos + 2 + i);
                if (this.str.substring(pos + 2, this.current).replace(/[\s]/g, '') !== '') {
                    this.addToken('WORD', this.str.substring(pos + 2, this.current)
                        .replace(/[\s]/g, ''), pos + 2, this.current);
                }
            }
            else {
                this.addToken('WORD', this.str.substring(this.start, this.current)
                    .replace(/[\s]/g, ''), this.start, this.current);
            }
        }
    }

    isAlphaNumeric(c) {
        return this.isDigit(c) || this.isAlpha(c);
    }
}

module.exports = Lexer;