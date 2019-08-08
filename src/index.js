const Highlighter = require('../parser/highlighter/highlighter');
const Parser = require('../parser/parser');
const errorEx = require('../parser/exceptions/syntaxException');
const Cursor = require('../parser/cursor');
const UndoRedo = require('../parser/UndoRedo');

let field = document.getElementById('inQuery');
let tree = document.getElementById('result');
let cursor = new Cursor(field);
let ur = new UndoRedo();
ur.addState('', 0);

function listener () {
    try {
        let inputText = field.innerText.replace(/\n/g, '');
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
            document.getElementById('result').value = e;
            tree.value = e;
        }
    }
}

if (field.addEventListener) {
    field.addEventListener("input", listener, false);
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
        let range = document.createRange();
        if (window.getSelection().anchorNode === field) {
            keys.preventDefault();
            return;
        }
        if (window.getSelection().anchorNode.nodeType === 3)
            range.selectNode(window.getSelection().anchorNode.parentNode);
        else
            range.selectNode(window.getSelection().anchorNode);
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(range);

        keys.preventDefault();
    }
}

document.onkeydown = keyPress;