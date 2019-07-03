let lexer = require('./lexer');

function parser(str) {
    let lex = new lexer(str);
    return lex.lexer();
}

module.exports = parser;