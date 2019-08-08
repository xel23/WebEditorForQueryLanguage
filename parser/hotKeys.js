const Grouping = require('./general/Grouping');
const Binary = require('./general/Binary');
const Cursor = require('./cursor');
const Parser = require('./parser');
const UndoRedo = require('./UndoRedo');

class HotKeys {
    constructor(field) {
        this.field = field;
        this.ur = new UndoRedo();
        this.ur.addState('', 0);
        this.cursor = new Cursor(field);
    }

    keyPress(keys) {
        if (keys.keyCode === 90 && keys.ctrlKey && keys.shiftKey) {
            let previousState = this.ur.redo();
            if (previousState !== -1) {
                this.field.innerText = previousState.line;
                this.cursor.position = previousState.pos;

                return 0;
            }
        }
        else if (keys.keyCode === 90 && keys.ctrlKey) {
            let previousState = this.ur.undo();
            if (previousState !== -1) {
                this.field.innerText = previousState.line;
                this.cursor.position = previousState.pos;

                return 0;
            }
        }
        else if (keys.altKey && (keys.keyCode === 38)) {
            let inputText = this.field.innerText;
            let p = new Parser(inputText);
            let res = p.parse();
            let startPos = this.cursor.position;

            let positions = search(res, startPos);



            let range = new Range();
            range.setStart(this.field, this.getNode(positions.begin));
            range.setEnd(this.field, this.getNode(positions.end) + 1);
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(range);
            keys.preventDefault();
            return 1;
        }
        return 1;
    }

    search(obj, pos) {
        if (obj instanceof Binary) {
            let res =  search(obj.left, pos);
            if (res !== undefined) return res;
            res = search(obj.operator, pos);
            if (res !== undefined) return res;
            return search(obj.right, pos);
        }
        for (let key in obj) {
            if (obj[key] instanceof Grouping) {
                search(obj[key].expr, pos);
            }
            else if (key === 'type') {
                switch (obj[key]) {
                    case 'QuotedText':
                    case 'NegativeText':
                    case 'NegativeSingleValue':
                    case 'PositiveSingleValue':
                    {
                        if (obj.begin <= pos && obj.end >= pos) {
                            return {
                                begin: obj.begin,
                                end: obj.end
                            };
                        }
                        break;
                    }
                    case 'CategorizedFilter':
                    case 'Has':
                    case 'Sort':
                    case 'OPERATOR':
                    {
                        if (obj.begin <= pos && obj.end >= pos) {
                            return {
                                begin: obj.begin + 1,
                                end: obj.end
                            };
                        }
                        break;
                    }
                    default:
                        break;
                }
            }
        }
    }

    getNode(position) {
        let curNode = this.field;
        let curPos = 0, i = -1;
        while (curPos < position) {
            i++;
            if (curNode.childNodes[i] !== null) {
                curPos += curNode.childNodes[i].textContent.length;
            }
            else {
                curNode = curNode.childNodes[i];
                if (curNode.childNodes.length === 0)  {
                    break;
                }
            }
        }
        return i < 0 ? 0 : i;
    }

    addState(text, pos) {
        this.ur.addState(text, pos);
    }
}

module.exports = HotKeys;