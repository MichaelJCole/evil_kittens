'use strict';

var requireNew = require('require-new');


// Let's run our e2e test 1000 times

for (var i=0; i<1000; i+=1) {
  requireNew('../app.e2e');
}

