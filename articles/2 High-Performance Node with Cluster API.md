# High Performance Node.js Clustering

The secret to take a business to "web scale" is to hire quality engineers.

The secret to engineering a "web scale" application is hard work and good tools.

Node.js is in the toolbox, and 0.12 just got an update to it's Clustering API.

Node.js 0.12 is the pre-quel to Node.js 1.0.  The 0.12 Clustering API underwent some improvements, learning from 0.8.  There's a bunch of other goodies in 0.12 so if you're not using it already, check it out.


## Hello Kittens

In [FIXME TITLE Agile Performance Testing](FIXME) we played with some fun (if slightly evil) kittens.  

That article was loooo-snore-ooong.  So if you're just interested in Node.js Clustering, here we're going to code up some clustering into the [API](FIXME).  If you want to follow along [it's easy to setup](FIXME).  

Here's where we're at: 

```
node singleNoLog.js
```

Should get you a home page at <a href="http://localhost:8000">http://localhost:8000</a>.  

We're going to work with one API route to explore Node.js clustering.  

    GET /evil-kittens-sploding-your-cpu/:id      -> 100% cpu for 1 seconds

The evil-kitten API is an [Express 4.0 app](FIXME GITHUB).

This particular API call:
  - Calculates a Fibbonacci number.
  - Leaks 1 meg of memory for each :id - [slightly evil](FIXME kitten video)

## Baseline Time/Request: 30.5 ms

Open a new console, and let's do a quick [load test](FIXME link to test types).  We'll use `ab` as our [test tool](FIXME link to AB).

To save on digital trees, I'm going to snip out the most interesting parts of the results.

Let's do `-n 100` requests , with `-c 1` concurrent thread.  These are sequential requests.

```
$ ab -l -n 100 -c 1 http://localhost:8000/evil-kittens-sploding-your-cpu/baseline 

Concurrency Level:      1
Time taken for tests:   3.054 seconds
Complete requests:      100

Requests per second:    32.75 [#/sec] (mean)
Time per request:       30.537 [ms] (mean)
Time per request:       30.537 [ms] (mean, across all concurrent requests)

Percentage of the requests served within a certain time (ms)
  50%     30
 100%     34 (longest request)
```

Great.  We're serving cpu-kittens ~30.5 ms.  So each request for a fibonacci number is taking 30.5 ms.  

**Our 'Baseline time/request' is 30.5ms.**

Remember that!  That's the constant time for every HTTP request in this article.  That won't change.

### Baseline Load test

Now, let's scale up to a Load Test by running `-c 10` concurrent threads:

```
$ ab -l -n 1000 -c 10 http://localhost:8000/evil-kittens-sploding-your-cpu/baseline

Concurrency Level:      10
Time taken for tests:   30.575 seconds
Complete requests:      1000

Requests per second:    32.71 [#/sec] (mean)
Time per request:       305.747 [ms] (mean)
Time per request:       30.575 [ms] (mean, across all concurrent requests)

Percentage of the requests served within a certain time (ms)
  50%    305
 100%    319 (longest request)
```

Ok, now we're simulating 10 concurrent users at a time, each making 100 requests in a row.

The server now has 10 open requests at a time.  They're all CPU bound and sharing the same CPU.  So naturally they're 10x slower:

```
Time per request: 305.747 [ms]  (mean)`
Time per request: 30.575 [ms] (mean, across all concurrent requests)`?
```

What's the second line then?  It's damn confusing, is what it is.  

```
Time per request: 305.747 [ms] (mean)
Time per request: 30.575 [ms] (mean, across all concurrent requests)`?
```

This `mean, across all concurrent requests` is:

`Time taken for tests: 30.575 seconds` / `Concurrency Level: 10`

So, even though the requests are taking longer to server (305 ms instead of 30.5), the 'mean, across all concurrent requests' is still 30.5).

If that's confusing, it's because it is.  There's a better way to measure this:

Using our 30.5ms "Baseline", we can calculate our server's "concurrency performance".

    performance[concurrency] = baseline / mean, across all concurrent requests
    performance[10] = 30.5 / 30.575
    performance[10] = 1

If "concurrency performance" is < 1, our server *bogs down* with more users.
If "concurrency performance" is > 1, our server scales with concurrency.

Since I have 7 idle CPU's on my laptop while the 8th is 100% clearly there's an opportunity for improvement.

Let's do that.

## Just one thread

Horizontal scaling is the idea that lots of little things can work better than one big thing.  For example, [Nyan](https://www.youtube.com/watch?v=QH2-TGUlwu4) is the answer to humanity's collective unconscious search for something!

Apache, Tomcat/Glassfish, and PHP each serve one request per thread/process.  (Yes, there is some pooling and optimization.)

Node.js, Memcache, and Redis, each server all requests with the same thread.  Yes, Redis has some [I/O threads](http://redis.io/topics/latency#single-threaded-nature-of-redis), and Node.js has [webworker](https://www.npmjs.com/package/webworker-threads) packages.  

The point isn't that *they* get one thread.  It's that *you* get one thread.  And if you're code can serve multiple requests in one thread, that means it's easier to horizontally scale for performance.

Ok then.

## singleNoLog.js

singleNoLog.js is more or less the hello world of Express app servers:

```
var port = process.env.PORT || 8000;
var app = require('./app')({ logging: false });
app.listen(port);

// Everywhere is localhost somewhere.
console.log('Server started on http://localhost:' + port);
```

Our kitten api is wrapped up nicely in [app.js](FIXME github).  Single-threaded and serving 4.5k requests/s. Thanks Node!

To scale this up, we're going to use the new Cluster API.  

The [basic pattern](https://nodejs.org/api/cluster.html#cluster_cluster) is implemented as [cluster.js](fixme github)

```
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
```

Ctrl-c to kill the `singleNoLog.js` server.  Then start the clustered one: 

```
$ node cluster.js
Server started on http://localhost:8000
Worker 15511 listening
Server started on http://localhost:8000
Server started on http://localhost:8000
Server started on http://localhost:8000
Server started on http://localhost:8000
Server started on http://localhost:8000
Worker 15506 listening
Server started on http://localhost:8000
Worker 15527 listening
Worker 15529 listening
Worker 15528 listening
Worker 15512 listening
Worker 15517 listening
Server started on http://localhost:8000
Worker 15522 listening
```

Great, so we started the server, with 1 master process, and 8 workers.

Now, let's do another Load Test.

```
$ ab -l -n 1000 -c 10 http://localhost:8000/evil-kittens-sploding-your-cpu/baseline

Concurrency Level:      10
Time taken for tests:   3.361 seconds
Complete requests:      1000

Requests per second:    297.49 [#/sec] (mean)
Time per request:       33.614 [ms] (mean)
Time per request:       3.361 [ms] (mean, across all concurrent requests)

Percentage of the requests served within a certain time (ms)
  50%     32
 100%    127 (longest request)
```

Awesome!  This scaled beautifully.  You should have noticed all your CPU's aflutter instead of just one.

So, "mean, across all concurrent requests" = 3.361 ms.  That's crazy-talk.  No request took 3.361 ms.  We know our baseline is 30.5 ms.  Clustering didn't make our fibbonacci algrothm faster.

But, if we calculate our concurrency performance:

    performance[concurrency] = baseline / mean, across all concurrent requests
    performance[10] = 30.5 / 3.361
    performance[10] = 9

We see our server is performing for a load concurrency of 10, with a performance concurrency of 9.  That's pretty efficient!

Well, that's what it is friends.  Go big!
