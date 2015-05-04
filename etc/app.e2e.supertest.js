'use strict';

var supertest = require('supertest');

/* This doesn't work due to version compatibility
require('superagent-proxy')(supertest);  // decorates supertest with .proxy()
*/

// Note: If we want to record our api requests with a proxy, 
// we'll need to use a proxy.  Superagent doesn't respect 'http_proxy' 
// environment variables.  We use 'superagent-proxy' plugin
// YMMV.

// Endurance tests need a long-running server
var app = 'http://localhost:8000';
// E2e unit tests can use Express w/o a web server for faster results
// var app = require('./app')();

// Define our proxy
var proxy = process.env.http_proxy || false;

// Monkey-patch superagent to use proxy.  Put this in our helper.
function request(toTest) {
  var agent = supertest.agent(toTest);
/* This doesn't work due to version incompatibilities
  if (proxy) {
    agent.endProxy = function (cb) {
      this.proxy(proxy);
      return this.end(cb);
    };
  }
*/
  return agent;
}

// Seems simple enough, but there's a 1m memory leak for every :id
describe('evil-kittens API ', function(){
  it ('gets a random tiny kitten - leak memory', function(done){
    request(app)
    .get('/tiny-kittens-in-your-memory/'+ Math.random())
    .expect(200)
    .end(function(err, res){
      if (err) throw err;
      done();
    });  
  });

  it ('gets an evil kitten - leak memory and disk', function(done){
    request(app)
    .get('/evil-kittens-sploding-your-disk/'+ Math.random())
    .expect(200)
    .end(function(err, res){
      if (err) throw err;
      done();
    });  
  });
});
