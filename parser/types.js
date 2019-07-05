const types = Object.freeze({
    TRUE: true,          // 0
    FALSE: false,        // 1
    NULL: null,          // 2
    NUMBER: 'NUMBER',    // 3
    STRING: 'STRING',
    IDENTIFIER: 'IDENTIFIER',
    KEYWORD: 'KEYWORD',
    FIELD_NAME: 'FIELD_NAME',
    FIELD_VALUE: 'FIELD_VALUE',
    TUPLE_NAME: 'TUPLE_NAME',
    FIELD: 'FIELD',
});

module.exports = types;