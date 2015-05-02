# Performance Testing Small-Medium sized Web Apps

'We deployed our web app once, finished the beta, tons of people signed up, and we never had a problem.'  - No one ever.

Unit testing gives us confidence to improve software features and add new ones.

Performance testing gives us confidence to offer those features reliably to known levels of use.

Performance testing web apps was invented before the cloud.  Much of the information around performance testing is aimed at large projects with enterprise resources.  We're leaner, smaller, and iterative now.  And we'll be looking at strategies that let us iterate quickly.

In this article, we'll:

  - Build a small web app.  
  - Deploy it.
  - Then crush it.  Using a variety of testing tools.  

We'll look at two broad strategies for running performance tests: Local network, and Cloud-based.

But first, vocabulary and structure.


# Performance Testing Taxonomy

## Sub-species

Surely there are some exotic animals out there, but the most common are:

  - **Load testing**.  Performance under a certain load. *Can we support 1000 simultaneous users on this server?*

  - **Endurance/Soak testing**.  Sustained use to detect resource leaks.  *How often will it "randomly" crash?*

  - **Stress testing**.  The upper performance limit before failure.  *How many users can this server support?*

  - **Spike testing**.  Testing sudden increased load.  *Slashdot.  Afraid?*

Asking these questions is asking how and/or when to scale a web application.  Luckily the testing infrastructure for each kind of performance test is the same.


## Anatomy

Any good performance test will have these parts:

  - **Server Under Test**: Software, hardware, and configuration. 

  - **Test Plan**

    - **Test Case(s)**: Series of requests and assertions, describing how the server would be used by one user.  These are more-or-less End-to-end Unit tests.  *login, put 4 things in cart, checkout, logout, done.*

    - **Load**: Description of how and when to run the test cases.  *1000 Users (aka Threads), running Test Case A, then B.  Looped 1000 times.*

  - **Testing Tool**:

    - One or more systems to run Test Cases, creating the Load, and summarizing the results into the Test Report.

  - **Test Report**:

    - Actionable data, easy to share, easy to compare, and preferrably without fiddling.

Test plan....  Snorrr....kgt!  Drool. Yeah, that'll happen.

The difference between large and small project is iteration.  We'll be looking at strategies to iterate quickly, without building elaborate written test plans.  P.s. don't google 'Performance test plan'.


# Server Under Test

## Application API

Enough Preamble.  We need an API to crush.  Because we'll be here awhile, let's look at some kittens.  

We're using Node.js/Heroku here, because we had to pick something.  These strategies and tools apply to any web app on any host.

Our API has these routes:

    GET /tiny-kittens-in-your-memory/123         -> text/plain: filename 
    GET /big-kittens-in-your-memory/:id          -> image/jpeg: [kitten jpg data]
    GET /evil-kittens-sploding-your-memory/:id   -> locks 1 meg of memory for 1 seconds
    GET /evil-kittens-sploding-your-cpu/:id      -> 100% cpu for 1 seconds
    GET /evil-kittens-sploding-your-disk/:id     -> writes 1 meg to disk
    GET /evil-kittens-sploding-your-network/:id  -> text/plain: sends 512k of random data

:id is any string, used to cycle through the images, and memory leak 1mb/id.

Here's FIXME an Express 4.0 app implementing this API.  This server is neither secure or performant.  If you read the last few calls, you'll see it's small, innocent, and shamelessly destructive.

## Server hardware and configuration

We'll be testing two strategies.  On a local network, and in the cloud.

If you'd like to play along, the code's on Github:

    git clone FIXME
    cd FIXME
    npm install
    node server1.js

Open <a href="http://localhost:8000">http://localhost:8000</a> to test.

If you'd like to deploy to heroku, 

    # If you log aint.
    heroku login
    #
    heroku app create
    heroku init
    git push heroku master
    heroku add 
    heroku add
    heroku add
    heroku open

It was created to be fun, innocent, and destructive.

Note: The hardware and configuration these servers will affect performance.  The server on my laptop has alot more disk, cpu, and RAM than the one on Heroku.  And the Heroku app likely has much better network IO that my laptop.

These differences are often as or more important than the actual code.

Also, note that VPS hosting 

## Server Hardware


