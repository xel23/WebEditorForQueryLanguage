let lexer = require('./lexer');

function parser(str) {
    return lexer(str);
}

module.exports = parser;