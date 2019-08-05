const types = Object.freeze({
    TRUE: true,          // 0
    FALSE: false,        // 1
    NULL: null,          // 2
    WORD: 'WORD',
    COMPLEX_VALUE: 'COMPLEX_VALUE',
    SIMPLE_VALUE: 'SIMPLE_VALUE',
    QUOTED_TEXT: 'QUOTED_TEXT',
    ATTRIBUTE: 'ATTRIBUTE',
    SORT_ATTRIBUTE: 'SORT_ATTRIBUTE',
    SINGLE_VALUE: 'SINGLE_VALUE',
    OPERATOR: 'OPERATOR',
    TEXT: 'TEXT'
});

module.exports = types;