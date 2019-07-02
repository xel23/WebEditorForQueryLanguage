let server = require('http');

let app = server.createServer(function (req, res) {
    res.end('Hello world');
});

app.listen(3000);