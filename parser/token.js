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

module.exports = Token;