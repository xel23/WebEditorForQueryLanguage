class ParserSyntaxException extends SyntaxError {
    constructor(message, n, str) {
        let err = "";
        for (let i = 0; i < n; i++) err += " ";
        throw super(message + str + "\n" + err + "^");
    }
}

module.exports = ParserSyntaxException;