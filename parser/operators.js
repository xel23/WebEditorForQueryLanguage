const operators = Object.freeze({
    LEFT_PAREN: '(',     // 0
    RIGHT_PAREN: ')',    // 1
    LEFT_BRACE: '{',     // 2
    RIGHT_BRACE: '}',    // 3
    COMMA: '\,',         // 4
    DOT: '\.',           // 5
    MINUS: '-',          // 6
    PLUS: '\+',          // 7
    SEMICOLON: ';',      // 8
    STAR: '\*',          // 9
    SLASH: '\/',         // 10
    BANG: '!',           // 11
    BANG_EQUAL: '!=',    // 12
    EQUAL: '=',          // 13
    EQUAL_EQUAL: '==',   // 14
    LESS: '<',           // 15
    LESS_EQUAL: '<=',    // 16
    GREATER: '>',        // 17
    GREATER_EQUAL: '>=', // 18
    COLON: ':',          // 19
    EOF: '(end)'         // 20
});

module.exports = operators;