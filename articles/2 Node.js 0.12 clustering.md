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

## A Baseline Load test

Open a new console, and let's do a quick [load test](FIXME link to test types).  We'll use `ab` as our [test tool](FIXME link to AB).

```
time ab -l -n 10000 -c 10 http://localhost:8000/evil-kittens-sploding-your-cpu/baseline
```





## Just one thread

Horizontal scaling is the idea that lots of little things can work better than one big thing.  For example, humanity's collective unconscious question, who's answer is [Nyan](https://www.youtube.com/watch?v=QH2-TGUlwu4).

Horizontal scaling.  Node.js apps get just one thread.  

Why?  Because making processes and threads is relatively cheap on my laptop, but relatively expensive "at scale".

Tools like Apache, Tomcat/Glassfish, and PHP work by each request per thread.  (Yes, there is some pooling and optimization.)

Tools like and Node.js and Redis are built as single-threaded services.  Yes, Redis has some [I/O threads](http://redis.io/topics/latency#single-threaded-nature-of-redis), and Node.js has [webworker](https://www.npmjs.com/package/webworker-threads) packages.  

But, the point isn't that *they* get one thread.  It's that *you* get one thread.  And if you're code can serve multiple requests in one thread, that means it's easier to horizontally scale for performance.



Enough Preamble.  Let's build something, crush it with load testing, then scale it.

We need an API.  Because writing good technical blog posts takes hours, let's look at some kittens for a bit.

The API has these routes:

    GET /tiny-kittens-in-your-memory/123         -> text/plain: filename 
    GET /big-kittens-in-your-memory/:id          -> image/jpeg: image data
    GET /evil-kittens-sploding-your-memory/:id   -> locks 1 meg of memory for 3 seconds
    GET /evil-kittens-sploding-your-cpu/:id      -> 100% cpu for 3 seconds
    GET /evil-kittens-sploding-your-disk/:id     -> writes 1 meg to disk
    GET /evil-kittens-sploding-your-network/:id  -> text/plain: 1 meg of random data

:id is any string.

Here's FIXME an Express 4.0 app implementing this API.  This server is neither secure or performant.  If you read the last few calls, you'll see it's small and innocent looking, with claws.

server1.js is a basic Express server.

~~~~~
// Create the app and listen
var app = require('./app')();
var port = process.env.NODE_ENV || 8000;
app.listen(port);

// Print routes to the console
console.log('I was built to serve:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path) 
    console.log(' - http://127.0.0.1:' + port + r.route.path);
});
~~~~~

If you'd like to follow along, the code's on Github:

    git clone FIXME
    cd FIXME
    npm install
    node server1.js

Here's the API if you'd like to play with the kittens for a bit.

  - <a href='http://127.0.0.1:8000/tiny-kittens-in-your-memory/:id' target='_blank'>http://127.0.0.1:8000/tiny-kittens-in-your-memory/:id</a>
  - <a href='http://127.0.0.1:8000/big-kittens-in-your-memory/:id' target='_blank'>http://127.0.0.1:8000/big-kittens-in-your-memory/:id</a>
  - <a href='http://127.0.0.1:8000/evil-kittens-sploding-your-memory/:id' target='_blank'>http://127.0.0.1:8000/evil-kittens-sploding-your-memory/:id</a>
  - <a href='http://127.0.0.1:8000/evil-kittens-sploding-your-cpu/:id' target='_blank'>http://127.0.0.1:8000/evil-kittens-sploding-your-cpu/:id</a>
  - <a href='http://127.0.0.1:8000/evil-kittens-sploding-your-disk/:id' target='_blank'>http://127.0.0.1:8000/evil-kittens-sploding-your-disk/:id</a>
  - <a href='http://127.0.0.1:8000/evil-kittens-sploding-your-network/:id' target='_blank'>http://127.0.0.1:8000/evil-kittens-sploding-your-network/:id</a>

When your ready (ahem) we'll get back to work.  

## Breaking the Toy Server

Ok, now we have an adorable, if slightly evil server.  Let's crush it with load testing.  

### Jmeter

For end-to-end testing, Mocha is great for Node.js, but it doesn't do 5000 threads at a time.  For that, we're going to need something bigger.

JMeter is the 'Nimitz' of load testing, dating back to 1998.  A durable, old-school [Apache project](http://jmeter.apache.org/), it's the go-to tool for load testing.  

We're going to install JMeter 2.13 and two plugins with pretty graphs.  In Linux, you can do this:

~~~~~
wget http://www.us.apache.org/dist//jmeter/binaries/apache-jmeter-2.13.tgz -O - | tar -xz
cd apache-jmeter-2.13
wget -qO- -O tmp.zip http://jmeter-plugins.org/downloads/file/JMeterPlugins-Standard-1.2.1.zip && unzip tmp.zip && rm tmp.zip
wget -qO- -O tmp.zip http://jmeter-plugins.org/downloads/file/JMeterPlugins-Extras-1.2.1.zip && unzip tmp.zip && rm tmp.zip
cd ..
./apache-jmeter-2.13/bin/jmeter
~~~~~

~~~~~
wget -O tmp.zip https://repo1.maven.org/maven2/io/gatling/highcharts/gatling-charts-highcharts-bundle/2.1.5/gatling-charts-highcharts-bundle-2.1.5-bundle.zip && unzip tmp.zip && rm tmp.zip
./gatling
~~~~~

For other platforms, download [JMeter](http://wiki.apache.org/jmeter/JMeterAndOperatingSystemsTested) and add the ['standard' and 'extras'](http://jmeter-plugins.org/downloads/all/) plugins.

Now.  A project with 17 years of development is going to have *features*.  An a blog post isn't going to cover them all.  

Luckily, our API was written to be easy to test.  All these tests are in the `/jmeter` directory on github.

So let's crush something.

  1. Fire up JMeter
  1. Open the `tiny-kittens-in-your-memory`
  1. Expand the test tree till you see 'Graph Results'.  Click it.
  1. Click the 'green arrow' icon to start.
  1. When you've had enough, 'stop-sign' to stop.
  1. Start over with 'clear all' icon to reset your graphs.


This will open 1000 threads, each to make 1000 requests our tiny-kittens-in-your-memory route.

#### tiny-kittens-in-your-memory
On my laptop with our simple server, I got about 2533 requests/second (153k/min) throughput.  This particular API request is probably as fast as we can get with this simple server.  It's essentially about a dozen assignments and array lookups.  

Let's try something that does a little more.

#### big-kittens-in-your-memory

This API call sends an jpg buffered in-memory to the browser.  Let's see how JMeter does.  

  1.  Click on `tiny-kittens-in-your-memory` and disable it.  Ctrl-t
  1.  Click on `big-kittens-in-your-memory` and enable it.  Ctrl-t
  1.  Click the graph, then green arrow to start.











Hi Nick,

Ok, we can definitely do that.  The most useful information, for the widest audience could be:

    Engineers starting new load testing on a web application, and don't already have a tooling setup.  

We can offer them:

    Two different load testing approaches, and an overview of tools for each approach.

Two approaches:

1) Generate Local Traffic

Setup a server on your local network (or localhost), and run a load tester on the same network (or localhost).

I'll link to a JMeter test case, and show how to get a report with graphs.

What: 

 - Local App Server
 - Local Load Tester - JMeter (Java), locust.io (Python), gatling.io (Java), ab (Apache webserver)
 - Scale up complexity from there

Pros: 
 - Simplest thing that could possibly work?
 - Free
 - With effort to build the right tests, useful for comparing performance of code changes

Cons: 
 - LAN scale traffic
 - Tools are very old or very new, and not 'turn-key'
 - Not testing production system, so what do results mean?  Are you testing your laptop or your code?
 - You've made yourself a part-time job

IMHO, ultimately isn't really the "simplest thing", and stretches the phrase "possibly work".  But may be a fit for large organizations who can dedicate a performance engineer and a lab.


2) Buy Web Traffic

 - Hosted server - "production" configuration
 - Hosted traffic generator - bought from a service like: load.io, Blazemeter, etc.

Pros:
 - Testing "production" configuration
 - Turn-key
 - Pretty reports
 - Infrastructure maintained by someone else

Cons:
 - Not free
 - No control of the infrastructure


Note: The kitten images were downloaded from:

http://www.publicdomainpictures.net/hledej.php?hleda=kitten
