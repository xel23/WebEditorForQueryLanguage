const TermItem = require('./TermItem');
const ValueRange = require('./ValueRange');
const AttributeFilter = require('./AttributeFilter');

class CategorizedFilter extends TermItem {
    constructor(attribute, operator, attributeFilter) {
        super('CategorizedFilter', attribute.begin, attributeFilter instanceof ValueRange ? attributeFilter.rightVal.end : attributeFilter.end);
        this.attribute = attribute;
        this.operator = operator;
        this.attributeFilter = [];

        this.attributeFilter.push(new AttributeFilter(attributeFilter));
    }

    addAttributeFilter(token, comma) {
        this.end = token instanceof ValueRange ? token.rightVal.end : token.end;

        this.attributeFilter.push(comma);
        this.attributeFilter.push(new AttributeFilter(token));
    }
}

module.exports = CategorizedFilter;