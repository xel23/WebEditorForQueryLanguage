// TO DO: Text, commas

const lexer = require('./lexer');
const operators = require('./operators');
const types = require('./types');
const errorEx = require('./syntaxException');
const Token = require('./token');

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

class QuotedText extends TermItem {
    constructor(leftQuote, text, rightQuote) {
        super('QuotedText', leftQuote.begin, rightQuote.end);
        this.leftQuote = leftQuote;
        this.lexeme = text.lexeme;
        this.literal = text.literal;
        this.begin = leftQuote.begin;
        this.end = rightQuote.end;
        this.rightQuote = rightQuote;
    }
}

class NegativeText extends TermItem {
    constructor(minus, qt) {
        super('NegativeText', minus.begin, qt.end);
        this.minus = minus;
        this.text = qt;
    }
}

class PositiveSingleValue extends TermItem {
    constructor(lat, value) {
        super('PositiveSingleValue', lat.begin, value.right.end);
        this.operator = lat.type;
        this.lexeme = value.right.lexeme;
        this.literal = value.right.literal;
        this.begin = lat.begin;
        this.end = value.right.end;
    }
}

class NegativeSingleValue extends TermItem {
    constructor(minus, value) {
        super('NegativeSingleValue', minus.begin, value.right.end);
        this.minus = minus.type;
        this.lexeme = value.right.lexeme;
        this.literal = value.right.literal;
        this.begin = minus.begin;
        this.end = value.right.end;
    }
}

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
            this.type = value.type === 'QuotedText' ? value.type : 'Value';
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
        this.key = has;
        this.operator = operator;
    }
}

class CategorizedFilter extends TermItem {
    constructor(attribute, operator, attributeFilter) {
        super('CategorizedFilter', attribute.begin, attributeFilter instanceof ValueRange ? attributeFilter.rightVal.end : attributeFilter.end);
        this.attribute = attribute;
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

class SortAttribute {
    constructor(value) {
        this.type = value.type;
        this.lexeme = value.lexeme;
        this.literal = value.literal;
        this.begin = value.begin;
        this.end = value.end;
    }
}

class Sort extends TermItem {
    constructor(sortBy, operator, value) {
        super('Sort', sortBy.begin, value.end);
        this.key = sortBy;
        this.value = new SortAttribute(value);
        if (arguments[3] !== undefined) {
            this.order = arguments[3];
        }
        // if (sortField.length > 1) {
        //     if (sortField[1] === 'asc' || sortField[1] === 'desc') {
        //         this.order = sortField[1];
        //     }
        //     else {
        //         new errorEx("SortAttribute can have 'asc' or 'desc' order\n", 0, "");
        //     }
        // }
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

        while (this.matchOperator(operators.OR) || this.match(',')) {
            if (this.previous().lexeme === operators.OR) {
                let operator = this.previous();
                operator.type = 'OPERATOR';
                let right = this.andExpression();
                expr = new Binary(expr, operator, right);
            }
            else {
                let operator = new Token('OPERATOR', 'or', 'or');
                let right = this.andExpression();
                if (right.type === types.WORD || right.type === types.QUOTED_TEXT || right instanceof Unary) {
                    if (expr instanceof CategorizedFilter) {
                        expr = new Binary(expr, operator, this.rightObj('CategorizedFilter', expr, right));
                    }
                    else if (expr instanceof Has) {
                        expr = new Binary(expr, operator, this.rightObj('Has', expr, right));
                    }
                    else if (expr instanceof Sort) {
                        expr = new Binary(expr, operator, this.rightObj('Sort', expr, right));
                    }
                    else {
                        this.error(expr.type + "does not support comma operator:\n", expr.begin);
                    }
                }
                else if (right.type === '-' || right.type !== '#') {

                }
                else {
                    this.error("Unexpected value after comma:\n", right.begin);
                }
            }
        }

        return expr;
    }

    andExpression() {
        let expr = this.andOperand();

        while (this.matchOperator(operators.AND)) {
            let operator = this.previous();
            operator.type = 'OPERATOR';
            let right = this.andOperand();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    andOperand() {
        let expr = this.item();

        while ((this.tokens[this.current].type === types.WORD || this.tokens[this.current].type === '#' ||
            this.tokens[this.current].type === '-') && !(this.tokens[this.current].lexeme.toUpperCase() in operators)) {
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
                    expr = new CategorizedFilter(new Attribute(expr), operator, right, minus);
                } else {
                    expr = new CategorizedFilter(new Attribute(expr), operator, right_1, minus);
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
                        expr = new CategorizedFilter(new Attribute(expr), operator, right);
                    }
                } else {
                    if (expr.lexeme === 'has') {
                        expr = new Has(expr, operator, right_1);
                        // TO DO: multiple attribute has (handle comma)
                    }
                    else if(expr.lexeme === 'sort by') {
                        if (this.tokens[this.current].lexeme === 'asc' || this.tokens[this.current].lexeme === 'desc') {
                            expr = new Sort(expr, operator, right_1, this.advance());
                        }
                        else {
                            expr = new Sort(expr, operator, right_1);
                        }
                    }
                    else {
                        expr = new CategorizedFilter(new Attribute(expr), operator, right_1);
                    }
                }
            }
            // TO DO: multiple attribute filters (handle comma)
        }

        else if (expr instanceof QuotedText) {
            return expr;
        }

        else if ('operator' in expr) {
            if (expr.operator.type !== '#' && expr.operator.type !== '-') {
                this.error("Missing ':'\n", expr.end);
            }

            else if (expr.operator.type === '#') {
                expr = new PositiveSingleValue(expr.operator, expr);
            }

            else if (expr.operator.type === '-') {
                if (expr.right instanceof QuotedText) {
                    expr = new NegativeText(expr.operator, expr.right);
                }
                else {
                    expr = new NegativeSingleValue(expr.operator, expr);
                }
            }

            else {
                this.error("Unexpected operator:\n", expr.operator.begin);
            }
        }

        else if ('expr' in expr) {
            return expr;
        }

        else if (this.match(',') || this.isAtEnd()) {
            return expr;
        }

        else {
            this.error("Unexpected word:\n", expr.begin);
        }

        return expr;
    }

    unary() {
        if (this.match('#') || this.match('\-')) {
            let operator = this.previous();
            if (arguments[0] === 'key') {
                let right = this.primary();
                return new Unary(operator, right);
            }
            else {
                let right = this.item();
                return new Unary(operator, right);
            }
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
            let attr = this.previous();
            // if (!this.isAtEnd()) {
            //     if (this.peek().type === operators.COLON) return this.previous();
            //
            //     if (this.tokens[this.current - 1].lexeme.toLowerCase() in singleWordHelper) {
            //         let newLongWord = this.previous();
            //         let secondWord = this.advance();
            //         newLongWord.lexeme += ' ' + secondWord.lexeme;
            //         newLongWord.literal += ' ' + secondWord.literal;
            //         newLongWord.end = secondWord.end;
            //         if (newLongWord.lexeme.toLowerCase() in timeTracking ||
            //             newLongWord.lexeme.toLowerCase() in sortAttribute ||
            //             newLongWord.lexeme.toLowerCase() in customField ||
            //             newLongWord.lexeme.toLowerCase() in issueAttribute ||
            //             newLongWord.lexeme.toLowerCase() in issueLink) {
            //             return newLongWord;
            //         }
            //         else if (newLongWord.lexeme.toLowerCase() in doubleWordHelper) {
            //             if (!this.isAtEnd()) {
            //                 let thirdWord = this.advance();
            //                 newLongWord.lexeme += ' ' + thirdWord.lexeme;
            //                 newLongWord.literal += ' ' + thirdWord.literal;
            //                 newLongWord.end = thirdWord.end;
            //                 if (newLongWord.lexeme.toLowerCase() in customField ||
            //                     newLongWord.lexeme.toLowerCase() in issueLink) {
            //                     return newLongWord;
            //                 }
            //                 else {
            //                     this.error("Unexpected token:\n", thirdWord.begin);
            //                 }
            //             } else {
            //                 this.error("Unexpected end:\n", newLongWord.end + 1);
            //             }
            //         }
            //         else {
            //             this.error("Unexpected token:\n", secondWord.begin);
            //         }
            //     }
            //     else {
            //         this.error("Unexpected token:\n", this.tokens[this.current - 1].end);
            //     }
            // }
            // else if (this.current - 2 >= 0) {
            //     if (this.tokens[this.current - 2].type === ':') return this.previous();
            // }
            // else {
            //     this.error("Unexpected end:\n", this.previous().end + 1);
            // }

            while (this.match(types.WORD)) {
                attr.lexeme += ' ' + this.previous().lexeme;
                attr.literal += ' ' + this.previous().literal;
                attr.end = this.previous().end;
            }

            return attr;
        }
        else if (this.match(types.WORD) || this.match('COMPLEX_VALUE')) {
            return this.previous();
        }

        else if (this.match('"')) {
            let qt = new QuotedText(this.previous(), this.advance(), this.advance());
            this.advance();
            return qt;
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

    rightObj(type, expr, right) {
        let rightObj;
        if (type === 'CategorizedFilter') {
            rightObj = new CategorizedFilter(expr.attribute, new Token(':', ':', ':'), right);
        }
        else if (type === 'Has') {
            rightObj = new Has(expr.key, new Token(':', ':', ':'), right);
        }
        else {
            rightObj = new Sort(expr.key, new Token(':', ':', ':'), right);
        }
        return rightObj;
    }
}

try {
    let t = new Parser('name: val1, val .. lav');
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
//             document.getElementById('result').value = 'Text:' + document.getElementById('query').value;
//         }
//     }
// };

module.exports = Parser;