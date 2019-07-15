// TO DO: position for all tokens
// exceptions for parser

let lexer = require('./lexer');
let operators = require('./operators');
let types = require('./types');

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

// Below is parser for Hub query grammar
class Item {
    // constructor(begin, end) {
    //     this.begin = begin;
    //     this.end = end;
    // }
    constructor () {

    }
}

class Field extends Item {
    constructor(fieldName, operator, fieldValue) {
        // super(begin, end);
        super();
        this.fieldName = fieldName;
        this.operator = operator;
        this.filedValue = fieldValue;
    }
}

class Tuple extends Item {
    constructor(tupleName, orExpression) {
        // super(begin, end);
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

    getTree() {
        return this.orExpression();
    }

    parse() {
        let tree = this.getTree();
        // if (this.current < this.tokens.length - 1) {
        //     throw "Incomplete query after: '" + this.tokens[this.current].literal + "'";
        // }
        // else {
            return tree;
        // }
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

        while (this.matchOperator(operators.NOT)) {
            let operator = this.previous();
            let right = this.item();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    item() {
        let expr = this.unary();

        if (this.match(operators.COLON)) {
            let operator = this.previous();
            let right = this.unary();
            expr = new Field(expr, operator, right);
        }

        else if(this.match(types.TUPLE_NAME) || this.tokens[this.current - 1].type === types.TUPLE_NAME) {
            // let operator = this.previous();
            let right = this.unary();
            expr = new Tuple(expr, /*operator,*/ right);
        }

        return expr;
    }

    unary() {
        if (this.match(types.OPERATOR)) {
            let operator = this.previous();
            if (operator.lexeme !== operators.NOT) {
                throw "Binary operator '" + operator.start + "' must have left expression";
            }
            let right = this.item();
            return new Unary(operator, right);
        }

        return this.primary();
    }

    primary() {
        if (this.match(types.FIELD_NAME) || this.match(types.FIELD_VALUE) || this.match(types.TUPLE_NAME) ||
            this.match(types.STRING)) return this.previous();

        if (this.match(operators.LEFT_PAREN)) {
            let left = this.tokens[this.current - 1];
            let expr = this.orExpression();
            if (this.check(operators.RIGHT_PAREN)) this.advance();
            else {
                let err = "";
                for (let i = 0; i < this.str.length; i++) err += " ";
                throw "SyntaxError: missing ')' after expression:\n" + this.str + "\n" + err + "^";
            }
            let right = this.tokens[this.current - 1];
            return new Grouping(left, expr, right);
        }

        let err = "";
        if (this.tokens[this.current - 1].type !== operators.LEFT_PAREN) {
            for (let i = 0; i < this.tokens[this.current - 1].end + 1; i++) err += " ";
            throw "Expect SignExpression after '" + this.tokens[this.current - 1].lexeme + "'\n" + this.str + "\n" +
            err + "^";
        } else {
            for (let i = 0; i < this.str.length; i++) err += " ";
            throw "Expect OrExpression after '" + this.tokens[this.current - 1].lexeme + "'\n" + this.str + "\n" + err + "^";
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
            let err = "";
            for (let i = 0; i < this.tokens[this.current - 1].end + 1; i++) err += " ";
            this.error("Expect SignExpression after '" + this.tokens[this.current - 1].lexeme + "'\n" + this.str + "\n" +
            err + "^");
        }
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    error() {
        throw message;
    }
}

class Token {
    constructor(type, lexeme, literal) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        if (arguments[3] !== undefined) {
            this.begin = arguments[3];
            this.end = arguments[4];
        }
    }

    toString() {
        return this.type + " " + this.lexeme + " " + this.literal;
    }
}

try {
    let t = new Parser('(login: user or login: user1) and accessible(with: pp or with: tt)');
    let checking = t.parse();
    console.log(checking);
} catch(e) {
    console.log(e);
}

// document.getElementById('query').oninput = function () {
//     try {
//         let p = new Parser(document.getElementById('query').value);
//         let res = p.parse();
//         document.getElementById('result').value = JSON.stringify(res, null, 4);
//     } catch (e) {
//         document.getElementById('result').value = e;

// foo(bar: A or bar: B ()
//     }
// };

module.exports = Parser;