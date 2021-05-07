const eventHandler = require('./eventHandler');

let field = document.getElementById('inQuery');
let tree = document.getElementById('result');

let events = new eventHandler(field, tree);