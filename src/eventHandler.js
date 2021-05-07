const Highlighter = require('../parser/highlighter/highlighter');
const Parser = require('../parser/parser');
const Cursor = require('../parser/cursor');
const UndoRedo = require('../parser/UndoRedo');

class eventHandler {
    constructor(field, tree) {
        this.field = field;
        this.tree = tree;
        this.cursor = new Cursor(this.field);
        this.ur = new UndoRedo();
        this.ur.addState('', 0);

        if (this.field.addEventListener) {
            this.field.addEventListener("input", this.listener.bind(this), false);
        }

        document.onkeydown = this.keyPress.bind(this);
    }

    listener () {
        try {
            let inputText = this.field.innerText.replace(/\n/g, '');
            let position = this.cursor.position;
            if (arguments[0] !== 0)
                this.ur.addState(inputText, position);
            let p = new Parser(inputText);
            let res = p.parse();
            this.tree.value = JSON.stringify(res, null, 4);
            let highlightedQuery = new Highlighter(res, inputText);
            this.field.innerHTML = highlightedQuery.getResult();

            this.cursor.position = position;
        } catch (e) {
            this.tree.value = e;
        }
    }

    keyPress(keys) {
        if (keys.keyCode === 90 && keys.ctrlKey && keys.shiftKey) {
            let previousState = this.ur.redo();
            if (previousState !== -1) {
                this.field.innerText = previousState.line;
                this.cursor.position = previousState.pos;

                this.listener(0).bind(this);
            }
        }
        else if (keys.keyCode === 90 && keys.ctrlKey) {
            let previousState = this.ur.undo();
            if (previousState !== -1) {
                this.field.innerText = previousState.line;
                this.cursor.position = previousState.pos;

                this.listener(0).bind(this);
            }
        }
        else if (keys.altKey && (keys.keyCode === 38)) {
            let range = document.createRange();
            if (window.getSelection().anchorNode === this.field) {
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
}

module.exports = eventHandler;