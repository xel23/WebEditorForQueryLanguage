const TermItem = require('./TermItem');
const SortAttribute = require('./SortAttribute');

class Sort extends TermItem {
    constructor(sortBy, operator, value) {
        super('Sort', sortBy.begin, value.end);
        this.key = sortBy;
        this.key.type = 'key';
        this.operator = operator;
        this.value = [];
        if (arguments[3] !== undefined) {
            this.value.push(new SortAttribute(value, arguments[3]));
            this.end = arguments[3].end;
        }
        else {
            this.value.push(new SortAttribute(value));
        }
    }

    addValue(token, comma) {
        this.value.push(comma);
        if (arguments[2] !== undefined) {
            this.value.push(new SortAttribute(token, arguments[2]));
            this.end = arguments[2].end;
        }
        else {
            this.value.push(new SortAttribute(token));
            this.end = token.end;
        }
    }
}

module.exports = Sort;