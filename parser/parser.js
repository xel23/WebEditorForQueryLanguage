let lexer = require('./lexer');
let operators = require('./operators');
let types = require('./types');
let symbols = require('./symbols');

class Parser {
    constructor(str) {
        this.str = str;
        let lex = new lexer(this.str);
        this.tokens = lex.scanTokens();
        this.current = 0;
    }

    parse() {
        return this.expression();
    }

    expression() {
        return this.equality();
    }

    equality() {
        let expr = this.comparison();

        while (this.match(operators.BANG_EQUAL, operators.EQUAL_EQUAL)) {
            let operator = this.previous();
            let right = this.comparison();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    comparison() {
        let expr = this.addition();

        while (this.match(operators.GREATER, operators.GREATER_EQUAL, operators.LESS, operators.LESS_EQUAL)) {
            let operator = this.previous();
            let right = this.addition();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    addition() {
        let expr = this.multiplication();

        while (this.match(operators.MINUS, operators.PLUS)) {
            let operator = this.previous();
            let right = this.multiplication();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    multiplication() {
        let expr = this.unary();

        while (this.match(operators.SLASH, operators.STAR)) {
            let operator = this.previous();
            let right = this.unary();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    unary() {
        if (this.match(operators.BANG, operators.MINUS)) {
            let operator = this.previous();
            let right = this.unary();
            return new Unary(operator, right);
        }

        return this.primary();
    }

    primary() {
        if (this.match(types.FALSE)) return new Literal(false);
        if (this.match(types.TRUE)) return new Literal(true);
        if (this.match(types.NULL)) return new Literal(null);

        if (this.match(types.NUMBER)) return new Literal(this.previous().literal);

        if (this.match(operators.LEFT_PAREN)) {
            let expr = this.expression();
            this.consume(operators.RIGHT_PAREN, "Except ')' after expression.");
            return new Grouping(expr);
        }

        throw "Except expression.";
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

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
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

    consume(type, message) {
        if (this.check(type)) return this.advance();

        throw '${this.peek()} , ${message}';
    }

}

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

class Literal {
    constructor(literal) {
        this.literal = literal;
    }
}

class Grouping {
    constructor(expr) {
        this.expr = expr;
    }

}

module.exports = Parser;



// Below is parser for Hub query grammar
class NewParser {
    constructor(str) {
        this.str = str;
        let lex = new lexer(this.str);
        this.tokens = lex.scanTokens();
        this.current = 0;
    }

    parse() {
        return this.orExpression();
    }

    orExpression() {
        return this.andExpression();
    }

    andExpression() {
        let expr = this.signExpression();

        while (this.match(operators.OR)) {
            let operator = this.previous();
            let right = this.signExpression();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    signExpression() {
        let expr = this.item();

        while (this.match(types.OPERATOR, symbols.COMMA)) {
            let operator = this.previous();
            let right = this.item();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    item() {
        let expr = this.unary();

        while (this.match(operators.COLON, types.TUPLE_NAME)) {
            let operator = this.previous();
            let right = this.unary();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    unary() {
        let operator;
        let right = [];
        if (this.match(types.OPERATOR)) {
            operator = this.previous();
            right.push(this.item());
            return new Unary(operator, right);
        }

        let t = this.tokens[this.current + 2].type;
        if (this.matchNext(symbols.COMMA)) {
            if (t !== types.FIELD_NAME) {
                right.push(this.tokens[this.current - 1]);
                t = this.tokens[this.current + 1].type;
                while (this.match(symbols.COMMA) && this.tokens[this.current + 1].type !== types.FIELD_NAME) {
                    right.push(this.tokens[this.current]);
                    this.advance();
                }

                return right;
            }
            else {
                this.current--;
                return this.primary();
            }
        }

        return this.primary();
    }

    primary() {
        if (this.match(types.KEYWORD) || this.match(types.FIELD_NAME) || this.match(types.FIELD_VALUE) ||
            this.match(types.TUPLE_NAME)) return new Literal(this.previous().literal);

        if (this.match(operators.LEFT_PAREN)) {
            let expr = this.orExpression();
            this.consume(operators.RIGHT_PAREN, "Except ')' after expression.");
            return new Grouping(expr);
        }

        throw "Except expression.";
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

    matchNext() {
        for (let i = 0; i < arguments.length; i++) {
            if (this.checkNext(arguments[i])) {
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

    checkNext(type) {
        if (this.isAtEnd()) return false;
        return this.peekNext().type === type;
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

    peekNext() {
        return this.tokens[this.current + 1];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    consume(type, message) {
        if (this.check(type)) return this.advance();

        throw message;
    }
}







class Item {
    constructor() {}

}

class Field extends Item {
    constructor(fieldName, fieldValue) {
        super();
        this.fieldName = fieldName;
        this.filedValue = fieldValue;
    }
}

class Tuple extends Item {
    constructor(tupleName, orExpression) {
        super();
        this.tupleName = tupleName;
        this.orExpression = orExpression;
    }
}


class NewParser_ {
    constructor(str) {
        this.str = str;
        let lex = new lexer(this.str);
        this.tokens = lex.scanTokens();
        this.current = 0;
    }

    parse() {
        return this.orExpression();
    }

    orExpression() {
        return this.andExpression();
    }

    andExpression() {
        let expr = this.signExpression();

        while (this.match(types.OPERATOR)) {
            let operator = this.previous();
            let right = this.signExpression();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    signExpression() {
        let expr = this.item();

        while (this.match(types.OPERATOR, symbols.COMMA, types.TUPLE_NAME)) {
            let operator = this.previous();
            let right = this.item();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    item() {
        let expr = this.unary();

        if (this.match(operators.COLON)) {
            // let operator = this.previous(); tmp disabled
            let right = this.unary();
            expr = new Field(expr, /*operator,*/ right);
        }

        else if(this.match(types.TUPLE_NAME)) {
            // let operator = this.previous();
            let right = this.unary();
            expr = new Tuple(expr, /*operator,*/ right);
        }

        return expr;
    }

    unary() {
        let operator;
        let right = [];
        if (this.match(types.OPERATOR)) {
            operator = this.previous();
            let _right = this.item();
            return new Unary(operator, _right);
        }

        if (!this.isAtEnd(this.current)) {
            let t = this.tokens[this.current + 2].type;
            if (this.matchNext(symbols.COMMA)) {
                if (t !== types.FIELD_NAME) {
                    right.push(this.tokens[this.current - 1]);
                    t = this.tokens[this.current + 1].type;
                    while (this.match(symbols.COMMA) && this.tokens[this.current + 1].type !== types.FIELD_NAME) {
                        right.push(this.tokens[this.current]);
                        this.advance();
                    }

                    return right;
                }
                else {
                    this.current--;
                    return this.primary();
                }
            }
        }


        return this.primary();
    }

    primary() {
        if (this.match(types.KEYWORD) || this.match(types.FIELD_NAME) || this.match(types.FIELD_VALUE) ||
            this.match(types.TUPLE_NAME)) return new Literal(this.previous().literal);

        if (this.match(operators.LEFT_PAREN)) {
            let expr = this.orExpression();
            this.consume(operators.RIGHT_PAREN, "Except ')' after expression.");
            return new Grouping(expr);
        }

        throw "Except expression.";
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

    matchNext() {
        for (let i = 0; i < arguments.length; i++) {
            if (this.checkNext(arguments[i])) {
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

    checkNext(type) {
        if (this.isAtEnd()) return false;
        return this.peekNext().type === type;
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
        return this.tokens[this.current + 1];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    consume(type, message) {
        if (this.check(type)) return this.advance();

        throw message;
    }
}

try {
    // let t = new NewParser_('login: {darth.vader}, yoda access(project: DS,with: Developer)');
    // let t = new NewParser_('not authModule: Google and has: ownRole');
    let t = new NewParser_('accessible(for: {Vader}, with: Developer) and accessible(for: Yoda)');
    let checking = t.parse();
    console.log(checking);
} catch(e) {
    console.log(e);
}