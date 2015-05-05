'use strict';

var port = process.env.PORT || 8000;
var app = require('./app')({ logging: false });
app.listen(port);

console.log('Server started on http://localhost:' + port);  // Everywhere is localhost somewhere.

