'use strict';

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {

  // Master process
  
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('listening', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' listening');
  });
  cluster.on('disconnect', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' disconnect.  Exit should follow.');
  });
  cluster.on('exit', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' exit (' + (signal||code) + ').  Starting replacement...');
    cluster.fork();
  });

} else {

  // Kittens all listen on the same port.  Master load balances.
  var port = process.env.PORT || 8000;
  var app = require('./app')({ logging: false });

  app.listen(port);

  console.log('Server started on http://localhost:' + port);
}