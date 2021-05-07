const NegativeSingleValue = require('./NegativeSingleValue');

class Attribute {
    constructor(value) {
        this.type = value.type === 'TEXT'? 'TEXT' : 'Attribute';
        this.lexeme = value.lexeme;
        this.literal = value.literal;
        this.begin = value.begin;
        this.end = value.end;
        if (value instanceof NegativeSingleValue) {
            this.begin = value.minus.end;
            this.operator = value.minus;
        }
        if (arguments[1] !== undefined) this.operator = arguments[1];
    }
}

module.exports = Attribute;