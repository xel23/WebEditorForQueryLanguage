let lexer = require('./lexer');
let operators = require('./operators');
let types = require('./types');

class Parser {
    constructor(str) {
        this.str = str;
        let lex = new lexer(this.str);
        this.tokens = lex.scanTokens();
        this.current = 0;
        return this.parse();
    }

    parse() {
        // return this.tokens;
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