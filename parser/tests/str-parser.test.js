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

class Item {
    constructor() {}

}

class Field extends Item {
    constructor(fieldName, operator, fieldValue) {
        super();
        this.fieldName = fieldName;
        this.operator = operator;
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

[       {input: 'login: admin', output:
                new Field(
                    new Token('FIELD_NAME', 'login', 'login', 0, 5),
                    new Token(':', ':', ':', 5, 6),
                    new Token('FIELD_VALUE', 'admin', 'admin', 7, 12)
                )},


        {input: 'accessible(for: admin)', output:
                new Tuple(
                    new Token('TUPLE_NAME', 'accessible', 'accessible', 0, 10),
                    new Grouping(
                        new Token('(', '(', '(', 10, 11),
                        new Field(
                            new Token('FIELD_NAME', 'for', 'for', 11, 14),
                            new Token(':', ':', ':', 14, 15),
                            new Token('FIELD_VALUE', 'admin', 'admin', 16, 21)
                        ),
                        new Token(')', ')', ')', 21, 22)
                    )
                )},


        {input: 'login: admin and hasLicense: YouTrack', output:
                new Binary(
                    new Field(
                        new Token('FIELD_NAME', 'login', 'login', 0, 5),
                        new Token(':', ':',':', 5, 6),
                        new Token('FIELD_VALUE', 'admin','admin', 7, 12)
                    ),
                    new Token('OPERATOR','and', 'and', 13, 16),
                    new Field(
                        new Token('FIELD_NAME', 'hasLicense', 'hasLicense', 17, 27),
                        new Token(':',':',':', 27, 28),
                        new Token('FIELD_VALUE', 'YouTrack','YouTrack', 29, 37)
                    )
                )
        },


        {input: 'login: {new name}', output:
                new Field(
                    new Token('FIELD_NAME', 'login', 'login', 0, 5),
                    new Token(':', ':', ':', 5, 6),
                    new Token('FIELD_VALUE', 'new name', 'new name', 7, 17)
                )},


        {input: 'login: admin or hasLicense: YouTrack', output:
                new Binary(
                    new Field(
                        new Token('FIELD_NAME', 'login', 'login', 0, 5),
                        new Token(':', ':',':', 5, 6),
                        new Token('FIELD_VALUE', 'admin','admin', 7, 12)
                    ),
                    new Token('OPERATOR','or', 'or', 13, 15),
                    new Field(
                        new Token('FIELD_NAME', 'hasLicense', 'hasLicense', 16, 26),
                        new Token(':', ':', ':', 26, 27),
                        new Token('FIELD_VALUE', 'YouTrack', 'YouTrack', 28, 36)
                    )
                )},


        {input: 'login: admin or login: test and hasLicense: YouTrack', output:
                new Binary(
                    new Field(
                        new Token('FIELD_NAME', 'login', 'login', 0, 5),
                        new Token(':', ':',':', 5, 6),
                        new Token('FIELD_VALUE', 'admin','admin', 7, 12)
                    ),
                    new Token ('OPERATOR', 'or', 'or', 13, 15),
                    new Binary(
                        new Field(
                            new Token('FIELD_NAME', 'login', 'login', 16, 21),
                            new Token(':',':',':', 21, 22),
                            new Token('FIELD_VALUE', 'test', 'test', 23, 27)
                        ),
                        new Token('OPERATOR', 'and', 'and', 28, 31),
                        new Field(
                            new Token('FIELD_NAME', 'hasLicense', 'hasLicense', 32, 42),
                            new Token(':', ':', ':', 42, 43),
                            new Token('FIELD_VALUE', 'YouTrack', 'YouTrack', 44, 52)
                        )
                    )
                )},


        {input: 'accessible(for: {Yoda master})', output:
                new Tuple(
                    new Token('TUPLE_NAME', 'accessible', 'accessible', 0, 10),
                    new Grouping(
                        new Token('(', '(', '(', 10, 11),
                        new Field(
                            new Token('FIELD_NAME', 'for', 'for', 11, 14),
                            new Token(':', ':', ':', 14, 15),
                            new Token('FIELD_VALUE', 'Yoda master', 'Yoda master', 16, 29)
                        ),
                        new Token(')', ')', ')', 29, 30)
                    ))},


        {input: '(accessible(for: Yoda))', output:
                new Grouping(
                    new Token('(', '(', '(', 0, 1),
                    new Tuple(
                        new Token('TUPLE_NAME', 'accessible', 'accessible', 1, 11),
                        new Grouping(
                            new Token('(', '(', '(', 11, 12),
                            new Field(
                                new Token('FIELD_NAME', 'for', 'for', 12, 15),
                                new Token(':', ':', ':', 15, 16),
                                new Token('FIELD_VALUE', 'Yoda', 'Yoda', 17, 21)
                            ),
                            new Token(')', ')', ')', 21, 22)
                        )
                    ),
                    new Token(')', ')', ')', 22, 23)
                )},


        {input: '(login: user)', output:
                new Grouping(
                    new Token('(', '(', '(', 0, 1),
                    new Field(
                        new Token('FIELD_NAME', 'login', 'login', 1, 6),
                        new Token(':', ':', ':', 6, 7),
                        new Token('FIELD_VALUE', 'user', 'user', 8, 12)
                    ),
                    new Token(')', ')', ')', 12, 13)
                )},


        {input: 'not login: user', output:
                new Unary(
                    new Token('OPERATOR', 'not', 'not', 0, 3),
                    new Field(
                        new Token('FIELD_NAME', 'login', 'login', 4, 9),
                        new Token(':', ':', ':', 9, 10),
                        new Token('FIELD_VALUE', 'user', 'user', 11, 15)
                    )
                )},


        {input: 'not login: user and not login: user1', output:
                new Binary(
                    new Unary(
                        new Token('OPERATOR', 'not', 'not', 0, 3),
                        new Field(
                            new Token('FIELD_NAME', 'login', 'login', 4, 9),
                            new Token(':', ':', ':', 9, 10),
                            new Token('FIELD_VALUE', 'user', 'user', 11, 15)
                        )
                    ),
                    new Token('OPERATOR', 'and', 'and', 16, 19),
                    new Unary(
                        new Token('OPERATOR', 'not', 'not', 20, 23),
                        new Field(
                            new Token('FIELD_NAME', 'login', 'login', 24, 29),
                            new Token(':', ':', ':', 29, 30),
                            new Token('FIELD_VALUE', 'user1', 'user1', 31, 36)
                        )
                    )
                )},


        {input: '(login: user or login: user1) and (with: pp or with: tt)', output:
                new Binary(
                    new Grouping(
                        new Token('(', '(', '(', 0, 1),
                        new Binary(
                            new Field(
                                new Token('FIELD_NAME', 'login', 'login', 1, 6),
                                new Token(':', ':', ':', 6, 7),
                                new Token('FIELD_VALUE', 'user', 'user', 8, 12)
                            ),
                            new Token('OPERATOR', 'or', 'or', 13, 15),
                            new Field(
                                new Token('FIELD_NAME', 'login', 'login', 16, 21),
                                new Token(':', ':', ':', 21, 22),
                                new Token('FIELD_VALUE', 'user1', 'user1', 23, 28)
                            )
                        ),
                        new Token(')', ')', ')', 28, 29)
                    ),
                    new Token('OPERATOR', 'and', 'and', 30, 34),
                    new Grouping(
                        new Token('(', '(', '(', 34, 35),
                        new Binary(
                            new Field(
                                new Token('FIELD_NAME', 'with', 'with', 35, 39),
                                new Token(':', ':', ':', 39, 40),
                                new Token('FIELD_VALUE', 'pp', 'pp', 41, 43)
                            ),
                            new Token('OPERATOR', 'or', 'or', 44, 46),
                            new Field(
                                new Token('FIELD_NAME', 'with', 'with', 47, 51),
                                new Token(':', ':', ':', 51, 52),
                                new Token('FIELD_VALUE', 'tt', 'tt', 53, 55)
                            )
                        ),
                        new Token(')', ')', ')', 55, 56)
                    )
                )},


        {input: '(login: user or login: user1) and not (with: pp or with: tt)', output:
                new Binary(
                    new Grouping(
                        new Token('(', '(', '(', 0, 1),
                        new Binary(
                            new Field(
                                new Token('FIELD_NAME', 'login', 'login', 1, 6),
                                new Token(':', ':', ':', 6, 7),
                                new Token('FIELD_VALUE', 'user', 'user', 8, 12)
                            ),
                            new Token('OPERATOR', 'or', 'or', 13, 15),
                            new Field(
                                new Token('FIELD_NAME', 'login', 'login', 16, 21),
                                new Token(':', ':', ':', 21, 22),
                                new Token('FIELD_VALUE', 'user1', 'user1', 23, 28)
                            )
                        ),
                        new Token(')', ')', ')', 28, 29)
                    ),
                    new Token('OPERATOR', 'and', 'and', 30, 33),
                    new Unary(
                        new Token('OPERATOR', 'not', 'not', 34, 38),
                        new Grouping(
                            new Token('(', '(', '(', 38, 39),
                            new Binary(
                                new Field(
                                    new Token('FIELD_NAME', 'with', 'with', 39, 43),
                                    new Token(':', ':', ':', 43, 44),
                                    new Token('FIELD_VALUE', 'pp', 'pp', 45, 47)
                                ),
                                new Token('OPERATOR', 'or', 'or', 48, 50),
                                new Field(
                                    new Token('FIELD_NAME', 'with', 'with', 51, 55),
                                    new Token(':', ':', ':', 55, 56),
                                    new Token('FIELD_VALUE', 'tt', 'tt', 57, 59)
                                )
                            ),
                            new Token(')', ')', ')', 59, 60)
                        )
                    )
                )},


        {input: '(login: user or login: user1) and accessible(with: pp or with: tt)', output:
                new Binary(
                    new Grouping(
                        new Token('(', '(', '(', 0, 1),
                        new Binary(
                            new Field(
                                new Token('FIELD_NAME', 'login', 'login', 1, 6),
                                new Token(':', ':', ':', 6, 7),
                                new Token('FIELD_VALUE', 'user', 'user', 8, 12)
                            ),
                            new Token('OPERATOR', 'or', 'or', 13, 15),
                            new Field(
                                new Token('FIELD_NAME', 'login', 'login', 16, 21),
                                new Token(':', ':', ':', 21, 22),
                                new Token('FIELD_VALUE', 'user1', 'user1', 23, 28)
                            )
                        ),
                        new Token(')', ')', ')', 28, 29)
                    ),
                    new Token('OPERATOR', 'and', 'and', 30, 33),
                    new Tuple(
                        new Token('TUPLE_NAME', 'accessible', 'accessible', 34, 44),
                        new Grouping(
                            new Token('(', '(', '(', 44, 45),
                            new Binary(
                                new Field(
                                    new Token('FIELD_NAME', 'with', 'with', 45, 49),
                                    new Token(':', ':', ':', 49, 50),
                                    new Token('FIELD_VALUE', 'pp', 'pp', 51, 53)
                                ),
                                new Token('OPERATOR', 'or', 'or', 54, 56),
                                new Field(
                                    new Token('FIELD_NAME', 'with', 'with', 57, 61),
                                    new Token(':', ':', ':', 61, 62),
                                    new Token('FIELD_VALUE', 'tt', 'tt', 63, 65)
                                )
                            ),
                            new Token(')', ')', ')', 65, 66)
                        )
                    )
                )},


        {input: '(login: user or login: user1) and not accessible(with: pp or with: tt)', output:
                new Binary(
                    new Grouping(
                        new Token('(', '(', '(', 0, 1),
                        new Binary(
                            new Field(
                                new Token('FIELD_NAME', 'login', 'login', 1, 6),
                                new Token(':', ':', ':', 6, 7),
                                new Token('FIELD_VALUE', 'user', 'user', 8, 12)
                            ),
                            new Token('OPERATOR', 'or', 'or', 13, 15),
                            new Field(
                                new Token('FIELD_NAME', 'login', 'login', 16, 21),
                                new Token(':', ':', ':', 21, 22),
                                new Token('FIELD_VALUE', 'user1', 'user1', 23, 28)
                            )
                        ),
                        new Token(')', ')', ')', 28, 29)
                    ),
                    new Token('OPERATOR', 'and', 'and', 30, 33),
                    new Unary(
                        new Token('OPERATOR', 'not', 'not', 34, 37),
                        new Tuple(
                            new Token('TUPLE_NAME', 'accessible', 'accessible', 38, 48),
                            new Grouping(
                                new Token('(', '(', '(', 48, 49),
                                new Binary(
                                    new Field(
                                        new Token('FIELD_NAME', 'with', 'with', 49, 53),
                                        new Token(':', ':', ':', 53, 54),
                                        new Token('FIELD_VALUE', 'pp', 'pp', 55, 57)
                                    ),
                                    new Token('OPERATOR', 'or', 'or', 58, 60),
                                    new Field(
                                        new Token('FIELD_NAME', 'with', 'with', 61, 65),
                                        new Token(':', ':', ':', 65, 66),
                                        new Token('FIELD_VALUE', 'tt', 'tt', 67, 69)
                                    )
                                ),
                                new Token(')', ')', ')', 69, 70)
                            )
                        )
                    )
                )},


        {input: 'login: user and login: user1 and with: tt', output:
            new Binary(
                new Binary(
                    new Field(
                        new Token('FIELD_NAME', 'login', 'login', 0, 5),
                        new Token(':', ':', ':', 5, 6),
                        new Token('FIELD_VALUE', 'user', 'user', 7, 11)
                    ),
                    new Token('OPERATOR', 'and', 'and', 12, 15),
                    new Field(
                        new Token('FIELD_NAME', 'login', 'login', 16, 21),
                        new Token(':', ':', ':', 21, 22),
                        new Token('FIELD_VALUE', 'user1', 'user1', 23, 28)
                    )
                ),
                new Token('OPERATOR', 'and', 'and', 29, 32),
                new Field(
                    new Token('FIELD_NAME', 'with', 'with', 33, 37),
                    new Token(':', ':', ':', 37, 38),
                    new Token('FIELD_VALUE', 'tt', 'tt', 39, 41)
                )
            )},


        {input: 'login: user or login: user1 or with: tt', output:
            new Binary(
                new Binary(
                    new Field(
                        new Token('FIELD_NAME', 'login', 'login', 0, 5),
                        new Token(':', ':' ,':', 5, 6),
                        new Token('FIELD_VALUE', 'user', 'user', 7, 11)
                    ),
                    new Token('OPERATOR', 'or', 'or', 12, 14),
                    new Field(
                        new Token('FIELD_NAME', 'login', 'login', 15, 20),
                        new Token(':', ':', ':', 20, 21),
                        new Token('FIELD_VALUE', 'user1', 'user1', 22, 27)
                    )
                ),
                new Token('OPERATOR', 'or', 'or', 28, 30),
                new Field(
                    new Token('FIELD_NAME', 'with', 'with', 31, 35),
                    new Token(':', ':', ':', 35, 36),
                    new Token('FIELD_VALUE', 'tt', 'tt', 37, 39)
                )
            )},


        {input: 'not login: user and not login: user1 or login: boss', output:
            new Binary(
                new Binary(
                    new Unary(
                        new Token('OPERATOR', 'not', 'not', 0, 3),
                        new Field(
                            new Token('FIELD_NAME', 'login', 'login', 4, 9),
                            new Token(':', ':', ':', 9, 10),
                            new Token('FIELD_VALUE', 'user', 'user', 11, 15)
                        )
                    ),
                    new Token('OPERATOR', 'and', 'and', 16, 19),
                    new Unary(
                        new Token('OPERATOR', 'not', 'not', 20, 23),
                        new Field(
                            new Token('FIELD_NAME', 'login', 'login', 24, 29),
                            new Token(':', ':', ':', 29, 30),
                            new Token('FIELD_VALUE', 'user1', 'user1', 31, 36)
                        )
                    )
                ),
                new Token('OPERATOR', 'or', 'or', 37, 39),
                new Field(
                    new Token('FIELD_NAME', 'login', 'login', 40, 45),
                    new Token(':', ':', ':', 45, 46),
                    new Token('FIELD_VALUE', 'boss', 'boss', 47, 51)
                )
            )},


        {input: 'not login: user and accessible(login: boss)', output:
                new Binary(
                    new Unary(
                        new Token('OPERATOR', 'not', 'not', 0, 3),
                        new Field(
                            new Token('FIELD_NAME', 'login', 'login', 4, 9),
                            new Token(':', ':', ':', 9, 10),
                            new Token('FIELD_VALUE', 'user', 'user', 11, 15)
                        )
                    ),
                    new Token('OPERATOR', 'and', 'and', 16, 19),
                    new Tuple(
                        new Token('TUPLE_NAME', 'accessible', 'accessible', 20, 30),
                        new Grouping(
                            new Token('(', '(', '(', 30, 31),
                            new Field(
                                new Token('FIELD_NAME', 'login', 'login', 31, 36),
                                new Token(':', ':', ':', 36, 37),
                                new Token('FIELD_VALUE', 'boss', 'boss', 38, 42)
                            ),
                            new Token(')', ')', ')', 42, 43)
                        )
                    )
                )
            },


        {input: '(h:yoda) and(t: g)', output:
            new Binary(
                new Grouping(
                    new Token('(', '(', '(', 0, 1),
                    new Field(
                        new Token('FIELD_NAME', 'h', 'h', 1, 2),
                        new Token(':' ,':', ':', 2, 3),
                        new Token('FIELD_VALUE', 'yoda', 'yoda', 3, 7)
                    ),
                    new Token(')', ')', ')', 7, 8)
                ),
                new Token('OPERATOR', 'and', 'and', 9, 12),
                new Grouping(
                    new Token('(', '(', '(', 12, 13),
                    new Field(
                        new Token('FIELD_NAME', 't','t', 13, 14),
                        new Token(':', ':', ':', 14, 15),
                        new Token('FIELD_VALUE', 'g', 'g', 16, 17)
                    ),
                    new Token(')', ')', ')', 17, 18)
                )
            )},

        {input: '((h:yoda))', output:
            new Grouping(
                new Token('(', '(', '(', 0, 1),
                new Grouping(
                    new Token('(', '(', '(', 1, 2),
                    new Field(
                        new Token('FIELD_NAME', 'h', 'h', 2, 3),
                        new Token(':', ':', ':', 3, 4),
                        new Token('FIELD_VALUE', 'yoda', 'yoda', 4, 8)
                    ),
                    new Token(')', ')', ')', 8, 9)
                ),
                new Token(')', ')', ')', 9, 10)
            )},

        {input: 'h:yoda or ands     (t: g)', output:
            new Binary(
                new Field(
                    new Token('FIELD_NAME', 'h', 'h', 0, 1),
                    new Token(':', ':', ':', 1, 2),
                    new Token('FIELD_VALUE', 'yoda', 'yoda', 2, 6)
                ),
                new Token('OPERATOR', 'or', 'or', 7, 9),
                new Tuple(
                    new Token('TUPLE_NAME', 'ands', 'ands', 10, 19),
                    new Grouping(
                        new Token('(', '(', '(', 19, 20),
                        new Field(
                            new Token('FIELD_NAME', 't', 't', 20, 21),
                            new Token(':', ':', ':', 21, 22),
                            new Token('FIELD_VALUE', 'g', 'g', 23, 24)
                        ),
                        new Token(')', ')', ')', 24, 25)
                    )
                )
            )},
].forEach((it) => {
    test(`${it.input} should return ${it.output}`, () => {
            let par = new parser(it.input);
            expect(par.parse()).toEqual(it.output);
    })
});