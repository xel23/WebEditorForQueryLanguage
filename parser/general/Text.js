const TermItem = require('./TermItem');

class Text extends TermItem {
    constructor(token) {
        super('TEXT', token.begin, token.end);
        this.lexeme = token.lexeme;
        this.literal = token.literal;
    }
}

module.exports = Text;