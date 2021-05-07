class Binary {
    constructor(left, operator, right) {
        this.type = 'Binary';
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

module.exports = Binary;