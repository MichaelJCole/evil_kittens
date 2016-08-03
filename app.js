'use strict';

/**
 * This is our application.  Use it like this:
 *
 *   var app = require('./app')({ logging: false });
 *   app.listen(port);
 */

module.exports = function(config) {

  // Libraries we'll use
  var fs = require('fs');
  var crypto = require('crypto');
  var express = require('express');

  // We'll return this app.
  var app = express();

  // Turning logging off to increase throughput ~50%
  if (config.logging) {
    app.use(require('morgan')('dev')); // log requests to console.
  }

  // Get some data to serve - notice readdirSync() and readFileSync() in Node.js 0.12.
  var kittenNames = [];
  var kittenJpgs = [];
  fs.readdirSync(__dirname + '/kittens').forEach(function(name) {
    kittenNames.push(name);
    kittenJpgs.push(fs.readFileSync(__dirname + '/kittens/' + name));  // This is a buffer.
  });


  // This is a database of Id's so we can cycle through images.
  // It also is where we store our memory leaks.
  var counts = {};

  // param('id') is used by other routes when they include ':id'
  app.param('id', function(req, res, next, id) {
    // Create a new counts entry if none found.
    counts[id] = counts[id] || {
      count: Math.floor(Math.random() * kittenNames.length),
      memoryLeak: crypto.randomBytes(1024*1024),  // Oops.
    };
    // Decorate request object with information from counts
    req.kittens = {
      id: id,
      count: counts[id].count,
      kittenName: kittenNames[ counts[id].count % kittenNames.length ],
      kittenJpg: kittenJpgs[ counts[id].count % kittenJpgs.length ],
    };
    counts[id].count += 1;
    next();  // Continue processing more routes
  });


  // Basic route to cycle through file names for the id.
  app.get('/tiny-kittens-in-your-memory/:id', function(req, res, next) {
    return res.send(req.kittens.kittenName);
  });

  // Basic route to cycle through images
  app.get('/big-kittens-in-your-memory/:id', function(req, res, next) {
    res.set('Content-Type', 'image/jpeg');
    return res.send(req.kittens.kittenJpg);
  });

  // Evil route to lock 1 mb of memory for 1 seconds
  var buffers = [];
  app.get('/evil-kittens-in-your-memory/:id', function(req, res, next) {
    var b = new Buffer(1024*1024);
    b.fill('meow!');
    buffers.push(b);
    setTimeout(function() {
      buffers.pop();
    }, 10000);
    res.send(req.kittens.id + ' Locking 1 mb of memory for 10 seconds');
  });

  // Evil route to calculate fib(30).  Badly.
  app.get('/evil-kittens-in-your-cpu/:id', function(req, res, next) {
    function fib(n) {
      if (n <= 1) return n;
      else return fib(n-1) + fib(n-2);
    }
    return res.send(req.kittens.id + ' Calculating fib(30)' + fib(30));
  });

  // Evil route to write 1 mb to disk.
  app.get('/evil-kittens-in-your-disk/:id', function(req, res, next) {
    var filename = __dirname + '/kitten.' + new Date().getTime() + '.tmp';
    var stream = fs.createWriteStream(filename);
    stream.end(crypto.randomBytes(512*1024), function() {
      return res.send(req.kittens.id + ' Writing 1 mb to disk: ' + filename);
    });
  });

  // Evil route to response with 512k of random data
  app.get('/evil-kittens-in-your-network/:id', function(req, res, next) {
    return res.send(req.kittens.id + ' Sending 512k of random data: ' + crypto.randomBytes(1024*1024));
  });

  // Used to validate our app at loader.io
  app.get('/loaderio-1826f62d0ee7e86b34fe392089e16a2d.txt', function(req, res, next) {
    return res.send('loaderio-1826f62d0ee7e86b34fe392089e16a2d');
  });

  // Home page with list of routes.
  app.get('/', function(req, res, next) {
    var list = [];
    app._router.stack.forEach(function(r){
      if (r.route && r.route.path) list.push(r.route.path);
    });
    return res.render('index.jade', {routes: list});
  });

  return app;
};
