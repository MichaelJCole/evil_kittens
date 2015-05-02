'use strict';

module.exports = function(config) {

  var fs = require('fs');
  var crypto = require('crypto');
  var express = require('express');
  var app = express();

  app.use(require('morgan')('dev')); // log requests to console.

  // Get some data to serve

  var kittenNames = [];
  var kittenJpgs = [];

  // Load kittens - notice the new fs.readdirSync() functions in 0.12.
  fs.readdirSync(__dirname + '/kittens').forEach(function(name) {
    kittenNames.push(name);
    kittenJpgs.push(fs.readFileSync(__dirname + '/kittens/' + name));  // This is a buffer.
  });


  // Save database of Id's and leak memory 1meg/id

  var counts = {};
  app.param('id', function(req, res, next, id) {
    counts[id] = counts[id] || {
      count: Math.floor(Math.random() * kittenNames.length),
      memoryLeak: crypto.randomBytes(1024*1024),  // Oops.
    };
    // This gets put on every request with :id in the route
    req.kittens = {
      id: id,
      count: counts[id].count,
      kittenName: kittenNames[ counts[id].count % kittenNames.length ],
      kittenJpg: kittenJpgs[ counts[id].count % kittenJpgs.length ],
    };
    counts[id].count += 1;
    next();  // Contiue processing more routes
  });


  // Serve up some kittens

  app.get('/tiny-kittens-in-your-memory/:id', function(req, res, next) {
    return res.send(req.kittens.kittenName);
  });

  app.get('/big-kittens-in-your-memory/:id', function(req, res, next) {
    res.set('Content-Type', 'image/jpeg');
    return res.send(req.kittens.kittenJpg);
  });

  app.get('/evil-kittens-sploding-your-memory/:id', function(req, res, next) {
    crypto.randomBytes(1024*1024, function(err, buf) {
      if (err) throw err;
      setTimeout(function() {
        var keepit = buf;  // jshint ignore:line
        res.send(req.kittens.id + ' splodin 1 megz for 1 seconds');
      }, 1000);
    });
  });

  app.get('/evil-kittens-sploding-your-cpu/:id', function(req, res, next) {
    function fib(n) {
      if (n <= 1) return n;
      else return fib(n-1) + fib(n-2);
    }
    return res.send(req.kittens.id + ' splodin your cpu for fib(39)' + fib(39));
  });

  app.get('/evil-kittens-sploding-your-disk/:id', function(req, res, next) {
    var filename = __dirname + '/kitten.' + new Date().getTime() + '.tmp';
    var stream = fs.createWriteStream(filename);
    stream.end(crypto.randomBytes(512*1024), function() {
      return res.send(req.kittens.id + ' splodin your disk with 1 meg to: ' + filename);
    });
  });

  app.get('/evil-kittens-sploding-your-network/:id', function(req, res, next) {
    return res.send(req.kittens.id + ' splodin your network with 512k to your browser: ' + crypto.randomBytes(1024*1024));
  });

  // Show home page with list of routes.
  app.get('/', function(req, res, next) {
    var list = [];
    app._router.stack.forEach(function(r){
      if (r.route && r.route.path) list.push(r.route.path);
    });
    return res.render('index.jade', {routes: list});
  });

  app.use(function(err, req, res, next) {
    console.log('*** Server Error:  ' + req.originalUrl);
    console.log(err);
    if(err.stack) console.log(err.stack);
    return res.status(500).send();
  });

  return app;
};