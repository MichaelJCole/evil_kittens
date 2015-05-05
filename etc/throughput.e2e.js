'use strict';

var hippie = require('hippie');

// Note: If we want to record our api requests with a proxy, 
// we'll need to use a proxy.  Superagent doesn't respect 'http_proxy' 
// environment variables, and isn't compatible with 'superagent-proxy'.
// Let's try hippie

// Endurance tests need a long-running server
var app = 'http://localhost:8000';
// E2e unit tests can use Express w/o a web server for faster results
// var app = require('./app')();

// Put this in our helper.
function request(toTest) {
  if (typeof toTest === 'string') {
    return hippie().base(toTest);
  }
  return hippie(toTest);
}

// Seems simple enough, but there's a 1m memory leak for every :id
describe('evil-kittens API ', function(){
  it ('gets a random big kitten', function(done){
    request(app)
    .get('/big-kittens-in-your-memory/1000')
    .expectStatus(200)
    .end(function(err, res){
      if (err) throw err;
      done();
    });  
  });
});
