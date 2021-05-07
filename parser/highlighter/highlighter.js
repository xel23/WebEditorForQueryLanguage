const Unary = require('../general/Unary');
const Binary = require('../general/Binary');
const Has = require('../general/Has');
const CategorizedFilter = require('../general/CategorizedFilter');
const Sort = require('../general/Sort');
const Grouping = require('../general/Grouping');
const PositiveSingleValue = require('../general/PositiveSingleValue');
const NegativeSingleValue = require('../general/NegativeSingleValue');

class Highlighter {
    constructor(obj, str) {
        this.resString = this.traverse(obj, str);
    }

    wrapper(text, type) {
        return '<span class="' + type + '">' + text +'</span>';
    }

    divWrapper() {
        return arguments[0] !== undefined ? '<div class="treeWrapper ' + arguments[0] + '">' : '</div>';
    }

    traverse(obj, str) {
        let resString = "";
        if (obj instanceof Binary || obj instanceof Grouping || obj instanceof Has || obj instanceof Sort
            || obj instanceof CategorizedFilter || obj instanceof NegativeSingleValue || obj instanceof PositiveSingleValue) {
            resString += this.divWrapper(obj.type);
        }
        if (obj instanceof Grouping) {
            resString += this.wrapper(str.substring(obj.left.begin, obj.left.end), 'Parentheses');
            resString += this.traverse(obj.expr, str);
            resString += this.wrapper(str.substring(obj.right.begin, obj.right.end), 'Parentheses');
        }
        else {
            for (let key in obj) {
                if (obj[key] instanceof Object && !(obj[key] instanceof Unary) && key !== 'minus' &&
                    !(obj[key] instanceof Grouping) && key !== 'attributeFilter' && key !== 'value') {
                    resString += this.traverse(obj[key], str);
                }
                else if (obj[key] instanceof Grouping) {
                    resString += this.wrapper(str.substring(obj[key].left.begin, obj[key].left.end), 'Parentheses');
                    resString += this.traverse(obj[key].expr, str);
                    resString += this.wrapper(str.substring(obj[key].right.begin, obj[key].right.end), 'Parentheses');
                }
                else {
                    if (key === 'type') {
                        switch (obj.type) {
                            case 'QuotedText':
                            case 'NegativeText':
                            case 'key':
                            case 'Attribute':
                            case 'Value':
                            case 'ValueRange':
                            case 'TEXT':  {
                                resString += this.wrapper(str.substring(obj.begin, obj.end), obj.type);
                                break;
                            }
                            case 'NegativeSingleValue': {
                                resString += this.wrapper(str.substring(obj.minus.begin, obj.minus.end), 'operator');
                                resString += this.wrapper(str.substring(obj.begin, obj.end), obj.type);
                                break;
                            }
                            case 'PositiveSingleValue': {
                                resString += this.wrapper(str.substring(obj.operator.begin, obj.operator.end), 'operator');
                                resString += this.wrapper(str.substring(obj.begin, obj.end), obj.type);
                                break;
                            }
                            case 'OPERATOR':
                            case ':':
                            case '-': {
                                if ('begin' in obj) {
                                    resString += this.wrapper(str.substring(obj.begin, obj.end), 'operator');
                                }
                                else if (obj.lexeme === 'or') {
                                    resString += this.wrapper(str.substring(obj.begin, obj.end), 'operator');
                                }
                                break;
                            }
                            default: break;
                        }
                    }
                    else if (key === 'attributeFilter' || key === 'value') {
                        if ('operator' in obj[key][0]) {
                            resString += this.wrapper(str.substring(obj[key][0].operator.begin, obj[key][0].operator.end), 'operator');
                        }
                        resString += this.wrapper(str.substring(obj[key][0].begin, obj[key][0].end), obj[key][0].type);

                        if ('order' in obj[key][0]) {
                            resString += this.wrapper(str.substring(obj[key][0].order.begin, obj[key][0].order.end), 'order');
                        }

                        for (let cur = 1; cur < obj[key].length; cur++) {
                            resString += this.wrapper(str.substring(obj[key][cur].begin, obj[key][cur].end), 'operator');
                            cur++;
                            if ('operator' in obj[key][cur]) {
                                resString += this.wrapper(str.substring(obj[key][cur].operator.begin, obj[key][cur].operator.end), 'operator');
                            }
                            resString += this.wrapper(str.substring(obj[key][cur].begin, obj[key][cur].end), obj[key][cur].type);

                            if ('order' in obj[key][cur]) {
                                resString += this.wrapper(str.substring(obj[key][cur].order.begin, obj[key][cur].order.end), 'order');
                            }
                        }
                    }
                }
            }
        }
        if (obj instanceof Binary || obj instanceof Grouping || obj instanceof Has || obj instanceof Sort
            || obj instanceof CategorizedFilter || obj instanceof NegativeSingleValue || obj instanceof PositiveSingleValue) {
            resString += this.divWrapper();
        }
        return resString;
    }

    getResult() {
        return this.resString;
    }
}

module.exports = Highlighter;