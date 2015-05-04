# Agile Performance Testing for Web Apps

'We deployed our web app once, finished the beta, everyone signed up, and we never had a problem.'  - No one ever

Unit testing gives us confidence to improve software features and add new ones.

Performance testing gives us confidence to offer those features reliably to known numbers of users.

Performance testing web apps was invented before the cloud.  Much of the information around performance testing is aimed at large enterprise projects with enterprise resources.  'Agile' means leaner, smaller, and iterative.  

We'll be looking at Agile Performance testing strategies.

In this article, we'll:

  - Build a small web app.  
  - Deploy it.
  - Test it on our local machine
  - Crush it in the cloud.

We'll look at two broad strategies for running performance tests: Local network, and Cloud-based.

But first, a little vocabulary and structure.

# Performance Testing Taxonomy

## Sub-species

There are some exotic animals out there, but the most common are:

  - **Load testing** performance under a certain load. *Can we support 1000 simultaneous users on this server?*

  - **Endurance/Soak testing** sustained use to detect resource leaks.  *How often will it "randomly" crash?*

  - **Stress testing** the upper performance limit before failure.  *How many users can this server support?*

  - **Spike testing** testing sudden increased load.  *Slashdot effect testing*

Asking these specific questions is part of asking the general question *How and when should I scale my web application?*  Luckily these different tests all have the same structure.


## Anatomy

Any good performance test will have these parts:

  - **Server Under Test**: Software, hardware, and configuration. 

  - **Test Plan**

    - **Test Case(s)**: Series of requests and assertions, describing how the server would be used by one user.  These are more-or-less End-to-end Unit tests.  *login, put 4 things in cart, checkout, logout, done.*

    - **Load**: Description of how and when to run the test cases.  *1000 Users (aka Threads), running Test Case A, then B.  Looped 1000 times.*

  - **Testing Tool**:

    - Computers and software to run Test Cases, creating the Load, and summarizing the results.

  - **Test Report**:

    - Actionable data, easy to share, easy to compare, and preferrably without constant fiddling.

Test plan....  Snorrr....kgt!  Drool. Yeah, that'll happen.


## Most importantly, why!

Performance testing can be a huge --waste-- sink of time.  We're looking at strategies to iterate quickly, without building elaborate written test plans.  P.s. don't google 'Performance test plan'.

Performance testing should be done with a clear question or vision:   

  - *How can I make this use case faster?*

  - *I want each server to serve 1000 requests/second, without crashing or serving errors.*

  - *I want my web application to serve 70,000 requests/second.*

Once you have that, you'll have clear goals to iterate towards, and cut through lots of unnecessary effort.

# Server Under Test

Enough Preamble.  We need an API to crush.  Because we'll be here awhile, let's look at some kittens.  

## Application API

These strategies and tools apply to any web app, on any hosting.

We're using [Node.js](https://nodejs.org/) hosted on [Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction), because we had to pick something and Heroku Add-ons make it easy.

Our API has these routes:

    GET /tiny-kittens-in-your-memory/123         -> text/plain: filename 
    GET /big-kittens-in-your-memory/:id          -> image/jpeg: [kitten jpg data]
    GET /evil-kittens-sploding-your-memory/:id   -> locks 1 meg of memory for 1 seconds
    GET /evil-kittens-sploding-your-cpu/:id      -> 100% cpu for 1 seconds
    GET /evil-kittens-sploding-your-disk/:id     -> writes 1 meg to disk
    GET /evil-kittens-sploding-your-network/:id  -> text/plain: sends 512k of random data

:id is any string, used to cycle through the images, and memory leak 1mb/id.

Here's FIXME an Express 4.0 app implementing this API.  This server is neither secure or performant.  If you read the last few calls, you'll see it's small, cute, and shamelessly destructive.

## Server hardware and configuration

This article describes two servers under test, with strategies and things to be gained from each.

### Localhost Server Under Test

If you'd like to play along, the code's on Github:

    # Download the code from github.
    git clone FIXME
    cd FIXME
    npm install
    node simple.js

If you're installing Node for the first time, [nvm(node version manager)](https://github.com/creationix/nvm) will simplify your life.

Open <a href="http://localhost:8000">http://localhost:8000</a> to test.

### Cloud Server Under Test

If you don't want to install node, you can still play along with a cloud server on Heroku.

    # Get the code.
    git clone FIXME
    cd FIXME
    # Log in if you log aint.  
    heroku login
    # Create an app
    heroku create
    # Add load testing services
    heroku addons:add blazemeter:test
    heroku addons:add loaderio:basic
    heroku addons:add blitz:250
    # Logging
    heroku addons:add papertrail:choklad
    # Deploy
    git push heroku master
    # Open app in browser
    heroku open
    # Open log in browser
    heroku addons:open papertrail

It was created to be fun, innocent, and destructive.

# Performance Testing on Localhost

What can we test on localhost?

**We can't do Stress Testing or Spike Testing**.  These are both 'destructive' testing trying to overwhelm the server.  Measuring the 'destruction' means measuring against the 'production configuration'.

Are those errors because the server failed?  Or was it the JVM (JMeter) or Python (Gatling.io, locust.io), or was it the network driver?

Simply put, Stress and Spike testing require a set of clients that can overwhelm the server.  We can't do that all on the same machine.

**We can do Load and Endurance testing**.  These tests measure the affects of applying some constant load.  If we apply the same load to two different versions of the software, we can still get meaningful data by comparing results.

Simply put, performance testing on localhost is a dev task.

But what about setting up a 'test lab' in my office?  Pull up a chair, let me tell you a story...

> Back in the caveman days of the 1990's, we had to program computers with rocks, fire, and C++.  There was no wifi (literally not invented), and 'web hosting' meant a strip-mall data center with a locked 'cage' containing an ethernet cable and clean power.  You bought your own server, which arrived in a cow-colored box, then drove it to the 'cage' to install yourself.  It was a fun day-trip, except when dinosaurs attacked.  
> Ops (devops not invented) bought two sets of hardware, one they locked in the 'cage', and one for the 'test lab'.  The test lab was on the local network so you could do distributed load testing from your co-workers desktops.  A desktop is...
(This should be an info-graphic)

Why the old-timey grandpa stories?  Because in the old days, web development meant hardware.  Now, we spin up servers at data centers around the globe, while sipping iced coffee in Thai cafes.

JMeter was created in the caveman era of 1998 - before Agile.  It's documentation and UI will lead Agile devops teams in the wrong direction.

JMeter/etc are still useful for enterprises with 'test labs', but I'm going to guess most 'Agile' teams would rather build features than 'test labs'.  Luckily Cloud Computing let's you quickly rent one (see below).

17 years is a respectable run for any software (that's ~350 in software-years), and remembering that was vital to my happiness.

## The simplest thing that could possibly work

[ApacheBench](http://httpd.apache.org/docs/2.2/programs/ab.html) is simple, light-weight, and scriptable.  If you have Apache installed, you already have it installed.

```
sudo apt-get install apache2-utils
```

Ok, let's load test some kittens (500 requests, 5 concurrency):

```
$ ab -n 500 -c 5 http://localhost:8000/evil-kittens-sploding-your-cpu/1000

Benchmarking localhost (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Finished 500 requests


Server Software:        
Server Hostname:        localhost
Server Port:            8000

Document Path:          /evil-kittens-sploding-your-cpu/1000
Document Length:        39 bytes

Concurrency Level:      5
Time taken for tests:   30.002 seconds
Complete requests:      500
Failed requests:        0
Total transferred:      110000 bytes
HTML transferred:       19500 bytes
Requests per second:    16.67 [#/sec] (mean)
Time per request:       300.019 [ms] (mean)
Time per request:       60.004 [ms] (mean, across all concurrent requests)
Transfer rate:          3.58 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.0      0       1
Processing:    90  299  14.1    298     343
Waiting:       88  298  14.1    297     342
Total:         91  299  14.1    298     343

Percentage of the requests served within a certain time (ms)
  50%    298
  66%    300
  75%    301
  80%    302
  90%    306
  95%    313
  98%    328
  99%    336
 100%    343 (longest request)

```

That's alot of copy/paste, but you can see some basic and useful information.  response time average, response time distribution, etc. 

Your OS has a resource utilization viewer (notice the kernel switch node.js between cores):

![First Load Test](./screenshots/1-first-load-test.png "First Load Test")

If we re-implemented `/evil-kittens-sploding-your-cpu/` and retested we'd see different response times.  

The actual times don't predict production performance.  But comparing the two tells us about our implementations.

Hurray!  Our first 'Load Test'.  `ab` has plenty of options for making single requests, but it takes multiple requests to make a 'use case'.  For that, we'll need something stronger.

## Using the End-to-end tests you already have

If you're worried about feature performance, you've probably already written end-to-end tests for your server API to test feature correctness and document use cases.  Those e2e tests are in something best suited for your app (aka not JMeter).

```

```

`evil-kittens` were built using Node.js and Express, so naturally we'd use Mocha to test them.  `npm test` will run the tests for us:

```
$ npm test

  Get a random tiny kitten
    ✓ get a random tiny kitten (140ms)

  1 passing (161ms)
```

That's great.  Let's make it an Endurance Test.  We'll do it two ways.

### Simplest Endurance Test that could possibly work

What about:

```
for i in {1..1000}; do npm test > /dev/null; done
```

That takes forever.  There's alot of scaffolding being setup and torn down for each iteration.  `mocha endurance.perf.js` uses `require-new` speed it up to half forever.  The real 'problem' here is Mocha wasn't designed to generate loads for performance testing.

> Scala: Check out [getling.io](http://gatling.io/) 
> Python:  Check out [locust.io](http://locust.io/) (it wouldn't install on Ubuntu)

### Using JMeter

At some point, we're both going to run out of interest in this article, so here comes less detail and more jazz-hands.

JMeter is a Load Testing Tool focused on web applications.  It's 'recorder' sets up a http proxy that will "write your tests for you".  You can record tests with a browser, but let's record the Mocha tests we've already written.  (FIXME Supertest doesn't support this?)

We are traveling back in time to 2001 Enterprise Java, so expect the unexpected.  

First, install [JMeter](http://jmeter.apache.org/index.html), and the [standard and extras](http://jmeter-plugins.org/wiki/Start/) plugins:

```
wget http://www.us.apache.org/dist//jmeter/binaries/apache-jmeter-2.13.tgz -O - | tar -xz
cd apache-jmeter-2.13
wget -qO- -O tmp.zip http://jmeter-plugins.org/downloads/file/JMeterPlugins-Standard-1.2.1.zip && unzip tmp.zip
wget -qO- -O tmp.zip http://jmeter-plugins.org/downloads/file/JMeterPlugins-Extras-1.2.1.zip && unzip tmp.zip
cd ..
```

(Don't worry about replacing LICENSE and README.  Windows users might find this[guide](http://www.guru99.com/guide-to-install-jmeter.html) useful)

Start JMeter like this:

```
./apache-jmeter-2.13/bin/jmeter
```

You should see something like this:

![Starting JMeter](./screenshots/1-start-jmeter.png "Start JMeter")

To record a test plan, 
  - "File -> Templates -> Select Template: 'Recording' -> Create".  
  - Open 'Workbench', 
  - Select 'HTTP(S) Test Script Recorder'
  - Scroll down and click 'Start', click Ok.

There is now a proxy on port 8888.  Let's run our Mocha tests through it:

```
http_proxy="http://localhost:8888/" npm test
```

> Node.js: Supertest doesn't [respect process.env.http_proxy](https://github.com/visionmedia/supertest/issues/214).  So I re-wrote my tests using a patched version of 'Hippie', which uses 'request', which uses http_proxy.

This also works great:
```
http_proxy="http://localhost:8888/" wget http://localhost:8000/http://localhost:8000/evil-kittens-sploding-your-cpu/1000
```





> Note.  My System76 laptop has 8 cores, 16 gig of mem, and a 256 gig SSD (seemed necessary at the time).  The Heroku instance has 1 core, .5 gig of mem, and .2 gigs of disk.  So Endurance Tests will have to work 8-32-1000x harder and longer on my laptop.  This is a good reason to use a Virtual Machines while testing.

If you'd like to run these tests in a Virtual Machine, let's use [Vagrant](https://docs.vagrantup.com/v2/why-vagrant/index.html).

```
FIXME Vagrant steps
```
