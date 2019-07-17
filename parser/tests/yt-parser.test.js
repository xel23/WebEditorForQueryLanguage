const parser = require('../parser');

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

[
    {input: 'a: b', output:
        new CategorizedFilter(
            new Attribute(
                new Token('WORD', 'a', 'a', 0, 1)
            ),
            new Token(':', ':', ':', 1, 2),
            new AttributeFilter(
                new Token('WORD', 'b', 'b', 3, 4)
            )
        )},

    {input: 'a: {b c}', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 2),
                new AttributeFilter(
                    new Token('WORD', 'b c', 'b c', 3, 8)
                )
            )},

    {input: 'a: -b', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 2),
                new Token('WORD', 'b', 'b', 4, 5),
                new Token('-', '-', '-', 3, 4)
            )},

    {input: 'a: bb .. cc', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 2),
                new ValueRange(
                    new Token('WORD', 'bb', 'bb', 3, 6),
                    new Token('..', '..', '..', 6, 8),
                    new Token('WORD', 'cc', 'cc', 9, 11)
                )
            )},

    {input: 'a: {bb .. cc}', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 2),
                new Token('WORD', 'bb .. cc', 'bb .. cc', 3, 13),
            )},

    {input: 'a: -{bb .. cc}', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 2),
                new Token('WORD', 'bb .. cc', 'bb .. cc', 4, 14),
                new Token('-', '-', '-', 3, 4)
            )},
].forEach((it) => {
    test(`${it.input} should return ${it.output}`, () => {
        let par = new parser(it.input);
        expect(par.parse()).toEqual(it.output);
    })
});