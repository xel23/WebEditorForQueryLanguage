const TermItem = require('./TermItem');

class NegativeText extends TermItem {
    constructor(minus, qt) {
        super('NegativeText', minus.begin, qt.end);
        this.minus = minus;
        this.text = qt;
    }
}

module.exports = NegativeText;