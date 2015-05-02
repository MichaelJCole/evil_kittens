'use strict';

var app = require('./app')();
var port = process.env.NODE_ENV || 8000;
app.listen(port);

console.log('I was built to serve:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path) 
    console.log(' - http://127.0.0.1:' + port + r.route.path);
});

