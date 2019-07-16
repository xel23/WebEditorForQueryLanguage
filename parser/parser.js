let lexer = require('./lexer');
let operators = require('./operators');
let types = require('./types');
let errorEx = require('./syntaxException');
let Token = require('./token');
let singleWordHelper = require('./singleWordHelper');
let doubleWordHelper = require('./doubleWordHelper');
let timeTracking = require('./timeTracking');
let sortAttribute = require('./sortAttribute');
let customField = require('./customField');
let keyword = require('./keyword');
let issueAttribute = require('./issueAttribute');
let issueLink = require('./issueLink');

class Binary {
    constructor(left, operator, right) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

class Unary {
    constructor(operator, right) {
        this.operator = operator;
        this.right = right;
    }
}

class Grouping {
    constructor(left, expr, right) {
        this.left = left;
        this.expr = expr;
        this.right = right;
    }
}

class TermItem {
    constructor () {}
}

class QuotedText extends TermItem {
    constructor(leftQuote, text, rightQoute) {
        super();
        this.leftQuote = leftQuote;
        this.text = text;
        this.rightQoute = rightQoute;
    }
}

class NegativeText extends TermItem {
    constructor(minus, leftQuote, text, rightQoute) {
        super();
        this.minus = minus;
        this.text = new QuotedText(leftQuote, text, rightQoute);
    }
}

class Value extends TermItem {
    constructor(value) {
        super();
        this.value = value;
    }
}

class SingleValue extends Value {
    constructor(value) {
        super(value);
    }
}

class PositiveSingleValue extends TermItem {
    constructor(lat, value) {
        super();
        this.lat = lat;
        this.value = new SingleValue(value);
    }
}

class NegativeSingleValue extends TermItem {
    constructor(minus, value) {
        super();
        this.minus = minus;
        this.value = new SingleValue(value);
    }
}

class ValueRange {
    constructor(leftVal, operator, rightVal) {
        this.leftVal = new Value(leftVal);
        this.operator = operator;
        this.rightVal = new Value(rightVal);
    }
}

class AttributeFilter {
    constructor(operator, value) {
        this.operator = operator;
        if (value instanceof Value) {
            this.value = new Value(value);
        }
        else {
            this.value = new ValueRange(value);
        }
    }
}

class Attribute {
    constructor(value) {
        this.value = value;
    }
}

class Has extends TermItem {
    constructor(has, operator, value) {
        super();
        this.attribute = new Attribute(value);
        this.has = has;
        this.operator = operator;
    }
}

class CategorizedFilter extends TermItem {
    constructor(attribute, operator, attributeFilter) {
        super();
        this.attribute = new Attribute(attribute);
        this.operator = operator;
        this.attributeFilter = new AttributeFilter(attributeFilter);
    }
}

class Text extends TermItem {
    constructor(text) {
        super();
        this.text = text;
    }
}

class SortAttribute {
    constructor(value, order) {
        this.value = value;
        this.order = order;
    }
}

class SortField {
    constructor(value) {
        this.sortAttribute = value;
    }
}

class Sort extends TermItem {
    constructor(sortBy, value) {
        super();
        this.sortBy = sortBy;
        this.value = new SortField(value);
    }
}


class Parser {
    constructor(str) {
        this.str = str;
        let lex = new lexer(this.str);
        this.tokens = lex.scanTokens();
        this.current = 0;
    }

    getTree() {
        return this.orExpression();
    }

    parse() {
        let tree = this.getTree();
        if (this.current < this.tokens.length - 1) {
            this.error("Incomplete query after: '" + this.tokens[this.current - 1].literal + "'\n", this.tokens[this.current - 1].end);
        }
        else {
            return tree;
        }
    }

    orExpression() {
        let expr = this.andExpression();

        while (this.matchOperator(operators.OR)) {
            let operator = this.previous();
            let right = this.andExpression();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    andExpression() {
        let expr = this.andOperand();

        while (this.matchOperator(operators.AND)) {
            let operator = this.previous();
            let right = this.andOperand();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    andOperand() {
        let expr = this.item();

        while (this.match(types.WORD)) {
            let operator = new Token(types.OPERATOR, 'and', 'and');
            let right = this.item(operator);
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    item() {
        let expr;
        if (arguments[0] !== undefined) {
            expr = this.unary(arguments[0]);
        }
        else {
            expr = this.unary();
        }

        if (this.match(operators.COLON)) {
            let operator = this.previous();
            let right = this.unary();
            expr = new CategorizedFilter(expr, operator, right);
            // TO DO: multiple attribute filters (handle comma)
        }

        else if(this.match(types.TUPLE_NAME) || this.tokens[this.current - 1].type === types.TUPLE_NAME) {
            let right = this.unary();
            expr = new Tuple(expr, right);
        }

        return expr;
    }

    unary() {
        if (this.match('#') || this.match('\-')) {
            let operator = this.previous();
            let right = this.item();
            return new Unary(operator, right);
        }

        if (arguments[0] !== undefined) {
            return this.primary(arguments[0])
        }
        else {
            return this.primary()
        }
    }

    primary() {
        if (this.match(types.WORD)) {
            if (!this.isAtEnd()) {
                if (this.peek().type === operators.COLON || arguments[0] !== undefined ||
                    this.previous().type === ':') return this.previous();

                if (this.tokens[this.current - 1].lexeme.toLowerCase() in singleWordHelper) {
                    let newLongWord = this.previous();
                    let secondWord = this.advance();
                    newLongWord.lexeme += ' ' + secondWord.lexeme;
                    newLongWord.literal += ' ' + secondWord.literal;
                    newLongWord.end = secondWord.end;
                    if (newLongWord.lexeme.toLowerCase() in timeTracking ||
                        newLongWord.lexeme.toLowerCase() in sortAttribute ||
                        newLongWord.lexeme.toLowerCase() in customField ||
                        newLongWord.lexeme.toLowerCase() in issueAttribute ||
                        newLongWord.lexeme.toLowerCase() in issueLink) {
                        return newLongWord;
                    }
                    else if (newLongWord.lexeme.toLowerCase() in doubleWordHelper) {
                        if (!this.isAtEnd()) {
                            let thirdWord = this.advance();
                            newLongWord.lexeme += ' ' + thirdWord.lexeme;
                            newLongWord.literal += ' ' + thirdWord.literal;
                            newLongWord.end = thirdWord.end;
                            if (newLongWord.lexeme.toLowerCase() in customField ||
                                newLongWord.lexeme.toLowerCase() in issueLink) {
                                return newLongWord;
                            }
                            else {
                                this.error("Unexpected token:\n", thirdWord.begin);
                            }
                        } else {
                            this.error("Unexpected end:\n", newLongWord.end + 1);
                        }
                    }
                    else {
                        this.error("Unexpected token:\n", secondWord.begin);
                    }
                }
                else {
                    this.error("Unexpected token:\n", this.tokens[this.current + 1].end);
                }
            }
            else if (this.current - 2 >= 0) {
                if (this.tokens[this.current - 2].type === ':') return this.previous();
            }
            else {
                this.error("Unexpected end:\n", this.previous().end + 1);
            }
        }

        if (this.match(operators.LEFT_PAREN)) {
            let left = this.previous();
            let expr = this.orExpression();
            if (this.check(operators.RIGHT_PAREN)) this.advance();
            else {
                this.error("SyntaxError: missing ')' after expression:\n", this.str.length);
            }
            let right = this.tokens[this.current - 1];
            return new Grouping(left, expr, right);
        }

        if (this.tokens[this.current - 1].type !== operators.LEFT_PAREN) {
            this.error("Expect AndOperand after '" + this.tokens[this.current - 1].lexeme + "'\n", this.tokens[this.current - 1].end + 1);
        } else {
            this.error("Expect OrExpression after '" + this.tokens[this.current - 1].lexeme + "'\n", this.str.length);
        }
    }

    match() {
        for (let i = 0; i < arguments.length; i++) {
            if (this.check(arguments[i])) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    matchOperator() {
        for (let i = 0; i < arguments.length; i++) {
            if (this.checkOperator(arguments[i])) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    checkOperator(type) {
        if (this.isAtEnd()) return false;
        return this.peek().lexeme === type;
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    isAtEnd() {
        if (arguments[0] === undefined)
            return this.peek().type === operators.EOF;
        else
            return this.peekNext().type === operators.EOF;

    }

    peek() {
        return this.tokens[this.current];
    }

    peekNext() {
        if (this.tokens[this.current + 1] !== undefined)
            return this.tokens[this.current + 1];
        else {
            this.error("Expect SignExpression after '" + this.tokens[this.current - 1].lexeme + "'\n", this.tokens[this.current - 1].end + 1);
        }
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    error(message, n) {
        new errorEx(message, n, this.str);
    }
}

try {
    let t = new Parser('"is duplicated by: gg"');
    let res = t.parse();
    console.log(res);
} catch (e) {
    console.log(e);
}

// document.getElementById('query').oninput = function () {
//     try {
//         let p = new Parser(document.getElementById('query').value);
//         let res = p.parse();
//         document.getElementById('result').value = JSON.stringify(res, null, 4);
//     } catch (e) {
//         if (e instanceof errorEx) {
//             document.getElementById('result').value = e;
//         } else {
//             document.getElementById('result').value = 'Empty query';
//         }
//     }
// };

module.exports = Parser;