const Highlighter = require('../parser/highlighter/highlighter');
const Parser = require('../parser/parser');
const errorEx = require('../parser/exceptions/syntaxException');
const Cursor = require('../parser/cursor');

console.log('Hello World');

let field = document.getElementById('inQuery');

function listener () {
    try {
        let cursor = new Cursor(field);
        cursor.getCursor();

        let p = new Parser(field.innerText);
        let res = p.parse();
        document.getElementById('result').value = JSON.stringify(res, null, 4);
        let highlightedQuery = new Highlighter(res, field.innerText)
        field.innerHTML = highlightedQuery.getResult();
        cursor.setCursor(field);
    } catch (e) {
        if (e instanceof errorEx) {
            document.getElementById('result').value = e;
        } else {
            document.getElementById('result').value = e;
        }
    }
}

if (field.addEventListener) {
    field.addEventListener("input", listener, false);
}