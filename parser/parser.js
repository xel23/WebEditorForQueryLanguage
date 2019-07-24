const lexer = require('./lexer');
const operators = require('./operators');
const types = require('./types');
const errorEx = require('./syntaxException');
const Token = require('./token');

class Binary {
    constructor(left, operator, right) {
        this.type = 'Binary';
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

class Unary {
    constructor(operator, right) {
        this.type = 'Unary';
        this.operator = operator;
        this.right = right;
    }
}

class Grouping {
    constructor(left, expr, right) {
        this.type = 'Grouping';
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
        this.minus = minus;
        this.lexeme = value.right.lexeme;
        this.literal = value.right.literal;
        this.begin = minus.begin;
        this.end = value.right.end;
        this._value = value;
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
        if (arguments[1] !== undefined) this.operator = arguments[1];
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
        } else {
            this.type = value.type === 'QuotedText' ? value.type : 'Value';
            if (arguments[1] !== undefined) {
                if (arguments[1].type === '-' && this.type === 'QuotedText') {
                    this.type = 'NegativeText';
                }
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
        this.key = has;
        this.key.type = 'key';
        this.operator = operator;
        this.value = [];
        this.value.push(new Attribute(value));
    }

    addAttribute(token) {
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
        if (arguments[3] !== undefined)
            this.attributeFilter.push(new AttributeFilter(attributeFilter, arguments[3]));
        else
            this.attributeFilter.push(new AttributeFilter(attributeFilter));
    }

    addAttributeFilter(token) {
        this.end = token instanceof ValueRange ? token.rightVal.end : token.end;

        if (arguments[1] !== undefined)
            this.attributeFilter.push(new AttributeFilter(token, arguments[1]));
        else
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

    addValue(token) {
        if (arguments[1] !== undefined) {
            this.value.push(new SortAttribute(token, arguments[1]));
            this.end = arguments[1].end;
        }
        else {
            this.value.push(new SortAttribute(token));
            this.end = token.end;
        }
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
                this.error("Incomplete query after: '" + this.tokens[this.current - 2].literal + "'\n", rightTree.begin);
            }
            tree = new Binary(tree, operator, rightTree);
        }
        return tree;
    }

    orExpression() {
        let expr = this.andExpression();
        let exprCommaHelper = expr;

        while (this.matchOperator(operators.OR) || this.match(',')) {
            if (this.previous().lexeme === operators.OR) {
                let operator = this.previous();
                operator.type = 'OPERATOR';
                let right = this.andExpression();
                if (right.type === types.WORD) {
                    this.error("Incomplete query after:\n", right.begin - 1);
                }
                expr = new Binary(expr, operator, right);
            }
            else {
                let right = this.andExpression('value');
                if (right instanceof Binary) {
                    this.error("Missing parentheses for OrExpression before 'and' operator:\n", right.operator.begin - 1);
                }
                this.current--;
                if ((this.match(types.WORD) || this.match(types.QUOTED_TEXT) || this.match(types.COMPLEX_VALUE) || right instanceof Unary) &&
                    !(right instanceof CategorizedFilter || right instanceof Has || right instanceof Sort)) {
                    if (exprCommaHelper instanceof CategorizedFilter) {
                        if (right instanceof NegativeSingleValue) {
                            let minus = right.minus;
                            expr.addAttributeFilter(right._value.right, minus);
                        }
                        else if (right instanceof PositiveSingleValue) {
                            this.error("Unexpected PositiveSingleValue: \n", right.begin);
                        }
                        else {
                            expr.addAttributeFilter(right);
                        }
                    }
                    else if (right instanceof ValueRange || right instanceof NegativeSingleValue ||
                        right instanceof PositiveSingleValue) {
                        this.error(exprCommaHelper.type + " can not have '" + right.type + "' value.\n", right.begin);
                    }
                    else {
                        right.type = 'Value';
                        if (exprCommaHelper instanceof Has) {
                            expr.addAttribute(right);
                        }
                        else if (exprCommaHelper instanceof Sort) {
                            let order = this.tokens[this.current];
                            if (order.type === types.WORD) {
                                if (order.literal === 'asc' || order.literal === 'desc') {
                                    expr.addValue(right, order);
                                    this.current++;
                                }
                            }
                            else {
                                expr.addValue(right);
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
        }

        return expr;
    }

    andExpression() {
        let expr;
        if (arguments[0] !== undefined)
            expr = this.andOperand(arguments[0]);
        else
            expr = this.andOperand();

        while (this.matchOperator(operators.AND)) {
            let operator = this.previous();
            operator.type = 'OPERATOR';
            let right = this.andOperand();
            if (right.type === types.WORD) {
                this.error("Incomplete query after: \n", right.begin - 1);
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
        let expr;
        if (arguments[0] !== undefined)
            expr = this.item(arguments[0]);
        else
            expr = this.item();

        return expr;
    }

    item() {
        let expr = this.unary(arguments[0] || 'key');

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
            else if (this.tokens[this.current].type === '#') {
                this.error("Unexpected PositiveSingleValue in 'value':\n", this.tokens[this.current].begin)
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
                    right_1.type = 'Value';
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

        else if (this.match(',')) {
            this.current--;
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
        if (this.match('#') || this.match('\-')) {
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
                    this.error("Operator '" + this.previous().lexeme.toUpperCase() + "' can not be key.\n", this.previous().begin);
                }
                attr.lexeme += ' ' + this.previous().lexeme;
                attr.literal += ' ' + this.previous().literal;
                attr.end = this.previous().end;
            }

            return attr;
        }
        else if (this.match(types.WORD) || this.match('COMPLEX_VALUE')) {
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
            let qt = new QuotedText(this.previous(), this.advance(), this.advance());
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
            if (arguments[3] !== undefined) {
                rightObj = new CategorizedFilter(expr.attribute, new Token(':', ':', ':'), right, arguments[3]);
            }
            else {
                rightObj = new CategorizedFilter(expr.attribute, new Token(':', ':', ':'), right);
            }
        }
        else if (right instanceof PositiveSingleValue || right instanceof NegativeSingleValue || right instanceof ValueRange) {
            this.error(type + " can not have " + right.type + " attribute:\n", right.begin);
        }
        else if (type === 'Has') {
            rightObj = new Has(expr.key, new Token(':', ':', ':'), right);
        }
        else {
            if (arguments[3] !== undefined)
                rightObj = new Sort(expr.key, new Token(':', ':', ':'), right, arguments[3]);
            else
                rightObj = new Sort(expr.key, new Token(':', ':', ':'), right);
        }
        return rightObj;
    }
}

try {
    let t = new Parser('a:v');
    let res = t.parse();
    console.log(res);
} catch (e) {
    console.log(e);
}

function traverse(obj, str) {
    let i;
    let resString = "";
    for (let key in obj) {
        if (obj[key] instanceof Object && !(obj[key] instanceof Unary) && key !== 'minus' &&
            !(obj[key] instanceof Grouping) && key !== 'attributeFilter' && key !== 'value') {
            resString += traverse(obj[key], str);
        }
        else if (obj[key] instanceof Grouping) {
            resString +=  '<span class="Parentheses">(</span>';
            resString += traverse(obj[key], str);
            resString +=  '<span class="Parentheses">) </span>';
        }
        else {
            if (key === 'type') {
                switch (obj.type) {
                    case 'PositiveSingleValue': {
                        resString += '<span class="' + obj.type + '">' + str.substring(obj.begin, obj.end) + '</span>';
                        break;
                    }
                    case 'NegativeSingleValue': {
                        resString += '<span class="' + obj.type + '">' + str.substring(obj.begin, obj.end) + '</span>';
                        break;
                    }
                    case 'QuotedText': {
                        resString += '<span class="' + obj.type + '">' + str.substring(obj.begin, obj.end) + ' </span>';
                        break;
                    }
                    case 'NegativeText': {
                        resString += '<span class="' + obj.type + '">' + str.substring(obj.begin, obj.end) + ' </span>';
                        break;
                    }
                    case 'key': {
                        resString += '<span class="' + obj.type + '">' + str.substring(obj.begin, obj.end) + '</span>';
                        break;
                    }
                    case 'Attribute': {
                        resString += '<span class="' + obj.type + '">' + str.substring(obj.begin, obj.end) + '</span>';
                        break;
                    }
                    case 'Value': {
                        resString += '<span class="' + obj.type + '">' + str.substring(obj.begin, obj.end) + '</span>';
                        break;
                    }
                    case 'ValueRange': {
                        resString += '<span class="' + obj.type + '">' + str.substring(obj.begin, obj.end) + '</span>';
                        break;
                    }
                    case 'OPERATOR':
                    case ':':
                    case '-':
                    case '#': {
                        if ('begin' in obj) {
                            resString += '<span class="operator">' + str.substring(obj.begin, obj.end) + ' </span>';
                        }
                        else if (obj.lexeme === 'or') {
                            resString += '<span class="operator">, </span>';
                        }
                        break;
                    }
                    default: break;
                }
            }
            else if (key === 'attributeFilter') {
                resString += '<span class="' + obj[key][0].type + '">' + str.substring(obj[key][0].begin, obj[key][0].end) + '</span>';
                for (let cur = 1; cur < obj[key].length; cur++) {
                    resString += '<span class="operator">, </span><span class="' + obj[key][cur].type + '">' + str.substring(obj[key][cur].begin, obj[key][cur].end) + '</span>';
                }
            }
            else if (key === 'value') {
                resString += '<span class="' + obj[key][0].type + '">' + str.substring(obj[key][0].begin, obj[key][0].end) + '</span>';
                for (let cur = 1; cur < obj[key].length; cur++) {
                    resString += '<span class="operator">, </span><span class="' + obj[key][cur].type + '">' + str.substring(obj[key][cur].begin, obj[key][cur].end) + '</span>';
                }
            }
        }
    }
    return resString;
}

let res1 = new NegativeSingleValue(
    new Token('-', '-', '-', 0, 1),
    new Unary(
        new Token('-', '-', '-', 0, 1),
        new Token('WORD', 'c', 'c', 1,2)
    )
);

// let hRes = traverse(res1, '-c');
// document.getElementById('HQuery').innerHTML = hRes;


document.getElementById('inQuery').oninput = function () {
    try {
        let p = new Parser(document.getElementById('inQuery').value);
        let res = p.parse();
        document.getElementById('result').value = JSON.stringify(res, null, 4);
        let hRes = traverse(res, document.getElementById('inQuery').value);
        document.getElementById('HQuery').innerHTML = hRes;
    } catch (e) {
        if (e instanceof errorEx) {
            document.getElementById('result').value = e;
        } else {
            document.getElementById('result').value = 'Text:' + document.getElementById('query').value;
        }
    }
};

module.exports = Parser;