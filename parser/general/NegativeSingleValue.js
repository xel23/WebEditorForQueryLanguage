const TermItem = require('./TermItem');
const ValueRange = require('./ValueRange');

class NegativeSingleValue extends TermItem {
    constructor(minus, value) {
        super('NegativeSingleValue', value.begin, value.end);
        this.minus = minus;
        if (value instanceof ValueRange) {
            this.left_lexeme = value.leftVal.lexeme;
            this.left_lexeme_begin = value.leftVal.begin;
            this.left_lexeme_end = value.leftVal.end;
            this.left_literal = value.leftVal.literal;
            this.right_lexeme = value.rightVal.lexeme;
            this.right_lexeme_begin = value.rightVal.begin;
            this.right_lexeme_end = value.rightVal.end;
            this.right_literal = value.rightVal.literal;
            this.vr_operator = value.operator;
            this.begin = value.leftVal.begin;
            this.end = value.rightVal.end;
        }
        else {
            this.lexeme = value.lexeme;
            this.literal = value.literal;
        }
    }
}

module.exports = NegativeSingleValue;