// TO DO: fix bug related with several commas and Field after that
// whitespaces

let lexer = require('./lexer');
let operators = require('./operators');
let types = require('./types');
let symbols = require('./symbols');

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
    constructor(expr) {
        this.expr = expr;
    }

}

// Below is parser for Hub query grammar
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


class Parser {
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
        let expr = this.andExpression();

        while (this.matchOperator(operators.OR)) {
            let operator = this.previous();
            let right = this.andExpression();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    andExpression() {
        let expr = this.signExpression();

        while (this.matchOperator(operators.AND)) {
            let operator = this.previous();
            let right = this.signExpression();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    signExpression() {
        let expr = this.item();

        while (this.match(symbols.COMMA) || this.matchOperator(operators.NOT)) {
            if (expr instanceof Field) {
                let operator = this.previous();
                let right = this.item();
                expr = new Binary(expr, operator, right);
            }
            else {
                throw 'Operator "," must has Field like left operand'
            }
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

        else if(this.match(types.TUPLE_NAME) || this.tokens[this.current - 1].type === types.TUPLE_NAME) {
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
            if (operator.lexeme !== operators.NOT) throw 'Binary operator does not have left expression';
            let _right = this.item();
            return new Unary(operator, _right);
        }

        if (!this.isAtEnd(this.current)) {
            let t = this.tokens[this.current + 2].type;
            if (this.matchNext(symbols.COMMA)) {
                if (t !== types.FIELD_NAME) {
                    right.push(this.tokens[this.current - 1]);
                    t = this.tokens[this.current + 1].type;
                    while (this.match(symbols.COMMA) && t !== types.FIELD_NAME) {
                        if (this.isAtEnd()) {
                            return right;
                        }
                        else {
                            right.push(this.tokens[this.current]);
                            this.advance();
                            if (this.isAtEnd())
                                return right;
                            else
                                t = this.tokens[this.current + 1].type;
                        }
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
        // if (this.match(types.KEYWORD) || this.match(types.FIELD_NAME) || this.match(types.FIELD_VALUE) ||
        //     this.match(types.TUPLE_NAME)) return new Literal(this.previous().literal);

        if (this.match(types.KEYWORD) || this.match(types.FIELD_NAME) || this.match(types.FIELD_VALUE) ||
            this.match(types.TUPLE_NAME) || this.match(types.STRING)) return this.previous().literal;

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

    matchOperator() {
        for (let i = 0; i < arguments.length; i++) {
            if (this.checkOperator(arguments[i])) {
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

    checkOperator(type) {
        if (this.isAtEnd()) return false;
        return this.peek().lexeme === type;
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

// try {
//     // let t = new Parser('login: {darth.vader}, yoda access(project: DS, with: Developer)'); should we use 'access' like operator?
//     // let t = new Parser('not authModule: Google and has: ownRole');
//     // let t = new Parser('accessible(for: {Vader}, with: Developer) and accessible(for: Yoda)');
//     // let t = new Parser('(login: admin or login: root) and hasLicense: YouTrack');
//     // let t = new Parser('(login: admin or group: star-team) and access(project: {Death Star}, with: {Low-level Admin Read})');
//     let t = new Parser('login: admin, pass,');
//     let checking = t.parse();
//     console.log(checking);
// } catch(e) {
//     console.log(e);
// }

document.getElementById('query').oninput = function () {
    try {
        let p = new Parser(document.getElementById('query').value);
        let res = p.parse();
        document.getElementById('result').value = JSON.stringify(res, null, 7);
    } catch (e) {
        document.getElementById('result').value = 'Incorrect query';
    }
};

module.exports = Parser;