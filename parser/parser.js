const lexer = require('./lexer');
const operators = require('./const/operators');
const types = require('./const/types');
const errorEx = require('./exceptions/syntaxException');
const Token = require('./token');
const Binary = require('./general/Binary');
const Unary = require('./general/Unary');
const Grouping = require('./general/Grouping');

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
        super('PositiveSingleValue', value.begin, value.end);
        this.operator = lat;
        this.lexeme = value.lexeme;
        this.literal = value.literal;
    }
}

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

class ValueRange {
    constructor(leftVal, operator, rightVal) {
        this.type = 'ValueRange';
        this.leftVal = leftVal;
        this.operator = operator;
        this.rightVal = rightVal;
        this.begin = leftVal.begin;
        this.end = rightVal.end;
    }
}

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

class Attribute {
    constructor(value) {
        this.type = value.type === 'TEXT'? 'TEXT' : 'Attribute';
        this.lexeme = value.lexeme;
        this.literal = value.literal;
        this.begin = value.begin;
        this.end = value.end;
        if (value instanceof NegativeSingleValue) {
            this.begin = value.minus.end;
            this.operator = value.minus;
        }
        if (arguments[1] !== undefined) this.operator = arguments[1];
    }
}

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

class CategorizedFilter extends TermItem {
    constructor(attribute, operator, attributeFilter) {
        super('CategorizedFilter', attribute.begin, attributeFilter instanceof ValueRange ? attributeFilter.rightVal.end : attributeFilter.end);
        this.attribute = attribute;
        this.operator = operator;
        this.attributeFilter = [];

        this.attributeFilter.push(new AttributeFilter(attributeFilter));
    }

    addAttributeFilter(token, comma) {
        this.end = token instanceof ValueRange ? token.rightVal.end : token.end;

        this.attributeFilter.push(comma);
        this.attributeFilter.push(new AttributeFilter(token));
    }
}

class SortAttribute {
    constructor(value) {
        this.type = value.type;
        this.lexeme = value.lexeme;
        this.literal = value.literal;
        this.begin = value.begin;
        this.end = value.end;
        if (arguments[1] !== undefined) {
            this.order = arguments[1];
        }
    }
}

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

class Text extends TermItem {
    constructor(token) {
        super('TEXT', token.begin, token.end);
        this.lexeme = token.lexeme;
        this.literal = token.literal;
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
        while (this.current < this.tokens.length - 1 || tree instanceof Token) {
            let operator = new Token('OPERATOR', 'and', 'and');
            let rightTree = this.getTree();
            if (rightTree instanceof Token) {
                if (rightTree.type === types.WORD) {
                    rightTree.type = types.TEXT;
                }
            }
            tree = new Binary(tree, operator, rightTree);
        }
        return tree;
    }

    orExpression() {
        let expr = this.andExpression();

        while (this.matchOperator(operators.OR)) {
            let operator = this.previous();
            operator.type = 'OPERATOR';
            let right = this.andExpression();
            if (right.type === types.WORD) {
                // this.error("Incomplete query after:\n", right.begin - 1);
                right.type = types.TEXT;
            }
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    andExpression() {
        let expr = this.andOperand();

        while (this.matchOperator(operators.AND)) {
            let operator = this.previous();
            operator.type = 'OPERATOR';
            let right = this.andOperand();
            if (right.type === types.WORD) {
                // this.error("Incomplete query after: \n", right.begin - 1);
                right.type = types.TEXT;
            }
            if (!(expr instanceof CategorizedFilter || expr instanceof Has || expr instanceof Sort
                || expr instanceof PositiveSingleValue || expr instanceof NegativeSingleValue || expr instanceof Grouping)) {
                this.error("Missing parentheses before 'and' operator:\n", operator.begin - 1);
            }
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    andOperand() {
        let expr = this.item();

        let exprCommaHelper = expr;

        while (this.match(',')) {
            let comma = this.previous();
            let right = this.item('value');
            this.current--;
            if ((this.match(types.WORD, types.QUOTED_TEXT, types.COMPLEX_VALUE, types.TEXT))) {
                if (right instanceof PositiveSingleValue) {
                    // this.error("Unexpected PositiveSingleValue: \n", right.begin);
                    right = new Text(new Token('TEXT', this.str.substring(right.operator.begin, right.end),
                        this.str.substring(right.operator.begin, right.end), right.operator.begin, right.end));
                }
                if (exprCommaHelper instanceof CategorizedFilter) {
                    // if (right instanceof PositiveSingleValue) {
                    //     // this.error("Unexpected PositiveSingleValue: \n", right.begin);
                    //     right = new Text(new Token('TEXT', this.str.substring(right.operator.begin, right.end),
                    //         this.str.substring(right.operator.begin, right.end), right.operator.begin, right.end));
                    // }
                    expr.addAttributeFilter(right, comma);
                }
                else if (right instanceof ValueRange) {
                    this.error(exprCommaHelper.type + " can not have '" + right.type + "' value.\n", right.begin);
                }
                else {
                    right.type = right.type === 'TEXT' ? 'TEXT' : 'Value';
                    if (exprCommaHelper instanceof Has) {
                        expr.addAttribute(right, comma);
                    }
                    else if (exprCommaHelper instanceof Sort) {
                        if (right instanceof NegativeSingleValue) {
                            // this.error(exprCommaHelper.type + " can not have '" + right.type + "' value.\n", right.begin);
                            right = new Text(new Token('TEXT', this.str.substring(right.minus.begin, right.end),
                                this.str.substring(right.minus.begin, right.end), right.minus.begin, right.end));
                        }
                        let order = this.tokens[this.current];
                        if (order.type === types.WORD) {
                            if (order.literal === 'asc' || order.literal === 'desc') {
                                expr.addValue(right, comma, order);
                                this.current++;
                            }
                        }
                        else {
                            expr.addValue(right, comma);
                        }
                    }
                    else {
                        this.error(expr.type + " does not support comma operator:\n", expr.right.begin);
                    }
                }
            }
            else {
                this.error("Unexpected value after comma:\n", right.begin);
            }
        }

        return expr;
    }

    item() {
        let expr = this.unary(arguments[0] || 'key');

        if (this.match(operators.COLON)) {
            let operator = this.previous();
            if (this.tokens[this.current].type === '-') {
                let minus = this.advance();
                let right_1 = this.unary();
                if (expr.lexeme === 'sort by') {
                    // this.error("'"+ expr.lexeme + "' can't have minus symbol\n", minus.begin);
                    expr = new Sort(expr, operator, new Text(new Token('TEXT', this.str.substring(minus.begin, right_1.end),
                        this.str.substring(minus.begin, right_1.end), minus.begin, right_1.end)));
                }
                else if (expr.lexeme === 'has') {
                    expr = new Has(expr, operator, right_1, minus);
                }
                else if (this.match('..')) {
                    let right = new ValueRange(right_1, this.previous(), this.unary());
                    expr = new CategorizedFilter(new Attribute(expr), operator, new NegativeSingleValue(minus, right));
                }
                else {
                    expr = new CategorizedFilter(new Attribute(expr), operator, new NegativeSingleValue(minus, right_1));
                }
            }
            else if (this.tokens[this.current].type === '#') {
                // this.error("Unexpected PositiveSingleValue in 'value':\n", this.tokens[this.current].begin)
                let lat = this.advance();
                let right_1 = this.unary();
                if (expr.lexeme === 'sort by') {
                    // this.error("'"+ expr.lexeme + "' can't have minus symbol\n", minus.begin);
                    if (this.match('..')) {
                        let right = new ValueRange(right_1, this.previous(), this.unary());
                        expr = new Sort(expr, operator, new Text(new Token('TEXT', this.str.substring(lat.begin, right.end),
                            this.str.substring(lat.begin, right.end), lat.begin, right.end)));
                    }
                    else {
                        expr = new Sort(expr, operator, new Text(new Token('TEXT', this.str.substring(lat.begin, right_1.end),
                            this.str.substring(lat.begin, right_1.end), lat.begin, right_1.end)));
                    }
                }
                else if (expr.lexeme === 'has') {
                    if (this.match('..')) {
                        let right = new ValueRange(right_1, this.previous(), this.unary());
                        expr = new Has(expr, operator, new Text(new Token('TEXT', this.str.substring(lat.begin, right.end),
                            this.str.substring(lat.begin, right.end), lat.begin, right.end)));
                    }
                    else {
                        expr = new Has(expr, operator, new Text(new Token('TEXT', this.str.substring(lat.begin, right_1.end),
                            this.str.substring(lat.begin, right_1.end), lat.begin, right_1.end)));
                    }
                }
                else if (this.match('..')) {
                    let right = new ValueRange(right_1, this.previous(), this.unary());
                    expr = new CategorizedFilter(new Attribute(expr), operator, new Text(new Token('TEXT', this.str.substring(lat.begin, right.end),
                        this.str.substring(lat.begin, right.end), lat.begin, right.end)));
                }
                else {
                    expr = new CategorizedFilter(new Attribute(expr), operator, new Text(new Token('TEXT', this.str.substring(lat.begin, right_1.end),
                        this.str.substring(lat.begin, right_1.end), lat.begin, right_1.end)));
                }
            }
            else {
                let right_1 = this.unary();
                if (this.match('..')) {
                    let right = new ValueRange(right_1, this.previous(), this.unary());
                    if (expr.lexeme === 'has') {
                        expr = new Has(expr, operator, new Text(new Token('TEXT', this.str.substring(right.begin, right.end),
                            this.str.substring(right.begin, right.end), right.begin, right.end)));
                    }
                    else if (expr.lexeme === 'sort by') {
                        expr = new Sort(expr, operator, new Text(new Token('TEXT', this.str.substring(right.begin, right.end),
                            this.str.substring(right.begin, right.end), right.begin, right.end)));
                    }
                    else {
                        expr = new CategorizedFilter(new Attribute(expr), operator, right);
                    }
                } else {
                    right_1.type = right_1.type !== 'QuotedText' ? 'Value' : right_1.type;
                    if (expr.lexeme === 'has') {
                        expr = new Has(expr, operator, right_1);
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
        }

        else if (expr instanceof QuotedText) {
            return expr;
        }

        else if ('operator' in expr) {
            if (expr.operator.type !== '#' && expr.operator.type !== '-') {
                this.error("Missing ':'\n", expr.end);
            }

            else if (expr.operator.type === '#') {
                expr = new PositiveSingleValue(expr.operator, expr.right);
            }

            else if (expr.operator.type === '-') {
                if (expr.right instanceof QuotedText) {
                    expr = new NegativeText(expr.operator, expr.right);
                }
                else {
                    expr = new NegativeSingleValue(expr.operator, expr.right);
                }
            }

            else {
                this.error("Unexpected operator:\n", expr.operator.begin);
            }
        }

        else if ('expr' in expr) {
            return expr;
        }

        else if (this.isAtEnd()) {
            return expr;
        }

        else if (this.match('..')) {
            return new ValueRange(expr, this.previous(), this.unary())
        }

        else if (arguments[0] === 'value') {
            return expr;
        }

        else {
            this.error("Unexpected word:\n", expr.begin);
        }

        return expr;
    }

    unary() {
        if (this.match('#') || this.match('-')) {
            let operator = this.previous();
            if (arguments[0] === 'key') {
                let right = this.primary();
                return new Unary(operator, right);
            }
            else {
                let right = this.item('value');
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
            if (attr.lexeme.toUpperCase() in operators) {
                this.error("Operator '" + attr.lexeme.toUpperCase() + "' can not be key.\n", attr.begin);
            }

            while (this.match(types.WORD)) {
                if (this.previous().lexeme.toUpperCase() in operators) {
                    this.error("Operator '" + this.previous().lexeme.toUpperCase() + "' can not be key.\n",
                        this.previous().begin);
                }
                attr.lexeme += ' ' + this.previous().lexeme;
                attr.literal += ' ' + this.previous().literal;
                attr.end = this.previous().end;
            }

            return attr;
        }
        else if (this.match(types.WORD, types.COMPLEX_VALUE)) {
            let attr = this.previous();
            if (attr.lexeme.toUpperCase() in operators) {
                this.error("Operator '" + attr.lexeme.toUpperCase() + "' can not be value.\n", attr.begin);
            }
            if (attr.lexeme === 'sort') {
                let by = this.advance();
                if (by.lexeme === 'by') {
                    attr.lexeme += ' ' + by.lexeme;
                    attr.literal += ' ' + by.literal;
                    attr.end = by.end;
                }
            }
            return this.previous();
        }

        else if (this.match('"')) {
            return new QuotedText(this.previous(), this.advance(), this.advance());
        }
        else if (this.match(types.TEXT)) {
            return new Text(this.previous());
        }

        if (this.match(operators.LEFT_PAREN)) {
            let left = this.previous();
            let expr = this.orExpression();
            if (this.check(operators.RIGHT_PAREN)) this.advance();
            else {
                this.error("Missing ')' after expression:\n", this.str.length);
            }
            let right = this.tokens[this.current - 1];
            return new Grouping(left, expr, right);
        }

        if (this.tokens[this.current - 1].type !== operators.LEFT_PAREN) {
            this.error("Expect AndOperand after '" + this.tokens[this.current - 1].lexeme + "'\n",
                this.tokens[this.current - 1].end);
        }

        else {
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
        return this.peek().type === operators.EOF;
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    error(message, n) {
        new errorEx(message, n, this.str);
    }
}

try {
    let t = new Parser('has: ss, #sss');
    let res = t.parse();
    console.log(res);
} catch (e) {
    console.log(e);
}

module.exports = Parser;