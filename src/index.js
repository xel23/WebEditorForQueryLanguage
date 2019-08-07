const Highlighter = require('../parser/highlighter/highlighter');
const Parser = require('../parser/parser');
const errorEx = require('../parser/exceptions/syntaxException');
const Cursor = require('../parser/cursor');
const UndoRedo = require('../parser/UndoRedo');
const Grouping = require('../parser/general/Grouping');
const Binary = require('../parser/general/Binary');

let field = document.getElementById('inQuery');
let tree = document.getElementById('result');
let cursor = new Cursor(field);
let ur = new UndoRedo();
ur.addState('', 0);

function listener () {
    try {
        let inputText = field.innerText;
        let position = cursor.position;
        if (arguments[0] !== 0)
            ur.addState(inputText, position);
        let p = new Parser(inputText);
        let res = p.parse();
        tree.value = JSON.stringify(res, null, 4);
        let highlightedQuery = new Highlighter(res, inputText);
        field.innerHTML = highlightedQuery.getResult();

        cursor.position = position;
    } catch (e) {
        if (e instanceof errorEx) {
            tree.value = e;
        } else {
            tree.value = e;
        }
    }
}

if (field.addEventListener) {
    field.addEventListener("input", listener, false);
}

function search(obj, pos) {
    if (obj instanceof Binary) {
        let res =  search(obj.left, pos);
        if (res !== undefined) return res;
        res = search(obj.operator, pos);
        if (res !== undefined) return res;
        return search(obj.right, pos);
    }
    if (obj instanceof Grouping) {
        return search(obj.expr, pos);
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

function getNode(position) {
    let curNode = field;
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

function keyPress(keys) {
    if (keys.keyCode === 90 && keys.ctrlKey && keys.shiftKey) {
        let previousState = ur.redo();
        if (previousState !== -1) {
            field.innerText = previousState.line;
            cursor.position = previousState.pos;

            listener(0);
        }
    }
    else if (keys.keyCode === 90 && keys.ctrlKey) {
        let previousState = ur.undo();
        if (previousState !== -1) {
            field.innerText = previousState.line;
            cursor.position = previousState.pos;

            listener(0);
        }
    }
    else if (keys.altKey && (keys.keyCode === 38)) {
        let inputText = field.innerText;
        let p = new Parser(inputText);
        let res = p.parse();
        let startPos = cursor.position;

        let positions = search(res, startPos);

        let range = new Range();
        range.setStart(field, getNode(positions.begin));
        range.setEnd(field, getNode(positions.end) + 1);
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(range);
        keys.preventDefault();
    }
}

document.onkeydown = keyPress;