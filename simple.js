'use strict';

var port = process.env.NODE_ENV || 8000;
var app = require('./app')({ port: port});
app.listen(port);

console.log('Server started on http://localhost:' + port);  // Everywhere is localhost somewhere.

