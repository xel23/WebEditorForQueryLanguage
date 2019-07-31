class Grouping {
    constructor(left, expr, right) {
        this.type = 'Grouping';
        this.left = left;
        this.expr = expr;
        this.right = right;
    }
}

module.exports = Grouping;