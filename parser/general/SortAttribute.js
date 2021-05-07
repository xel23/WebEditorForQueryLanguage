class SortAttribute {
    constructor(value) {
        this.type = value.type;
        this.lexeme = value.lexeme;
        this.literal = value.literal;
        this.begin = value.begin;
        this.end = value.end;
        if (arguments[1] !== undefined) {
            this.order = arguments[1];
        }
    }
}

module.exports = SortAttribute;