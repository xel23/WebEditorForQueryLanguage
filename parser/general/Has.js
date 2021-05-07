const TermItem = require('./TermItem');
const Attribute = require('./Attribute');

class Has extends TermItem {
    constructor(has, operator, value) {
        super('Has', has.begin, value.end);
        this.key = has;
        this.key.type = 'key';
        this.operator = operator;
        this.value = [];
        if (arguments[3] !== undefined) {
            this.value.push(new Attribute(value, arguments[3]));
        }
        else {
            this.value.push(new Attribute(value));
        }
    }

    addAttribute(token, comma) {
        this.value.push(comma);
        this.value.push(new Attribute(token));
        this.end = token.end;
    }
}

module.exports = Has;