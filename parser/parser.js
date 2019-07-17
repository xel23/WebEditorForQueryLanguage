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
    constructor (type, being, end) {
        this.type = type;
        this.begin = being;
        this.end = end;
    }
}

// class QuotedText extends TermItem {
//     constructor(leftQuote, text, rightQoute) {
//         super();
//         this.leftQuote = leftQuote;
//         this.text = text;
//         this.rightQoute = rightQoute;
//     }
// }
//
// class NegativeText extends TermItem {
//     constructor(minus, leftQuote, text, rightQoute) {
//         super();
//         this.minus = minus;
//         this.text = new QuotedText(leftQuote, text, rightQoute);
//     }
// }

// class Value extends TermItem {
//     constructor(value) {
//         super();
//         this.value = value;
//     }
// }

// class SingleValue extends Value {
//     constructor(value) {
//         super(value);
//     }
// }

// class PositiveSingleValue extends TermItem {
//     constructor(lat, value) {
//         super();
//         this.lat = lat;
//         this.value = new SingleValue(value);
//     }
// }
//
// class NegativeSingleValue extends TermItem {
//     constructor(minus, value) {
//         super();
//         this.minus = minus;
//         this.value = new SingleValue(value);
//     }
// }

class ValueRange {
    constructor(leftVal, operator, rightVal) {
        this.leftVal = leftVal;
        this.operator = operator;
        this.rightVal = rightVal;
    }
}

class AttributeFilter {
    constructor(value) {
        if (arguments[1] !== undefined) this.operator = arguments[1];
        if (value instanceof ValueRange) {
            this.type = 'ValueRange';
            this.left_lexeme = value.leftVal.lexeme;
            this.left_literal = value.leftVal.literal;
            this.right_lexeme = value.rightVal.lexeme;
            this.right_literal = value.rightVal.literal;
            this.vr_operator = value.operator;
            this.begin = value.leftVal.begin;
            this.end = value.rightVal.end;
        } else {
            this.type = 'Value';
            this.lexeme = value.lexeme;
            this.literal = value.literal;
            this.begin = value.begin;
            this.end = value.end;
        }
    }
}

class Attribute {
    constructor(value) {
        this.type = 'Attribute';
        this.lexeme = value.lexeme;
        this.literal = value.literal;
        this.begin = value.begin;
        this.end = value.end;
    }
}

class Has extends TermItem {
    constructor(has, operator, value) {
        super('Has', has.begin, value.end);
        this.attribute = new Attribute(value);
        this.has = has;
        this.operator = operator;
    }
}

class CategorizedFilter extends TermItem {
    constructor(attribute, operator, attributeFilter) {
        super('CategorizedFilter', attribute.begin, attributeFilter instanceof ValueRange ? attributeFilter.rightVal.end : attributeFilter.end);
        this.attribute = new Attribute(attribute);
        this.operator = operator;
        if (arguments[3] !== undefined)
            this.attributeFilter = new AttributeFilter(attributeFilter, arguments[3]);
        else
            this.attributeFilter = new AttributeFilter(attributeFilter);
    }
}

// class Text extends TermItem {
//     constructor(text) {
//         super();
//         this.text = text;
//     }
// }
//
// class SortAttribute {
//     constructor(value, order) {
//         this.value = value;
//         this.order = order;
//     }
// }
//
// class SortField {
//     constructor(value) {
//         this.sortAttribute = value;
//     }
// }
//
class Sort extends TermItem {
    constructor(sortBy, value) {
        super('Sort', sortBy.begin, value.end);
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

        while (this.tokens[this.current].type === types.WORD && !(this.tokens[this.current].lexeme.toUpperCase()
                in operators)) {
            let operator = new Token(types.OPERATOR, 'and', 'and');
            let right = this.item();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    item() {
        let expr = this.unary('key');

        if (this.match(operators.COLON)) {
            let operator = this.previous();
            if (this.tokens[this.current].type === '\-') {
                let minus = this.advance();
                if (expr.lexeme === 'has' || expr.lexeme === 'sort by') {
                    this.error("'"+ expr.lexeme + "' can't have minus symbol\n", minus.begin);
                }
                let right_1 = this.unary();
                if (this.match('..')) {
                    let right = new ValueRange(right_1, this.previous(), this.unary());
                    expr = new CategorizedFilter(expr, operator, right, minus);
                } else {
                    expr = new CategorizedFilter(expr, operator, right_1, minus);
                }
            }
            else {
                let right_1 = this.unary();
                if (this.match('..')) {
                    let right = new ValueRange(right_1, this.previous(), this.unary());
                    if (expr.lexeme === 'has' || expr.lexeme === 'sort by') {
                        this.error("'" + expr.lexeme + "' can't have ValueArrange value\n", right_1.begin);
                    }
                    else {
                        expr = new CategorizedFilter(expr, operator, right);
                    }
                } else {
                    if (expr.lexeme === 'has') {
                        expr = new Has(expr, operator, right_1);
                        // TO DO: multiple attribute has (handle comma)
                    }
                    else if(expr.lexeme === 'sort by') {
                        expr = new Sort(expr, operator, right_1);
                    }
                    else {
                        expr = new CategorizedFilter(expr, operator, right_1);
                    }
                }
            }
            // TO DO: multiple attribute filters (handle comma)
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
        if (this.tokens[this.current].type === types.WORD && arguments[0] === 'key') {
            this.current++;
            if (!this.isAtEnd()) {
                if (this.peek().type === operators.COLON) return this.previous();

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
                    this.error("Unexpected token:\n", this.tokens[this.current - 1].begin);
                }
            }
            else if (this.current - 2 >= 0) {
                if (this.tokens[this.current - 2].type === ':') return this.previous();
            }
            else {
                this.error("Unexpected end:\n", this.previous().end + 1);
            }
        }
        else if (this.match(types.WORD) || this.match('COMPLEX_VALUE')) {
            return this.previous();
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
            this.error("Expect AndOperand after '" + this.tokens[this.current - 1].lexeme + "'\n", this.tokens[this.current - 1].end);
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
    let t = new Parser('has: filed');
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