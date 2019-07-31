class Unary {
    constructor(operator, right) {
        this.type = 'Unary';
        this.operator = operator;
        this.right = right;
    }
}

module.exports = Unary;