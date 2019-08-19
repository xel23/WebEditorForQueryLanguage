const lexer = require('./lexer');
const operators = require('./const/operators');
const types = require('./const/types');
const errorEx = require('./exceptions/syntaxException');
const Token = require('./token');
const Binary = require('./general/Binary');
const Unary = require('./general/Unary');
const Grouping = require('./general/Grouping');
const Has = require('./general/Has');
const QuotedText = require('./general/QuotedText');
const NegativeText = require('./general/NegativeText');
const PositiveSingleValue = require('./general/PositiveSingleValue');
const NegativeSingleValue = require('./general/NegativeSingleValue');
const ValueRange = require('./general/ValueRange');
const CategorizedFilter = require('./general/CategorizedFilter');
const Sort = require('./general/Sort');
const Text = require('./general/Text');
const Attribute = require('./general/Attribute');


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
        if (this.str.length === 0) return this.str;

        let tree;
        try {
            tree = this.getTree();
        } catch (e) {
            tree = new Text(new Token('TEXT', this.str.substring(0, this.tokens[this.current - 1].end),
                this.str.substring(0, this.tokens[this.current - 1].end), 0, this.tokens[this.current - 1].end));
        }
        while (this.current < this.tokens.length - 1) {
            let start = this.current;
            let operator = new Token('OPERATOR', 'and', 'and');
            let rightTree;
            try {
                rightTree = this.getTree();
                if (rightTree instanceof Token || rightTree instanceof ValueRange) {
                    rightTree = new Text(
                        new Token('TEXT', this.str.substring(this.tokens[start].begin, this.tokens[this.current - 1].end),
                            this.str.substring(this.tokens[start].begin, this.tokens[this.current - 1].end),
                            this.tokens[start].begin, this.tokens[this.current - 1].end));
                }
                tree = new Binary(tree, operator, rightTree);
            } catch(e) {
                tree = new Binary(tree, operator,
                    new Text(
                        new Token('TEXT', this.str.substring(this.tokens[start].begin, this.tokens[this.current - 1].end),
                            this.str.substring(this.tokens[start].begin, this.tokens[this.current - 1].end),
                            this.tokens[start].begin, this.tokens[this.current - 1].end)));
            }
        }
        if (tree instanceof Token) {
            tree.type = types.TEXT;
        }
        else if (tree instanceof ValueRange) {
            tree = new Text(
                new Token('TEXT', this.str, this.str, 0, this.str.length)
            );
        }
        return tree;
    }

    orExpression() {
        let expr = this.andExpression();

        let flag = false;

        while (this.matchOperator(operators.OR)) {
            let operator = this.previous();
            let curToken = this.current;
            operator.type = 'OPERATOR';
            let right;
            try {
                right = this.andExpression();
                if (right !== null) {
                    if (right.type === types.WORD) {
                        right.type = types.TEXT;
                    }
                    expr = new Binary(expr, operator, right);
                }
                else {
                    flag = true;
                }
            } catch (e) {
                expr = new Binary(expr, operator, new Text(new Token('TEXT', this.str.substring(this.tokens[curToken].begin,
                    this.tokens[this.current - 1].end), this.str.substring(this.tokens[curToken].begin,
                    this.tokens[this.current - 1].end), this.tokens[curToken].begin, this.tokens[this.current - 1].end)));
            }
        }

        if (flag) {
            this.current--;
        }

        return expr;
    }

    andExpression() {
        let expr = this.andOperand();

        if (expr === null) {
            return expr;
        }

        if (expr.type === types.WORD) {
            this.error('AndOperand can not be WORD\n', expr.begin);
        }

        let flag = false;

        while (this.matchOperator(operators.AND)) {
            let operator = this.previous();
            let curToken = this.current;
            operator.type = 'OPERATOR';
            let right;
            try {
                right = this.andOperand();
                if (right !== null) {
                    if (right.type === types.WORD) {
                        right.type = types.TEXT;
                    }
                    if (!(expr instanceof CategorizedFilter || expr instanceof Has || expr instanceof Sort
                        || expr instanceof PositiveSingleValue || expr instanceof NegativeSingleValue
                        || expr instanceof Grouping)) {
                        this.error("Missing parentheses before 'and' operator:\n", operator.begin - 1);
                    }
                    expr = new Binary(expr, operator, right);
                }
                else {
                    flag = true;
                }
            } catch (e) {
                expr = new Binary(expr, operator, new Text(new Token('TEXT', this.str.substring(this.tokens[curToken].begin,
                    this.tokens[this.current - 1].end), this.str.substring(this.tokens[curToken].begin,
                    this.tokens[this.current - 1].end), this.tokens[curToken].begin, this.tokens[this.current - 1].end)));
            }
        }

        if (flag) {
            this.current--;
        }

        return expr;
    }

    andOperand() {
        let expr = this.item();

        if (!(expr instanceof Has || expr instanceof Sort || expr instanceof CategorizedFilter)) {
            return expr;
        }

        let exprCommaHelper = expr;

        while (this.match(',')) {
            let cur = this.current - 1;
            let comma = this.previous();
            let right = this.item('value');
            if (right === null)  {
                this.current--;
                return expr;
            }
            this.current--;
            if ((this.match(types.WORD, types.QUOTED_TEXT, types.COMPLEX_VALUE, types.TEXT))) {
                if (right instanceof PositiveSingleValue) {
                    this.current -= 3;
                    return expr;
                }
                if (exprCommaHelper instanceof CategorizedFilter) {
                    expr.addAttributeFilter(right, comma);
                }
                else {
                    if (right instanceof ValueRange) {
                        this.current -= 4;
                        return expr;
                    }
                    right.type = right.type === 'TEXT' ? 'TEXT' : 'Value';
                    if (exprCommaHelper instanceof Has) {
                        expr.addAttribute(right, comma);
                    }
                    else if (exprCommaHelper instanceof Sort) {
                        if (right instanceof NegativeSingleValue) {
                            this.current -= 3;
                            return expr;
                        }
                        let order = this.tokens[this.current];
                        if (order.type === types.WORD) {
                            if (order.literal === 'asc' || order.literal === 'desc') {
                                expr.addValue(right, comma, order);
                                this.current++;
                            }
                            else {
                                expr.addValue(right, comma);
                                return expr;
                            }
                        }
                        else {
                            expr.addValue(right, comma);
                        }
                    }
                }
            }
            else {
                this.current = cur;
                return expr;
            }
        }

        return expr;
    }

    item() {
        let expr = this.unary(arguments[0] || 'key');

        if (expr === null) return null;

        if (expr.type !== types.WORD && !(expr instanceof Unary || expr instanceof Grouping
            || expr instanceof QuotedText)) {
            expr.type = types.TEXT;
            return expr;
        }

        if (!(expr instanceof Unary)) {
            if (this.match(operators.COLON)) {
                let operator = this.previous();
                if (this.tokens[this.current].type === '-') {
                    let curToken = this.current;
                    let minus = this.advance();
                    let right_1 = this.unary();
                    if (expr.lexeme === 'sort by') {
                        this.current = curToken;
                        return expr;
                    }
                    else if (expr.lexeme === 'has') {
                        expr = new Has(expr, operator, right_1, minus);
                    }
                    else if (this.match('..')) {
                        let vr_operator = this.previous();
                        if (this.isAtEnd()) {
                            this.current--;
                            expr = new CategorizedFilter(new Attribute(expr), operator, new NegativeSingleValue(minus, right_1));
                            return expr;
                        }
                        let rValue = this.unary();
                        if (rValue.type === types.WORD) {
                            let right = new ValueRange(right_1, vr_operator, rValue);
                            expr = new CategorizedFilter(new Attribute(expr), operator, new NegativeSingleValue(minus, right));
                        }
                        else {
                            this.current -= 2;
                            expr = new CategorizedFilter(new Attribute(expr), operator, new NegativeSingleValue(minus, right_1));
                        }
                    }
                    else {
                        expr = new CategorizedFilter(new Attribute(expr), operator, new NegativeSingleValue(minus, right_1));
                    }
                }
                else if (this.tokens[this.current].type === '#') {
                    return expr;
                }
                else if (!this.isAtEnd()){
                    let right_1 = this.unary();
                    if (right_1.type !== types.WORD && right_1.type !== types.COMPLEX_VALUE) {
                        this.error('Unexpected Value\n', right_1.begin);
                    }
                    let flag = false;
                    if (this.match('..')) {
                        let operator_vr = this.previous();
                        let curToken = this.current - 1;
                        let right;
                        if (!this.isAtEnd()) {
                            let right_vr = this.unary();
                            if (right_vr.type === types.WORD)
                                right = new ValueRange(right_1, operator_vr, right_vr);
                            else {
                                this.current = curToken;
                                if (expr.lexeme === 'sort by') {
                                    return new Sort(expr, operator, right_1);
                                }
                                else if (expr.lexeme === 'has') {
                                    return new Has(expr, operator, right_1);
                                }
                                else {
                                    return new CategorizedFilter(new Attribute(expr), operator, right_1);
                                }
                            }
                        }
                        else {
                            right = right_1;
                            flag = true;
                        }
                        if (expr.lexeme === 'has') {
                            this.current = curToken;
                            return new Has(expr, operator, right_1);
                        }
                        else if (expr.lexeme === 'sort by') {
                            this.current = curToken;
                            return new Sort(expr, operator, right_1);
                        }
                        else {
                            expr = new CategorizedFilter(new Attribute(expr), operator, right);
                        }
                        if (flag) {
                            this.current = curToken;
                            return expr;
                        }
                    } else {
                        if (right_1.type !== types.TEXT) {
                            right_1.type = right_1.type !== 'QuotedText' ? 'Value' : right_1.type;
                        }
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
                else {
                    return new Text(new Token('TEXT', this.str.substring(expr.begin, operator.end),
                        this.str.substring(expr.begin, operator.end), expr.begin, operator.end));
                }
            }

            else if (expr instanceof QuotedText) {
                return expr;
            }

            else if ('expr' in expr) {
                return expr;
            }

            else if (this.isAtEnd()) {
                return expr;
            }

            else if (this.match('..')) {
                let curToken = this.current - 1;
                let operator = this.previous();
                let right_vr = this.unary();
                if (right_vr !== null) {
                    if (right_vr.type === types.WORD)
                        return new ValueRange(expr, operator, right_vr);
                    else {
                        this.current = curToken;
                        return expr;
                    }
                }
                else {
                    this.current = curToken;
                }
            }
        }

        else if ('operator' in expr) {
            if (expr.operator.type === '#') {
                if (expr.right !== null)
                    expr = new PositiveSingleValue(expr.operator, expr.right);
                else {
                    expr = new Text(new Token('TEXT', this.str.substring(expr.operator.begin, expr.operator.end),
                        this.str.substring(expr.operator.begin, expr.operator.end), expr.operator.begin,
                        expr.operator.end));
                }
            }

            else if (expr.operator.type === '-') {
                if (expr.right !== null) {
                    if (expr.right instanceof QuotedText) {
                        expr = new NegativeText(expr.operator, expr.right);
                    }
                    else {
                        expr = new NegativeSingleValue(expr.operator, expr.right);
                    }
                }
                else {
                    expr = new Text(new Token('TEXT', this.str.substring(expr.operator.begin, expr.operator.end),
                        this.str.substring(expr.operator.begin, expr.operator.end), expr.operator.begin,
                        expr.operator.end));
                }
            }
        }

        return expr;
    }

    unary() {
        if (this.match('#') || this.match('-')) {
            let operator = this.previous();
            let right = arguments[0] === 'key' ? this.primary() : this.item('value');
            if (right !== null) {
                if (right.type !== types.WORD && !(right instanceof ValueRange || right instanceof QuotedText)) {
                    this.current--;
                    return  operator;
                }
            }
            return new Unary(operator, right);
        }

        return arguments[0] !== undefined ? this.primary(arguments[0]) : this.primary();
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
                    this.current--;
                    break;
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
                attr.type = 'TEXT';
            }
            return attr;
        }

        else if (this.match('"')) {
            return new QuotedText(this.previous(), this.advance(), this.advance());
        }
        else if (this.match(types.TEXT)) {
            return new Text(this.previous());
        }

        if (this.match(operators.LEFT_PAREN)) {
            let left = this.previous();
            let expr = this.getTree();
            if (this.check(operators.RIGHT_PAREN)) this.advance();
            else {
                this.error("Missing ')' after expression:\n", this.str.length);
            }
            let right = this.tokens[this.current - 1];
            return new Grouping(left, expr, right);
        }

        if (this.tokens.type !== types.WORD) {
            return this.advance();
        }

        if (this.tokens[this.current - 1].type !== operators.LEFT_PAREN) {
            return this.advance();
        }

        else {
            return null;
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
        if (!this.isAtEnd())
            this.current++;
        else
            return null;
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

module.exports = Parser;