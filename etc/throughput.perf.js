'use strict';

// Let's run our e2e test 1000 times

for (var i=0; i<1000; i+=1) {
  require('./throughput.e2e');
}

// Bummer.  It's only run once.  We need to use require-new.

var requireNew = require('require-new');
for (var i=0; i<1000; i+=1) {
  requireNew('./throughput.e2e');
}

