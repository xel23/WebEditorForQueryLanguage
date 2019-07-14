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
        // 1. Field only
[       {input: 'login: admin', output:
                new Field(
                    new Token('FIELD_NAME', 'login', 'login', 0, 5),
                    new Token(':', ':', ':', 5, 6),
                    new Token('FIELD_VALUE', 'admin', 'admin', 7, 12)
                )},

        // 2. Tuple only
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

        // 3. 2 Fields with 'and'
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

        // 4. Field with long value
        {input: 'login: {new name}', output:
                new Field(
                    new Token('FIELD_NAME', 'login', 'login', 0, 5),
                    new Token(':', ':', ':', 5, 6),
                    new Token('FIELD_VALUE', 'new name', 'new name', 7, 17)
                )},

        // 5. 2 Fields with 'or'
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

        // 6. 3 Fields with 'and' and 'or' operators
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

        // // 7. Tuple with Filed with long value
        // {input: 'accessible(for: {Yoda master})', output:
        //         new Tuple('accessible',
        //             new Grouping(
        //                 new Field('for', 'Yoda master')
        //             ))},
        //
        // // 8. Tuple between parentheses
        // {input: '(accessible(for: Yoda))', output:
        //         new Grouping(
        //             new Tuple('accessible',
        //                 new Grouping(
        //                         new Field('for', 'Yoda')
        //             )))},
        //
        // // 9. Field between parentheses
        // {input: '(login: user)', output:
        //             new Grouping(
        //                 new Field('login','user'))},
        //
        // // 10. Field + 'and' + 2 Fields between parentheses
        // // {input: 'login: user and (name: Ivan, with: test)', output:
        // //             new Binary(
        // //                 new Field('login', 'user'),
        // //                 new Token('OPERATOR', 'and', 'and'),
        // //                 new Grouping(
        // //                     new Binary(
        // //                         new Field('name', 'Ivan'),
        // //                         new Token(',', null, undefined),
        // //                         new Field('with', 'test')
        // //                     )
        // //                 )
        // //             )},
        //
        // // 11. Not operator with Field
        // {input: 'not login: user', output:
        //             new Unary(
        //                 new Token('OPERATOR', 'not', 'not', 0, 3),
        //                 new Field('login','user'))},
        //
        // // 12. Not operator with Field and not operator with Field
        // {input: 'not login: user and not login: user1', output:
        //             new Binary(
        //                 new Unary(
        //                     new Token('OPERATOR', 'not', 'not', 0, 3),
        //                     new Field('login', 'user')
        //                 ),
        //                 new Token('OPERATOR', 'and', 'and', 16, 19),
        //                 new Unary(
        //                     new Token('OPERATOR', 'not', 'not', 20, 23),
        //                     new Field('login', 'user1')
        //                 )
        //             )},
        //
        // // 13. 2 Fields between or between parentheses and 2 Fields between or between parentheses
        // {input: '(login: user or login: user1) and (with: pp or with: tt)', output:
        //             new Binary(
        //                 new Grouping(
        //                     new Binary(
        //                         new Field('login', 'user'),
        //                         new Token('OPERATOR', 'or', 'or', 13, 15),
        //                         new Field('login', 'user1')
        //                     )
        //                 ),
        //                 new Token('OPERATOR', 'and', 'and', 30, 33),
        //                 new Grouping(
        //                     new Binary(
        //                         new Field('with', 'pp'),
        //                         new Token('OPERATOR', 'or', 'or', 44, 46),
        //                         new Field('with', 'tt')
        //                     )
        //                 )
        //             )},
        //
        // // 14. 13 with operator not
        // {input: '(login: user or login: user1) and not (with: pp or with: tt)', output:
        //             new Binary(
        //                 new Grouping(
        //                     new Binary(
        //                         new Field('login', 'user'),
        //                         new Token('OPERATOR', 'or', 'or', 13, 15),
        //                         new Field('login', 'user1')
        //                     )
        //                 ),
        //                 new Token('OPERATOR', 'and', 'and', 30, 33),
        //                 new Unary(
        //                     new Token('OPERATOR', 'not', 'not', 34, 37),
        //                     new Grouping(
        //                         new Binary(
        //                             new Field('with', 'pp'),
        //                             new Token('OPERATOR', 'or', 'or', 48, 50),
        //                             new Field('with', 'tt')
        //                         )
        //                     )
        //                 )
        //             )},
        //
        // // 15. 14 with Tuple
        // {input: '(login: user or login: user1) and accessible(with: pp or with: tt)', output:
        //     new Binary(
        //         new Grouping(
        //             new Binary(
        //                 new Field('login', 'user'),
        //                 new Token('OPERATOR', 'or', 'or', 13, 15),
        //                 new Field('login', 'user1')
        //             )
        //         ),
        //         new Token('OPERATOR', 'and', 'and', 30, 33),
        //         new Tuple('accessible',
        //             new Grouping(
        //                 new Binary(
        //                     new Field('with', 'pp'),
        //                     new Token('OPERATOR', 'or', 'or', 54, 56),
        //                     new Field('with', 'tt')
        //                 )
        //             )
        //         )
        //     )},
        //
        // // 16. 15 with not operator
        // {input: '(login: user or login: user1) and not accessible(with: pp or with: tt)', output:
        //     new Binary(
        //         new Grouping(
        //             new Binary(
        //                 new Field('login', 'user'),
        //                 new Token('OPERATOR', 'or', 'or', 13, 15),
        //                 new Field('login', 'user1')
        //             )
        //         ),
        //         new Token('OPERATOR', 'and', 'and', 30, 33),
        //         new Unary(
        //             new Token('OPERATOR', 'not', 'not', 34, 37),
        //             new Tuple('accessible',
        //                 new Grouping(
        //                     new Binary(
        //                         new Field('with', 'pp'),
        //                         new Token('OPERATOR', 'or', 'or', 58, 60),
        //                         new Field('with', 'tt')
        //                     )
        //                 )
        //             )
        //         )
        //     )},
        //
        // // 17. 16 + comma
        // // {input: '(login: user or login: user1) and not accessible(with: pp, comma: tqt)', output:
        // //     new Binary(
        // //         new Grouping(
        // //             new Binary(
        // //                 new Field('login', 'user'),
        // //                 new Token('OPERATOR', 'or', 'or'),
        // //                 new Field('login', 'user1')
        // //             )
        // //         ),
        // //         new Token('OPERATOR', 'and', 'and'),
        // //         new Unary(
        // //             new Token('OPERATOR', 'not', 'not'),
        // //             new Tuple('accessible',
        // //                 new Grouping(
        // //                     new Binary(
        // //                         new Field('with', 'pp'),
        // //                         new Token(',', null, undefined),
        // //                         new Field('comma', 'tqt')
        // //                     )
        // //                 )
        // //             )
        // //         )
        // //     )},
        //
        // // 18. many ands
        // {input: 'login: user and login: user1 and with: tt', output:
        //     new Binary(
        //         new Binary(
        //             new Field('login', 'user'),
        //             new Token('OPERATOR', 'and', 'and', 12, 15),
        //             new Field('login', 'user1')
        //         ),
        //         new Token('OPERATOR', 'and', 'and', 29, 32),
        //         new Field( 'with', 'tt')
        //     )},
        //
        // // 19. many ors
        // {input: 'login: user or login: user1 or with: tt', output:
        //     new Binary(
        //         new Binary(
        //             new Field('login', 'user'),
        //             new Token('OPERATOR', 'or', 'or', 12, 14),
        //             new Field('login', 'user1')
        //         ),
        //         new Token('OPERATOR', 'or', 'or', 28, 30),
        //         new Field( 'with', 'tt')
        //     )},
        //
        // // 20. Checking priority of operators
        // {input: 'not login: user and not login: user1 or login: boss', output:
        //     new Binary(
        //         new Binary(
        //             new Unary(
        //                 new Token('OPERATOR', 'not', 'not', 0, 3),
        //                 new Field('login', 'user')
        //             ),
        //             new Token('OPERATOR', 'and', 'and', 16, 19),
        //             new Unary(
        //                 new Token('OPERATOR', 'not', 'not', 20, 23),
        //                 new Field('login', 'user1')
        //             )
        //         ),
        //         new Token('OPERATOR', 'or', 'or', 37, 39),
        //         new Field('login', 'boss')
        //     )},
        //
        // // 21. Tuple after operator
        // {input: 'not login: user and accessible(login: boss)', output:
        //     new Binary(
        //         new Unary(
        //             new Token('OPERATOR', 'not', 'not', 0, 3),
        //             new Field('login', 'user')
        //         ),
        //         new Token('OPERATOR', 'and', 'and', 16, 19),
        //         new Tuple('accessible',
        //             new Grouping(
        //                 new Field('login', 'boss')
        //             )
        //         )
        //     )},
        //
        //
        // {input: '(h:yoda) and(t: g)', output:
        //     new Binary(
        //         new Grouping(
        //             new Field('h', 'yoda')
        //         ),
        //         new Token('OPERATOR', 'and', 'and', 9, 11),
        //         new Grouping(
        //             new Field('t', 'g')
        //         )
        //     )},
        //
        // {input: '((h:yoda))', output:
        //     new Grouping(
        //         new Grouping(
        //             new Field('h', 'yoda')
        //         )
        //     )},
        //
        // {input: 'h:yoda or ands     (t: g)', output:
        //     new Binary(
        //         new Field('h', 'yoda'),
        //         new Token('OPERATOR', 'or', 'or', 7, 9),
        //         new Tuple('ands',
        //             new Grouping(
        //                 new Field('t', 'g')
        //             ))
        //     )},
].forEach((it) => {
    test(`${it.input} should return ${it.output}`, () => {
            let par = new parser(it.input);
            expect(par.parse()).toEqual(it.output);
    })
});