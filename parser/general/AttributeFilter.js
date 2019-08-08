const ValueRange = require('./ValueRange');
const NegativeSingleValue = require('./NegativeSingleValue');
const types = require('../const/types');

class AttributeFilter {
    constructor(value) {
        if (value instanceof ValueRange) {
            this.type = 'ValueRange';
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
        else if (value instanceof NegativeSingleValue) {
            this.type = value.type;
            this.operator = value.minus;
            if (value.left_lexeme !== undefined) {
                this.left_lexeme = value.left_lexeme;
                this.left_lexeme_begin = value.left_lexeme_begin;
                this.left_lexeme_end = value.left_lexeme_end;
                this.left_literal = value.left_literal;
                this.right_lexeme = value.right_lexeme;
                this.right_lexeme_begin = value.right_lexeme_begin;
                this.right_lexeme_end = value.right_lexeme_end;
                this.right_literal = value.right_literal;
                this.vr_operator = value.vr_operator;
                this.begin = value.begin;
                this.end = value.end;
            }
            else {
                this.lexeme = value.lexeme;
                this.literal = value.literal;
                this.begin = value.begin;
                this.end = value.end;
            }
        }
        else {
            this.type = value.type === 'WORD' ? 'Value' : value.type;
            if (value.type === types.TEXT) {
                this.type = types.TEXT;
            }
            this.lexeme = value.lexeme;
            this.literal = value.literal;
            this.begin = value.begin;
            this.end = value.end;
        }
    }
}

module.exports = AttributeFilter;