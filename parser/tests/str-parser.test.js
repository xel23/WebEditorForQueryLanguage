const parser = require('../parser');

class Token {
        constructor(type, lexeme, literal) {
                this.type = type;
                this.lexeme = lexeme;
                this.literal = literal;
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
        constructor(expr) {
                this.expr = expr;
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
        // 1. Field only
[       {input: 'login: admin', output: new Field('login', 'admin')},

        // 2. Tuple only
        {input: 'accessible(for: admin)', output:
                new Tuple('accessible',
                    new Grouping(
                        new Field('for', 'admin')))},

        // 3. 2 Fields with 'and'
        {input: 'login: admin and hasLicense: YouTrack', output:
                new Binary(
                    new Field('login', 'admin'),
                    new Token('OPERATOR','and', 'and'),
                    new Field('hasLicense', 'YouTrack')
                )
        },

        // 4. Field with long value
        {input: 'login: {new name}', output:
                new Field('login', 'new name')},

        // 5. 2 Fields with 'or'
        {input: 'login: admin or hasLicense: YouTrack', output:
                new Binary(
                    new Field('login', 'admin'),
                    new Token('OPERATOR','or', 'or'),
                    new Field('hasLicense', 'YouTrack')
                )},

        // 6. 3 Fields with 'and' and 'or' operators
        {input: 'login: admin or login: test and hasLicense: YouTrack', output:
                new Binary(
                    new Field('login', 'admin'),
                    new Token ('OPERATOR', 'or', 'or'),
                    new Binary(
                        new Field('login', 'test'),
                        new Token('OPERATOR', 'and', 'and'),
                        new Field('hasLicense', 'YouTrack')
                    )
                )},

        // 7. Tuple with Filed with long value
        {input: 'accessible(for: {Yoda master})', output:
                new Tuple('accessible',
                    new Grouping(
                        new Field('for', 'Yoda master')
                    ))},

        // 8. Tuple between parentheses
        {input: '(accessible(for: Yoda))', output:
                new Grouping(
                    new Tuple('accessible',
                        new Grouping(
                                new Field('for', 'Yoda')
                    )))},

        // 9. Field between parentheses
        {input: '(login: user)', output:
                    new Grouping(
                        new Field('login','user'))},

        // 10. Field + 'and' + 2 Fields between parentheses
        {input: 'login: user and (name: Ivan, with: test)', output:
                    new Binary(
                        new Field('login', 'user'),
                        new Token('OPERATOR', 'and', 'and'),
                        new Grouping(
                            new Binary(
                                new Field('name', 'Ivan'),
                                new Token(',', null, undefined),
                                new Field('with', 'test')
                            )
                        )
                    )},

        // 11. Not operator with Field
        {input: 'not login: user', output:
                    new Unary(
                        new Token('OPERATOR', 'not', 'not'),
                        new Field('login','user'))},

        // 12. Not operator with Field and not operator with Field
        {input: 'not login: user and not login: user1', output:
                    new Binary(
                        new Unary(
                            new Token('OPERATOR', 'not', 'not'),
                            new Field('login', 'user')
                        ),
                        new Token('OPERATOR', 'and', 'and'),
                        new Unary(
                            new Token('OPERATOR', 'not', 'not'),
                            new Field('login', 'user1')
                        )
                    )},

        // 13. 2 Fields between or between parentheses and 2 Fields between or between parentheses
        {input: '(login: user or login: user1) and (with: pp or with: tt)', output:
                    new Binary(
                        new Grouping(
                            new Binary(
                                new Field('login', 'user'),
                                new Token('OPERATOR', 'or', 'or'),
                                new Field('login', 'user1')
                            )
                        ),
                        new Token('OPERATOR', 'and', 'and'),
                        new Grouping(
                            new Binary(
                                new Field('with', 'pp'),
                                new Token('OPERATOR', 'or', 'or'),
                                new Field('with', 'tt')
                            )
                        )
                    )},

        // 14. 13 with operator not
        {input: '(login: user or login: user1) and not (with: pp or with: tt)', output:
                    new Binary(
                        new Grouping(
                            new Binary(
                                new Field('login', 'user'),
                                new Token('OPERATOR', 'or', 'or'),
                                new Field('login', 'user1')
                            )
                        ),
                        new Token('OPERATOR', 'and', 'and'),
                        new Unary(
                            new Token('OPERATOR', 'not', 'not'),
                            new Grouping(
                                new Binary(
                                    new Field('with', 'pp'),
                                    new Token('OPERATOR', 'or', 'or'),
                                    new Field('with', 'tt')
                                )
                            )
                        )
                    )},

        // 15. 14 with Tuple
        {input: '(login: user or login: user1) and accessible(with: pp or with: tt)', output:
            new Binary(
                new Grouping(
                    new Binary(
                        new Field('login', 'user'),
                        new Token('OPERATOR', 'or', 'or'),
                        new Field('login', 'user1')
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Tuple('accessible',
                    new Grouping(
                        new Binary(
                            new Field('with', 'pp'),
                            new Token('OPERATOR', 'or', 'or'),
                            new Field('with', 'tt')
                        )
                    )
                )
            )},

        // 16. 15 with not operator
        {input: '(login: user or login: user1) and not accessible(with: pp or with: tt)', output:
            new Binary(
                new Grouping(
                    new Binary(
                        new Field('login', 'user'),
                        new Token('OPERATOR', 'or', 'or'),
                        new Field('login', 'user1')
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Unary(
                    new Token('OPERATOR', 'not', 'not'),
                    new Tuple('accessible',
                        new Grouping(
                            new Binary(
                                new Field('with', 'pp'),
                                new Token('OPERATOR', 'or', 'or'),
                                new Field('with', 'tt')
                            )
                        )
                    )
                )
            )},

        // 17. 16 + comma
        {input: '(login: user or login: user1) and not accessible(with: pp, comma: tqt)', output:
            new Binary(
                new Grouping(
                    new Binary(
                        new Field('login', 'user'),
                        new Token('OPERATOR', 'or', 'or'),
                        new Field('login', 'user1')
                    )
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Unary(
                    new Token('OPERATOR', 'not', 'not'),
                    new Tuple('accessible',
                        new Grouping(
                            new Binary(
                                new Field('with', 'pp'),
                                new Token(',', null, undefined),
                                new Field('comma', 'tqt')
                            )
                        )
                    )
                )
            )},

        // 18. many ands
        {input: 'login: user and login: user1 and with: tt', output:
            new Binary(
                new Binary(
                    new Field('login', 'user'),
                    new Token('OPERATOR', 'and', 'and'),
                    new Field('login', 'user1')
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Field( 'with', 'tt')
            )},

        // 19. many ors
        {input: 'login: user or login: user1 or with: tt', output:
            new Binary(
                new Binary(
                    new Field('login', 'user'),
                    new Token('OPERATOR', 'or', 'or'),
                    new Field('login', 'user1')
                ),
                new Token('OPERATOR', 'or', 'or'),
                new Field( 'with', 'tt')
            )},

        // 20. Checking priority of operators
        {input: 'not login: user and not login: user1 or login: boss', output:
            new Binary(
                new Binary(
                    new Unary(
                        new Token('OPERATOR', 'not', 'not'),
                        new Field('login', 'user')
                    ),
                    new Token('OPERATOR', 'and', 'and'),
                    new Unary(
                        new Token('OPERATOR', 'not', 'not'),
                        new Field('login', 'user1')
                    )
                ),
                new Token('OPERATOR', 'or', 'or'),
                new Field('login', 'boss')
            )},

        // Tuple after operator
        {input: 'not login: user and accessible(login: boss)', output:
            new Binary(
                new Unary(
                    new Token('OPERATOR', 'not', 'not'),
                    new Field('login', 'user')
                ),
                new Token('OPERATOR', 'and', 'and'),
                new Tuple('accessible',
                    new Grouping(
                        new Field('login', 'boss')
                    )
                )
            )},
].forEach((it) => {
    test(`${it.input} should return ${it.output}`, () => {
            let par = new parser(it.input);
            expect(par.parse()).toEqual(it.output);
    })
});