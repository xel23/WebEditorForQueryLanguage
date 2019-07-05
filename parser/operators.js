const operators = Object.freeze({
    LEFT_PAREN: '(',     // 0
    RIGHT_PAREN: ')',    // 1
    DOT: '\.',           // 2
    COLON: ':',          // 3
    EOF: '(end)',        // 4
    NOT: 'not',          // 5
    AND: 'and',          // 6
    OR: 'or'             // 7
});

module.exports = operators;