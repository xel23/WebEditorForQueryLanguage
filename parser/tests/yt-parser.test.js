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
        this.value = value;
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
        this.attribute = new Attribute(attribute);
        this.operator = operator;
        if (arguments[3] !== undefined)
            this.attributeFilter = new AttributeFilter(attributeFilter, arguments[3]);
        else
            this.attributeFilter = new AttributeFilter(attributeFilter);
    }
}

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
        this.operator = operator;
        this.value = new SortAttribute(value);
        if (arguments[3] !== undefined) {
            this.order = arguments[3];
        }
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

    {input: 'a: -bb .. cc', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 2),
                new ValueRange(
                    new Token('WORD', 'bb', 'bb', 4, 7),
                    new Token('..', '..', '..', 7, 9),
                    new Token('WORD', 'cc', 'cc', 10, 12),
                ),
                new Token('-', '-','-', 3, 4)
            )},

    {input: 'has: field', output:
            new Has(
                new Token('WORD', 'has', 'has', 0, 3),
                new Token(':', ':', ':', 3, 4),
                new Attribute(
                    new Token('WORD', 'field', 'field', 5, 10)
                )
            )},

    {input: 'a: -bb .. cc has: field', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 2),
                    new ValueRange(
                        new Token('WORD', 'bb', 'bb', 4, 7),
                        new Token('..', '..', '..', 7, 9),
                        new Token('WORD', 'cc', 'cc', 10, 13),
                    ),
                    new Token('-', '-','-', 3, 4)
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Has(
                    new Token('WORD', 'has', 'has', 13, 16),
                    new Token(':', ':', ':', 16, 17),
                    new Attribute(
                        new Token('WORD', 'field', 'field', 18, 23)
                    )
                )
            )},

    {input: 'a: b and a: c', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 2),
                    new AttributeFilter(
                        new Token('WORD', 'b', 'b', 3, 5)
                    )
                ),
                new Token('OPERATOR', 'and', 'and', 5, 9),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 9, 10)
                    ),
                    new Token(':', ':', ':', 10, 11),
                    new AttributeFilter(
                        new Token('WORD', 'c', 'c', 12, 13)
                    )
                )
            )},

    {input: 'a: b or a: c', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 2),
                    new AttributeFilter(
                        new Token('WORD', 'b', 'b', 3, 5)
                    )
                ),
                new Token('OPERATOR', 'or', 'or', 5, 8),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 8, 9)
                    ),
                    new Token(':', ':', ':', 9, 10),
                    new AttributeFilter(
                        new Token('WORD', 'c', 'c', 11, 12)
                    )
                )
            )},

    {input: 'a: b a: c', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 2),
                    new AttributeFilter(
                        new Token('WORD', 'b', 'b', 3, 5)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 5, 6)
                    ),
                    new Token(':', ':', ':', 6, 7),
                    new AttributeFilter(
                        new Token('WORD', 'c', 'c', 8, 9)
                    )
                )
            )},

    {input: 'sort by: field', output:
            new Sort(
                new Token('WORD', 'sort by', 'sort by', 0, 7),
                new Token(':', ':', ':', 7, 8),
                new Token('WORD', 'field', 'field', 9, 14)
            )},

    {input: 'a: b sort by: field', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 2),
                    new AttributeFilter(
                        new Token('WORD', 'b', 'b', 3, 5)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Sort(
                    new Token('WORD', 'sort by', 'sort by', 5, 12),
                    new Token(':', ':', ':', 12, 13),
                    new Token('WORD', 'field', 'field', 14, 19)
                )
            )},

    {input: '-c', output:
            new NegativeSingleValue(
                new Token('-', '-', '-', 0, 1),
                new Unary(
                    new Token('-', '-', '-', 0, 1),
                    new Token('WORD', 'c', 'c', 1, 2)
                )
            )},

    {input: '#c', output:
            new PositiveSingleValue(
                new Token('#', '#', '#', 0, 1),
                new Unary(
                    new Token('#', '#', '#', 0, 1),
                    new Token('WORD', 'c', 'c', 1, 2)
                )
            )},

    {input: '#c -n', output:
            new Binary(
                new PositiveSingleValue(
                    new Token('#', '#', '#', 0, 1),
                    new Unary(
                        new Token('#', '#', '#', 0, 1),
                        new Token('WORD', 'c', 'c', 1, 3)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new NegativeSingleValue(
                    new Token('-', '-', '-', 3, 4),
                    new Unary(
                        new Token('-', '-', '-', 3, 4),
                        new Token('WORD', 'n', 'n', 4, 5)
                    )
                )
            )},

    {input: 'a:m -n', output:
            new Binary(
                new CategorizedFilter(
                    new Token('WORD', 'a', 'a', 0, 1),
                    new Token(':', ':', ':', 1, 2),
                    new Token('WORD', 'm' ,'m', 2, 4)
                ),
                new Token('OPERATOR', 'and', 'and'),
                new NegativeSingleValue(
                    new Token('-', '-', '-', 4, 5),
                    new Unary(
                        new Token('-', '-', '-', 4, 5),
                        new Token('WORD', 'n', 'n', 5, 6)
                    )
                )
            )},

    {input: '-"a new attr: m or -n"', output:
            new NegativeText(
                new Token('-', '-', '-', 0, 1),
                new QuotedText(
                    new Token('"', '"', '"', 1, 2),
                    new Token('QUOTED_TEXT', 'a new attr: m or -n', 'a new attr: m or -n', 2, 21),
                    new Token('"', '"', '"', 21, 22)
                )
            )},

    {input: '"a new attr: m or -n"', output:
            new QuotedText(
                new Token('"', '"', '"', 0, 1),
                new Token('QUOTED_TEXT', 'a new attr: m or -n', 'a new attr: m or -n', 1, 20),
                new Token('"', '"', '"', 20, 21)
            )},

    {input: 'name: val1, val2, val3', output:
            new Binary(
                new Binary(
                    new CategorizedFilter(
                        new Attribute(
                            new Token('WORD', 'name', 'name', 0, 4)
                        ),
                        new Token(':', ':', ':', 4, 5),
                        new Token('WORD', 'val1', 'val1', 6, 10)
                    ),
                    new Token('OPERATOR', 'or', 'or'),
                    new CategorizedFilter(
                        new Attribute(
                            new Token('WORD', 'name', 'name', 0, 4)
                        ),
                        new Token(':', ':', ':'),
                        new Token('WORD', 'val2', 'val2', 12, 16)
                    )
                ),
                new Token('OPERATOR', 'or', 'or'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'name', 'name', 0, 4)
                    ),
                    new Token(':' ,':', ':'),
                    new Token('WORD', 'val3', 'val3', 18, 22)
                )
            )},

    {input: 'name: val1, val2 .. lav2, val3', output:
            new Binary(
                new Binary(
                    new CategorizedFilter(
                        new Attribute(
                            new Token('WORD', 'name', 'name', 0, 4)
                        ),
                        new Token(':', ':', ':', 4, 5),
                        new Token('WORD', 'val1', 'val1', 6, 10)
                    ),
                    new Token('OPERATOR', 'or', 'or'),
                    new CategorizedFilter(
                        new Attribute(
                            new Token('WORD', 'name', 'name', 0, 4)
                        ),
                        new Token(':', ':', ':'),
                        new ValueRange(
                            new Token('WORD', 'val2', 'val2', 12, 17),
                            new Token('..', '..', '..', 17, 19),
                            new Token('WORD', 'lav2', 'lav2', 20, 24)
                        )
                    )
                ),
                new Token('OPERATOR', 'or', 'or'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'name', 'name', 0, 4)
                    ),
                    new Token(':' ,':', ':'),
                    new Token('WORD', 'val3', 'val3', 26, 30)
                )
            )},

    {input: 'has: val1, val2, val3', output:
            new Binary(
                new Binary(
                    new Has(
                        new Token('WORD', 'has', 'has', 0, 3),
                        new Token(':', ':', ':', 3, 4),
                        new Token('WORD', 'val1', 'val1', 5, 9)
                    ),
                    new Token('OPERATOR', 'or', 'or'),
                    new Has(
                        new Token('WORD', 'has', 'has', 0, 3),
                        new Token(':', ':', ':'),
                        new Token('WORD', 'val2', 'val2', 11, 15)
                    )
                ),
                new Token('OPERATOR', 'or', 'or'),
                new Has(
                    new Token('WORD', 'has', 'has', 0, 3),
                    new Token(':', ':', ':'),
                    new Token('WORD', 'val3', 'val3', 17, 21)
                )
            )},

    {input: 'sort by: val1, val2, val3', output:
            new Binary(
                new Binary(
                    new Sort(
                        new Token('WORD', 'sort by', 'sort by', 0, 7),
                        new Token(':', ':', ':', 7, 8),
                        new Token('WORD', 'val1', 'val1', 9, 13)
                    ),
                    new Token('OPERATOR', 'or', 'or'),
                    new Sort(
                        new Token('WORD', 'sort by', 'sort by', 0, 7),
                        new Token(':', ':', ':'),
                        new Token('WORD', 'val2', 'val2', 15, 19)
                    )
                ),
                new Token('OPERATOR', 'or', 'or'),
                new Sort(
                    new Token('WORD', 'sort by', 'sort by', 0, 7),
                    new Token(':', ':', ':'),
                    new Token('WORD', 'val3', 'val3', 21, 25)
                )
            )},

    {input: 'sort by: val1, val2 asc, val3', output:
            new Binary(
                new Binary(
                    new Sort(
                        new Token('WORD', 'sort by', 'sort by', 0, 7),
                        new Token(':', ':', ':', 7, 8),
                        new Token('WORD', 'val1', 'val1', 9, 13)
                    ),
                    new Token('OPERATOR', 'or', 'or'),
                    new Sort(
                        new Token('WORD', 'sort by', 'sort by', 0, 7),
                        new Token(':', ':', ':'),
                        new Token('WORD', 'val2', 'val2', 15, 20),
                        new Token('WORD', 'asc', 'asc', 20, 23)
                    )
                ),
                new Token('OPERATOR', 'or', 'or'),
                new Sort(
                    new Token('WORD', 'sort by', 'sort by', 0, 7),
                    new Token(':', ':', ':'),
                    new Token('WORD', 'val3', 'val3', 25, 29)
                )
            )},

    {input: 'sort by: val1, val2 asc two: name', output:
            new Binary(
                new Binary(
                    new Sort(
                        new Token('WORD', 'sort by', 'sort by', 0, 7),
                        new Token(':', ':', ':', 7, 8),
                        new Token('WORD', 'val1', 'val1', 9, 13)
                    ),
                    new Token('OPERATOR', 'or', 'or'),
                    new Sort(
                        new Token('WORD', 'sort by', 'sort by', 0, 7),
                        new Token(':', ':', ':'),
                        new Token('WORD', 'val2', 'val2', 15, 20),
                        new Token('WORD', 'asc', 'asc', 20, 24)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'two', 'two', 24, 27)
                    ),
                    new Token(':', ':', ':', 27, 28),
                    new Token('WORD', 'name', 'name', 29, 33)
                )
            )},

    {input: 'by: val1, val2 asc two: name', output:
            new Binary(
                new Binary(
                    new CategorizedFilter(
                        new Attribute(
                            new Token('WORD', 'by', 'by', 0, 2)
                        ),
                        new Token(':', ':', ':', 2, 3),
                        new Token('WORD', 'val1', 'val1', 4, 8)
                    ),
                    new Token('OPERATOR', 'or', 'or'),
                    new CategorizedFilter(
                        new Attribute(
                            new Token('WORD', 'by', 'by', 0, 2)
                        ),
                        new Token(':', ':', ':'),
                        new Token('WORD', 'val2', 'val2', 10, 15),
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'asc two', 'asc two', 15, 22)
                    ),
                    new Token(':', ':', ':', 22, 23),
                    new Token('WORD', 'name', 'name', 24, 28)
                )
            )},

    {input: '(a: b or a: g) and t: s', output:
            new Binary(
                new Grouping(
                    new Token('(', '(', '(', 0, 1),
                    new Binary(
                        new CategorizedFilter(
                            new Attribute(
                                new Token('WORD', 'a', 'a', 1, 2)
                            ),
                            new Token(':', ':', ':', 2, 3),
                            new Token('WORD', 'b', 'b', 4, 6)
                        ),
                        new Token('OPERATOR', 'or', 'or', 6, 9),
                        new CategorizedFilter(
                            new Attribute(
                                new Token('WORD', 'a', 'a', 9, 10)
                            ),
                            new Token(':', ':', ':', 10, 11),
                            new Token('WORD', 'g', 'g', 12, 13)
                        )
                    ),
                    new Token(')', ')', ')', 13, 14)
                ),
                new Token('OPERATOR', 'and', 'and', 15, 19),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 't', 't', 19, 20)
                    ),
                    new Token(':', ':', ':', 20, 21),
                    new Token('WORD', 's', 's', 22, 23)
                )
            )},

    {input: 'test: my, -me', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 0, 4)
                    ),
                    new Token(':', ':', ':', 4, 5),
                    new Token('WORD', 'my', 'my', 6, 8)
                ),
                new Token('OPERATOR', 'or', 'or'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 0, 4)
                    ),
                    new Token(':', ':', ':'),
                    new Token('WORD', 'me', 'me', 11, 13),
                    new Token('-', '-', '-', 10, 11)
                )
            )},

    {input: 'test: my, -me .. be', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 0, 4)
                    ),
                    new Token(':', ':', ':', 4, 5),
                    new Token('WORD', 'my', 'my', 6, 8)
                ),
                new Token('OPERATOR', 'or', 'or'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 0, 4)
                    ),
                    new Token(':', ':', ':'),
                    new ValueRange(
                        new Token('WORD', 'me', 'me', 11, 14),
                        new Token('..', '..', '..', 14, 16),
                        new Token('WORD', 'be', 'be', 17, 19)
                    ),
                    new Token('-', '-', '-', 10, 11)
                )
            )},

].forEach((it) => {
    test(`${it.input} should return ${it.output}`, () => {
        let par = new parser(it.input);
        expect(par.parse()).toEqual(it.output);
    })
});