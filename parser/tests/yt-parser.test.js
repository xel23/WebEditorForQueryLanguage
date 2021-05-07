const parser = require('../parser');
const Token = require('../token');
const NegativeSingleValue = require('../general/NegativeSingleValue');
const Binary = require('../general/Binary');
const ValueRange = require('../general/ValueRange');
const Grouping = require('../general/Grouping');
const TermItem = require('../general/TermItem');
const QuotedText = require('../general/QuotedText');
const NegativeText = require('../general/NegativeText');
const PositiveSingleValue = require('../general/PositiveSingleValue');
const AttributeFilter = require('../general/AttributeFilter');
const Attribute = require('../general/Attribute');
const Text = require('../general/Text');

class Has extends TermItem {
    constructor(has, operator, value) {
        super('Has', has.begin, value.end);
        this.value = [];

        if (value instanceof Array) {
            value.forEach((element) => {
                if (element.type === ',') {
                    this.value.push(element);
                }
                else {
                    this.value.push(new Attribute(element));
                }
                this.end = element.end;
            })
        }
        else {
            this.value.push(new Attribute(value));
        }

        this.key = has;
        this.key.type = 'key';
        this.operator = operator;
    }

    addAttribute(token) {
        this.value.push(new Attribute(token));
    }
}

class CategorizedFilter extends TermItem {
    constructor(attribute, operator, attributeFilter) {
        super('CategorizedFilter', attribute.begin, attributeFilter instanceof ValueRange ? attributeFilter.rightVal.end : attributeFilter.end);
        this.attribute = attribute;
        this.operator = operator;
        this.attributeFilter = [];
        if (attributeFilter instanceof Array) {
            attributeFilter.forEach((element) => {
                if (element.type === ',') {
                    this.attributeFilter.push(element);
                }
                else {
                    this.attributeFilter.push(new AttributeFilter(element));
                }
                this.end = element.end;
            })
        }
        else {
            this.attributeFilter.push(new AttributeFilter(attributeFilter));
        }
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
        let word = value;
        if (value.type !== 'TEXT') {
            word = value.literal.split(' ');
        }
        if (word.length > 1) {
            this.type = value.type;
            this.lexeme = word[0];
            this.literal = word[0];
            this.begin = value.begin;
            this.end = value.end - word[1].length - 1;
            this.order = new Token('WORD', word[1], word[1], value.end - word[1].length - 1, value.end);
        } else {
            this.type = value.type;
            this.lexeme = value.lexeme;
            this.literal = value.literal;
            this.begin = value.begin;
            this.end = value.end;
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
        if (value instanceof Array) {
            value.forEach((element) => {
                if (element.type === ',') {
                    this.value.push(element);
                }
                else {
                    this.value.push(new SortAttribute(element));
                }
                this.end = element.end;
            })
        }
        else {
            this.value.push(new SortAttribute(value));
        }
    }

    addValue(token) {
        if (arguments[1] !== undefined) {
            this.value.push(new SortAttribute(token, arguments[1]));
        }
        else {
            this.value.push(new SortAttribute(token));
        }
    }
}

[
    {input: 'a: b', output:
        new CategorizedFilter(
            new Attribute(
                new Token('WORD', 'a', 'a', 0, 1)
            ),
            new Token(':', ':', ':', 1, 3),
            new AttributeFilter(
                new Token('WORD', 'b', 'b', 3, 4)
            )
        )},

    {input: 'a: {b c}', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 3),
                new AttributeFilter(
                    new Token('WORD', 'b c', 'b c', 3, 8)
                )
            )},

    {input: 'a: -b', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 3),
                new NegativeSingleValue(
                    new Token('-', '-', '-', 3, 4),
                    new Token('WORD', 'b', 'b', 4, 5)
                )
            )},

    {input: 'a: bb .. cc', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 3),
                new ValueRange(
                    new Token('WORD', 'bb', 'bb', 3, 6),
                    new Token('..', '..', '..', 6, 9),
                    new Token('WORD', 'cc', 'cc', 9, 11)
                )
            )},

    {input: 'a: {bb .. cc}', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 3),
                new Token('WORD', 'bb .. cc', 'bb .. cc', 3, 13),
            )},

    {input: 'a: -{bb .. cc}', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 3),
                new NegativeSingleValue(
                    new Token('-', '-', '-', 3, 4),
                    new Token('WORD', 'bb .. cc', 'bb .. cc', 4, 14)
                )
            )},

    {input: 'a: -bb .. cc', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'a', 'a', 0, 1)
                ),
                new Token(':', ':', ':', 1, 3),
                new NegativeSingleValue(
                    new Token('-', '-','-', 3, 4),
                    new ValueRange(
                        new Token('WORD', 'bb', 'bb', 4, 7),
                        new Token('..', '..', '..', 7, 10),
                        new Token('WORD', 'cc', 'cc', 10, 12),
                    )
                )
            )},

    {input: 'has: field', output:
            new Has(
                new Token('WORD', 'has', 'has', 0, 3),
                new Token(':', ':', ':', 3, 5),
                new Token('Value', 'field', 'field', 5, 10)
            )},

    {input: 'a: -bb .. cc has: field', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 3),
                    new NegativeSingleValue(
                        new Token('-', '-','-', 3, 4),
                        new ValueRange(
                            new Token('WORD', 'bb', 'bb', 4, 7),
                            new Token('..', '..', '..', 7, 10),
                            new Token('WORD', 'cc', 'cc', 10, 13),
                        )
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Has(
                    new Token('WORD', 'has', 'has', 13, 16),
                    new Token(':', ':', ':', 16, 18),
                    new Token('Value', 'field', 'field', 18, 23)
                )
            )},

    {input: 'a: b and a: c', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 3),
                    new AttributeFilter(
                        new Token('WORD', 'b', 'b', 3, 5)
                    )
                ),
                new Token('OPERATOR', 'and', 'and', 5, 9),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 9, 10)
                    ),
                    new Token(':', ':', ':', 10, 12),
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
                    new Token(':', ':', ':', 1, 3),
                    new AttributeFilter(
                        new Token('WORD', 'b', 'b', 3, 5)
                    )
                ),
                new Token('OPERATOR', 'or', 'or', 5, 8),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 8, 9)
                    ),
                    new Token(':', ':', ':', 9, 11),
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
                    new Token(':', ':', ':', 1, 3),
                    new AttributeFilter(
                        new Token('WORD', 'b', 'b', 3, 5)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 5, 6)
                    ),
                    new Token(':', ':', ':', 6, 8),
                    new AttributeFilter(
                        new Token('WORD', 'c', 'c', 8, 9)
                    )
                )
            )},

    {input: 'sort by: field', output:
            new Sort(
                new Token('WORD', 'sort by', 'sort by', 0, 7),
                new Token(':', ':', ':', 7, 9),
                new Token('Value', 'field', 'field', 9, 14)
            )},

    {input: 'a: b sort by: field', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 3),
                    new AttributeFilter(
                        new Token('WORD', 'b', 'b', 3, 5)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Sort(
                    new Token('WORD', 'sort by', 'sort by', 5, 12),
                    new Token(':', ':', ':', 12, 14),
                    new Token('Value', 'field', 'field', 14, 19)
                )
            )},

    {input: '-c', output:
            new NegativeSingleValue(
                new Token('-', '-', '-', 0, 1),
                new Token('WORD', 'c', 'c', 1, 2)
            )},

    {input: '#c', output:
            new PositiveSingleValue(
                new Token('#', '#', '#', 0, 1),
                new Token('WORD', 'c', 'c', 1, 2)
            )},

    {input: '#c -n', output:
            new Binary(
                new PositiveSingleValue(
                    new Token('#', '#', '#', 0, 1),
                    new Token('WORD', 'c', 'c', 1, 3)
                ),
                new Token('OPERATOR', 'and', 'and'),
                new NegativeSingleValue(
                    new Token('-', '-', '-', 3, 4),
                    new Token('WORD', 'n', 'n', 4, 5)
                )
            )},

    {input: 'a:m -n', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 2),
                    new Token('WORD', 'm' ,'m', 2, 4)
                ),
                new Token('OPERATOR', 'and', 'and'),
                new NegativeSingleValue(
                    new Token('-', '-', '-', 4, 5),
                    new Token('WORD', 'n', 'n', 5, 6)
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
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'name', 'name', 0, 4)
                ),
                new Token(':', ':', ':', 4, 6),
                [
                    new Token('WORD', 'val1', 'val1', 6, 10),
                    new Token(',', ',', ',', 10, 12),
                    new Token('WORD', 'val2', 'val2', 12, 16),
                    new Token(',', ',', ',', 16, 18),
                    new Token('WORD', 'val3', 'val3', 18, 22)
                ]
            )
        },

    {input: 'name: val1, val2 .. lav2, val3', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'name', 'name', 0, 4)
                ),
                new Token(':', ':', ':', 4, 6),
                [
                    new Token('WORD', 'val1', 'val1', 6, 10),
                    new Token(',', ',', ',', 10, 12),
                    new ValueRange(
                        new Token('WORD', 'val2', 'val2', 12, 17),
                        new Token('..', '..', '..', 17, 20),
                        new Token('WORD', 'lav2', 'lav2', 20, 24)
                    ),
                    new Token(',', ',', ',', 24, 26),
                    new Token('WORD', 'val3', 'val3', 26, 30)
                ]
            )},

    {input: 'has: val1, val2, val3', output:
            new Has(
                new Token('WORD', 'has', 'has', 0, 3),
                new Token(':', ':', ':', 3, 5),
                [
                    new Token('Value', 'val1', 'val1', 5, 9),
                    new Token(',', ',', ',', 9, 11),
                    new Token('Value', 'val2', 'val2', 11, 15),
                    new Token(',', ',', ',', 15, 17),
                    new Token('Value', 'val3', 'val3', 17, 21),
                ]
            )},

    {input: 'sort by: val1, val2, val3', output:
            new Sort(
                new Token('WORD', 'sort by', 'sort by', 0, 7),
                new Token(':', ':', ':', 7, 9),
                [
                    new Token('Value', 'val1', 'val1', 9, 13),
                    new Token(',', ',', ',', 13, 15),
                    new Token('Value', 'val2', 'val2', 15, 19),
                    new Token(',', ',', ',', 19, 21),
                    new Token('Value', 'val3', 'val3', 21, 25)
                ]
            )},

    {input: 'sort by: val1, val2 asc , val3', output:
            new Sort(
                new Token('WORD', 'sort by', 'sort by', 0, 7),
                new Token(':', ':', ':', 7, 9),
                [
                    new Token('Value', 'val1', 'val1', 9, 13),
                    new Token(',', ',', ',', 13, 15),
                    new Token('Value', 'val2 asc', 'val2 asc', 15, 24),
                    new Token(',', ',', ',', 24, 26),
                    new Token('Value', 'val3', 'val3', 26, 30)
                ]
            )},

    {input: 'sort by: val1, val2 asc two: name', output:
            new Binary(
                new Sort(
                    new Token('WORD', 'sort by', 'sort by', 0, 7),
                    new Token(':', ':', ':', 7, 9),
                    [
                        new Token('Value', 'val1', 'val1', 9, 13),
                        new Token(',', ',', ',', 13, 15),
                        new Token('Value', 'val2 asc', 'val2 asc', 15, 24)
                    ]
                ),
                new Token('OPERATOR', 'and', 'and'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'two', 'two', 24, 27)
                    ),
                    new Token(':', ':', ':', 27, 29),
                    new Token('WORD', 'name', 'name', 29, 33)
                )
            )},

    {input: 'by: val1, val2 asc two: name', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'by', 'by', 0, 2)
                    ),
                    new Token(':', ':', ':', 2, 4),
                    [
                        new Token('WORD', 'val1', 'val1', 4, 8),
                        new Token(',', ',', ',', 8, 10),
                        new Token('WORD', 'val2', 'val2', 10, 15)
                    ]
                ),
                new Token('OPERATOR', 'and', 'and'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'asc two', 'asc two', 15, 22)
                    ),
                    new Token(':', ':', ':', 22, 24),
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
                            new Token(':', ':', ':', 2, 4),
                            new Token('WORD', 'b', 'b', 4, 6)
                        ),
                        new Token('OPERATOR', 'or', 'or', 6, 9),
                        new CategorizedFilter(
                            new Attribute(
                                new Token('WORD', 'a', 'a', 9, 10)
                            ),
                            new Token(':', ':', ':', 10, 12),
                            new Token('WORD', 'g', 'g', 12, 13)
                        )
                    ),
                    new Token(')', ')', ')', 13, 15)
                ),
                new Token('OPERATOR', 'and', 'and', 15, 19),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 't', 't', 19, 20)
                    ),
                    new Token(':', ':', ':', 20, 22),
                    new Token('WORD', 's', 's', 22, 23)
                )
            )},

    {input: 'test: my, -me', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'test', 'test', 0, 4)
                ),
                new Token(':', ':', ':', 4, 6),
                [
                    new Token('WORD', 'my', 'my', 6, 8),
                    new Token(',', ',', ',', 8, 10),
                    new NegativeSingleValue(
                        new Token('-', '-', '-', 10, 11),
                        new Token('WORD', 'me', 'me', 11, 13)
                    )
                ]
            )},

    {input: 'test: my, -me .. be', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'test', 'test', 0, 4)
                ),
                new Token(':', ':', ':', 4, 6),
                [
                    new Token('WORD', 'my', 'my', 6, 8),
                    new Token(',', ',', ',', 8, 10),
                    new NegativeSingleValue(
                        new Token('-', '-', '-', 10, 11),
                        new ValueRange(
                            new Token('WORD', 'me', 'me', 11, 14),
                            new Token('..', '..', '..', 14, 17),
                            new Token('WORD', 'be', 'be', 17, 19),
                        )
                    )
                ]
            )},

    {input: 'test: t, me test: gg', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 0, 4)
                    ),
                    new Token(':', ':', ':', 4, 6),
                    [
                        new Token('WORD', 't', 't', 6, 7),
                        new Token(',', ',', ',', 7, 9),
                        new Token('WORD', 'me', 'me', 9, 12)
                    ]
                ),
                new Token('OPERATOR', 'and', 'and'),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 12, 16)
                    ),
                    new Token(':', ':', ':', 16, 18),
                    new Token('WORD', 'gg', 'gg', 18, 20)
                )
            )},

    {input: 'test: t or t: g, m', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 0, 4)
                    ),
                    new Token(':', ':', ':', 4, 6),
                    new Token('WORD', 't', 't', 6, 8),
                ),
                new Token('OPERATOR', 'or', 'or', 8, 11),
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 't', 't', 11, 12)
                    ),
                    new Token(':', ':', ':', 12, 14),
                    [
                        new Token('WORD', 'g', 'g', 14, 15),
                        new Token(',', ',', ',', 15, 17),
                        new Token('WORD', 'm', 'm', 17, 18)
                    ]
                )
            )},

    {input: 'test: t..m', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'test', 'test', 0, 4)
                ),
                new Token(':', ':', ':', 4, 6),
                new ValueRange(
                    new Token('WORD', 't', 't', 6, 7),
                    new Token('..', '..', '..', 7, 9),
                    new Token('WORD', 'm', 'm', 9, 10)
                )
            )},

    {input: 'test: t.. m', output:
            new CategorizedFilter(
                new Attribute(
                    new Token('WORD', 'test', 'test', 0, 4)
                ),
                new Token(':', ':', ':', 4, 6),
                new ValueRange(
                    new Token('WORD', 't', 't', 6, 7),
                    new Token('..', '..', '..', 7, 10),
                    new Token('WORD', 'm', 'm', 10, 11)
                )
            )},

    {input: 'sort by: aa .. bb', output:
            new Binary(
                new Binary(
                    new Sort(
                        new Token('WORD', 'sort by', 'sort by', 0, 7),
                        new Token(':', ':', ':', 7, 9),
                        new Token('WORD', 'aa', 'aa', 9, 12)
                    ),
                    new Token('OPERATOR', 'and', 'and'),
                    new Text(
                        new Token('TEXT', '.. ', '.. ', 12, 15)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', 'bb', 'bb', 15, 17)
                )
            )},

    {input: 'has: aa .. bb', output:
            new Binary(
                new Binary(
                    new Has(
                        new Token('WORD', 'has', 'has', 0, 3),
                        new Token(':', ':', ':', 3, 5),
                        new Token('WORD', 'aa', 'aa', 5, 8)
                    ),
                    new Token('OPERATOR', 'and', 'and'),
                    new Text(
                        new Token('TEXT', '.. ', '.. ', 8, 11)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', 'bb', 'bb', 11, 13)
                )
            )},

    {input: 'a: #d', output:
            new Binary(
                new Text(new Token('TEXT', 'a: ', 'a: ', 0, 3)),
                new Token('OPERATOR' ,'and', 'and'),
                new PositiveSingleValue(
                    new Token('#', '#', '#', 3, 4),
                    new Token('WORD', 'd', 'd', 4, 5)
                )
            )},

    {input: 'sort by: -d', output:
        new Binary(
            new Text(new Token('TEXT', 'sort by: ', 'sort by: ', 0, 9)),
            new Token('OPERATOR' ,'and', 'and'),
            new NegativeSingleValue(
                new Token('-', '-', '-', 9, 10),
                new Token('WORD', 'd', 'd', 10, 11)
            )
        )},

    {input: 'sort by: #d', output:
            new Binary(
                new Text(new Token('TEXT', 'sort by: ', 'sort by: ', 0, 9)),
                new Token('OPERATOR' ,'and', 'and'),
                new PositiveSingleValue(
                    new Token('#', '#', '#', 9, 10),
                    new Token('WORD', 'd', 'd', 10, 11)
                )
            )},

    {input: 'has: #f', output:
            new Binary(
                new Text(new Token('TEXT', 'has: ', 'has: ', 0, 5)),
                new Token('OPERATOR' ,'and', 'and'),
                new PositiveSingleValue(
                    new Token('#', '#', '#', 5, 6),
                    new Token('WORD', 'f', 'f', 6, 7)
                )
            )},

    {input: 'has: a, b .. v', output:
            new Binary(
                new Binary(
                    new Has(
                        new Token('WORD', 'has', 'has', 0, 3),
                        new Token(':', ':', ':', 3, 5),
                        new Token('WORD', 'a', 'a', 5, 6)
                    ),
                    new Token('OPERATOR', 'and', 'and'),
                    new Text(new Token('TEXT', ', ', ', ', 6, 8))
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(new Token('TEXT', 'b .. v', 'b .. v', 8, 14))
            )},

    {input: 'sort by: a, b .', output:
            new Binary(
                new Sort(
                    new Token('WORD', 'sort by', 'sort by', 0, 7),
                    new Token(':', ':', ':', 7, 9),
                    [
                        new Token('Value', 'a', 'a', 9, 10),
                        new Token(',',',',',', 10, 12),
                        new Token('Value', 'b', 'b', 12, 14)
                    ]
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(new Token('TEXT', '.', '.', 14, 15))
            )},

    {input: 'has: t ..', output:
            new Binary(
                new Has(
                    new Token('WORD', 'has', 'has', 0, 3),
                    new Token(':', ':', ':', 3, 5),
                    new Token('WORD', 't', 't', 5, 7)
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(new Token('TEXT', '..', '..', 7, 9))
            )},

    {input: 'test: t..', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 0, 4)
                    ),
                    new Token(':', ':', ':', 4, 6),
                    new Token('WORD', 't', 't', 6, 7)
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', '..', '..', 7, 9)
                )
            )},

    {input: 'test: t or', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 0, 4)
                    ),
                    new Token(':', ':', ':', 4, 6),
                    new Token('WORD', 't', 't', 6, 8)
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', 'or', 'or', 8, 10)
                )
            )},

    {input: 'test: t or k', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'test', 'test', 0, 4)
                    ),
                    new Token(':', ':', ':', 4, 6),
                    new Token('WORD', 't', 't', 6, 8)
                ),
                new Token('OPERATOR', 'or', 'or', 8, 11),
                new Text(
                    new Token('TEXT', 'k', 'k', 11, 12)
                )
            )},

    {input: 'a:c .. #', output:
            new Binary(
                new Binary(
                    new CategorizedFilter(
                        new Attribute(
                            new Token('WORD', 'a', 'a', 0, 1)
                        ),
                        new Token(':', ':', ':', 1, 2),
                        new Token('WORD', 'c', 'c', 2, 4)
                    ),
                    new Token('OPERATOR', 'and', 'and'),
                    new Text(
                        new Token('TEXT', '.. ', '.. ', 4, 7)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', '#', '#', 7, 8)
                )
            )},

    {input: ';:v', output:
            new Binary(
                new Binary(
                    new Text(
                        new Token('TEXT', ';', ';', 0, 1)
                    ),
                    new Token('OPERATOR', 'and', 'and'),
                    new Text(
                        new Token('TEXT', ':', ':', 1, 2)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', 'v', 'v', 2, 3)
                )
            )},

    {input: '#,', output:
            new Binary(
                new Text(
                    new Token('TEXT', '#', '#', 0, 1)
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', ',',',', 1, 2)
                )
            )},

    {input: '-,', output:
            new Binary(
                new Text(
                    new Token('TEXT', '-', '-', 0, 1)
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', ',',',', 1, 2)
                )
            )},

    {input: 'a: -b .. #', output:
            new Binary(
                new Binary(
                    new CategorizedFilter(
                        new Attribute(
                            new Token('WORD', 'a', 'a', 0, 1)
                        ),
                        new Token(':', ':', ':', 1, 3),
                        new NegativeSingleValue(
                            new Token('-', '-', '-', 3, 4),
                            new Token('WORD', 'b', 'b', 4, 6)
                        )
                    ),
                    new Token('OPERATOR', 'and', 'and'),
                    new Text(
                        new Token('TEXT', '.. ', '.. ', 6, 9)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', '#', '#', 9, 10)
                )
            )},

    {input: 'a: -b ..', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 3),
                    new NegativeSingleValue(
                        new Token('-', '-', '-', 3, 4),
                        new Token('WORD', 'b', 'b', 4, 6)
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Text(
                    new Token('TEXT', '..', '..', 6, 8)
                )
            )},

    {input: 'a: b and sort by: §', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 3),
                    new Token('WORD', 'b', 'b', 3, 5)
                ),
                new Token('OPERATOR', 'and', 'and', 5, 9),
                new Text(
                    new Token('TEXT', 'sort by: §', 'sort by: §', 9, 19)
                )
            )},

    {input: 'a: b or sort by: §', output:
            new Binary(
                new CategorizedFilter(
                    new Attribute(
                        new Token('WORD', 'a', 'a', 0, 1)
                    ),
                    new Token(':', ':', ':', 1, 3),
                    new Token('WORD', 'b', 'b', 3, 5)
                ),
                new Token('OPERATOR', 'or', 'or', 5, 8),
                new Text(
                    new Token('TEXT', 'sort by: §', 'sort by: §', 8, 18)
                )
            )},

].forEach((it) => {
    test(`${it.input} should return ${it.output}`, () => {
        let par = new parser(it.input);
        expect(par.parse()).toEqual(it.output);
    })
});