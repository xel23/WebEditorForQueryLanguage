const TermItem = require('./TermItem');

class PositiveSingleValue extends TermItem {
    constructor(lat, value) {
        super('PositiveSingleValue', value.begin, value.end);
        this.operator = lat;
        this.lexeme = value.lexeme;
        this.literal = value.literal;
    }
}

module.exports = PositiveSingleValue;