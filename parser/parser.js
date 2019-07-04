let lexer = require('./lexer');

class Parser {
    constructor(str) {
        this.str = str;
        let lex = new lexer(this.str);
        this.tokens = lex.lexer();
        this.current = 0;
        return this.parse();
    }

    parse() {
        return this.tokens;
    }

    expression() {
        return this.equality();
    }

    equality() {
        let expr = this.comparsion();

        while (this.match()) { // TO DO: move the operators enum
            let operator = this.previous();
            let right = this.comparsion();
            // expr = new Binary(expr, operator, right); TO DO: Binary object
        }

        return expr;
    }

    comparsion() {
        let expr = this.addition();

        while (this.match()) { // TO DO: move the operators enum
            let operator = this.previous();
            let right = this.addition();
            // expr = new Binary(expr, operator, right); TO DO: Binary object
        }

        return expr;
    }

    addition() {
        let expr = this.multiplication();

        while (this.match()) { // TO DO: move the operators enum
            let operator = this.previous();
            let right = this.multiplication();
            // expr = new Binary(expr, operator, right); TO DO: Binary object
        }

        return expr;
    }

    multiplication() {
        let expr = this.unary();

        while (this.match()) { // TO DO: move the operators enum
            let operator = this.previous();
            let right = this.unary();
            // expr = new Binary(expr, operator, right); TO DO: Binary object
        }

        return expr;
    }

    unary() {
        if (this.match()) { // TO DO: move the operators enum
            let operator = this.previous();
            let right = this.unary();
            // return new Unary(expr, operator, right); TO DO: Unary object
        }

        return this.primary();
    }

    primary() {
        // TO DO after creating Binary and Unary object and moving operators enum
    }

    match() {
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }

        for (let type in args) {
            if (this.check(type)) {
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
        if (this.isAtEnd()) this.current++;
        return this.previous();
    }

    isAtEnd() {
        return this.peek().type === EOF; // TO DO: define EOF
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

}

module.exports = Parser;